import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ChildStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { useScreenAnnounce } from '../../hooks/useScreenAnnounce';
import { useChild } from '../../contexts/ChildContext';
import { LESSONS, type LessonCategory } from '../../data/lessons';
import { markLessonCompleted } from '../../services/progress';
import { endSession, startSession } from '../../services/analytics';
import { useTTS } from '../../hooks/useTTS';
import { scorePronunciation, startRecording, stopRecording, transcribeWithGoogle } from '../../services/speech';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { VoiceControlBar } from '../../components/VoiceControlBar';

type Route = RouteProp<ChildStackParamList, 'LessonPlayback'>;
type Nav = NativeStackNavigationProp<ChildStackParamList, 'LessonPlayback'>;

export function LessonPlaybackScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { selectedChild } = useChild();
  const { speak, stop: stopTts } = useTTS();
  const category = route.params?.category as LessonCategory;
  const lessonId = route.params?.lessonId;
  const lesson = LESSONS[category]?.find((l) => l.id === lessonId);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [checking, setChecking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<'correct' | 'try_again' | null>(null);
  const sessionRef = useRef<{ sessionId: string; startedAt: number } | null>(null);
  const endedRef = useRef(false);

  useScreenAnnounce(
    lesson ? `Lesson. ${lesson.title}. ${lesson.prompt}` : 'Lesson playback.'
  );


  useEffect(() => {
    const begin = async () => {
      if (!selectedChild?.id || !lesson) return;
      sessionRef.current = await startSession({
        childId: selectedChild.id,
        type: 'lesson',
        category,
        lessonId: lesson.id,
      });
    };
    begin();
    return () => {
      if (endedRef.current) return;
      const session = sessionRef.current;
      if (session && selectedChild?.id) {
        endSession({
          childId: selectedChild.id,
          sessionId: session.sessionId,
          startedAt: session.startedAt,
          category,
        }).catch(() => undefined);
      }
    };
  }, [selectedChild?.id, lesson?.id, category]);

  const handleComplete = async () => {
    if (!selectedChild?.id || !lesson) return;
    try {
      setSaving(true);
      if (!endedRef.current && sessionRef.current) {
        endedRef.current = true;
        await endSession({
          childId: selectedChild.id,
          sessionId: sessionRef.current.sessionId,
          startedAt: sessionRef.current.startedAt,
          category,
        });
      }
      await markLessonCompleted(selectedChild.id, category, lesson.id);
      navigation.goBack();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save progress.';
      Alert.alert('Save failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleListen = () => {
    if (!lesson) return;
    speak(lesson.prompt);
  };

  const handleStartPronounce = async () => {
    if (recording || checking || starting) return;
    try {
      stopTts();
      setResult(null);
      setTranscript('');
      setStarting(true);
      speak('Start speaking now.', {
        onDone: async () => {
          try {
            const rec = await startRecording();
            setRecording(rec);
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Recording failed.';
            Alert.alert('Recording failed', msg);
          } finally {
            setStarting(false);
          }
        },
        onError: async () => {
          try {
            const rec = await startRecording();
            setRecording(rec);
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Recording failed.';
            Alert.alert('Recording failed', msg);
          } finally {
            setStarting(false);
          }
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Recording failed.';
      Alert.alert('Recording failed', msg);
      setStarting(false);
    }
  };

  const handleStopPronounce = async () => {
    if (!recording || !lesson) return;
    try {
      setChecking(true);
      const uri = await stopRecording(recording);
      setRecording(null);
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_STT_API_KEY ?? '';
      const proxyUrl = process.env.EXPO_PUBLIC_STT_PROXY_URL ?? '';
      if (!apiKey && !proxyUrl) {
        Alert.alert(
          'STT not configured',
          'Add EXPO_PUBLIC_STT_PROXY_URL (recommended) or EXPO_PUBLIC_GOOGLE_STT_API_KEY to .env.'
        );
        return;
      }
      const text = await transcribeWithGoogle(uri, apiKey);
      setTranscript(text);
      const scored = scorePronunciation(lesson.target, text);
      if (scored.matched) {
        setResult('correct');
        speak('Great job. That was correct.');
      } else {
        setResult('try_again');
        speak(`Try again. The correct answer is ${lesson.target}.`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Pronunciation check failed.';
      Alert.alert('Check failed', msg);
    } finally {
      setChecking(false);
    }
  };

  const voice = useVoiceCommands({
    enabled: !recording && !checking && !starting,
    commands: [
      { phrases: ['repeat', 'listen'], action: handleListen },
      { phrases: ['start pronunciation', 'start speaking'], action: handleStartPronounce },
      { phrases: ['stop check', 'stop and check'], action: handleStopPronounce },
      { phrases: ['mark completed', 'complete lesson', 'done'], action: handleComplete },
      {
        phrases: ['help', 'commands', 'what can i say'],
        action: () =>
          speak('You can say: repeat, start pronunciation, stop check, mark completed, or go back.'),
      },
      { phrases: ['go back', 'back'], action: () => navigation.goBack() },
    ],
  });

  if (!lesson || !selectedChild) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Lesson not available</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Lesson</Text>
        <Text style={styles.subtitle}>{lesson.title}</Text>
        <Text style={styles.prompt}>{lesson.prompt}</Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleListen}
          accessibilityLabel="Listen to the lesson"
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Listen</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleStartPronounce}
          disabled={Boolean(recording) || checking || starting}
          accessibilityLabel="Start pronunciation"
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>
            {recording ? 'Recording…' : starting ? 'Preparing…' : 'Start pronunciation'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleStopPronounce}
          disabled={!recording || checking || starting}
          accessibilityLabel="Stop and check pronunciation"
          accessibilityRole="button"
        >
          {checking ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text style={styles.secondaryButtonText}>Stop & check</Text>
          )}
        </TouchableOpacity>

        {transcript ? (
          <Text style={styles.feedback}>You said: {transcript}</Text>
        ) : null}
        {result === 'correct' ? (
          <Text style={styles.feedbackSuccess}>Correct pronunciation</Text>
        ) : null}
        {result === 'try_again' ? (
          <Text style={styles.feedbackWarn}>Try again</Text>
        ) : null}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleComplete}
          disabled={saving}
          accessibilityLabel="Mark completed"
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Mark completed</Text>
          )}
        </TouchableOpacity>
      </View>

      <VoiceControlBar
        listening={voice.listening}
        processing={voice.processing}
        lastTranscript={voice.lastTranscript}
        onToggle={voice.toggleListening}
        disabled={Boolean(recording) || checking || starting}
        hint="Try: repeat, mark completed, go back."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  title: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
  },
  prompt: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    minHeight: theme.spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  primaryButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.onPrimary,
  },
  secondaryButton: {
    borderRadius: 12,
    padding: theme.spacing.md,
    minHeight: theme.spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  secondaryButtonText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
  },
  feedback: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  feedbackSuccess: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.success,
    fontWeight: theme.fontWeights.semibold,
  },
  feedbackWarn: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.warning,
    fontWeight: theme.fontWeights.semibold,
  },
});

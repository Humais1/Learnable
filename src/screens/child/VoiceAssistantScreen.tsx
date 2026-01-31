import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme';
import { useTTS } from '../../hooks/useTTS';
import { startRecording, stopRecording, transcribeWithGoogle } from '../../services/speech';
import { sendDialogflowText } from '../../services/dialogflow';
import { useChild } from '../../contexts/ChildContext';
import type { ChildStackParamList } from '../../navigation/types';

export function VoiceAssistantScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChildStackParamList, 'VoiceAssistant'>>();
  const { selectedChild } = useChild();
  const { speak } = useTTS();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [checking, setChecking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');

  const handleStart = async () => {
    if (recording || checking) return;
    try {
      const rec = await startRecording();
      setRecording(rec);
      setTranscript('');
      setReply('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Recording failed.';
      Alert.alert('Recording failed', msg);
    }
  };

  const handleStop = async () => {
    if (!recording) return;
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
      if (!text.trim()) {
        Alert.alert('No speech detected', 'Please try again.');
        return;
      }
      const sessionId = selectedChild?.id ?? 'learnable-session';
      const result = await sendDialogflowText(text, sessionId);
      const replyText = result.fulfillmentText || 'Okay.';
      setReply(replyText);
      speak(replyText);

      switch (result.intent) {
        case 'open_lessons':
          navigation.navigate('ChildHome');
          break;
        case 'open_letters':
          navigation.navigate('LessonList', { category: 'letters' });
          break;
        case 'open_numbers':
          navigation.navigate('LessonList', { category: 'numbers' });
          break;
        case 'open_birds':
          navigation.navigate('LessonList', { category: 'birds' });
          break;
        case 'open_animals':
          navigation.navigate('LessonList', { category: 'animals' });
          break;
        case 'start_quiz':
          navigation.navigate('ChildHome');
          speak('Say open letters, numbers, birds, or animals, then start quiz.');
          break;
        case 'show_badges':
          navigation.navigate('Badges');
          break;
        case 'show_leaderboard':
          navigation.navigate('Leaderboard');
          break;
        case 'help':
          speak(
            'You can say: open lessons, open letters, open numbers, open birds, open animals, start quiz, show badges, or show leaderboard.'
          );
          break;
        default:
          break;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Assistant failed.';
      Alert.alert('Assistant failed', msg);
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Voice Assistant</Text>
        <Text style={styles.subtitle}>Ask a question or say what you want to do.</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleStart}
          disabled={Boolean(recording) || checking}
          accessibilityLabel="Start listening"
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>
            {recording ? 'Listening…' : 'Start listening'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleStop}
          disabled={!recording || checking}
          accessibilityLabel="Stop and send"
          accessibilityRole="button"
        >
          {checking ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text style={styles.secondaryButtonText}>Stop & send</Text>
          )}
        </TouchableOpacity>

        {transcript ? <Text style={styles.block}>You said: {transcript}</Text> : null}
        {reply ? <Text style={styles.block}>Assistant: {reply}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
    justifyContent: 'center',
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
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    minHeight: theme.spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
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
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  secondaryButtonText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
  },
  block: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
});

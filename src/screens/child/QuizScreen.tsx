import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ChildStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { useScreenAnnounce } from '../../hooks/useScreenAnnounce';
import { useChild } from '../../contexts/ChildContext';
import { useTTS } from '../../hooks/useTTS';
import { QUIZZES } from '../../data/quizzes';
import type { LessonCategory } from '../../data/lessons';
import { addPoints, awardPerfectQuiz, saveQuizResult } from '../../services/progress';
import { playCorrectSound, playWrongSound } from '../../utils/audioFeedback';
import * as Haptics from 'expo-haptics';
import { endSession, startSession } from '../../services/analytics';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { VoiceControlBar } from '../../components/VoiceControlBar';

type Route = RouteProp<ChildStackParamList, 'Quiz'>;
type Nav = NativeStackNavigationProp<ChildStackParamList, 'Quiz'>;

export function QuizScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { selectedChild } = useChild();
  const { speak } = useTTS();
  const category = route.params?.category as LessonCategory | undefined;
  const questions = useMemo(() => (category ? QUIZZES[category] ?? [] : []), [category]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const sessionRef = useRef<{ sessionId: string; startedAt: number } | null>(null);
  const endedRef = useRef(false);

  useScreenAnnounce('Quiz. Answer the questions.');

  if (!selectedChild || !category) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select a child first</Text>
        <Text style={styles.subtitle}>Go back and choose a child profile.</Text>
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

  const question = questions[index];
  const total = questions.length;
  const isLast = index === total - 1;

  const repeatQuestion = () => {
    if (!question) return;
    const optionsText = question.options
      .map((opt, i) => `Option ${i + 1}. ${opt}`)
      .join('. ');
    speak(`${question.prompt}. ${optionsText}`);
  };

  const selectOption = (idx: number) => {
    if (!question || idx < 0 || idx >= question.options.length) return;
    const option = question.options[idx];
    speak(option);
    setSelected(idx);
  };

  const voice = useVoiceCommands({
    commands: [
      { phrases: ['repeat', 'repeat question'], action: repeatQuestion },
      { phrases: ['option one', 'option 1'], action: () => selectOption(0) },
      { phrases: ['option two', 'option 2'], action: () => selectOption(1) },
      { phrases: ['option three', 'option 3'], action: () => selectOption(2) },
      { phrases: ['option four', 'option 4'], action: () => selectOption(3) },
      { phrases: ['next', 'finish'], action: () => handleNext() },
      {
        phrases: ['help', 'commands', 'what can i say'],
        action: () =>
          speak('You can say: option one, option two, option three, option four, repeat, or next.'),
      },
      { phrases: ['go back', 'back'], action: () => navigation.goBack() },
    ],
  });

  useEffect(() => {
    if (!question) return;
    repeatQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, question?.id]);

  useEffect(() => {
    const begin = async () => {
      if (!selectedChild?.id || !category) return;
      sessionRef.current = await startSession({
        childId: selectedChild.id,
        type: 'quiz',
        category,
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
  }, [selectedChild?.id, category]);

  const handleNext = async () => {
    if (selected === null || !question) return;
    const isCorrect = selected === question.correctIndex;
    if (!isCorrect) {
      const correctAnswer = question.options[question.correctIndex];
      speak(`Not quite. The correct answer is ${correctAnswer}.`);
      playWrongSound().catch(() => undefined);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    if (isCorrect) {
      speak('Correct.');
      playCorrectSound().catch(() => undefined);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const nextScore = isCorrect ? score + 1 : score;
    setScore(nextScore);
    setSelected(null);
    if (isLast) {
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
        const passed = nextScore === total;
        await saveQuizResult(selectedChild.id, category, nextScore, total, passed);
        await addPoints(selectedChild.id, nextScore);
        if (passed) {
          await awardPerfectQuiz(selectedChild.id, category);
          Alert.alert('Perfect score!', 'You earned a badge and 10 points.');
        } else {
          Alert.alert('Quiz completed', `Score: ${nextScore}/${total}`);
        }
        navigation.goBack();
      } finally {
        setSaving(false);
      }
      return;
    }
    setIndex((prev) => prev + 1);
  };

  if (!question) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No quiz yet</Text>
        <Text style={styles.subtitle}>We’ll add questions soon.</Text>
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
      <View style={styles.headerCard}>
        <Text style={styles.title}>Quiz</Text>
        <Text style={styles.subtitle}>
          Question {index + 1} of {total}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.prompt}>{question.prompt}</Text>
        {question.options.map((option, idx) => {
          const selectedOption = selected === idx;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.option, selectedOption && styles.optionSelected]}
              onPress={() => {
                speak(option);
                setSelected(idx);
              }}
              accessibilityLabel={option}
              accessibilityRole="button"
            >
              <Text style={[styles.optionText, selectedOption && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, selected === null && styles.primaryButtonDisabled]}
        onPress={handleNext}
        disabled={selected === null || saving}
        accessibilityLabel={isLast ? 'Finish quiz' : 'Next question'}
        accessibilityRole="button"
      >
        {saving ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text style={styles.primaryButtonText}>{isLast ? 'Finish quiz' : 'Next'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => {
          repeatQuestion();
        }}
        accessibilityLabel="Repeat question"
        accessibilityRole="button"
      >
        <Text style={styles.secondaryButtonText}>Repeat question</Text>
      </TouchableOpacity>

      <VoiceControlBar
        listening={voice.listening}
        processing={voice.processing}
        lastTranscript={voice.lastTranscript}
        onToggle={voice.toggleListening}
        hint="Try: option one, option two, repeat, next."
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
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
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
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  prompt: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  option: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 10,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryDark,
  },
  optionText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
  },
  optionTextSelected: {
    color: theme.colors.onPrimary,
    fontWeight: theme.fontWeights.semibold,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    minHeight: theme.spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.onPrimary,
  },
  secondaryButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
  },
});

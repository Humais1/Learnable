import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ChildStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { useScreenAnnounce } from '../../hooks/useScreenAnnounce';
import { useChild } from '../../contexts/ChildContext';
import { LESSONS, type LessonCategory } from '../../data/lessons';
import { subscribeToLessonProgress, type LessonProgress } from '../../services/progress';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { VoiceControlBar } from '../../components/VoiceControlBar';
import { useTTS } from '../../hooks/useTTS';

type Route = RouteProp<ChildStackParamList, 'LessonList'>;
type Nav = NativeStackNavigationProp<ChildStackParamList, 'LessonList'>;

export function LessonListScreen() {
  useScreenAnnounce('Lesson list. Choose a lesson to play.');
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { selectedChild } = useChild();
  const { speak } = useTTS();
  const category = route.params?.category as LessonCategory | undefined;
  const lessons = category ? LESSONS[category] ?? [] : [];
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lessonCommands = lessons.map((lesson) => ({
    phrases: [`open ${lesson.title.toLowerCase()}`, lesson.title.toLowerCase()],
    action: () =>
      navigation.navigate('LessonPlayback', {
        lessonId: lesson.id,
        category,
      }),
  }));

  const voice = useVoiceCommands({
    commands: [
      { phrases: ['start quiz', 'open quiz'], action: () => category && navigation.navigate('Quiz', { category }) },
      {
        phrases: ['start lesson', 'open lesson'],
        action: () =>
          lessons[0]
            ? navigation.navigate('LessonPlayback', { lessonId: lessons[0].id, category })
            : undefined,
      },
      ...lessonCommands,
      {
        phrases: ['help', 'commands', 'what can i say'],
        action: () =>
          speak(
            'You can say: start quiz, open lesson one, open lesson two, open lesson three, or go back.'
          ),
      },
      { phrases: ['go back', 'back'], action: () => navigation.goBack() },
    ],
  });

  useEffect(() => {
    if (!selectedChild?.id || !category) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToLessonProgress(
      selectedChild.id,
      category,
      (map) => {
        setProgress(map);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || 'Failed to load progress.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [selectedChild?.id, category]);

  if (!selectedChild || !category) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select a child first</Text>
        <Text style={styles.subtitle}>Go back and choose a child profile.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Lessons</Text>
        <Text style={styles.subtitle}>
          {selectedChild.name} • {category}
        </Text>
        <TouchableOpacity
          style={styles.quizButton}
          onPress={() => navigation.navigate('Quiz', { category })}
          accessibilityLabel="Start quiz"
          accessibilityRole="button"
        >
          <Text style={styles.quizButtonText}>Start quiz</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.subtitle}>Unable to load progress</Text>
          <Text style={styles.helpText}>{error}</Text>
        </View>
      ) : (
        <>
        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const completed = Boolean(progress[item.id]?.completedAt);
            return (
              <TouchableOpacity
                style={styles.lessonCard}
                onPress={() =>
                  navigation.navigate('LessonPlayback', {
                    lessonId: item.id,
                    category,
                  })
                }
                accessibilityLabel={`Open ${item.title}`}
                accessibilityRole="button"
              >
                <Text style={styles.lessonTitle}>{item.title}</Text>
                <Text style={styles.lessonPrompt}>{item.prompt}</Text>
                {completed ? (
                  <Text style={styles.completedTag}>Completed</Text>
                ) : (
                  <Text style={styles.pendingTag}>Not completed</Text>
                )}
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <VoiceControlBar
              listening={voice.listening}
              processing={voice.processing}
              lastTranscript={voice.lastTranscript}
              onToggle={voice.toggleListening}
              hint="Try: start quiz, open lesson one, go back."
            />
          }
        />
        </>
      )}
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
    marginBottom: theme.spacing.md,
  },
  errorBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  helpText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  list: {
    paddingBottom: theme.spacing.xl,
  },
  lessonCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  lessonTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  lessonPrompt: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  completedTag: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.success,
    fontWeight: theme.fontWeights.semibold,
  },
  pendingTag: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
  },
  backButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 12,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  quizButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    minHeight: theme.spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  quizButtonText: {
    color: theme.colors.onPrimary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  AppState,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ChildStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { useScreenAnnounce } from '../../hooks/useScreenAnnounce';
import { useAuth } from '../../contexts/AuthContext';
import { useChild } from '../../contexts/ChildContext';
import { subscribeToChildren, type ChildProfile } from '../../services/children';
import { LESSON_CATEGORIES, LESSONS } from '../../data/lessons';
import { subscribeToLessonProgress, type LessonProgress } from '../../services/progress';

type Nav = NativeStackNavigationProp<ChildStackParamList, 'ChildHome'>;

export function ChildHomeScreen() {
  const { user } = useAuth();
  const { selectedChild, selectChild, clearChild, loading: childLoading } = useChild();
  const navigation = useNavigation<Nav>();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [progressByCategory, setProgressByCategory] = useState<
    Record<string, Record<string, LessonProgress>>
  >({});
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingMsRef = useRef(20 * 60 * 1000);
  const startedAtRef = useRef<number | null>(null);

  useScreenAnnounce(
    selectedChild
      ? `Learn. ${selectedChild.name} can learn letters, numbers, birds, or animals.`
      : 'Choose a child to start learning.'
  );

  useEffect(() => {
    if (!user?.uid || selectedChild) {
      setLoadingChildren(false);
      return;
    }
    const unsubscribe = subscribeToChildren(user.uid, (list) => {
      setChildren(list);
      setLoadingChildren(false);
    });
    return unsubscribe;
  }, [user?.uid, selectedChild]);

  useEffect(() => {
    if (!selectedChild?.id) {
      setProgressByCategory({});
      return;
    }
    const unsubscribers = LESSON_CATEGORIES.map((category) =>
      subscribeToLessonProgress(selectedChild.id, category.id, (map) => {
        setProgressByCategory((prev) => ({ ...prev, [category.id]: map }));
      })
    );
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [selectedChild?.id]);

  useEffect(() => {
    if (!selectedChild?.id) {
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
      restTimerRef.current = null;
      remainingMsRef.current = 20 * 60 * 1000;
      startedAtRef.current = null;
      return;
    }

    const startTimer = () => {
      startedAtRef.current = Date.now();
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
      restTimerRef.current = setTimeout(() => {
        Alert.alert('Time to rest', 'You have been learning for 20 minutes. Take a short break.');
        remainingMsRef.current = 20 * 60 * 1000;
        startedAtRef.current = Date.now();
        startTimer();
      }, remainingMsRef.current);
    };

    startTimer();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        startTimer();
        return;
      }
      if (startedAtRef.current) {
        const elapsed = Date.now() - startedAtRef.current;
        remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed);
      }
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
    });

    return () => {
      subscription.remove();
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
      restTimerRef.current = null;
    };
  }, [selectedChild?.id]);

  if (childLoading || loadingChildren) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!selectedChild) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select a child</Text>
        <Text style={styles.subtitle}>Tap a child to start learning.</Text>

        <FlatList
          data={children}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.childCard}
              onPress={() => selectChild(item)}
              accessibilityLabel={`Select ${item.name}`}
              accessibilityRole="button"
            >
              <Text style={styles.childName}>{item.name}</Text>
              <Text style={styles.childMeta}>
                Age: {item.age || 'N/A'} • {item.disabilityType}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.subtitle}>No child profiles yet. Add one in Parent.</Text>
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Learn</Text>
          <Text style={styles.subtitle}>Hi {selectedChild.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.changeButton}
          onPress={() => clearChild()}
          accessibilityLabel="Change child"
          accessibilityRole="button"
        >
          <Text style={styles.changeButtonText}>Change</Text>
        </TouchableOpacity>
      </View>

      {LESSON_CATEGORIES.map((category) => (
        (() => {
          const lessons = LESSONS[category.id] ?? [];
          const progressMap = progressByCategory[category.id] ?? {};
          const completedCount = lessons.filter((lesson) => progressMap[lesson.id]).length;
          const isCompleted = lessons.length > 0 && completedCount === lessons.length;
          const progressLabel =
            lessons.length === 0
              ? 'No lessons'
              : isCompleted
              ? 'Completed'
              : `${completedCount}/${lessons.length} completed`;
          return (
        <TouchableOpacity
          key={category.id}
          style={styles.categoryButton}
          onPress={() => navigation.navigate('LessonList', { category: category.id })}
          accessibilityLabel={`Open ${category.label} lessons`}
          accessibilityRole="button"
        >
          <View style={styles.categoryRow}>
            <Text style={styles.categoryText}>{category.label}</Text>
            <Text style={[styles.categoryProgress, isCompleted && styles.categoryProgressDone]}>
              {progressLabel}
            </Text>
          </View>
        </TouchableOpacity>
          );
        })()
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
  },
  list: {
    paddingTop: theme.spacing.lg,
  },
  childCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  childName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  childMeta: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  changeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceElevated,
  },
  changeButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  categoryButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
  },
  categoryProgress: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  categoryProgressDone: {
    color: theme.colors.success,
    fontWeight: theme.fontWeights.semibold,
  },
});

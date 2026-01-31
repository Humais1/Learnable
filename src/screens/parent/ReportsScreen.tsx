import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { useScreenAnnounce } from '../../hooks/useScreenAnnounce';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToChildren, type ChildProfile } from '../../services/children';
import {
  subscribeToAchievements,
  subscribeToQuizResults,
  type AchievementsSnapshot,
  type QuizResultsMap,
} from '../../services/progress';

export function ReportsScreen() {
  useScreenAnnounce('Reports. Learning time and quiz scores by date.');
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizResults, setQuizResults] = useState<Record<string, QuizResultsMap>>({});
  const [achievements, setAchievements] = useState<Record<string, AchievementsSnapshot>>({});

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToChildren(user.uid, (list) => {
      setChildren(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    if (!children.length) return;
    const unsubscribes: Array<() => void> = [];
    children.forEach((child) => {
      unsubscribes.push(
        subscribeToQuizResults(child.id, (data) => {
          setQuizResults((prev) => ({ ...prev, [child.id]: data }));
        })
      );
      unsubscribes.push(
        subscribeToAchievements(child.id, (data) => {
          setAchievements((prev) => ({ ...prev, [child.id]: data }));
        })
      );
    });
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [children]);

  const sortedChildren = useMemo(
    () => [...children].sort((a, b) => a.name.localeCompare(b.name)),
    [children]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How scores work</Text>
        <Text style={styles.infoText}>
          Quiz score = number of correct answers. Points = quiz score. Perfect quiz adds +10
          bonus points and a badge.
        </Text>
      </View>
      {sortedChildren.length === 0 ? (
        <Text style={styles.subtitle}>No children yet. Add a child profile first.</Text>
      ) : (
        sortedChildren.map((child) => {
          const childQuiz = quizResults[child.id] ?? {};
          const childAchievements = achievements[child.id] ?? {};
          const points = childAchievements.points ?? 0;
          const badges = childAchievements.badges?.quizPerfect ?? {};
          const categories = Object.keys(childQuiz);

          return (
            <View key={child.id} style={styles.card}>
              <Text style={styles.cardTitle}>{child.name}</Text>
              <Text style={styles.cardMeta}>
                Age: {child.age || 'N/A'} • {child.disabilityType}
              </Text>
              <Text style={styles.points}>Points: {points}</Text>
              {categories.length === 0 ? (
                <Text style={styles.subtitle}>No quiz results yet.</Text>
              ) : (
                categories.map((category) => {
                  const result = childQuiz[category];
                  const perfect = Boolean(badges?.[category]);
                  return (
                    <Text key={category} style={styles.resultRow}>
                      {category}: {result.score}/{result.total}{' '}
                      {perfect ? '• Perfect badge' : ''}
                    </Text>
                  );
                })
              )}
            </View>
          );
        })
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
  title: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  infoBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  infoTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardMeta: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  points: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.sm,
  },
  resultRow: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
});

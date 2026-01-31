import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { useScreenAnnounce } from '../../hooks/useScreenAnnounce';
import { useChild } from '../../contexts/ChildContext';
import { subscribeToAchievements, type AchievementsSnapshot } from '../../services/progress';

export function BadgesScreen() {
  useScreenAnnounce('Badges. Your earned rewards.');
  const { selectedChild } = useChild();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<AchievementsSnapshot>({});

  useEffect(() => {
    if (!selectedChild?.id) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToAchievements(selectedChild.id, (data) => {
      setAchievements(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [selectedChild?.id]);

  const perfectBadges = useMemo(
    () => Object.keys(achievements.badges?.quizPerfect ?? {}),
    [achievements.badges?.quizPerfect]
  );

  if (!selectedChild) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select a child first</Text>
        <Text style={styles.subtitle}>Go back and choose a child profile.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const points = achievements.points ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Badges</Text>
      <Text style={styles.subtitle}>Hi {selectedChild.name}</Text>
      <Text style={styles.points}>Points: {points}</Text>

      {perfectBadges.length === 0 ? (
        <Text style={styles.subtitle}>No badges yet. Complete a perfect quiz.</Text>
      ) : (
        <View style={styles.badgeList}>
          {perfectBadges.map((category) => (
            <View key={category} style={styles.badgeCard}>
              <Text style={styles.badgeTitle}>Perfect {category} quiz</Text>
              <Text style={styles.badgeSubtitle}>All answers correct</Text>
            </View>
          ))}
        </View>
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
    marginBottom: theme.spacing.md,
  },
  points: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.lg,
  },
  badgeList: {
    paddingBottom: theme.spacing.lg,
  },
  badgeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  badgeTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  badgeSubtitle: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
});

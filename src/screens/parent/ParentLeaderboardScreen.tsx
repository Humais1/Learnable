import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToChildren, type ChildProfile } from '../../services/children';
import { subscribeToAchievements, type AchievementsSnapshot } from '../../services/progress';

export function ParentLeaderboardScreen() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
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
        subscribeToAchievements(child.id, (data) => {
          setAchievements((prev) => ({ ...prev, [child.id]: data }));
        })
      );
    });
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [children]);

  const ranked = useMemo(() => {
    return [...children]
      .map((child) => ({
        ...child,
        points: achievements[child.id]?.points ?? 0,
      }))
      .sort((a, b) => b.points - a.points);
  }, [children, achievements]);

  const maxPoints = ranked[0]?.points ?? 1;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Leaderboard</Text>
      <Text style={styles.subtitle}>Track your children’s points over time</Text>

      {ranked.length === 0 ? (
        <Text style={styles.emptyText}>No learners yet.</Text>
      ) : (
        ranked.map((child, idx) => {
          const widthPct = Math.max(6, Math.round((child.points / maxPoints) * 100));
          return (
            <View key={child.id} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.rank}>#{idx + 1}</Text>
                <Text style={styles.name}>{child.name}</Text>
                <Text style={styles.points}>{child.points} pts</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${widthPct}%` }]} />
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  row: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  rank: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.primary,
    width: 36,
  },
  name: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeights.semibold,
  },
  points: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  barTrack: {
    height: 10,
    backgroundColor: theme.colors.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
  },
});

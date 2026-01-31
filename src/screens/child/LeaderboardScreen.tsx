import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { useScreenAnnounce } from '../../hooks/useScreenAnnounce';
import { useAuth } from '../../contexts/AuthContext';
import { useChild } from '../../contexts/ChildContext';
import { subscribeToChildren, type ChildProfile } from '../../services/children';
import { subscribeToAchievements, type AchievementsSnapshot } from '../../services/progress';

export function LeaderboardScreen() {
  useScreenAnnounce('Leaderboard. See your rank this week.');
  const { user } = useAuth();
  const { selectedChild } = useChild();
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

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      {ranked.length === 0 ? (
        <Text style={styles.subtitle}>No learners yet.</Text>
      ) : (
        ranked.map((child, idx) => (
          <View
            key={child.id}
            style={[
              styles.row,
              selectedChild?.id === child.id && styles.rowSelected,
            ]}
          >
            <Text style={styles.rank}>#{idx + 1}</Text>
            <View style={styles.rowBody}>
              <Text style={styles.name}>{child.name}</Text>
              <Text style={styles.points}>Points: {child.points}</Text>
            </View>
          </View>
        ))
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rowSelected: {
    borderColor: theme.colors.primary,
  },
  rank: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
    width: 48,
  },
  rowBody: {
    flex: 1,
  },
  name: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeights.semibold,
  },
  points: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
});

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToChildren, type ChildProfile } from '../../services/children';
import {
  subscribeToAchievements,
  subscribeToQuizResults,
  type AchievementsSnapshot,
  type QuizResultsMap,
} from '../../services/progress';
import { subscribeToDailyAnalytics, type DailyAnalytics } from '../../services/analytics';
import type { ParentStackParamList } from '../../navigation/types';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { VoiceControlBar } from '../../components/VoiceControlBar';

type Nav = NativeStackNavigationProp<ParentStackParamList, 'Dashboard'>;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const voice = useVoiceCommands({
    commands: [
      { phrases: ['open reports', 'reports'], action: () => navigation.navigate('Reports') },
      { phrases: ['open settings', 'settings'], action: () => navigation.navigate('Settings') },
      {
        phrases: ['manage children', 'child profiles', 'children'],
        action: () => navigation.navigate('ChildProfiles'),
      },
      { phrases: ['go back', 'back'], action: () => navigation.goBack() },
    ],
  });
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizResults, setQuizResults] = useState<Record<string, QuizResultsMap>>({});
  const [achievements, setAchievements] = useState<Record<string, AchievementsSnapshot>>({});
  const [analytics, setAnalytics] = useState<Record<string, Record<string, DailyAnalytics>>>({});

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
      unsubscribes.push(
        subscribeToDailyAnalytics(child.id, (data) => {
          setAnalytics((prev) => ({ ...prev, [child.id]: data }));
        })
      );
    });
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [children]);

  const formatDuration = (ms: number) => {
    const totalMinutes = Math.round(ms / 60000);
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getDateKey = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => getDateKey(6 - i));
  const todayKey = getDateKey(0);

  const totals = useMemo(() => {
    const totalPoints = children.reduce((sum, child) => {
      const points = achievements[child.id]?.points ?? 0;
      return sum + points;
    }, 0);
    const todayMs = children.reduce((sum, child) => {
      const ms = analytics[child.id]?.[todayKey]?.totalMs ?? 0;
      return sum + ms;
    }, 0);
    const weekMs = children.reduce((sum, child) => {
      const childAnalytics = analytics[child.id] ?? {};
      const childWeek = last7Days.reduce(
        (acc, key) => acc + (childAnalytics[key]?.totalMs ?? 0),
        0
      );
      return sum + childWeek;
    }, 0);
    return { totalPoints, todayMs, weekMs };
  }, [children, achievements, analytics, todayKey, last7Days]);

  const topChildren = useMemo(() => {
    return [...children]
      .map((child) => ({
        ...child,
        points: achievements[child.id]?.points ?? 0,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);
  }, [children, achievements]);

  const recentQuizzes = useMemo(() => {
    const items: Array<{
      childId: string;
      childName: string;
      category: string;
      score: number;
      total: number;
      completedAt: number;
    }> = [];
    children.forEach((child) => {
      const map = quizResults[child.id] ?? {};
      Object.entries(map).forEach(([category, result]) => {
        items.push({
          childId: child.id,
          childName: child.name,
          category,
          score: result.score,
          total: result.total,
          completedAt: result.completedAt,
        });
      });
    });
    return items
      .filter((item) => Boolean(item.completedAt))
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 3);
  }, [children, quizResults]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Parent Dashboard</Text>
        <Text style={styles.heroSubtitle}>
          Welcome back{user?.displayName ? `, ${user.displayName}` : ''}. Here’s today’s
          progress.
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('ChildProfiles')}
            accessibilityLabel="Manage child profiles"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Manage children</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Reports')}
            accessibilityLabel="Open reports"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>View reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, styles.summaryCardSplit]}>
          <Text style={styles.summaryLabel}>Children</Text>
          <Text style={styles.summaryValue}>{children.length}</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardSplitLast]}>
          <Text style={styles.summaryLabel}>Total points</Text>
          <Text style={styles.summaryValue}>{totals.totalPoints}</Text>
        </View>
      </View>
      <View style={styles.summaryCardWide}>
        <Text style={styles.summaryLabel}>Learning time</Text>
        <Text style={styles.summaryValueSm}>
          Today: {formatDuration(totals.todayMs)} • Last 7 days: {formatDuration(totals.weekMs)}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Top learners</Text>
      {topChildren.length === 0 ? (
        <Text style={styles.emptyText}>No children yet. Add a child profile first.</Text>
      ) : (
        topChildren.map((child, index) => (
          <View key={child.id} style={styles.listRow}>
            <View>
              <Text style={styles.listTitle}>
                {index + 1}. {child.name}
              </Text>
              <Text style={styles.listMeta}>Top performer</Text>
            </View>
            <Text style={styles.listBadge}>{child.points} pts</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Recent quizzes</Text>
      {recentQuizzes.length === 0 ? (
        <Text style={styles.emptyText}>No quiz results yet.</Text>
      ) : (
        recentQuizzes.map((item) => (
          <View key={`${item.childId}-${item.category}`} style={styles.listRow}>
            <View>
              <Text style={styles.listTitle}>
                {item.childName} • {item.category}
              </Text>
              <Text style={styles.listMeta}>Latest quiz attempt</Text>
            </View>
            <Text style={styles.listBadge}>
              {item.score}/{item.total}
            </Text>
          </View>
        ))
      )}

      <VoiceControlBar
        listening={voice.listening}
        processing={voice.processing}
        lastTranscript={voice.lastTranscript}
        onToggle={voice.toggleListening}
        hint="Try: open reports, settings, manage children, go back."
      />
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
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTitle: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  heroSubtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    minHeight: theme.spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  primaryButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.onPrimary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    minHeight: theme.spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexGrow: 1,
    marginBottom: theme.spacing.sm,
  },
  secondaryButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.primary,
  },
  summaryGrid: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flex: 1,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryCardSplit: {
    marginRight: theme.spacing.sm,
  },
  summaryCardSplitLast: {
    marginRight: 0,
  },
  summaryCardWide: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  summaryValueSm: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  listRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  listTitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  listMeta: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  listBadge: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.onPrimary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    overflow: 'hidden',
  },
  emptyText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
});

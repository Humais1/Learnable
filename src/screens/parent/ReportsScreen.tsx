import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { subscribeToDailyAnalytics, type DailyAnalytics } from '../../services/analytics';
import type { ParentStackParamList } from '../../navigation/types';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { VoiceControlBar } from '../../components/VoiceControlBar';

export function ReportsScreen() {
  useScreenAnnounce('Reports. Learning time and quiz scores by date.');
  const navigation = useNavigation<NativeStackNavigationProp<ParentStackParamList, 'Reports'>>();
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizResults, setQuizResults] = useState<Record<string, QuizResultsMap>>({});
  const [achievements, setAchievements] = useState<Record<string, AchievementsSnapshot>>({});
  const [analytics, setAnalytics] = useState<Record<string, Record<string, DailyAnalytics>>>({});
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});
  const voice = useVoiceCommands({
    commands: [{ phrases: ['go back', 'back'], action: () => navigation.goBack() }],
  });

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
          const childAnalytics = analytics[child.id] ?? {};
          const points = childAchievements.points ?? 0;
          const badges = childAchievements.badges?.quizPerfect ?? {};
          const categories = Object.keys(childQuiz);
          const todayKey = getDateKey(0);
          const todayMs = childAnalytics[todayKey]?.totalMs ?? 0;
          const weeklyEntries = last7Days.map((key) => ({
            key,
            ms: childAnalytics[key]?.totalMs ?? 0,
          }));
          const weekMs = weeklyEntries.reduce((sum, entry) => sum + entry.ms, 0);
          const isExpanded = expandedById[child.id] ?? false;
          const toggleExpanded = () =>
            setExpandedById((prev) => ({ ...prev, [child.id]: !isExpanded }));

          return (
            <View key={child.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{child.name}</Text>
                  <Text style={styles.cardMeta}>
                    Age: {child.age || 'N/A'} • {child.disabilityType}
                  </Text>
                </View>
                <Text style={styles.pointsBadge}>{points} pts</Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryLabel}>Today</Text>
                  <Text style={styles.summaryValue}>{formatDuration(todayMs)}</Text>
                </View>
                <View style={[styles.summaryPill, styles.summaryPillLast]}>
                  <Text style={styles.summaryLabel}>Last 7 days</Text>
                  <Text style={styles.summaryValue}>{formatDuration(weekMs)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={toggleExpanded}
                accessibilityRole="button"
                accessibilityLabel={isExpanded ? 'Hide details' : 'Show details'}
              >
                <Text style={styles.toggleText}>{isExpanded ? 'Hide details' : 'Show details'}</Text>
              </TouchableOpacity>

              {isExpanded ? (
                <>
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Weekly learning</Text>
                    <View style={styles.weekRow}>
                      {weeklyEntries.map((entry) => {
                        const date = new Date(entry.key);
                        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const mins = Math.round(entry.ms / 60000);
                        return (
                          <View key={entry.key} style={styles.weekPill}>
                            <Text style={styles.weekDay}>{day}</Text>
                            <Text style={styles.weekValue}>{mins}m</Text>
                          </View>
                        );
                      })}
                    </View>
                    {weekMs === 0 ? (
                      <Text style={styles.subtitle}>No learning time recorded yet.</Text>
                    ) : null}
                  </View>

                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Quiz results</Text>
                    {categories.length === 0 ? (
                      <Text style={styles.subtitle}>No quiz results yet.</Text>
                    ) : (
                      categories.map((category) => {
                        const result = childQuiz[category];
                        const perfect = Boolean(badges?.[category]);
                        return (
                          <View key={category} style={styles.resultRow}>
                            <Text style={styles.resultLabel}>{category}</Text>
                            <Text style={styles.resultValue}>
                              {result.score}/{result.total} {perfect ? '• Perfect badge' : ''}
                            </Text>
                          </View>
                        );
                      })
                    )}
                  </View>
                </>
              ) : null}
            </View>
          );
        })
      )}

      <VoiceControlBar
        listening={voice.listening}
        processing={voice.processing}
        lastTranscript={voice.lastTranscript}
        onToggle={voice.toggleListening}
        hint="Try: go back."
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
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
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
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
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
  pointsBadge: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.onPrimary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
  },
  summaryPillLast: {
    marginRight: 0,
  },
  summaryLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeights.semibold,
  },
  toggleRow: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  toggleText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.semibold,
  },
  sectionBlock: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
  },
  weekPill: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    minWidth: 54,
    alignItems: 'center',
  },
  weekDay: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  weekValue: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeights.semibold,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  timeRow: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  resultLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
  },
  resultValue: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
});

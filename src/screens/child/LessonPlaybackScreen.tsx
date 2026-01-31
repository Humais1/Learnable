import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ChildStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { useScreenAnnounce } from '../../hooks/useScreenAnnounce';
import { useChild } from '../../contexts/ChildContext';
import { LESSONS, type LessonCategory } from '../../data/lessons';
import { markLessonCompleted } from '../../services/progress';

type Route = RouteProp<ChildStackParamList, 'LessonPlayback'>;
type Nav = NativeStackNavigationProp<ChildStackParamList, 'LessonPlayback'>;

export function LessonPlaybackScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { selectedChild } = useChild();
  const category = route.params?.category as LessonCategory;
  const lessonId = route.params?.lessonId;
  const lesson = LESSONS[category]?.find((l) => l.id === lessonId);
  const [saving, setSaving] = useState(false);

  useScreenAnnounce(
    lesson ? `Lesson. ${lesson.title}. ${lesson.prompt}` : 'Lesson playback.'
  );

  const handleComplete = async () => {
    if (!selectedChild?.id || !lesson) return;
    try {
      setSaving(true);
      await markLessonCompleted(selectedChild.id, category, lesson.id);
      navigation.goBack();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save progress.';
      Alert.alert('Save failed', msg);
    } finally {
      setSaving(false);
    }
  };

  if (!lesson || !selectedChild) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Lesson not available</Text>
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
      <Text style={styles.title}>Lesson</Text>
      <Text style={styles.subtitle}>{lesson.title}</Text>
      <Text style={styles.prompt}>{lesson.prompt}</Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleComplete}
        disabled={saving}
        accessibilityLabel="Mark completed"
        accessibilityRole="button"
      >
        {saving ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text style={styles.primaryButtonText}>Mark completed</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
  prompt: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    minHeight: theme.spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  primaryButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.onPrimary,
  },
});

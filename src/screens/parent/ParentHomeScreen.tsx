import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParentStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { useScreenAnnounce } from '../../hooks/useScreenAnnounce';
import { useAuth } from '../../contexts/AuthContext';

type Nav = NativeStackNavigationProp<ParentStackParamList, 'ParentHome'>;

export function ParentHomeScreen() {
  useScreenAnnounce('Parent home. Dashboard and child profiles.');
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Welcome</Text>
        {user?.displayName ? (
          <Text style={styles.subtitle}>Hello, {user.displayName}</Text>
        ) : (
          <Text style={styles.subtitle}>Dashboard and child progress</Text>
        )}
      </View>

      <View style={styles.menuCard}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Dashboard')}
          accessibilityLabel="Open dashboard"
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Open Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('ChildProfiles')}
          accessibilityLabel="Manage child profiles"
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Manage child profiles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Reports')}
          accessibilityLabel="Open reports"
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>View reports</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => logout()}
        accessibilityLabel="Log out"
        accessibilityRole="button"
      >
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    minHeight: theme.spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.primary,
  },
  logoutButton: {
    padding: theme.spacing.md,
    minHeight: theme.spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.error,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParentStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { VoiceControlBar } from '../../components/VoiceControlBar';

type Nav = NativeStackNavigationProp<ParentStackParamList, 'ParentHome'>;

export function ParentHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  };
  const voice = useVoiceCommands({
    commands: [
      { phrases: ['open dashboard', 'dashboard'], action: () => navigation.navigate('Dashboard') },
      { phrases: ['open reports', 'reports'], action: () => navigation.navigate('Reports') },
      { phrases: ['open settings', 'settings'], action: () => navigation.navigate('Settings') },
      {
        phrases: ['manage children', 'child profiles', 'children'],
        action: () => navigation.navigate('ChildProfiles'),
      },
      { phrases: ['log out', 'logout', 'sign out'], action: () => confirmLogout() },
      { phrases: ['go back', 'back'], action: () => navigation.goBack() },
    ],
  });

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
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Settings')}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={confirmLogout}
        accessibilityLabel="Log out"
        accessibilityRole="button"
      >
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      <VoiceControlBar
        listening={voice.listening}
        processing={voice.processing}
        lastTranscript={voice.lastTranscript}
        onToggle={voice.toggleListening}
        hint="Try: open dashboard, open reports, settings, manage children."
      />
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

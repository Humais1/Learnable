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
      <Text style={styles.title}>Parent Home</Text>
      {user?.displayName ? (
        <Text style={styles.subtitle}>Hello, {user.displayName}</Text>
      ) : (
        <Text style={styles.subtitle}>Dashboard & profiles</Text>
      )}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('ChildProfiles')}
        accessibilityLabel="Manage child profiles"
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>Manage child profiles</Text>
      </TouchableOpacity>
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
    marginBottom: theme.spacing.lg,
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
  logoutButton: {
    padding: theme.spacing.md,
    minHeight: theme.spacing.minTouchTarget,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.error,
  },
});

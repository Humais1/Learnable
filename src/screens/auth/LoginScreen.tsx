import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { useScreenAnnounce } from '../../hooks/useScreenAnnounce';
import { useTTS } from '../../hooks/useTTS';
import { useAuth } from '../../contexts/AuthContext';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const MIN_TOUCH = theme.spacing.minTouchTarget;

export function LoginScreen() {
  useScreenAnnounce('Login. Sign in to your parent account.');
  const { speak } = useTTS();
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed.';
      Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Login</Text>
      <Text style={styles.subtitle}>Sign in to your parent account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.colors.textMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
        accessibilityLabel="Email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={theme.colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
        accessibilityLabel="Password"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPressIn={() => !loading && speak('Sign in')}
        onPress={handleLogin}
        disabled={loading}
        accessibilityLabel="Sign in"
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPressIn={() => speak('Forgot password')}
        onPress={() => navigation.navigate('ForgotPassword')}
        accessibilityLabel="Forgot password"
        accessibilityRole="button"
      >
        <Text style={styles.linkText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPressIn={() => speak('Create account')}
        onPress={() => navigation.navigate('Register')}
        accessibilityLabel="Create account"
        accessibilityRole="button"
      >
        <Text style={styles.linkText}>Create an account</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
    justifyContent: 'center',
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
    marginBottom: theme.spacing.xl,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    minHeight: MIN_TOUCH,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.onPrimary,
  },
  linkButton: {
    padding: theme.spacing.md,
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
  },
  linkText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.primary,
  },
});

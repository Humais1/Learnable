import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

type VoiceControlBarProps = {
  listening: boolean;
  processing: boolean;
  disabled?: boolean;
  lastTranscript?: string | null;
  onToggle: () => void;
  hint?: string;
};

export function VoiceControlBar({
  listening,
  processing,
  disabled,
  lastTranscript,
  onToggle,
  hint,
}: VoiceControlBarProps) {
  const label = listening
    ? 'Listening… tap to stop'
    : processing
    ? 'Processing…'
    : 'Voice control';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onToggle}
        disabled={disabled || processing}
        accessibilityRole="button"
        accessibilityLabel="Toggle voice control"
      >
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
      {lastTranscript ? (
        <Text style={styles.transcript}>Heard: {lastTranscript}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  transcript: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  hint: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
  },
});

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { ParentStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { useScreenAnnounce } from '../../hooks/useScreenAnnounce';
import { useAuth } from '../../contexts/AuthContext';
import { createChild, getChild, updateChild } from '../../services/children';

type Nav = NativeStackNavigationProp<ParentStackParamList, 'AddEditChild'>;
type Route = RouteProp<ParentStackParamList, 'AddEditChild'>;

const DISABILITY_OPTIONS = [
  'Blindness',
  'Low vision',
  'Partial vision loss',
  'Color blindness',
  'Multiple disabilities',
];

export function AddEditChildScreen() {
  useScreenAnnounce('Add or edit child. Enter name, age, and level.');
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { user } = useAuth();
  const childId = route.params?.childId;
  const [loading, setLoading] = useState(!!childId);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [disabilityType, setDisabilityType] = useState(DISABILITY_OPTIONS[0]);
  const [notes, setNotes] = useState('');

  const isEditing = useMemo(() => Boolean(childId), [childId]);

  useEffect(() => {
    const load = async () => {
      if (!childId || !user?.uid) return;
      try {
        const child = await getChild(user.uid, childId);
        if (child) {
          setName(child.name ?? '');
          setAge(child.age ?? '');
          setDisabilityType(child.disabilityType ?? DISABILITY_OPTIONS[0]);
          setNotes(child.notes ?? '');
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load child.';
        Alert.alert('Error', msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [childId, user?.uid]);

  const handleSave = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be signed in.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        age: age.trim(),
        disabilityType,
        notes: notes.trim(),
      };
      if (isEditing && childId) {
        await updateChild(user.uid, childId, payload);
      } else {
        await createChild(user.uid, payload);
      }
      navigation.goBack();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed.';
      Alert.alert('Save failed', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isEditing ? 'Edit Child' : 'Add Child'}</Text>
      <Text style={styles.subtitle}>Create a profile tailored to their needs.</Text>

      <TextInput
        style={styles.input}
        placeholder="Child name"
        placeholderTextColor={theme.colors.textMuted}
        value={name}
        onChangeText={setName}
        accessibilityLabel="Child name"
      />
      <TextInput
        style={styles.input}
        placeholder="Age"
        placeholderTextColor={theme.colors.textMuted}
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        accessibilityLabel="Age"
      />

      <Text style={styles.sectionLabel}>Disability type</Text>
      <View style={styles.optionsRow}>
        {DISABILITY_OPTIONS.map((option) => {
          const selected = option === disabilityType;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.optionChip, selected && styles.optionChipSelected]}
              onPress={() => setDisabilityType(option)}
              accessibilityLabel={option}
              accessibilityRole="button"
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes (optional)"
        placeholderTextColor={theme.colors.textMuted}
        value={notes}
        onChangeText={setNotes}
        multiline
        accessibilityLabel="Notes"
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
        accessibilityLabel={isEditing ? 'Update child' : 'Save child'}
        accessibilityRole="button"
      >
        {saving ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Update child' : 'Save child'}
          </Text>
        )}
      </TouchableOpacity>
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
    marginBottom: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    minHeight: theme.spacing.minTouchTarget,
  },
  sectionLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 999,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  optionChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryDark,
  },
  optionText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
  },
  optionTextSelected: {
    color: theme.colors.onPrimary,
    fontWeight: theme.fontWeights.semibold,
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    minHeight: theme.spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.onPrimary,
  },
});

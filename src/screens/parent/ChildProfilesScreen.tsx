import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParentStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { useScreenAnnounce } from '../../hooks/useScreenAnnounce';
import { useAuth } from '../../contexts/AuthContext';
import { deleteChild, subscribeToChildren, type ChildProfile } from '../../services/children';

type Nav = NativeStackNavigationProp<ParentStackParamList, 'ChildProfiles'>;

export function ChildProfilesScreen() {
  useScreenAnnounce('Child profiles. Add or edit your children.');
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setChildren([]);
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToChildren(
      user.uid,
      (list) => {
        setChildren(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || 'Failed to load children.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user?.uid]);

  const handleDelete = (child: ChildProfile) => {
    Alert.alert('Remove child', `Remove ${child.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (!user?.uid) return;
          try {
            await deleteChild(user.uid, child.id);
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Delete failed.';
            Alert.alert('Delete failed', msg);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Child Profiles</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddEditChild')}
          accessibilityLabel="Add child"
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>Add child</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.subtitle}>Unable to load children</Text>
          <Text style={styles.helpText}>{error}</Text>
        </View>
      ) : children.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.subtitle}>No children yet.</Text>
          <Text style={styles.helpText}>Add a child profile to begin learning.</Text>
        </View>
      ) : (
        <FlatList
          data={children}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardBody}>
                <Text style={styles.childName}>{item.name}</Text>
                <Text style={styles.childMeta}>
                  Age: {item.age || 'N/A'} • {item.disabilityType}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('AddEditChild', { childId: item.id })}
                  accessibilityLabel={`Edit ${item.name}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSpacer]}
                  onPress={() => handleDelete(item)}
                  accessibilityLabel={`Remove ${item.name}`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.actionText, styles.destructiveText]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 10,
    minHeight: theme.spacing.minTouchTarget,
    justifyContent: 'center',
  },
  addButtonText: {
    color: theme.colors.onPrimary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  list: {
    paddingBottom: theme.spacing.xl,
  },
  emptyState: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
  },
  helpText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardBody: {
    marginBottom: theme.spacing.sm,
  },
  childName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  childMeta: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  actionButtonSpacer: {
    marginLeft: theme.spacing.md,
  },
  actionText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.semibold,
  },
  destructiveText: {
    color: theme.colors.error,
  },
});

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { getChild, type ChildProfile } from '../services/children';

type ChildContextValue = {
  selectedChild: ChildProfile | null;
  selectChild: (child: ChildProfile) => Promise<void>;
  clearChild: () => Promise<void>;
  loading: boolean;
};

const ChildContext = createContext<ChildContextValue | null>(null);

const selectedChildKey = (uid: string) => `learnable.selectedChild.${uid}`;

export function ChildProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const uid = user?.uid ?? '';

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!uid) {
        setSelectedChild(null);
        return;
      }
      setLoading(true);
      try {
        const savedId = await AsyncStorage.getItem(selectedChildKey(uid));
        if (!savedId) {
          setSelectedChild(null);
          return;
        }
        const child = await getChild(uid, savedId);
        if (mounted) setSelectedChild(child);
      } catch {
        if (mounted) setSelectedChild(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [uid]);

  const value = useMemo<ChildContextValue>(
    () => ({
      selectedChild,
      loading,
      selectChild: async (child: ChildProfile) => {
        if (!uid) return;
        setSelectedChild(child);
        await AsyncStorage.setItem(selectedChildKey(uid), child.id);
      },
      clearChild: async () => {
        if (!uid) return;
        setSelectedChild(null);
        await AsyncStorage.removeItem(selectedChildKey(uid));
      },
    }),
    [selectedChild, loading, uid]
  );

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>;
}

export function useChild() {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error('useChild must be used within ChildProvider');
  return ctx;
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type firebase from 'firebase/compat/app';
import { auth } from '../config/firebase';

type AuthContextValue = {
  user: firebase.User | null;
  loading: boolean;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const FIREBASE_NOT_CONFIGURED =
  'Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* keys to .env and restart (expo start).';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u ?? null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string, displayName: string) => {
    if (!auth) {
      Alert.alert('Not configured', FIREBASE_NOT_CONFIGURED);
      return;
    }
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (cred.user) {
      await cred.user.updateProfile({ displayName });
    }
  };

  const login = async (email: string, password: string) => {
    if (!auth) {
      Alert.alert('Not configured', FIREBASE_NOT_CONFIGURED);
      return;
    }
    await auth.signInWithEmailAndPassword(email, password);
  };

  const logout = async () => {
    if (!auth) {
      Alert.alert('Not configured', FIREBASE_NOT_CONFIGURED);
      return;
    }
    await auth.signOut();
  };

  const resetPassword = async (email: string) => {
    if (!auth) {
      Alert.alert('Not configured', FIREBASE_NOT_CONFIGURED);
      return;
    }
    await auth.sendPasswordResetEmail(email);
  };

  const value: AuthContextValue = {
    user,
    loading,
    register,
    login,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

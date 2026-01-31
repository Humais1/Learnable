import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AuthProvider } from './src/contexts/AuthContext';
import { ChildProvider } from './src/contexts/ChildContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ChildProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </ChildProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

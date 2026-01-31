import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

type Props = { children: ReactNode };
type State = { error: Error | null; errorInfo: ErrorInfo | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    if (__DEV__) console.error('[ErrorBoundary]', error, errorInfo.componentStack);
  }

  render() {
    const { error, errorInfo } = this.state;
    if (!error) return this.props.children;

    const message = error.message || String(error);
    const stack = error.stack ?? '';
    const componentStack = errorInfo?.componentStack ?? '';

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{message}</Text>
        {__DEV__ && stack ? (
          <>
            <Text style={styles.label}>Stack</Text>
            <Text style={styles.code}>{stack}</Text>
          </>
        ) : null}
        {__DEV__ && componentStack ? (
          <>
            <Text style={styles.label}>Component stack</Text>
            <Text style={styles.code}>{componentStack}</Text>
          </>
        ) : null}
        <TouchableOpacity
          style={styles.button}
          onPress={() => this.setState({ error: null, errorInfo: null })}
        >
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  message: { fontSize: 16, color: '#e0e0e0', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#888', marginTop: 12, marginBottom: 4 },
  code: { fontSize: 12, color: '#aaa', fontFamily: 'monospace' },
  button: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

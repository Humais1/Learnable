/**
 * Auth flow tests (mocked Firebase).
 * Run: npm test
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoginScreen } from '../src/screens/auth/LoginScreen';
import { AuthProvider } from '../src/contexts/AuthContext';

// Mock Firebase auth so tests run without real config
jest.mock('../src/config/firebase', () => ({
  auth: {},
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn((_auth, cb) => {
    cb(null);
    return jest.fn();
  }),
  updateProfile: jest.fn(),
}));

describe('Auth', () => {
  it('LoginScreen renders and shows Sign in', () => {
    render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );
    expect(screen.getByText('Login')).toBeTruthy();
    expect(screen.getByText('Sign in')).toBeTruthy();
  });
});

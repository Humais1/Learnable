import Constants from 'expo-constants';
import firebase from 'firebase/compat/app';
import type { FirebaseApp } from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

const extraFirebase =
  Constants.expoConfig?.extra?.firebase ??
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Constants as any).manifest?.extra?.firebase ??
  {};

const getValue = (envValue: string | undefined, key: string) => {
  return envValue && envValue.trim().length > 0 ? envValue : extraFirebase?.[key] ?? '';
};

const apiKey = getValue(process.env.EXPO_PUBLIC_FIREBASE_API_KEY, 'apiKey');
const projectId = getValue(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, 'projectId');
const hasConfig = Boolean(apiKey && projectId);

let app: FirebaseApp | null = null;
let auth: firebase.auth.Auth | null = null;
let database: firebase.database.Database | null = null;

if (hasConfig && !firebase.apps.length) {
  try {
    app = firebase.initializeApp({
      apiKey,
      authDomain: getValue(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, 'authDomain'),
      databaseURL: getValue(process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL, 'databaseURL'),
      projectId,
      storageBucket: getValue(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET, 'storageBucket'),
      messagingSenderId: getValue(
        process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        'messagingSenderId'
      ),
      appId: getValue(process.env.EXPO_PUBLIC_FIREBASE_APP_ID, 'appId'),
      measurementId: getValue(process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID, 'measurementId'),
    });
    auth = firebase.auth();
    database = firebase.database();
  } catch (e) {
    if (__DEV__) console.warn('[firebase] init failed', e);
  }
} else if (firebase.apps.length) {
  app = firebase.app();
  auth = firebase.auth();
  database = firebase.database();
}

export { auth, database };
export const isFirebaseConfigured = (): boolean => Boolean(auth);
export default app;

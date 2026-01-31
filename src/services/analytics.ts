import type firebase from 'firebase/compat/app';
import { database } from '../config/firebase';

export type SessionType = 'lesson' | 'quiz';

export type DailyAnalytics = {
  totalMs?: number;
  categories?: Record<string, number>;
};

const ensureDatabase = () => {
  if (!database) {
    throw new Error('Database is not configured.');
  }
  return database;
};

const getDateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const startSession = async (params: {
  childId: string;
  type: SessionType;
  category?: string;
  lessonId?: string;
}) => {
  const db = ensureDatabase();
  const ref = db.ref(`sessions/${params.childId}`).push();
  const startedAt = Date.now();
  await ref.set({
    startedAt,
    type: params.type,
    category: params.category ?? null,
    lessonId: params.lessonId ?? null,
  });
  return { sessionId: ref.key as string, startedAt };
};

export const endSession = async (params: {
  childId: string;
  sessionId: string;
  startedAt: number;
  category?: string;
}) => {
  const db = ensureDatabase();
  const endedAt = Date.now();
  const durationMs = Math.max(0, endedAt - params.startedAt);
  await db.ref(`sessions/${params.childId}/${params.sessionId}`).update({
    endedAt,
    durationMs,
  });

  const dateKey = getDateKey();
  const dailyRef = db.ref(`analytics/${params.childId}/daily/${dateKey}/totalMs`);
  await dailyRef.transaction((current) => (Number(current || 0) + durationMs));

  if (params.category) {
    const catRef = db.ref(
      `analytics/${params.childId}/daily/${dateKey}/categories/${params.category}`
    );
    await catRef.transaction((current) => (Number(current || 0) + durationMs));
  }
};

export const subscribeToDailyAnalytics = (
  childId: string,
  onChange: (data: Record<string, DailyAnalytics>) => void,
  onError?: (error: Error) => void
) => {
  const db = ensureDatabase();
  const ref = db.ref(`analytics/${childId}/daily`);
  const handler = (snapshot: firebase.database.DataSnapshot) => {
    onChange((snapshot.val() ?? {}) as Record<string, DailyAnalytics>);
  };
  const errorHandler = (err: Error) => onError?.(err);
  ref.on('value', handler, errorHandler);
  return () => ref.off('value', handler);
};

import type firebase from 'firebase/compat/app';
import { database } from '../config/firebase';

export type LessonProgress = {
  completedAt: number;
};

const ensureDatabase = () => {
  if (!database) {
    throw new Error('Database is not configured.');
  }
  return database;
};

const progressPath = (childId: string, category: string) =>
  `learning_progress/${childId}/modules/${category}`;

export const subscribeToLessonProgress = (
  childId: string,
  category: string,
  onChange: (progressMap: Record<string, LessonProgress>) => void,
  onError?: (error: Error) => void
) => {
  const db = ensureDatabase();
  const ref = db.ref(progressPath(childId, category));
  const handler = (snapshot: firebase.database.DataSnapshot) => {
    const value = snapshot.val() ?? {};
    onChange(value as Record<string, LessonProgress>);
  };
  const errorHandler = (err: Error) => onError?.(err);
  ref.on('value', handler, errorHandler);
  return () => ref.off('value', handler);
};

export const markLessonCompleted = async (
  childId: string,
  category: string,
  lessonId: string
) => {
  const db = ensureDatabase();
  const now = Date.now();
  await db.ref(`${progressPath(childId, category)}/${lessonId}`).set({
    completedAt: now,
  });
};

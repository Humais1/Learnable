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

export type QuizResult = {
  score: number;
  total: number;
  passed: boolean;
  completedAt: number;
};

export const saveQuizResult = async (
  childId: string,
  category: string,
  score: number,
  total: number,
  passed: boolean
) => {
  const db = ensureDatabase();
  const now = Date.now();
  await db.ref(`learning_progress/${childId}/quizzes/${category}`).set({
    score,
    total,
    passed,
    completedAt: now,
  });
};

export type QuizResultsMap = Record<string, QuizResult>;

export const subscribeToQuizResults = (
  childId: string,
  onChange: (results: QuizResultsMap) => void,
  onError?: (error: Error) => void
) => {
  const db = ensureDatabase();
  const ref = db.ref(`learning_progress/${childId}/quizzes`);
  const handler = (snapshot: firebase.database.DataSnapshot) => {
    onChange((snapshot.val() ?? {}) as QuizResultsMap);
  };
  const errorHandler = (err: Error) => onError?.(err);
  ref.on('value', handler, errorHandler);
  return () => ref.off('value', handler);
};

export type AchievementsSnapshot = {
  points?: number;
  badges?: {
    quizPerfect?: Record<string, { achievedAt: number }>;
  };
};

export const subscribeToAchievements = (
  childId: string,
  onChange: (data: AchievementsSnapshot) => void,
  onError?: (error: Error) => void
) => {
  const db = ensureDatabase();
  const ref = db.ref(`achievements/${childId}`);
  const handler = (snapshot: firebase.database.DataSnapshot) => {
    onChange((snapshot.val() ?? {}) as AchievementsSnapshot);
  };
  const errorHandler = (err: Error) => onError?.(err);
  ref.on('value', handler, errorHandler);
  return () => ref.off('value', handler);
};

export const awardPerfectQuiz = async (childId: string, category: string) => {
  const db = ensureDatabase();
  const badgeRef = db.ref(`achievements/${childId}/badges/quizPerfect/${category}`);
  const pointsRef = db.ref(`achievements/${childId}/points`);
  const now = Date.now();
  await badgeRef.set({ achievedAt: now });
  await pointsRef.transaction((current) => (Number(current || 0) + 10));
};

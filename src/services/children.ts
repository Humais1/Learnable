import type firebase from 'firebase/compat/app';
import { database } from '../config/firebase';

export type ChildProfile = {
  id: string;
  parentId: string;
  name: string;
  age: string;
  disabilityType: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

type ChildProfileInput = Omit<ChildProfile, 'id' | 'createdAt' | 'updatedAt' | 'parentId'>;

const childrenPath = () => 'children';

const ensureDatabase = () => {
  if (!database) {
    throw new Error('Database is not configured.');
  }
  return database;
};

export const subscribeToChildren = (
  parentId: string,
  onChange: (children: ChildProfile[]) => void,
  onError?: (error: Error) => void
) => {
  const db = ensureDatabase();
  const ref = db.ref(childrenPath()).orderByChild('parentId').equalTo(parentId);
  const handler = (snapshot: firebase.database.DataSnapshot) => {
    const value = snapshot.val() ?? {};
    const list = Object.entries(value).map(([id, data]) => {
      const child = data as Omit<ChildProfile, 'id'>;
      return { id, ...child };
    });
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    onChange(list);
  };
  const errorHandler = (err: Error) => {
    onError?.(err);
  };
  ref.on('value', handler, errorHandler);
  return () => ref.off('value', handler);
};

export const createChild = async (parentId: string, input: ChildProfileInput) => {
  const db = ensureDatabase();
  const ref = db.ref(childrenPath()).push();
  const now = Date.now();
  await ref.set({
    parentId,
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  return ref.key as string;
};

export const updateChild = async (
  parentId: string,
  childId: string,
  input: ChildProfileInput
) => {
  const db = ensureDatabase();
  const now = Date.now();
  await db.ref(`${childrenPath()}/${childId}`).update({
    parentId,
    ...input,
    updatedAt: now,
  });
};

export const deleteChild = async (parentId: string, childId: string) => {
  const db = ensureDatabase();
  await db.ref(`${childrenPath()}/${childId}`).remove();
};

export const getChild = async (parentId: string, childId: string) => {
  const db = ensureDatabase();
  const snapshot = await db.ref(`${childrenPath()}/${childId}`).once('value');
  const value = snapshot.val();
  if (!value) return null;
  const child = { id: childId, ...(value as Omit<ChildProfile, 'id'>) } as ChildProfile;
  if (child.parentId !== parentId) return null;
  return child;
};

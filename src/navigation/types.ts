import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabsParamList = {
  ParentTab: undefined;
  ChildTab: undefined;
  SettingsTab: undefined;
};

export type ParentStackParamList = {
  ParentHome: undefined;
  ChildProfiles: undefined;
  AddEditChild: { childId?: string };
  Reports: undefined;
  Dashboard: undefined;
  Settings: undefined;
};

export type ChildStackParamList = {
  ChildHome: undefined;
  LessonList: { category: string };
  LessonPlayback: { lessonId: string; category: string };
  Quiz: { category: string };
  Badges: undefined;
  Leaderboard: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

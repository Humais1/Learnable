import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ChildStackParamList } from './types';
import { ChildHomeScreen } from '../screens/child/ChildHomeScreen';
import { LessonListScreen } from '../screens/child/LessonListScreen';
import { LessonPlaybackScreen } from '../screens/child/LessonPlaybackScreen';
import { QuizScreen } from '../screens/child/QuizScreen';
import { BadgesScreen } from '../screens/child/BadgesScreen';
import { LeaderboardScreen } from '../screens/child/LeaderboardScreen';

const Stack = createNativeStackNavigator<ChildStackParamList>();

export function ChildNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F0F1A' },
      }}
    >
      <Stack.Screen name="ChildHome" component={ChildHomeScreen} />
      <Stack.Screen name="LessonList" component={LessonListScreen} />
      <Stack.Screen name="LessonPlayback" component={LessonPlaybackScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="Badges" component={BadgesScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ParentStackParamList } from './types';
import { ParentHomeScreen } from '../screens/parent/ParentHomeScreen';
import { ChildProfilesScreen } from '../screens/parent/ChildProfilesScreen';
import { AddEditChildScreen } from '../screens/parent/AddEditChildScreen';
import { ReportsScreen } from '../screens/parent/ReportsScreen';
import { DashboardScreen } from '../screens/parent/DashboardScreen';
import { SettingsScreen } from '../screens/parent/SettingsScreen';

const Stack = createNativeStackNavigator<ParentStackParamList>();

export function ParentNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F0F1A' },
      }}
    >
      <Stack.Screen name="ParentHome" component={ParentHomeScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="ChildProfiles" component={ChildProfilesScreen} />
      <Stack.Screen name="AddEditChild" component={AddEditChildScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

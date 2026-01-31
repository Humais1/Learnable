import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from './types';
import { ParentNavigator } from './ParentNavigator';
import { ChildNavigator } from './ChildNavigator';
import { theme } from '../theme';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontSize: theme.fontSizes.sm },
      }}
    >
      <Tab.Screen
        name="ParentTab"
        component={ParentNavigator}
        options={{ tabBarLabel: 'Parent' }}
      />
      <Tab.Screen
        name="ChildTab"
        component={ChildNavigator}
        options={{ tabBarLabel: 'Learn' }}
      />
    </Tab.Navigator>
  );
}

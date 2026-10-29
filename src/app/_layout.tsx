import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/colors';
import { TasksProvider } from '../context/tasks-context';

export default function RootLayout() {
  return (
    <TasksProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="task-form" />
      </Stack>
    </TasksProvider>
  );
}
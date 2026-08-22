import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/design/theme';

export default function OnboardingLayout() {
  const { tokens } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.background },
      }}
    >
      <Stack.Screen name="create-organization" />
      <Stack.Screen name="index" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}

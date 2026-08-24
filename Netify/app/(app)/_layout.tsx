import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/design/theme';

export default function AppLayout() {
  const { tokens } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="copilot/index" />
      <Stack.Screen name="customers/index" />
      <Stack.Screen name="receivables/index" />
      <Stack.Screen name="commitments/index" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="subscription/index" />
      <Stack.Screen name="security/index" />
      <Stack.Screen name="security/sessions" />
    </Stack>
  );
}

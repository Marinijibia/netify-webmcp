import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/design/theme';

// Keep native splash screen locked until initial auth state and theme are fully resolved
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { isDark, tokens, initializeTheme } = useTheme();

  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([initializeTheme(), initializeAuth()]);
      } catch (err) {
        console.warn('Initialization error:', err);
      }
    }
    prepare();
  }, [initializeTheme, initializeAuth]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: tokens.background },
            animation: 'none',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

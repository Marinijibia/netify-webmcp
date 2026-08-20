import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center p-6">
      <ActivityIndicator size="large" color="#10b981" />
      <Text className="text-sm font-medium text-slate-400 mt-4 tracking-wide text-center">
        {message}
      </Text>
    </SafeAreaView>
  );
}

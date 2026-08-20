import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth-store';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import { Button } from '@/components/ui/button';

export default function EntryScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(app)/index');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center p-6">
        <View className="w-14 h-14 bg-emerald-500 rounded-2xl items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
          <Text className="text-slate-950 text-2xl font-black">N</Text>
        </View>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center p-6">
      <View className="w-14 h-14 bg-emerald-500 rounded-2xl items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
        <Text className="text-slate-950 text-2xl font-black">N</Text>
      </View>
      <Text className="text-2xl font-black text-white mb-2">Netify Mobile</Text>
      <Text className="text-xs text-slate-400 text-center mb-8 px-6">
        AI Collections + Business Memory for African SMEs
      </Text>

      <View className="w-full max-w-xs gap-3">
        <Button
          label="Sign In"
          onPress={() => router.push('/(auth)/login')}
          variant="primary"
        />
        <Button
          label="Register Business"
          onPress={() => router.push('/(auth)/register')}
          variant="secondary"
        />
      </View>
    </SafeAreaView>
  );
}

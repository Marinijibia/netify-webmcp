import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function BusinessOnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-6 justify-center">
      <View className="mb-8">
        <View className="w-12 h-12 bg-emerald-500 rounded-xl items-center justify-center mb-4">
          <Text className="text-slate-950 text-xl font-black">🏢</Text>
        </View>
        <Text className="text-3xl font-black text-white">Business Setup</Text>
        <Text className="text-sm text-slate-400 mt-1">
          Configure your SME currency and collection settings
        </Text>
      </View>

      <Card className="p-6 mb-6">
        <Text className="text-slate-200 text-sm font-semibold mb-2">
          Onboarding Foundation Ready
        </Text>
        <Text className="text-slate-400 text-xs leading-5">
          In the upcoming phase, this screen will configure default currency (NGN, GHS, KES, USD), business phone, and collection reminder templates.
        </Text>
      </Card>

      <Button
        label="Complete Setup & Enter App"
        onPress={() => router.replace('/(app)/index')}
      />
    </SafeAreaView>
  );
}

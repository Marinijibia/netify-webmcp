import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function VerifyEmailScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-6 justify-center">
      <View className="mb-8">
        <View className="w-12 h-12 bg-emerald-500 rounded-xl items-center justify-center mb-4">
          <Text className="text-slate-950 text-xl font-black">✉</Text>
        </View>
        <Text className="text-3xl font-black text-white">Verify email</Text>
        <Text className="text-sm text-slate-400 mt-1">
          Enter the 6-digit verification code sent to your email
        </Text>
      </View>

      <Card className="gap-4 mb-6">
        <Input
          label="Verification Code"
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
        />

        <Button
          label="Verify Code"
          onPress={() => router.push('/(onboarding)/index')}
          className="mt-2"
        />
      </Card>

      <View className="flex-row justify-center items-center gap-1.5">
        <Text className="text-xs text-slate-400">Didn't receive code?</Text>
        <TouchableOpacity onPress={() => {}}>
          <Text className="text-xs font-bold text-emerald-400">Resend</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

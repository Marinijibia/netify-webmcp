import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-6 justify-center">
      <View className="mb-8">
        <Text className="text-3xl font-black text-white">Reset password</Text>
        <Text className="text-sm text-slate-400 mt-1">
          Enter your registered email to receive reset instructions
        </Text>
      </View>

      <Card className="gap-4 mb-6">
        <Input
          label="Email Address"
          placeholder="name@business.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          label="Send Reset Code"
          onPress={() => router.push('/(auth)/reset-password')}
          className="mt-2"
        />
      </Card>

      <TouchableOpacity
        onPress={() => router.back()}
        className="items-center"
      >
        <Text className="text-xs font-bold text-slate-400">Back to Sign In</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

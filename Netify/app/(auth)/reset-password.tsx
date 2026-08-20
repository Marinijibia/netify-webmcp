import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ResetPasswordScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-6 justify-center">
      <View className="mb-8">
        <Text className="text-3xl font-black text-white">Set new password</Text>
        <Text className="text-sm text-slate-400 mt-1">
          Enter the reset code and your new password
        </Text>
      </View>

      <Card className="gap-4 mb-6">
        <Input
          label="Reset Code"
          placeholder="123456"
          keyboardType="number-pad"
        />

        <Input
          label="New Password"
          placeholder="••••••••"
          secureTextEntry
        />

        <Button
          label="Update Password"
          onPress={() => router.push('/(auth)/login')}
          className="mt-2"
        />
      </Card>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/login')}
        className="items-center"
      >
        <Text className="text-xs font-bold text-slate-400">Back to Sign In</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

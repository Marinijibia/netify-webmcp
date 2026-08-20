import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-6 justify-center">
      <View className="mb-8">
        <View className="w-12 h-12 bg-emerald-500 rounded-xl items-center justify-center mb-4">
          <Text className="text-slate-950 text-xl font-black">N</Text>
        </View>
        <Text className="text-3xl font-black text-white">Welcome back</Text>
        <Text className="text-sm text-slate-400 mt-1">
          Sign in to your Netify account
        </Text>
      </View>

      <Card className="gap-4 mb-6">
        <Input
          label="Email Address"
          placeholder="name@business.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          placeholder="••••••••"
          secureTextEntry
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          className="self-end"
        >
          <Text className="text-xs font-semibold text-emerald-400">
            Forgot password?
          </Text>
        </TouchableOpacity>

        <Button
          label="Sign In"
          onPress={() => {
            // Foundation readiness - will connect to /auth/login in next phase
          }}
          className="mt-2"
        />
      </Card>

      <View className="flex-row justify-center items-center gap-1.5">
        <Text className="text-xs text-slate-400">Don't have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text className="text-xs font-bold text-emerald-400">Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

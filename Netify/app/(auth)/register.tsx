import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerClassName="px-6 py-8 justify-center min-h-full">
        <View className="mb-8">
          <View className="w-12 h-12 bg-emerald-500 rounded-xl items-center justify-center mb-4">
            <Text className="text-slate-950 text-xl font-black">N</Text>
          </View>
          <Text className="text-3xl font-black text-white">Create account</Text>
          <Text className="text-sm text-slate-400 mt-1">
            Start managing collections and business memory
          </Text>
        </View>

        <Card className="gap-4 mb-6">
          <Input
            label="Full Name"
            placeholder="John Doe"
            autoCapitalize="words"
          />

          <Input
            label="Business Name"
            placeholder="Apex Trading Ltd"
            autoCapitalize="words"
          />

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

          <Button
            label="Create Account"
            onPress={() => router.push('/(auth)/verify-email')}
            className="mt-2"
          />
        </Card>

        <View className="flex-row justify-center items-center gap-1.5 mb-4">
          <Text className="text-xs text-slate-400">Already registered?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-xs font-bold text-emerald-400">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

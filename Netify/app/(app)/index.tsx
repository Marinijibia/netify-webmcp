import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/empty-state';

export default function AppHomeScreen() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleSignOut = async () => {
    await clearSession();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950 px-6 py-8">
      {/* App Header */}
      <View className="flex-row items-center justify-between mb-8">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-emerald-500 rounded-xl items-center justify-center">
            <Text className="text-slate-950 text-lg font-black">N</Text>
          </View>
          <View>
            <Text className="text-lg font-black text-white">Netify</Text>
            <Text className="text-xs text-slate-400">Mobile Foundation Active</Text>
          </View>
        </View>

        <Button
          label="Sign Out"
          variant="outline"
          size="sm"
          onPress={handleSignOut}
        />
      </View>

      {/* Foundation Status Card */}
      <Card className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Architecture Status
          </Text>
          <View className="bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            <Text className="text-[11px] font-bold text-emerald-400">READY</Text>
          </View>
        </View>

        <Text className="text-slate-100 text-sm font-semibold mb-1">
          Standalone Foundation Verified
        </Text>
        <Text className="text-slate-400 text-xs leading-5">
          Expo SDK 54, NativeWind v5, TanStack Query, SecureStorage, and strict TypeScript are cleanly operational.
        </Text>
      </Card>

      {/* Clean Empty State Example */}
      <View className="flex-1 justify-center">
        <EmptyState
          title="No Active Collections"
          description="Your real SME customers, invoices, and debt commitments will appear here once connected to the backend."
        />
      </View>
    </SafeAreaView>
  );
}

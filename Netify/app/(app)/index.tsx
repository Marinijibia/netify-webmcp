import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth-store';
import { Button, Card, Badge, EmptyState } from '@/design/components';
import { ShieldIcon, ChevronRightIcon, BuildingIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';

export default function AppHomeScreen() {
  const router = useRouter();
  const { user, organization, role, logout } = useAuthStore();
  const { tokens, isDark } = useTheme();

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }} className="px-6 py-6">
      {/* App Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <View
            style={{ backgroundColor: tokens.primary }}
            className="w-10 h-10 rounded-xl items-center justify-center mr-3 shadow-sm"
          >
            <Text className="text-white text-lg font-black">N</Text>
          </View>
          <View>
            <Text style={{ color: tokens.textPrimary }} className="text-lg font-bold">
              {organization?.name || 'Netify Workspace'}
            </Text>
            <Text style={{ color: tokens.textSecondary }} className="text-xs">
              {user ? `${user.firstName} ${user.lastName} • ${role || 'OWNER'}` : 'Netify Mobile'}
            </Text>
          </View>
        </View>

        <Button
          label="Sign Out"
          variant="tertiary"
          size="sm"
          onPress={handleSignOut}
        />
      </View>

      {/* Verified Workspace Card */}
      <Card className="p-4 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text style={{ color: tokens.textMuted }} className="text-xs font-bold uppercase tracking-wider">
            Workspace Active
          </Text>
          <Badge
            label={`${organization?.currency || 'NGN'} • VERIFIED`}
            variant="primary"
            size="sm"
          />
        </View>

        <Text style={{ color: tokens.textSecondary }} className="text-xs">
          Signed in as <Text style={{ color: tokens.textPrimary, fontWeight: '600' }}>{user?.email}</Text>
        </Text>
      </Card>

      {/* Security Quick Link */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => router.push('/(app)/security' as any)}
        style={{
          backgroundColor: isDark ? tokens.surface : '#FFFFFF',
          borderColor: tokens.border,
          borderWidth: 1,
        }}
        className="rounded-2xl p-4 mb-6 flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          <View
            style={{ backgroundColor: tokens.accentSoft }}
            className="w-9 h-9 rounded-xl items-center justify-center mr-3"
          >
            <ShieldIcon size={18} color={tokens.accent} />
          </View>
          <View>
            <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold">
              Security, Appearance & Sessions
            </Text>
            <Text style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
              Theme appearance, biometrics & active sign-ins
            </Text>
          </View>
        </View>
        <ChevronRightIcon size={18} color={tokens.textMuted} />
      </TouchableOpacity>

      {/* Clean Collections Placeholder */}
      <View className="flex-1 justify-center">
        <EmptyState
          icon={<BuildingIcon size={28} color={tokens.accent} />}
          title="No Active Invoices"
          description="Your real SME debtors, overdue receivables, and automated WhatsApp follow-ups will appear here in Phase 3."
        />
      </View>
    </SafeAreaView>
  );
}

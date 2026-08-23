import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth-store';
import { useBillingStore } from '@/store/billing-store';
import {
  Button,
  Card,
  Badge,
  DailyBriefingCard,
  PriorityCustomerCard,
  BusinessQAModal,
  ProPaywallModal,
  BusinessPaywallModal,
  BusinessSwitcherModal,
} from '@/design/components';
import { ShieldIcon, ChevronRightIcon, BuildingIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  aiApi,
  TodayAttentionData,
  PriorityCustomerItem,
} from '@/services/api/ai';
import { BillingPlan } from '@/services/billing/billing.types';

export default function AppHomeScreen() {
  const router = useRouter();
  const { user, organization, role, logout } = useAuthStore();
  const { tokens, isDark } = useTheme();

  const {
    plan,
    isPro,
    initializeBilling,
    openBusinessSwitcher,
    openProPaywall,
    canAccessFeature,
  } = useBillingStore();

  const [attentionData, setAttentionData] = useState<TodayAttentionData | null>(null);
  const [priorityCustomers, setPriorityCustomers] = useState<PriorityCustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qaModalVisible, setQaModalVisible] = useState(false);

  useEffect(() => {
    if (user?.id && organization?.id) {
      initializeBilling(user.id, organization.id);
    }
  }, [user?.id, organization?.id]);

  const loadCopilotData = useCallback(async () => {
    try {
      const [todayResult, priorityResult] = await Promise.all([
        aiApi.getTodayAttention(),
        aiApi.getPriorityCustomers({ limit: 5 }),
      ]);
      setAttentionData(todayResult);
      setPriorityCustomers(priorityResult.items);
    } catch (err) {
      console.warn('Failed to load Collection Copilot data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCopilotData();
  }, [loadCopilotData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCopilotData();
  };

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleAskCopilot = () => {
    if (!canAccessFeature('AI_COLLECTION_COPILOT')) {
      openProPaywall();
      return;
    }
    setQaModalVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.primary}
            colors={[tokens.primary]}
          />
        }
      >
        {/* App Header with Business Switcher Trigger */}
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={openBusinessSwitcher}
            className="flex-row items-center flex-1 mr-2"
          >
            <View
              style={{ backgroundColor: tokens.primary }}
              className="w-10 h-10 rounded-xl items-center justify-center mr-3 shadow-sm"
            >
              <Text className="text-white text-lg font-black">N</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Text
                  style={{ color: tokens.textPrimary }}
                  className="text-base font-bold"
                  numberOfLines={1}
                >
                  {organization?.name || 'Netify Workspace'}
                </Text>
                <Feather name="chevron-down" size={16} color={tokens.textSecondary} />
              </View>
              <Text style={{ color: tokens.textSecondary }} className="text-xs">
                {user ? `${user.firstName} • ${role || 'OWNER'}` : 'Netify Mobile'} • {plan}
              </Text>
            </View>
          </TouchableOpacity>

          <Button
            label="Sign Out"
            variant="tertiary"
            size="sm"
            onPress={handleSignOut}
          />
        </View>

        {/* Daily Briefing Card */}
        <DailyBriefingCard
          data={attentionData}
          loading={loading}
          onAskCopilot={handleAskCopilot}
          onRefresh={loadCopilotData}
        />

        {/* Priority Attention Customers Section */}
        {priorityCustomers.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Feather name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold uppercase tracking-wider">
                  Needs Attention Today
                </Text>
              </View>
              <Text style={{ color: tokens.textSecondary }} className="text-xs font-semibold">
                {priorityCustomers.length} Priority Accounts
              </Text>
            </View>

            {priorityCustomers.map((cust) => (
              <PriorityCustomerCard
                key={cust.customerId}
                customer={cust}
                onPress={() => router.push(`/(app)/customers/${cust.customerId}` as any)}
                onQuickMessage={() => router.push(`/(app)/customers/${cust.customerId}` as any)}
              />
            ))}
          </View>
        )}

        {/* Navigation Quick Links Section */}
        <Text style={{ color: tokens.textSecondary }} className="text-xs font-bold uppercase tracking-wider mb-3">
          Workspace Modules
        </Text>

        {/* Receivables & Financial Ledger Quick Link */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push('/(app)/receivables' as any)}
          style={{
            backgroundColor: isDark ? tokens.surface : '#FFFFFF',
            borderColor: tokens.border,
            borderWidth: 1,
          }}
          className="rounded-2xl p-4 mb-3 flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: tokens.primarySoft }}
              className="w-9 h-9 rounded-xl items-center justify-center mr-3"
            >
              <BuildingIcon size={18} color={tokens.primary} />
            </View>
            <View>
              <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold">
                Receivables & Payments
              </Text>
              <Text style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
                Authoritative debtor balances, debts & payments
              </Text>
            </View>
          </View>
          <ChevronRightIcon size={18} color={tokens.textMuted} />
        </TouchableOpacity>

        {/* Payment Promises Quick Link */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push('/(app)/commitments' as any)}
          style={{
            backgroundColor: isDark ? tokens.surface : '#FFFFFF',
            borderColor: tokens.border,
            borderWidth: 1,
          }}
          className="rounded-2xl p-4 mb-3 flex-row items-center justify-between"
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
                Payment Promises
              </Text>
              <Text style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
                Today's, upcoming & missed customer commitments
              </Text>
            </View>
          </View>
          <ChevronRightIcon size={18} color={tokens.textMuted} />
        </TouchableOpacity>

        {/* Customers Management Quick Link */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push('/(app)/customers' as any)}
          style={{
            backgroundColor: isDark ? tokens.surface : '#FFFFFF',
            borderColor: tokens.border,
            borderWidth: 1,
          }}
          className="rounded-2xl p-4 mb-3 flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: tokens.primarySoft }}
              className="w-9 h-9 rounded-xl items-center justify-center mr-3"
            >
              <BuildingIcon size={18} color={tokens.primary} />
            </View>
            <View>
              <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold">
                Customers & Contacts
              </Text>
              <Text style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
                Client directory, phone numbers & contacts
              </Text>
            </View>
          </View>
          <ChevronRightIcon size={18} color={tokens.textMuted} />
        </TouchableOpacity>

        {/* Subscription & Billing Quick Link */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push('/(app)/subscription' as any)}
          style={{
            backgroundColor: isDark ? tokens.surface : '#FFFFFF',
            borderColor: tokens.border,
            borderWidth: 1,
          }}
          className="rounded-2xl p-4 mb-3 flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: isPro ? 'rgba(0, 165, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)' }}
              className="w-9 h-9 rounded-xl items-center justify-center mr-3"
            >
              <MaterialCommunityIcons
                name="crown-outline"
                size={20}
                color={isPro ? '#00A581' : '#3B82F6'}
              />
            </View>
            <View>
              <View className="flex-row items-center gap-2">
                <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold">
                  Subscription & Billing
                </Text>
                <View
                  style={{
                    backgroundColor: isPro ? '#00A581' : '#64748B',
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 4,
                  }}
                >
                  <Text className="text-white text-[10px] font-extrabold">{plan}</Text>
                </View>
              </View>
              <Text style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
                Manage commercial plan, AI usage limits & store billing
              </Text>
            </View>
          </View>
          <ChevronRightIcon size={18} color={tokens.textMuted} />
        </TouchableOpacity>

        {/* Security Quick Link */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push('/(app)/security' as any)}
          style={{
            backgroundColor: isDark ? tokens.surface : '#FFFFFF',
            borderColor: tokens.border,
            borderWidth: 1,
          }}
          className="rounded-2xl p-4 mb-3 flex-row items-center justify-between"
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
      </ScrollView>

      {/* Business Q&A Modal */}
      <BusinessQAModal
        visible={qaModalVisible}
        onClose={() => setQaModalVisible(false)}
      />

      {/* Embedded Billing & Multi-Business Modals */}
      <ProPaywallModal />
      <BusinessPaywallModal />
      <BusinessSwitcherModal />
    </SafeAreaView>
  );
}

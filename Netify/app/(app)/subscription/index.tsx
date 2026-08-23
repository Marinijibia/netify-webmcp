import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/design/theme';
import { useAuthStore } from '@/store/auth-store';
import { useBillingStore } from '@/store/billing-store';
import {
  SubscriptionCard,
  ProPaywallModal,
  BusinessPaywallModal,
} from '@/design/components';
import { BillingPlan } from '@/services/billing/billing.types';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();

  const { organization, user } = useAuthStore();
  const {
    plan,
    status,
    subscription,
    isLoading,
    refreshSubscription,
    openProPaywall,
    openBusinessPaywall,
    restorePurchases,
  } = useBillingStore();

  useEffect(() => {
    refreshSubscription();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={tokens.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tokens.textPrimary }]}>
          Subscription & Billing
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Active Workspace Info */}
        <View
          style={[
            styles.orgPill,
            {
              backgroundColor: tokens.surface,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
            },
          ]}
        >
          <MaterialCommunityIcons name="storefront-outline" size={18} color="#00A581" />
          <Text style={[styles.orgPillText, { color: tokens.textPrimary }]}>
            Workspace: {organization?.name || 'My Business'}
          </Text>
        </View>

        {/* Current Subscription Card */}
        <SubscriptionCard />

        {/* Plan Comparison Section */}
        <Text style={[styles.sectionHeading, { color: tokens.textPrimary }]}>
          Commercial Plans
        </Text>

        {/* Plan 1: Free */}
        <View
          style={[
            styles.planBox,
            {
              backgroundColor: tokens.surface,
              borderColor: plan === BillingPlan.FREE ? '#00A581' : isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              borderWidth: plan === BillingPlan.FREE ? 2 : 1,
            },
          ]}
        >
          <View style={styles.planBoxHeader}>
            <View>
              <Text style={[styles.planBoxTitle, { color: tokens.textPrimary }]}>
                Netify Free
              </Text>
              <Text style={[styles.planBoxSubtitle, { color: tokens.textSecondary }]}>
                Essential bookkeeping & manual collection
              </Text>
            </View>
            {plan === BillingPlan.FREE && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>CURRENT</Text>
              </View>
            )}
          </View>

          <View style={styles.bulletList}>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • 1 Business workspace
            </Text>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • 25 Customers ledger limit
            </Text>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • 20 AI test requests/month
            </Text>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • Basic Timeline & Activity Stream
            </Text>
          </View>
        </View>

        {/* Plan 2: Pro */}
        <View
          style={[
            styles.planBox,
            {
              backgroundColor: tokens.surface,
              borderColor: plan === BillingPlan.PRO ? '#00A581' : isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              borderWidth: plan === BillingPlan.PRO ? 2 : 1,
            },
          ]}
        >
          <View style={styles.planBoxHeader}>
            <View>
              <Text style={[styles.planBoxTitle, { color: tokens.textPrimary }]}>
                Netify Pro
              </Text>
              <Text style={[styles.planBoxSubtitle, { color: tokens.textSecondary }]}>
                Autonomous AI Collections & 360 Memory
              </Text>
            </View>
            {plan === BillingPlan.PRO ? (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>CURRENT</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.smallUpgradeBtn, { backgroundColor: '#00A581' }]}
                onPress={openProPaywall}
              >
                <Text style={styles.smallUpgradeBtnText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bulletList}>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • AI Collection Copilot & Today Attention
            </Text>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • Customer Intelligence & Behavioral Risk Scoring
            </Text>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • AI WhatsApp Message Drafting
            </Text>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • Natural Language Business Q&A
            </Text>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • 250 AI Requests/mo & 500 Customers
            </Text>
          </View>
        </View>

        {/* Plan 3: Business */}
        <View
          style={[
            styles.planBox,
            {
              backgroundColor: tokens.surface,
              borderColor: plan === BillingPlan.BUSINESS ? '#3B82F6' : isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              borderWidth: plan === BillingPlan.BUSINESS ? 2 : 1,
            },
          ]}
        >
          <View style={styles.planBoxHeader}>
            <View>
              <Text style={[styles.planBoxTitle, { color: tokens.textPrimary }]}>
                Netify Business
              </Text>
              <Text style={[styles.planBoxSubtitle, { color: tokens.textSecondary }]}>
                Multi-business operators & SME groups
              </Text>
            </View>
            {plan === BillingPlan.BUSINESS ? (
              <View style={[styles.currentBadge, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.currentBadgeText}>CURRENT</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.smallUpgradeBtn, { backgroundColor: '#3B82F6' }]}
                onPress={openBusinessPaywall}
              >
                <Text style={styles.smallUpgradeBtnText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bulletList}>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • Up to 5 Isolated Business Workspaces
            </Text>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • 10 Team Member Seats with RBAC
            </Text>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • 1,000 AI Requests/mo & 5,000 Customers
            </Text>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • Cross-Business Portfolio Overview
            </Text>
            <Text style={[styles.bulletItem, { color: tokens.textSecondary }]}>
              • Includes all Pro Intelligence Features
            </Text>
          </View>
        </View>

        {/* Netify Foundation Commitment */}
        <View style={styles.foundationCard}>
          <MaterialCommunityIcons name="charity" size={24} color="#00A581" />
          <View style={styles.foundationTextCol}>
            <Text style={[styles.foundationTitle, { color: tokens.textPrimary }]}>
              Netify Foundation Impact
            </Text>
            <Text style={[styles.foundationDesc, { color: tokens.textSecondary }]}>
              20% of every subscription fee is dedicated to supporting educational access and out-of-school children across Africa.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Embedded Modals */}
      <ProPaywallModal />
      <BusinessPaywallModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  orgPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 4,
  },
  orgPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 12,
  },
  planBox: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  planBoxHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  planBoxTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  planBoxSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: '#00A581',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  smallUpgradeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallUpgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bulletList: {
    gap: 4,
  },
  bulletItem: {
    fontSize: 13,
    lineHeight: 18,
  },
  foundationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 165, 129, 0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginTop: 10,
  },
  foundationTextCol: {
    flex: 1,
  },
  foundationTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  foundationDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});

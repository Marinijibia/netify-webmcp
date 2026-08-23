import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/design/theme';
import { useBillingStore } from '@/store/billing-store';
import { BillingPlan } from '@/services/billing/billing.types';
import { billingProvider } from '@/services/billing/revenuecat-provider';

export function SubscriptionCard() {
  const { tokens, isDark } = useTheme();

  const {
    plan,
    status,
    subscription,
    isLoading,
    openProPaywall,
    openBusinessPaywall,
    restorePurchases,
  } = useBillingStore();

  const isFree = plan === BillingPlan.FREE;
  const isPro = plan === BillingPlan.PRO;
  const isBusiness = plan === BillingPlan.BUSINESS;
  const isEnterprise = plan === BillingPlan.ENTERPRISE;

  const aiUsed = subscription?.aiUsage?.used || 0;
  const aiLimit = subscription?.limits?.maxAIRequestsPerMonth || 20;
  const aiProgress = Math.min(1, aiUsed / aiLimit);

  const planBadgeColor = isEnterprise
    ? '#8B5CF6'
    : isBusiness
    ? '#3B82F6'
    : isPro
    ? '#00A581'
    : '#64748B';

  const handleManage = async () => {
    await billingProvider.presentCustomerCenter();
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.surface,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.planBadge, { backgroundColor: planBadgeColor }]}>
            <Text style={styles.planBadgeText}>PLAN: {plan}</Text>
          </View>
          <Text style={[styles.statusText, { color: tokens.textSecondary }]}>
            Status: {status.toLowerCase()}
          </Text>
        </View>

        {!isFree && (
          <TouchableOpacity style={styles.manageBtn} onPress={handleManage}>
            <Text style={[styles.manageBtnText, { color: tokens.textSecondary }]}>
              Manage in Store
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* AI Usage Gauge */}
      <View style={styles.usageSection}>
        <View style={styles.usageLabelRow}>
          <Text style={[styles.usageLabel, { color: tokens.textPrimary }]}>
            Monthly AI Copilot Capacity
          </Text>
          <Text style={[styles.usageNumbers, { color: tokens.textSecondary }]}>
            {aiUsed} / {aiLimit} requests
          </Text>
        </View>
        <View
          style={[
            styles.progressBarBg,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' },
          ]}
        >
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${aiProgress * 100}%`,
                backgroundColor: aiProgress > 0.85 ? '#EF4444' : '#00A581',
              },
            ]}
          />
        </View>
      </View>

      {/* Renewal Info */}
      {subscription?.expiresAt && (
        <View style={styles.dateRow}>
          <Feather name="clock" size={13} color={tokens.textSecondary} />
          <Text style={[styles.dateText, { color: tokens.textSecondary }]}>
            {subscription.autoRenewing ? 'Renews on' : 'Expires on'}{' '}
            {new Date(subscription.expiresAt).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {isFree ? (
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: '#00A581' }]}
            onPress={openProPaywall}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={16} color="#FFFFFF" />
            <Text style={styles.upgradeButtonText}>Upgrade to Netify Pro</Text>
          </TouchableOpacity>
        ) : isPro ? (
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: '#3B82F6' }]}
            onPress={openBusinessPaywall}
          >
            <MaterialCommunityIcons name="office-building" size={16} color="#FFFFFF" />
            <Text style={styles.upgradeButtonText}>Upgrade to Business (5 Workspaces)</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[
            styles.restoreBtn,
            { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1' },
          ]}
          onPress={restorePurchases}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={tokens.textPrimary} />
          ) : (
            <>
              <Feather name="refresh-cw" size={13} color={tokens.textPrimary} />
              <Text style={[styles.restoreBtnText, { color: tokens.textPrimary }]}>
                Restore Purchases
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  manageBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  manageBtnText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  usageSection: {
    marginBottom: 12,
  },
  usageLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  usageLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  usageNumbers: {
    fontSize: 12,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  dateText: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  upgradeButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  restoreBtn: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  restoreBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

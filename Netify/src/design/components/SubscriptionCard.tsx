import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/design/theme';
import { useBillingStore } from '@/store/billing-store';
import { BillingPlan } from '@/services/billing/billing.types';
import { billingProvider } from '@/services/billing/revenuecat-provider';
import { GRADIENTS } from '@/design/tokens/gradients';

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
  const nearLimit = aiProgress > 0.85;

  const handleManage = async () => {
    await billingProvider.presentCustomerCenter();
  };

  // Plan badge gradient colours
  const planBadgeColors: [string, string] = isEnterprise
    ? ['#7C3AED', '#8B5CF6']
    : isBusiness
    ? GRADIENTS.goldGradient as [string, string]
    : isPro
    ? GRADIENTS.tealSheen as [string, string]
    : ['#475569', '#64748B'];

  const planLabel = isEnterprise
    ? '👑 ENTERPRISE'
    : isBusiness
    ? '💼 BUSINESS'
    : isPro
    ? '⚡ PRO'
    : '🆓 FREE';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.surface,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
        },
      ]}
    >
      {/* ── Header Row ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={planBadgeColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.planBadge}
          >
            <Text style={styles.planBadgeText}>{planLabel}</Text>
          </LinearGradient>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor:
                  status === 'ACTIVE' || status === 'TRIALING'
                    ? 'rgba(0,165,129,0.1)'
                    : 'rgba(239,68,68,0.1)',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    status === 'ACTIVE' || status === 'TRIALING' ? '#00A581' : '#EF4444',
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    status === 'ACTIVE' || status === 'TRIALING' ? '#00A581' : '#EF4444',
                },
              ]}
            >
              {status.toLowerCase().replace('_', ' ')}
            </Text>
          </View>
        </View>

        {!isFree && (
          <TouchableOpacity style={styles.manageBtn} onPress={handleManage} activeOpacity={0.7}>
            <Feather name="settings" size={12} color={tokens.textMuted} />
            <Text style={[styles.manageBtnText, { color: tokens.textMuted }]}>Manage</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── AI Usage Gauge ── */}
      <View style={styles.usageSection}>
        <View style={styles.usageLabelRow}>
          <View style={styles.usageLabelLeft}>
            <MaterialCommunityIcons
              name="robot-outline"
              size={14}
              color={nearLimit ? '#EF4444' : '#00A581'}
            />
            <Text style={[styles.usageLabel, { color: tokens.textPrimary }]}>
              AI Requests This Month
            </Text>
          </View>
          <Text
            style={[
              styles.usageNumbers,
              { color: nearLimit ? '#EF4444' : tokens.textSecondary },
            ]}
          >
            {aiUsed} / {aiLimit}
          </Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${aiProgress * 100}%` as any,
                backgroundColor: nearLimit ? '#EF4444' : '#00A581',
              },
            ]}
          />
        </View>
        {nearLimit && (
          <Text style={styles.nearLimitText}>
            ⚠️ {aiLimit - aiUsed} requests remaining — upgrade for more capacity
          </Text>
        )}
      </View>

      {/* ── Renewal Info ── */}
      {subscription?.expiresAt && (
        <View style={styles.dateRow}>
          <Feather name="clock" size={12} color={tokens.textMuted} />
          <Text style={[styles.dateText, { color: tokens.textMuted }]}>
            {subscription.autoRenewing ? 'Renews' : 'Expires'}{' '}
            {new Date(subscription.expiresAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
      )}

      {/* ── Action Buttons ── */}
      <View style={styles.actionRow}>
        {isFree ? (
          <TouchableOpacity
            style={styles.upgradeWrapper}
            onPress={openProPaywall}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={GRADIENTS.navyToTeal as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeGradient}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={15} color="#FFFFFF" />
              <Text style={styles.upgradeText}>Upgrade to Pro</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : isPro ? (
          <TouchableOpacity
            style={styles.upgradeWrapper}
            onPress={openBusinessPaywall}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={GRADIENTS.goldGradient as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeGradient}
            >
              <MaterialCommunityIcons name="domain" size={15} color="#FFFFFF" />
              <Text style={styles.upgradeText}>Upgrade to Business</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.restoreBtn, { borderColor: tokens.border }]}
          onPress={restorePurchases}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={tokens.textSecondary} />
          ) : (
            <>
              <Feather name="refresh-cw" size={12} color={tokens.textSecondary} />
              <Text style={[styles.restoreBtnText, { color: tokens.textSecondary }]}>
                Restore
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
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  manageBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  usageSection: {
    marginBottom: 12,
  },
  usageLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  usageLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  usageNumbers: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  nearLimitText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 5,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upgradeWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeGradient: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  upgradeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  restoreBtn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
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

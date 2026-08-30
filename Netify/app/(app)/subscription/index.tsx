import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/design/theme';
import { useAuthStore } from '@/store/auth-store';
import { useBillingStore } from '@/store/billing-store';
import { useLanguageStore } from '@/store/language-store';
import {
  SubscriptionCard,
  ProPaywallModal,
  BusinessPaywallModal,
} from '@/design/components';
import { BillingPlan } from '@/services/billing/billing.types';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';

// ─── Feature Row Component ────────────────────────────────────────────────────

function FeatureRow({
  label,
  free,
  pro,
  business,
}: {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  business: string | boolean;
}) {
  const renderCell = (val: string | boolean, isHighlight?: boolean) => {
    if (val === false)
      return <Feather name="x" size={14} color="#9CA3AF" />;
    if (val === true)
      return <Feather name="check" size={14} color="#00A581" />;
    return (
      <Text
        style={[
          styles.cellText,
          isHighlight && { color: '#00A581', fontWeight: '700' },
        ]}
      >
        {val}
      </Text>
    );
  };

  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureLabel} numberOfLines={2}>
        {label}
      </Text>
      <View style={styles.cellFree}>{renderCell(free)}</View>
      <View style={styles.cellPro}>{renderCell(pro, true)}</View>
      <View style={styles.cellBiz}>{renderCell(business)}</View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SubscriptionScreen() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();
  const { organization } = useAuthStore();
  const { t } = useLanguageStore();
  const {
    plan,
    subscription,
    refreshSubscription,
    openProPaywall,
    openBusinessPaywall,
  } = useBillingStore();

  useEffect(() => {
    refreshSubscription();
  }, []);

  const headerGradient = isDark ? GRADIENTS.darkHero : GRADIENTS.navyHero;
  const isFreePlan = plan === BillingPlan.FREE;
  const isProPlan = plan === BillingPlan.PRO;
  const isBusinessPlan = plan === BillingPlan.BUSINESS || plan === BillingPlan.ENTERPRISE;

  // AI usage ring
  const aiUsed = subscription?.aiUsage?.used ?? 0;
  const aiLimit = subscription?.aiUsage?.limit ?? 20;
  const aiRemaining = subscription?.aiUsage?.remaining ?? aiLimit;
  const aiPct = Math.min((aiUsed / aiLimit) * 100, 100);
  const aiNearLimit = aiRemaining <= 3;

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: tokens.background }]}>
      {/* ── HEADER ── */}
      <LinearGradient
        colors={headerGradient as [string, string]}
        start={GRADIENT_DIRECTION.toBottomRight.start}
        end={GRADIENT_DIRECTION.toBottomRight.end}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <Feather name="arrow-left" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('settings.subscriptionBilling')}</Text>
          <Text style={styles.headerSub}>
            {organization?.name || 'My Workspace'}
          </Text>
        </View>
        <View
          style={[
            styles.planBadge,
            {
              backgroundColor:
                isBusinessPlan
                  ? 'rgba(217,119,6,0.25)'
                  : isProPlan
                  ? 'rgba(0,185,148,0.25)'
                  : 'rgba(255,255,255,0.15)',
              borderColor:
                isBusinessPlan ? '#D97706' : isProPlan ? '#00B994' : 'rgba(255,255,255,0.3)',
            },
          ]}
        >
          <Text
            style={[
              styles.planBadgeText,
              {
                color: isBusinessPlan
                  ? '#FCD34D'
                  : isProPlan
                  ? '#00B994'
                  : 'rgba(255,255,255,0.85)',
              },
            ]}
          >
            {plan}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── CURRENT SUBSCRIPTION CARD ── */}
        <SubscriptionCard />

        {/* ── AI USAGE METER (FREE only) ── */}
        {isFreePlan && (
          <View style={[styles.usageCard, { backgroundColor: tokens.surface, borderColor: aiNearLimit ? '#EF4444' : tokens.border }]}>
            <View style={styles.usageHeader}>
              <MaterialCommunityIcons
                name="robot-outline"
                size={18}
                color={aiNearLimit ? '#EF4444' : '#00A581'}
              />
              <Text style={[styles.usageTitle, { color: tokens.textPrimary }]}>
                AI Requests This Month
              </Text>
              <Text
                style={[
                  styles.usageCount,
                  { color: aiNearLimit ? '#EF4444' : tokens.textSecondary },
                ]}
              >
                {aiUsed} / {aiLimit}
              </Text>
            </View>
            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: tokens.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${aiPct}%` as any,
                    backgroundColor: aiNearLimit ? '#EF4444' : '#00A581',
                  },
                ]}
              />
            </View>
            <Text style={[styles.usageSub, { color: aiNearLimit ? '#EF4444' : tokens.textSecondary }]}>
              {aiNearLimit
                ? `⚠️ Only ${aiRemaining} requests remaining — upgrade for 250/mo`
                : `${aiRemaining} requests remaining · resets monthly`}
            </Text>
            {aiNearLimit && (
              <TouchableOpacity
                style={styles.upgradeNudgeBtn}
                onPress={openProPaywall}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={GRADIENTS.tealSheen as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upgradeNudgeGradient}
                >
                  <Feather name="zap" size={14} color="#FFFFFF" />
                  <Text style={styles.upgradeNudgeText}>Upgrade to Pro — 250 AI req/mo</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── PLAN COMPARISON TABLE ── */}
        <Text style={[styles.sectionHeading, { color: tokens.textPrimary }]}>
          Compare Plans
        </Text>

        {/* Table Header */}
        <View style={[styles.tableHeader, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.featureCol}>
            <Text style={[styles.tableHeaderLabel, { color: tokens.textSecondary }]}>Feature</Text>
          </View>
          <View style={styles.cellFree}>
            <Text style={[styles.planColLabel, { color: tokens.textSecondary }]}>Free</Text>
          </View>
          <LinearGradient
            colors={GRADIENTS.tealSheen as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.cellPro, styles.proHeaderGradient]}
          >
            <Feather name="zap" size={11} color="#FFFFFF" />
            <Text style={styles.planColLabelPro}>Pro</Text>
          </LinearGradient>
          <View style={styles.cellBiz}>
            <MaterialCommunityIcons name="domain" size={12} color="#D97706" />
            <Text style={[styles.planColLabel, { color: '#D97706' }]}>Business</Text>
          </View>
        </View>

        {/* Table Rows */}
        <View style={[styles.tableBody, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          {/* --- Core --- */}
          <Text style={[styles.groupLabel, { color: tokens.textMuted }]}>CORE</Text>
          <FeatureRow label="Workspaces" free="1" pro="1" business="Up to 5" />
          <FeatureRow label="Customer ledger" free="25" pro="500" business="5,000" />
          <FeatureRow label="Receivables & debt tracking" free={true} pro={true} business={true} />
          <FeatureRow label="Payment commitments" free={true} pro={true} business={true} />
          <FeatureRow label="Collection activity log" free={true} pro={true} business={true} />

          {/* --- AI --- */}
          <Text style={[styles.groupLabel, { color: tokens.textMuted }]}>AI INTELLIGENCE</Text>
          <FeatureRow label="AI Copilot (Q&A)" free="20/mo" pro="250/mo" business="1,000/mo" />
          <FeatureRow label="AI Daily Briefing" free="20/mo" pro="250/mo" business="1,000/mo" />
          <FeatureRow label="AI WhatsApp Drafting" free={false} pro={true} business={true} />
          <FeatureRow label="Customer Risk Scoring" free={false} pro={true} business={true} />
          <FeatureRow label="Collection Automation" free={false} pro={true} business={true} />
          <FeatureRow label="360° Business Memory" free={false} pro={true} business={true} />

          {/* --- Business --- */}
          <Text style={[styles.groupLabel, { color: tokens.textMuted }]}>BUSINESS</Text>
          <FeatureRow label="Multi-business switching" free={false} pro={false} business={true} />
          <FeatureRow label="Cross-business overview" free={false} pro={false} business={true} />
          <FeatureRow label="Team seats + RBAC" free={false} pro={false} business="10 seats" />
        </View>

        {/* ── UPGRADE CTAs ── */}
        {!isProPlan && !isBusinessPlan && (
          <TouchableOpacity onPress={openProPaywall} activeOpacity={0.9} style={styles.ctaWrapper}>
            <LinearGradient
              colors={GRADIENTS.tealSheen as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Feather name="zap" size={18} color="#FFFFFF" />
              <View style={styles.ctaTextBlock}>
                <Text style={styles.ctaTitle}>Upgrade to Netify Pro</Text>
                <Text style={styles.ctaSub}>250 AI requests · Risk scoring · WhatsApp drafting</Text>
              </View>
              <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {!isBusinessPlan && (
          <TouchableOpacity onPress={openBusinessPaywall} activeOpacity={0.9} style={styles.ctaWrapper}>
            <LinearGradient
              colors={GRADIENTS.goldGradient as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <MaterialCommunityIcons name="domain" size={18} color="#FFFFFF" />
              <View style={styles.ctaTextBlock}>
                <Text style={styles.ctaTitle}>Upgrade to Netify Business</Text>
                <Text style={styles.ctaSub}>5 workspaces · 10 team seats · 1,000 AI req/mo</Text>
              </View>
              <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── FOUNDATION IMPACT ── */}
        <View
          style={[
            styles.foundationCard,
            {
              backgroundColor: isDark ? 'rgba(0,165,129,0.12)' : 'rgba(0,165,129,0.06)',
              borderColor: isDark ? 'rgba(0,185,148,0.25)' : 'rgba(0,165,129,0.18)',
            },
          ]}
        >
          <MaterialCommunityIcons name="charity" size={28} color="#00A581" />
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

      {/* Modals */}
      <ProPaywallModal />
      <BusinessPaywallModal />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const COL_FREE = 52;
const COL_PRO = 52;
const COL_BIZ = 60;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Content
  content: { padding: 16, paddingBottom: 48 },

  // AI Usage Card
  usageCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  usageTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  usageCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  usageSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  upgradeNudgeBtn: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeNudgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  upgradeNudgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Section heading
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.2,
  },

  // Comparison table
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 2,
  },
  tableBody: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingBottom: 8,
    marginBottom: 20,
  },
  featureCol: { flex: 1 },
  cellFree: {
    width: COL_FREE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellPro: {
    width: COL_PRO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBiz: {
    width: COL_BIZ,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  tableHeaderLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  planColLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  planColLabelPro: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  proHeaderGradient: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    flexDirection: 'row',
    gap: 3,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 14,
    marginBottom: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  featureLabel: {
    flex: 1,
    fontSize: 12.5,
    color: '#374151',
    paddingRight: 6,
  },
  cellText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },

  // Upgrade CTAs
  ctaWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  ctaTextBlock: { flex: 1 },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ctaSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },

  // Foundation
  foundationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginTop: 6,
  },
  foundationTextCol: { flex: 1 },
  foundationTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  foundationDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/design/theme';
import { useBillingStore } from '@/store/billing-store';
import { BillingPackage, BillingPlan } from '@/services/billing/billing.types';
import { GRADIENTS } from '@/design/tokens/gradients';

const BUSINESS_FEATURES = [
  {
    icon: 'domain' as const,
    title: 'Up to 5 Business Workspaces',
    desc: 'Complete tenant isolation per venture — separate ledgers, memory & settings',
  },
  {
    icon: 'account-multiple-outline' as const,
    title: '10 Team Member Seats + RBAC',
    desc: 'Collaborative staff management with role-based permissions per workspace',
  },
  {
    icon: 'chart-areaspline' as const,
    title: 'Cross-Business Portfolio View',
    desc: 'Consolidated receivables health overview across all your businesses in one glance',
  },
  {
    icon: 'robot-outline' as const,
    title: '1,000 AI Requests/Month',
    desc: 'High-volume copilot intelligence for active multi-business operators',
  },
  {
    icon: 'star-circle-outline' as const,
    title: 'All Netify Pro Features',
    desc: 'AI Copilot, Daily Briefing, 360° Memory, WhatsApp drafting & Risk Scoring',
  },
  {
    icon: 'account-group' as const,
    title: '5,000 Customers per Workspace',
    desc: 'Enterprise-grade capacity for high-volume credit businesses',
  },
];

export function BusinessPaywallModal() {
  const { tokens, isDark } = useTheme();

  const {
    isBusinessPaywallVisible,
    closeBusinessPaywall,
    offerings,
    purchasePackage,
    restorePurchases,
    isPurchasing,
    isLoading,
    error,
  } = useBillingStore();

  const bizPackages = offerings.filter((p) => p.plan === BillingPlan.BUSINESS);
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);

  if (!isBusinessPaywallVisible) return null;

  const selectedPackage: BillingPackage | undefined =
    bizPackages[selectedPkgIndex] || bizPackages[0];

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    await purchasePackage(selectedPackage);
  };

  return (
    <Modal
      visible={isBusinessPaywallVisible}
      animationType="slide"
      transparent
      onRequestClose={closeBusinessPaywall}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: tokens.background, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' },
          ]}
        >
          {/* ── Gold Gradient Hero Banner ── */}
          <LinearGradient
            colors={['#92400E', '#B45309', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <TouchableOpacity style={styles.closeBtn} onPress={closeBusinessPaywall} activeOpacity={0.8}>
              <Feather name="x" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="domain" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>NETIFY BUSINESS</Text>
            </View>
            <Text style={styles.heroTitle}>
              Manage multiple businesses{'\n'}from one account.
            </Text>
            <Text style={styles.heroSub}>
              5 workspaces · 10 team seats · 1,000 AI requests/month
            </Text>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>5</Text>
                <Text style={styles.statLabel}>Businesses</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>10</Text>
                <Text style={styles.statLabel}>Team Seats</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>1K</Text>
                <Text style={styles.statLabel}>AI Req/mo</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>5K</Text>
                <Text style={styles.statLabel}>Customers</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Feature List ── */}
            <Text style={[styles.sectionLabel, { color: tokens.textMuted }]}>EVERYTHING INCLUDED</Text>
            {BUSINESS_FEATURES.map((feat, idx) => (
              <View
                key={idx}
                style={[styles.featureRow, { borderBottomColor: tokens.border }]}
              >
                <LinearGradient
                  colors={GRADIENTS.goldGradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureIconWrap}
                >
                  <MaterialCommunityIcons name={feat.icon} size={15} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: tokens.textPrimary }]}>
                    {feat.title}
                  </Text>
                  <Text style={[styles.featureDesc, { color: tokens.textSecondary }]}>
                    {feat.desc}
                  </Text>
                </View>
              </View>
            ))}

            {/* ── Pricing Packages ── */}
            {bizPackages.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: tokens.textMuted, marginTop: 20 }]}>
                  SELECT PLAN
                </Text>
                <View style={styles.packagesRow}>
                  {bizPackages.map((pkg, idx) => {
                    const isSelected = idx === selectedPkgIndex;
                    const isAnnual = pkg.packageType === 'ANNUAL';
                    return (
                      <TouchableOpacity
                        key={pkg.identifier}
                        style={[
                          styles.pkgCard,
                          {
                            backgroundColor: tokens.surface,
                            borderColor: isSelected ? '#D97706' : tokens.border,
                            borderWidth: isSelected ? 2 : 1,
                          },
                        ]}
                        onPress={() => setSelectedPkgIndex(idx)}
                        activeOpacity={0.8}
                      >
                        {isAnnual && (
                          <View style={styles.saveBadge}>
                            <Text style={styles.saveBadgeText}>SAVE 25%</Text>
                          </View>
                        )}
                        <Text style={[styles.pkgType, { color: tokens.textSecondary }]}>
                          {isAnnual ? 'Annual' : 'Monthly'}
                        </Text>
                        <Text style={styles.pkgPrice}>
                          {pkg.product.priceString || `${pkg.product.currencyCode} ${pkg.product.price}`}
                        </Text>
                        <Text style={[styles.pkgPeriod, { color: tokens.textMuted }]}>
                          {isAnnual ? 'per year · best value' : 'per month · 5 businesses'}
                        </Text>
                        {isSelected && (
                          <View style={styles.selectedDot} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* ── Error ── */}
            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={15} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* ── CTA ── */}
            <TouchableOpacity
              style={[styles.ctaWrapper, isPurchasing && { opacity: 0.7 }]}
              onPress={handlePurchase}
              disabled={isPurchasing || isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#92400E', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="domain" size={20} color="#FFFFFF" />
                    <Text style={styles.ctaText}>Upgrade to Netify Business</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* ── Restore ── */}
            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={restorePurchases}
              disabled={isLoading || isPurchasing}
            >
              <Text style={[styles.restoreText, { color: tokens.textMuted }]}>
                Restore existing purchases
              </Text>
            </TouchableOpacity>

            {/* ── Foundation ── */}
            <View style={[styles.foundationBox, { backgroundColor: isDark ? 'rgba(217,119,6,0.1)' : 'rgba(217,119,6,0.06)', borderColor: 'rgba(217,119,6,0.2)' }]}>
              <MaterialCommunityIcons name="heart-multiple" size={18} color="#D97706" />
              <Text style={[styles.foundationText, { color: tokens.textSecondary }]}>
                <Text style={{ fontWeight: '700', color: tokens.textPrimary }}>20% of every subscription</Text> goes to the Netify Foundation supporting education for out-of-school children across Africa.
              </Text>
            </View>

            {/* ── Legal ── */}
            <Text style={[styles.legal, { color: tokens.textMuted }]}>
              Subscriptions auto-renew unless cancelled 24+ hours before renewal. Manage in App Store / Google Play settings.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '93%',
    overflow: 'hidden',
  },
  heroBanner: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  heroPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: '100%',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  packagesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  pkgCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    position: 'relative',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 1,
  },
  saveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pkgType: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pkgPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D97706',
    marginBottom: 4,
  },
  pkgPeriod: {
    fontSize: 11,
  },
  selectedDot: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    flex: 1,
  },
  ctaWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
  },
  ctaGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
  },
  restoreText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  foundationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  foundationText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  legal: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
});

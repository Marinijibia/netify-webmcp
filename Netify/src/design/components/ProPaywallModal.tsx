import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/design/theme';
import { useBillingStore } from '@/store/billing-store';
import { BillingPackage, BillingPlan } from '@/services/billing/billing.types';

export function ProPaywallModal() {
  const { tokens, isDark } = useTheme();

  const {
    isProPaywallVisible,
    closeProPaywall,
    offerings,
    purchasePackage,
    restorePurchases,
    isPurchasing,
    isLoading,
    error,
  } = useBillingStore();

  const proPackages = offerings.filter((p) => p.plan === BillingPlan.PRO);
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);

  if (!isProPaywallVisible) return null;

  const selectedPackage: BillingPackage | undefined =
    proPackages[selectedPkgIndex] || proPackages[0];

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    await purchasePackage(selectedPackage);
  };

  return (
    <Modal
      visible={isProPaywallVisible}
      animationType="slide"
      transparent
      onRequestClose={closeProPaywall}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: tokens.background,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>NETIFY PRO</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={closeProPaywall}>
              <Feather name="x" size={20} color={tokens.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Title & Subtitle */}
            <Text style={[styles.title, { color: tokens.textPrimary }]}>
              Your business has a memory.{'\n'}Now let it work for you.
            </Text>
            <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>
              Unlock autonomous collection intelligence, behavioral risk analysis, and automated customer follow-ups.
            </Text>

            {/* Feature Checklist */}
            <View
              style={[
                styles.featuresCard,
                {
                  backgroundColor: tokens.surface,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                },
              ]}
            >
              {[
                { title: 'AI Collection Copilot', desc: 'Predictive collection prioritization and action recommendations' },
                { title: 'Daily Business Briefing', desc: 'Every morning executive attention breakdown & overdue forecast' },
                { title: 'Customer Intelligence & 360 Memory', desc: 'Reliability history, promise patterns, and context summaries' },
                { title: 'AI WhatsApp Message Drafting', desc: 'Culturally-attuned reminder templates with verified amounts' },
                { title: 'Conversational Business Q&A', desc: 'Natural language ledger queries with grounded evidence citations' },
                { title: 'High-Volume Capacity', desc: '250 AI intelligence requests/month and up to 500 customers' },
              ].map((feat, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <View style={styles.checkCircle}>
                    <Feather name="check" size={13} color="#FFFFFF" />
                  </View>
                  <View style={styles.featureTextCol}>
                    <Text style={[styles.featureTitle, { color: tokens.textPrimary }]}>
                      {feat.title}
                    </Text>
                    <Text style={[styles.featureDesc, { color: tokens.textSecondary }]}>
                      {feat.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Pricing Packages from RevenueCat */}
            <Text style={[styles.sectionLabel, { color: tokens.textSecondary }]}>
              SELECT PLAN:
            </Text>

            {proPackages.length > 0 ? (
              <View style={styles.packagesRow}>
                {proPackages.map((pkg, idx) => {
                  const isSelected = idx === selectedPkgIndex;
                  const isAnnual = pkg.packageType === 'ANNUAL';
                  return (
                    <TouchableOpacity
                      key={pkg.identifier}
                      style={[
                        styles.packageCard,
                        {
                          backgroundColor: tokens.surface,
                          borderColor: isSelected ? '#00A581' : isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => setSelectedPkgIndex(idx)}
                    >
                      {isAnnual && (
                        <View style={styles.saveBadge}>
                          <Text style={styles.saveBadgeText}>SAVE 20%</Text>
                        </View>
                      )}
                      <Text style={[styles.packageTitle, { color: tokens.textPrimary }]}>
                        {isAnnual ? 'Annual Pro' : 'Monthly Pro'}
                      </Text>
                      <Text style={styles.packagePrice}>
                        {pkg.product.priceString || `${pkg.product.currencyCode} ${pkg.product.price}`}
                      </Text>
                      <Text style={[styles.packagePeriod, { color: tokens.textSecondary }]}>
                        {isAnnual ? 'per year (best value)' : 'per month'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View
                style={[
                  styles.packageCard,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: '#00A581',
                    borderWidth: 2,
                    alignItems: 'center',
                  },
                ]}
              >
                <Text style={[styles.packageTitle, { color: tokens.textPrimary }]}>
                  Netify Pro Tier
                </Text>
                <Text style={[styles.packagePeriod, { color: tokens.textSecondary }]}>
                  Pricing localized upon checkout from app store
                </Text>
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* CTA Subscribe Button */}
            <TouchableOpacity
              style={[
                styles.ctaButton,
                { backgroundColor: '#00A581' },
                isPurchasing && { opacity: 0.7 },
              ]}
              onPress={handlePurchase}
              disabled={isPurchasing || isLoading}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="lightning-bolt" size={18} color="#FFFFFF" />
                  <Text style={styles.ctaButtonText}>
                    {selectedPackage?.product?.introPrice ? 'Start 14-Day Free Trial' : 'Unlock Netify Pro'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Restore Purchases */}
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={restorePurchases}
              disabled={isLoading || isPurchasing}
            >
              <Text style={[styles.restoreText, { color: tokens.textSecondary }]}>
                Restore Existing Store Purchases
              </Text>
            </TouchableOpacity>

            {/* Social Impact Commitment */}
            <View style={styles.impactBox}>
              <MaterialCommunityIcons name="heart-multiple" size={16} color="#00A581" />
              <Text style={[styles.impactText, { color: tokens.textSecondary }]}>
                20% of Netify subscription proceeds support the Netify Foundation for out-of-school children across Africa.
              </Text>
            </View>

            {/* Footer Legal Terms */}
            <Text style={[styles.legalText, { color: tokens.textMuted }]}>
              Subscribing grants access to Pro features. Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period. Manage or cancel in App Store / Google Play account settings.
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '92%',
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proBadge: {
    backgroundColor: '#00A581',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginTop: 8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  featuresCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00A581',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  packagesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  packageCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    position: 'relative',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  packageTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00A581',
    marginBottom: 2,
  },
  packagePeriod: {
    fontSize: 11,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    flex: 1,
  },
  ctaButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  restoreText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  impactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 165, 129, 0.08)',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  impactText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  legalText: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
});

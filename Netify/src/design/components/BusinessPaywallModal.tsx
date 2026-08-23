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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/design/theme';
import { useBillingStore } from '@/store/billing-store';
import { BillingPackage, BillingPlan } from '@/services/billing/billing.types';

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
              <View style={styles.bizBadge}>
                <Text style={styles.bizBadgeText}>NETIFY BUSINESS</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={closeBusinessPaywall}>
              <Feather name="x" size={20} color={tokens.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Title & Subtitle */}
            <Text style={[styles.title, { color: tokens.textPrimary }]}>
              Manage multiple businesses{'\n'}from one account.
            </Text>
            <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>
              Seamlessly switch between distinct companies with isolated customer ledgers, separate business memories, and high-capacity team seats.
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
                { title: 'Up to 5 Business Workspaces', desc: 'Complete tenant isolation for each distinct venture or branch' },
                { title: '10 Team Member Seats', desc: 'Collaborative staff management and role-based permissions' },
                { title: '1,000 AI Intelligence Requests/mo', desc: 'High-volume copilot recommendations and message drafting' },
                { title: 'Cross-Business Portfolio Overview', desc: 'Consolidated receivable health across all your businesses' },
                { title: 'Includes all Netify Pro Features', desc: 'AI Copilot, Daily Briefings, 360 Memory, and WhatsApp templates' },
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

            {/* Pricing Packages */}
            <Text style={[styles.sectionLabel, { color: tokens.textSecondary }]}>
              SELECT BUSINESS TIER:
            </Text>

            {bizPackages.length > 0 ? (
              <View style={styles.packagesRow}>
                {bizPackages.map((pkg, idx) => {
                  const isSelected = idx === selectedPkgIndex;
                  const isAnnual = pkg.packageType === 'ANNUAL';
                  return (
                    <TouchableOpacity
                      key={pkg.identifier}
                      style={[
                        styles.packageCard,
                        {
                          backgroundColor: tokens.surface,
                          borderColor: isSelected ? '#3B82F6' : isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => setSelectedPkgIndex(idx)}
                    >
                      {isAnnual && (
                        <View style={styles.saveBadge}>
                          <Text style={styles.saveBadgeText}>SAVE 25%</Text>
                        </View>
                      )}
                      <Text style={[styles.packageTitle, { color: tokens.textPrimary }]}>
                        {isAnnual ? 'Annual Business' : 'Monthly Business'}
                      </Text>
                      <Text style={[styles.packagePrice, { color: '#3B82F6' }]}>
                        {pkg.product.priceString || `${pkg.product.currencyCode} ${pkg.product.price}`}
                      </Text>
                      <Text style={[styles.packagePeriod, { color: tokens.textSecondary }]}>
                        {isAnnual ? 'per year (5 businesses)' : 'per month (5 businesses)'}
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
                    borderColor: '#3B82F6',
                    borderWidth: 2,
                    alignItems: 'center',
                  },
                ]}
              >
                <Text style={[styles.packageTitle, { color: tokens.textPrimary }]}>
                  Netify Business Tier
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
                { backgroundColor: '#3B82F6' },
                isPurchasing && { opacity: 0.7 },
              ]}
              onPress={handlePurchase}
              disabled={isPurchasing || isLoading}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="office-building" size={18} color="#FFFFFF" />
                  <Text style={styles.ctaButtonText}>
                    Upgrade to Netify Business
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
              <MaterialCommunityIcons name="heart-multiple" size={16} color="#3B82F6" />
              <Text style={[styles.impactText, { color: tokens.textSecondary }]}>
                20% of Netify subscription proceeds support the Netify Foundation for out-of-school children across Africa.
              </Text>
            </View>
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
  bizBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bizBadgeText: {
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
    backgroundColor: '#3B82F6',
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
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
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
});

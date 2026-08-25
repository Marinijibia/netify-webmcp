import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/design/theme';
import { useAuthStore } from '@/store/auth-store';
import { useBillingStore } from '@/store/billing-store';
import { useLanguageStore } from '@/store/language-store';
import { LANGUAGE_REGISTRY } from '@/i18n';
import { Avatar, LanguageSelectorModal } from '@/design/components';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';

export default function SettingsScreen() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();

  const { user, organization, logout } = useAuthStore();
  const { plan, isPro, isBusiness } = useBillingStore();
  const { currentLanguage } = useLanguageStore();

  const [isLangModalVisible, setIsLangModalVisible] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Business Owner';
  const currentLangName = LANGUAGE_REGISTRY[currentLanguage]?.name || 'English';

  const handleSignOut = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmSignOut = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/(auth)/login' as any);
  };

  const headerGradient = isDark ? GRADIENTS.darkHero : GRADIENTS.navyHero;

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: tokens.background }]}>
      {/* ── PREMIUM HEADER ── */}
      <LinearGradient
        colors={headerGradient as [string, string]}
        start={GRADIENT_DIRECTION.toBottomRight.start}
        end={GRADIENT_DIRECTION.toBottomRight.end}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Profile</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── USER PROFILE CARD ── */}
        <View
          style={[
            styles.userCard,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            },
          ]}
        >
          <Avatar name={displayName} size="lg" />

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: tokens.textPrimary }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.userEmail, { color: tokens.textSecondary }]} numberOfLines={1}>
              {user?.email || 'owner@business.com'}
            </Text>
          </View>

          {/* Subscription Tier Pill */}
          <TouchableOpacity
            onPress={() => router.push('/subscription' as any)}
            activeOpacity={0.8}
            style={styles.planBadgeWrap}
          >
            {isBusiness ? (
              <LinearGradient
                colors={GRADIENTS.goldGradient as [string, string]}
                style={styles.planBadge}
              >
                <MaterialCommunityIcons name="crown" size={12} color="#FFFFFF" />
                <Text style={styles.planBadgeText}>BUSINESS</Text>
              </LinearGradient>
            ) : isPro ? (
              <LinearGradient
                colors={GRADIENTS.tealSheen as [string, string]}
                style={styles.planBadge}
              >
                <MaterialCommunityIcons name="star" size={12} color="#FFFFFF" />
                <Text style={styles.planBadgeText}>PRO</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.planBadgeNeutral, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }]}>
                <Text style={[styles.planBadgeNeutralText, { color: tokens.textSecondary }]}>
                  {plan || 'FREE'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── SECTION: ACTIVE BUSINESS ── */}
        <Text style={[styles.sectionHeading, { color: tokens.textMuted }]}>
          Active Business
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={[styles.orgCardHeader, { borderBottomColor: tokens.border }]}>
            <View style={styles.orgStripe} />
            <View style={styles.orgDetails}>
              <Text style={[styles.orgName, { color: tokens.textPrimary }]}>
                {organization?.name || 'My Business'}
              </Text>
              <Text style={[styles.orgCurrency, { color: tokens.textSecondary }]}>
                Operating Currency: {organization?.currency || 'NGN'}
              </Text>
            </View>
            <View style={[styles.orgIconWrap, { backgroundColor: tokens.accentSoft }]}>
              <MaterialCommunityIcons name="domain" size={20} color="#00A581" />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/subscription' as any)}
            style={styles.rowItem}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(0,165,129,0.12)' }]}>
                <Ionicons name="card-outline" size={17} color="#00A581" />
              </View>
              <Text style={[styles.rowLabel, { color: tokens.textPrimary }]}>
                Subscription & Billing Plan
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={tokens.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── SECTION: PREFERENCES ── */}
        <Text style={[styles.sectionHeading, { color: tokens.textMuted }]}>
          Preferences
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <TouchableOpacity
            onPress={() => setIsLangModalVisible(true)}
            style={[styles.rowItem, { borderBottomWidth: 1, borderBottomColor: tokens.border }]}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                <Ionicons name="globe-outline" size={17} color="#10B981" />
              </View>
              <Text style={[styles.rowLabel, { color: tokens.textPrimary }]}>
                App & AI Language
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: tokens.textSecondary }]}>
                {currentLangName}
              </Text>
              <Ionicons name="chevron-forward" size={17} color={tokens.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/notifications' as any)}
            style={styles.rowItem}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                <Ionicons name="notifications-outline" size={17} color="#F59E0B" />
              </View>
              <Text style={[styles.rowLabel, { color: tokens.textPrimary }]}>
                Notifications & Signals
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={tokens.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── SECTION: SECURITY ── */}
        <Text style={[styles.sectionHeading, { color: tokens.textMuted }]}>
          Security & Access
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <TouchableOpacity
            onPress={() => router.push('/security' as any)}
            style={[styles.rowItem, { borderBottomWidth: 1, borderBottomColor: tokens.border }]}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                <Ionicons name="finger-print-outline" size={17} color="#6366F1" />
              </View>
              <Text style={[styles.rowLabel, { color: tokens.textPrimary }]}>
                Biometrics & App Lock
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={tokens.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/security/sessions' as any)}
            style={styles.rowItem}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(236,72,153,0.12)' }]}>
                <Ionicons name="shield-checkmark-outline" size={17} color="#EC4899" />
              </View>
              <Text style={[styles.rowLabel, { color: tokens.textPrimary }]}>
                Active Devices & Sessions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={tokens.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── SIGN OUT BUTTON ── */}
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.8}
          style={[styles.signOutBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }]}
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out of Netify</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        visible={isLangModalVisible}
        onClose={() => setIsLangModalVisible(false)}
      />

      {/* ── Premium Logout Confirmation Modal ── */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.logoutModal, { backgroundColor: tokens.background, borderColor: tokens.border }]}>
            {/* Icon header */}
            <LinearGradient
              colors={GRADIENTS.navyHero as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoutModalHeader}
            >
              <View style={styles.logoutIconCircle}>
                <Ionicons name="log-out-outline" size={28} color="#FFFFFF" />
              </View>
            </LinearGradient>

            <View style={styles.logoutModalBody}>
              <Text style={[styles.logoutModalTitle, { color: tokens.textPrimary }]}>
                Sign Out?
              </Text>
              <Text style={[styles.logoutModalDesc, { color: tokens.textSecondary }]}>
                You'll need to sign back in to access your business data and AI features.
              </Text>

              {/* Confirm Sign Out */}
              <TouchableOpacity
                style={styles.logoutConfirmBtn}
                onPress={handleConfirmSignOut}
                activeOpacity={0.85}
              >
                <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
                <Text style={styles.logoutConfirmText}>Yes, Sign Out</Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                style={[styles.logoutCancelBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.logoutCancelText, { color: tokens.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  userCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  planBadgeWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  planBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planBadgeNeutral: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  planBadgeNeutralText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  orgCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  orgStripe: {
    width: 4,
    height: 36,
    borderRadius: 2,
    backgroundColor: '#00A581',
  },
  orgDetails: {
    flex: 1,
  },
  orgName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  orgCurrency: {
    fontSize: 12,
    fontWeight: '500',
  },
  orgIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 4,
  },
  signOutText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#EF4444',
  },

  // ── Logout Modal ─────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  logoutModal: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  logoutModalHeader: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutModalBody: {
    padding: 24,
  },
  logoutModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  logoutModalDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  logoutConfirmBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  logoutConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  logoutCancelBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutCancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

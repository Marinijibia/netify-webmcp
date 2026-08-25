import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth-store';
import { useBillingStore } from '@/store/billing-store';
import { useLanguageStore } from '@/store/language-store';
import { LANGUAGE_REGISTRY } from '@/i18n';
import {
  DailyBriefingCard,
  PriorityCustomerCard,
  LanguageSelectorModal,
  ProPaywallModal,
  BusinessPaywallModal,
  BusinessSwitcherModal,
  AnimatedNumber,
  MetricGridSkeleton,
  BriefingCardSkeleton,
  CustomerRowSkeleton,
  Avatar,
} from '@/design/components';
import { BuildingIcon, ChevronRightIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import Feather from '@expo/vector-icons/Feather';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { commandCenterApi, CommandCenterAttentionData } from '@/services/api/command-center';
import { aiApi, PriorityCustomerItem } from '@/services/api/ai';
import { useNotificationStore } from '@/store/notification-store';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';

// ─── Metric Card Component ───────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: number;
  sub: string;
  valueColor: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  formatValue?: (n: number) => string;
  onPress?: () => void;
}

function MetricCard({
  label,
  value,
  sub,
  valueColor,
  bgColor,
  borderColor,
  icon,
  formatValue,
  onPress,
}: MetricCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.metricBox, { backgroundColor: bgColor, borderColor }]}
    >
      <View style={styles.metricTop}>
        <Text style={[styles.metricBoxLabel, { color: valueColor }]}>{label}</Text>
        <View style={[styles.metricIconWrap, { backgroundColor: valueColor + '22' }]}>
          {icon}
        </View>
      </View>
      <AnimatedNumber
        value={value}
        duration={800}
        style={StyleSheet.flatten([styles.metricBoxValue, { color: valueColor }])}
        format={formatValue}
      />
      <Text style={[styles.metricSub, { color: valueColor + 'CC' }]} numberOfLines={1}>
        {sub}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen Component ───────────────────────────────────────────────────

export default function AppHomeScreen() {
  const router = useRouter();
  const { user, organization } = useAuthStore();
  const { tokens, isDark } = useTheme();

  const {
    isPro,
    isBusiness,
    plan,
    initializeBilling,
    openBusinessSwitcher,
    openProPaywall,
    canAccessFeature,
  } = useBillingStore();

  const { currentLanguage, openLanguageModal, initializeLanguage, t } = useLanguageStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  const [attentionData, setAttentionData] = useState<CommandCenterAttentionData | null>(null);
  const [priorityCustomers, setPriorityCustomers] = useState<PriorityCustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Notification badge pulse
  const badgePulse = useRef(new Animated.Value(1)).current;

  const langInfo = LANGUAGE_REGISTRY[currentLanguage] || LANGUAGE_REGISTRY.en;

  useEffect(() => {
    initializeLanguage();
  }, []);

  useEffect(() => {
    if (user?.id && organization?.id) {
      initializeBilling(user.id, organization.id);
    }
  }, [user?.id, organization?.id]);

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(badgePulse, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(badgePulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [unreadCount]);

  const loadCommandCenterData = useCallback(async () => {
    try {
      fetchUnreadCount();
      const [attResult, priorityResult] = await Promise.all([
        commandCenterApi.getAttention({ language: currentLanguage }),
        aiApi.getPriorityCustomers({ limit: 5 }),
      ]);
      setAttentionData(attResult);
      setPriorityCustomers(priorityResult?.items || []);
    } catch (err) {
      console.warn('Failed to load Command Center data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentLanguage]);

  useEffect(() => {
    loadCommandCenterData();
  }, [loadCommandCenterData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCommandCenterData();
  };

  const handleOpenCopilot = () => {
    router.push('/(app)/copilot' as any);
  };

  const currency = attentionData?.currency || organization?.currency || '₦';

  const headerGradient = isDark ? GRADIENTS.darkHero : GRADIENTS.navyHero;
  const orgPillBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.18)';

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: tokens.background }]}>
      {/* ── PREMIUM HEADER ── */}
      <LinearGradient
        colors={headerGradient as [string, string]}
        start={GRADIENT_DIRECTION.toBottomRight.start}
        end={GRADIENT_DIRECTION.toBottomRight.end}
        style={styles.header}
      >
        {/* Top Nav Row: Org Switcher + Icons */}
        <View style={styles.headerTopRow}>
          {/* Business Name Switcher Pill */}
          <TouchableOpacity
            onPress={openBusinessSwitcher}
            style={[styles.orgPill, { backgroundColor: orgPillBg }]}
            activeOpacity={0.75}
          >
            <BuildingIcon size={15} color="#00B994" />
            <Text numberOfLines={1} style={styles.orgName}>
              {organization?.name || 'Netify Business'}
            </Text>
            <ChevronRightIcon size={13} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <View style={styles.headerRight}>
            {/* Notification Bell */}
            <TouchableOpacity
              onPress={() => router.push('/notifications' as any)}
              style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.14)' }]}
              activeOpacity={0.75}
            >
              <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
              {unreadCount > 0 && (
                <Animated.View
                  style={[styles.badgeDot, { transform: [{ scale: badgePulse }] }]}
                >
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </Animated.View>
              )}
            </TouchableOpacity>

            {/* Language Selector */}
            <TouchableOpacity
              onPress={openLanguageModal}
              style={[styles.langPill, { backgroundColor: 'rgba(0,185,148,0.22)', borderColor: '#00B994' }]}
              activeOpacity={0.75}
            >
              <Text style={styles.langFlag}>{langInfo.flag}</Text>
              <Text style={styles.langCode}>{langInfo.code.toUpperCase()}</Text>
              <Feather name="chevron-down" size={11} color="#00B994" />
            </TouchableOpacity>

            {/* Settings Trigger */}
            <TouchableOpacity
              onPress={() => router.push('/settings' as any)}
              style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.14)' }]}
              activeOpacity={0.75}
            >
              <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Greeting — inside gradient for both light + dark */}
        <View style={styles.headerGreeting}>
          <View style={styles.greetingRow}>
            <View style={styles.greetingAccentLine} />
            <Text style={styles.greetingSubtext}>
              {langInfo.greeting.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.heroHeadline}>
            {t('commandCenter.greeting')}
          </Text>
        </View>
      </LinearGradient>

      {/* ── SCROLLABLE CONTENT ── */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.accent} />
        }
      >
        {/* ── QUICK ACTIONS BAR ── */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            onPress={() => router.push('/(app)/customers/create' as any)}
            style={[styles.quickActionCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            activeOpacity={0.75}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: 'rgba(0,165,129,0.12)' }]}>
              <Feather name="user-plus" size={16} color="#00A581" />
            </View>
            <Text style={[styles.quickActionLabel, { color: tokens.textPrimary }]}>
              + Customer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(app)/receivables/create' as any)}
            style={[styles.quickActionCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            activeOpacity={0.75}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Feather name="file-plus" size={16} color="#EF4444" />
            </View>
            <Text style={[styles.quickActionLabel, { color: tokens.textPrimary }]}>
              + Receivable
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(app)/commitments' as any)}
            style={[styles.quickActionCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            activeOpacity={0.75}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <MaterialCommunityIcons name="handshake-outline" size={16} color="#F59E0B" />
            </View>
            <Text style={[styles.quickActionLabel, { color: tokens.textPrimary }]}>
              Promises
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleOpenCopilot}
            style={[styles.quickActionCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            activeOpacity={0.75}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
              <MaterialCommunityIcons name="robot-outline" size={16} color="#6366F1" />
            </View>
            <Text style={[styles.quickActionLabel, { color: tokens.textPrimary }]}>
              AI Copilot
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <>
            <MetricGridSkeleton />
            <BriefingCardSkeleton />
            {[0, 1, 2].map((i) => (
              <CustomerRowSkeleton key={i} />
            ))}
          </>
        ) : (
          <View>
            {/* ── FINANCIAL ATTENTION METRICS (2×2 GRID) ── */}
            <View style={styles.metricsGrid}>
              <MetricCard
                label={t('commandCenter.totalOutstanding')}
                value={attentionData?.facts?.totalOutstanding || 0}
                sub={`${attentionData?.facts?.activeCustomersCount || 0} active accounts`}
                valueColor={tokens.danger}
                bgColor={tokens.dangerSoft}
                borderColor={tokens.danger + '33'}
                icon={<MaterialCommunityIcons name="cash-remove" size={16} color={tokens.danger} />}
                formatValue={(n) => `${currency}${n.toLocaleString()}`}
                onPress={() => router.push('/(app)/receivables' as any)}
              />
              <MetricCard
                label={t('commandCenter.overdueCustomers')}
                value={attentionData?.facts?.overdueCustomersCount || 0}
                sub={`${currency}${(attentionData?.facts?.totalOverdue || 0).toLocaleString()} past due`}
                valueColor={tokens.warning}
                bgColor={tokens.warningSoft}
                borderColor={tokens.warning + '33'}
                icon={<MaterialCommunityIcons name="clock-alert-outline" size={16} color={tokens.warning} />}
                onPress={() => router.push('/(app)/receivables' as any)}
              />
              <MetricCard
                label={t('commandCenter.promisesDueToday')}
                value={attentionData?.facts?.promisesDueTodayCount || 0}
                sub={`${currency}${(attentionData?.facts?.promisesDueTodayAmount || 0).toLocaleString()} expected`}
                valueColor={tokens.accent}
                bgColor={tokens.accentSoft}
                borderColor={tokens.accent + '33'}
                icon={<MaterialCommunityIcons name="handshake-outline" size={16} color={tokens.accent} />}
                onPress={() => router.push('/(app)/commitments' as any)}
              />
              <MetricCard
                label={t('commandCenter.highRiskCases')}
                value={attentionData?.facts?.highRiskCasesCount || 0}
                sub={`${attentionData?.facts?.missedPromisesCount || 0} missed commitments`}
                valueColor="#7C3AED"
                bgColor={isDark ? '#1E0D40' : '#F5F3FF'}
                borderColor="#7C3AED33"
                icon={<MaterialCommunityIcons name="alert-circle-outline" size={16} color="#7C3AED" />}
                onPress={() => router.push('/(app)/receivables' as any)}
              />
            </View>

            {/* ── CORE BUSINESS MODULES NAVIGATION ── */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: tokens.textPrimary, marginBottom: 12 }]}>
                Business Modules
              </Text>
              <View style={styles.modulesGrid}>
                {/* Customers Module */}
                <TouchableOpacity
                  onPress={() => router.push('/(app)/customers' as any)}
                  style={[styles.moduleCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                  activeOpacity={0.75}
                >
                  <View style={[styles.moduleIconCircle, { backgroundColor: 'rgba(0,165,129,0.12)' }]}>
                    <Feather name="users" size={20} color="#00A581" />
                  </View>
                  <Text style={[styles.moduleTitle, { color: tokens.textPrimary }]}>Customers</Text>
                  <Text style={[styles.moduleDesc, { color: tokens.textSecondary }]}>
                    Directory & debtor records
                  </Text>
                </TouchableOpacity>

                {/* Receivables Module */}
                <TouchableOpacity
                  onPress={() => router.push('/(app)/receivables' as any)}
                  style={[styles.moduleCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                  activeOpacity={0.75}
                >
                  <View style={[styles.moduleIconCircle, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                    <MaterialCommunityIcons name="file-document-outline" size={20} color="#EF4444" />
                  </View>
                  <Text style={[styles.moduleTitle, { color: tokens.textPrimary }]}>Receivables</Text>
                  <Text style={[styles.moduleDesc, { color: tokens.textSecondary }]}>
                    Debt ledger & invoices
                  </Text>
                </TouchableOpacity>

                {/* Payment Promises Module */}
                <TouchableOpacity
                  onPress={() => router.push('/(app)/commitments' as any)}
                  style={[styles.moduleCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                  activeOpacity={0.75}
                >
                  <View style={[styles.moduleIconCircle, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                    <MaterialCommunityIcons name="handshake" size={20} color="#F59E0B" />
                  </View>
                  <Text style={[styles.moduleTitle, { color: tokens.textPrimary }]}>Commitments</Text>
                  <Text style={[styles.moduleDesc, { color: tokens.textSecondary }]}>
                    Payment promises & dues
                  </Text>
                </TouchableOpacity>

                {/* AI Copilot Module */}
                <TouchableOpacity
                  onPress={handleOpenCopilot}
                  style={[styles.moduleCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                  activeOpacity={0.75}
                >
                  <View style={[styles.moduleIconCircle, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                    <MaterialCommunityIcons name="robot" size={20} color="#6366F1" />
                  </View>
                  <Text style={[styles.moduleTitle, { color: tokens.textPrimary }]}>AI Intelligence</Text>
                  <Text style={[styles.moduleDesc, { color: tokens.textSecondary }]}>
                    Collections reasoning
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── AI DAILY BRIEFING CARD ── */}
            <View style={styles.sectionContainer}>
              <DailyBriefingCard
                briefing={
                  attentionData?.executiveBriefing ||
                  'Your daily business briefing analyzes outstanding debts, payment promises, and collection priorities across your customer accounts in real-time.'
                }
                calculatedAt={attentionData?.calculatedAt || new Date().toISOString()}
                onAskCopilot={handleOpenCopilot}
                onRefresh={onRefresh}
              />
            </View>

            {/* ── PRIORITY CUSTOMERS / ACTION QUEUE ── */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>
                    {t('commandCenter.topPriority')}
                  </Text>
                  {priorityCustomers.length > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: tokens.dangerSoft }]}>
                      <Text style={[styles.countBadgeText, { color: tokens.danger }]}>
                        {priorityCustomers.length}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => router.push('/(app)/customers' as any)}>
                  <Text style={[styles.viewAllText, { color: tokens.accent }]}>
                    {t('common.viewAll')}
                  </Text>
                </TouchableOpacity>
              </View>

              {priorityCustomers.length > 0 ? (
                priorityCustomers.map((cust) => (
                  <PriorityCustomerCard
                    key={cust.customerId}
                    customer={cust}
                    onPress={() => router.push(`/(app)/customers/${cust.customerId}` as any)}
                    onQuickMessage={() => {
                      router.push('/(app)/copilot' as any);
                    }}
                  />
                ))
              ) : (
                <View style={[styles.emptyCustomerCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                  <Feather name="check-circle" size={24} color="#00A581" style={{ marginBottom: 6 }} />
                  <Text style={[styles.emptyCustomerTitle, { color: tokens.textPrimary }]}>
                    No Urgent Collection Flags
                  </Text>
                  <Text style={[styles.emptyCustomerDesc, { color: tokens.textSecondary }]}>
                    Your high-priority debtor queues will populate here as receivables mature.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(app)/customers' as any)}
                    style={[styles.viewCustomersBtn, { backgroundColor: tokens.accentSoft, borderColor: tokens.accent }]}
                  >
                    <Text style={[styles.viewCustomersBtnText, { color: tokens.accent }]}>
                      Browse All Customers
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── FLOATING COPILOT BAR ── */}
      <View style={[styles.floatingBarContainer, { backgroundColor: tokens.surface, borderTopColor: tokens.border }]}>
        <Pressable onPress={handleOpenCopilot}>
          {({ pressed }) => (
            <LinearGradient
              colors={
                pressed
                  ? ['#003F5F', '#007A64']
                  : isDark
                  ? ['rgba(0,165,129,0.18)', 'rgba(0,185,148,0.12)']
                  : ['rgba(0,165,129,0.06)', 'rgba(0,185,148,0.04)']
              }
              start={GRADIENT_DIRECTION.toRight.start}
              end={GRADIENT_DIRECTION.toRight.end}
              style={[styles.copilotBar, { borderColor: tokens.accent }]}
            >
              <View style={styles.copilotBarLeft}>
                <LinearGradient
                  colors={GRADIENTS.tealSheen as [string, string]}
                  style={styles.copilotIconCircle}
                >
                  <MaterialCommunityIcons name="robot-outline" size={17} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.copilotBarText, { color: tokens.textSecondary }]}>
                  {t('copilot.placeholder')}
                </Text>
              </View>
              <View style={[styles.copilotArrow, { backgroundColor: tokens.accent }]}>
                <Feather name="arrow-up-right" size={16} color="#FFFFFF" />
              </View>
            </LinearGradient>
          )}
        </Pressable>
      </View>

      {/* ── MODALS ── */}
      <LanguageSelectorModal
        visible={useLanguageStore((state) => state.isLanguageModalOpen)}
        onClose={useLanguageStore((state) => state.closeLanguageModal)}
      />
      <BusinessSwitcherModal />
      <ProPaywallModal />
      <BusinessPaywallModal />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerGreeting: {
    paddingHorizontal: 2,
  },
  orgPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    maxWidth: '55%',
  },
  orgName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
    letterSpacing: 0.1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#003051',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  langFlag: { fontSize: 14 },
  langCode: { fontSize: 11, fontWeight: '800', color: '#00B994' },

  // ── Content ──────────────────────────────────────────────────────────────
  contentContainer: { padding: 16, paddingBottom: 110 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  greetingAccentLine: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#00B994',
  },
  greetingSubtext: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.55)',
  },
  greetingText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.55)',
  },
  heroHeadline: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 32,
    color: '#FFFFFF',
  },

  // ── Quick Actions ────────────────────────────────────────────────────────
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── Metric Grid ──────────────────────────────────────────────────────────
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 22,
  },
  metricBox: {
    width: '48%',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 4,
  },
  metricBoxValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  metricSub: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Business Modules Grid ────────────────────────────────────────────────
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleCard: {
    width: '48%',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  moduleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  moduleTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  moduleDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },

  // ── Section headers ──────────────────────────────────────────────────────
  sectionContainer: { marginBottom: 22 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: { fontSize: 11, fontWeight: '800' },
  viewAllText: { fontSize: 13, fontWeight: '700' },

  // ── Empty Priority Customer Card ─────────────────────────────────────────
  emptyCustomerCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyCustomerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyCustomerDesc: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  viewCustomersBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  viewCustomersBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // ── Copilot Floating Bar ─────────────────────────────────────────────────
  floatingBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  copilotBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 28,
    borderWidth: 1.5,
  },
  copilotBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  copilotIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copilotBarText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  copilotArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Animated,
  Linking,
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
  FollowUpCustomerCard,
  LanguageSelectorModal,
  ProPaywallModal,
  BusinessPaywallModal,
  BusinessSwitcherModal,
  AnimatedNumber,
  MetricGridSkeleton,
  BriefingCardSkeleton,
  CustomerRowSkeleton,
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

type FollowUpFilter = 'ALL' | 'BROKEN_PROMISES' | 'OVERDUE' | 'HIGH_URGENCY';

export default function AppHomeScreen() {
  const router = useRouter();
  const { user, organization } = useAuthStore();
  const { tokens, isDark } = useTheme();

  const {
    initializeBilling,
    openBusinessSwitcher,
  } = useBillingStore();

  const { currentLanguage, openLanguageModal, initializeLanguage, t } = useLanguageStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  const [attentionData, setAttentionData] = useState<CommandCenterAttentionData | null>(null);
  const [priorityCustomers, setPriorityCustomers] = useState<PriorityCustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>('ALL');

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
        aiApi.getPriorityCustomers({ limit: 15 }),
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

  // Derived Follow-Up Metrics & Filter Calculations
  const brokenPromisesCount = priorityCustomers.filter(
    (p) => (p.missedCommitmentsCount || 0) > 0
  ).length;
  const overdueCount = priorityCustomers.filter(
    (p) => (p.totalOverdue || 0) > 0
  ).length;
  const highUrgencyCount = priorityCustomers.filter(
    (p) => p.urgency === 'HIGH' || p.priorityScore >= 70
  ).length;

  const filteredFollowUps = priorityCustomers.filter((item) => {
    if (followUpFilter === 'BROKEN_PROMISES') return (item.missedCommitmentsCount || 0) > 0;
    if (followUpFilter === 'OVERDUE') return (item.totalOverdue || 0) > 0;
    if (followUpFilter === 'HIGH_URGENCY') return item.urgency === 'HIGH' || item.priorityScore >= 70;
    return true;
  });

  const totalOut = attentionData?.facts?.totalOutstanding || 0;
  const totalOver = attentionData?.facts?.totalOverdue || 0;
  const overdueRatio = totalOut > 0 ? Math.min(100, Math.round((totalOver / totalOut) * 100)) : 0;

  const headerGradient = isDark ? GRADIENTS.darkHero : GRADIENTS.navyHero;
  const orgPillBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.18)';

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: tokens.background }]}>
      {/* ── SLEEK EXECUTIVE HEADER ── */}
      <LinearGradient
        colors={headerGradient as [string, string]}
        start={GRADIENT_DIRECTION.toBottomRight.start}
        end={GRADIENT_DIRECTION.toBottomRight.end}
        style={styles.header}
      >
        {/* Top Nav Row: Org Switcher + Quick Icons */}
        <View style={styles.headerTopRow}>
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

        {/* Hero Greeting Row */}
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

      {/* ── MAIN SCROLLABLE CONTENT ── */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.accent} />
        }
      >
        {loading ? (
          <View style={styles.loadingPadding}>
            <MetricGridSkeleton />
            <BriefingCardSkeleton />
            {[0, 1, 2].map((i) => (
              <CustomerRowSkeleton key={i} />
            ))}
          </View>
        ) : (
          <>
            {/* ── 1. EXECUTIVE FINANCIAL BENTO HERO (Replaces Chunky 2x2 Grid) ── */}
            <LinearGradient
              colors={isDark ? ['#002C48', '#001A2C'] : ['#00385C', '#001E33']}
              start={GRADIENT_DIRECTION.toBottomRight.start}
              end={GRADIENT_DIRECTION.toBottomRight.end}
              style={styles.heroCard}
            >
              <View style={styles.heroCardTop}>
                <View style={styles.heroLabelRow}>
                  <Text style={styles.heroCardLabel}>{t('commandCenter.totalOutstanding')}</Text>
                </View>
                <View style={styles.syncPill}>
                  <View style={styles.syncDot} />
                  <Text style={styles.syncText}>{t('common.liveLedger')}</Text>
                </View>
              </View>

              <AnimatedNumber
                value={totalOut}
                duration={800}
                style={styles.heroAmount}
                format={(n) => `${currency}${n.toLocaleString()}`}
              />

              {/* Overdue Exposure Bar */}
              <View style={styles.exposureBarContainer}>
                <View style={styles.exposureBarTrack}>
                  <View style={[styles.exposureBarFill, { width: `${overdueRatio}%` }]} />
                </View>
                <View style={styles.exposureMetaRow}>
                  <Text style={styles.exposureMetaText}>
                    {t('commandCenter.overdueExposure')}: <Text style={{ color: overdueRatio > 30 ? '#FCA5A5' : '#3AD0A9', fontWeight: '800' }}>{overdueRatio}%</Text>
                  </Text>
                  <Text style={styles.exposureMetaText}>
                    {t('commandCenter.activeAccountsCount', { count: attentionData?.facts?.activeCustomersCount || 0 })}
                  </Text>
                </View>
              </View>

              {/* Micro-Metrics Bento Row */}
              <View style={styles.heroBentoRow}>
                {/* Past Due */}
                <TouchableOpacity
                  style={styles.heroBentoTile}
                  onPress={() => router.push('/(app)/receivables' as any)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.bentoTileLabel}>{t('commandCenter.pastDue')}</Text>
                  <Text style={[styles.bentoTileValue, { color: '#F87171' }]} numberOfLines={1}>
                    {currency}{totalOver > 1000000 ? (totalOver / 1000000).toFixed(1) + 'M' : totalOver.toLocaleString()}
                  </Text>
                  <Text style={styles.bentoTileSub}>
                    {attentionData?.facts?.overdueCustomersCount || 0} {t('common.accounts')}
                  </Text>
                </TouchableOpacity>

                <View style={styles.bentoDivider} />

                {/* Due Today */}
                <TouchableOpacity
                  style={styles.heroBentoTile}
                  onPress={() => router.push('/(app)/commitments' as any)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.bentoTileLabel}>{t('commandCenter.dueToday')}</Text>
                  <Text style={[styles.bentoTileValue, { color: '#FBBF24' }]} numberOfLines={1}>
                    {currency}{(attentionData?.facts?.promisesDueTodayAmount || 0) > 1000000 ? ((attentionData?.facts?.promisesDueTodayAmount || 0) / 1000000).toFixed(1) + 'M' : (attentionData?.facts?.promisesDueTodayAmount || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.bentoTileSub}>
                    {attentionData?.facts?.promisesDueTodayCount || 0} {t('common.promises')}
                  </Text>
                </TouchableOpacity>

                <View style={styles.bentoDivider} />

                {/* Broken Promises */}
                <TouchableOpacity
                  style={styles.heroBentoTile}
                  onPress={() => router.push('/(app)/commitments' as any)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.bentoTileLabel}>{t('commandCenter.broken')}</Text>
                  <Text style={[styles.bentoTileValue, { color: '#C084FC' }]} numberOfLines={1}>
                    {attentionData?.facts?.missedPromisesCount || 0}
                  </Text>
                  <Text style={styles.bentoTileSub}>
                    {t('common.missedDues')}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* ── 2. COMPACT ACTION STRIP (Single Row, Uncluttered) ── */}
            <View style={styles.actionStripContainer}>
              <TouchableOpacity
                onPress={() => router.push('/(app)/customers/create' as any)}
                style={[styles.actionStripPill, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                activeOpacity={0.75}
              >
                <Feather name="user-plus" size={13} color="#00A581" />
                <Text style={[styles.actionStripText, { color: tokens.textPrimary }]}>{t('commandCenter.addCustomer')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(app)/receivables/create' as any)}
                style={[styles.actionStripPill, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                activeOpacity={0.75}
              >
                <Feather name="file-plus" size={13} color="#EF4444" />
                <Text style={[styles.actionStripText, { color: tokens.textPrimary }]}>{t('commandCenter.addInvoice')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(app)/commitments' as any)}
                style={[styles.actionStripPill, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="handshake-outline" size={14} color="#F59E0B" />
                <Text style={[styles.actionStripText, { color: tokens.textPrimary }]}>{t('commandCenter.promisesAction')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenCopilot}
                style={[styles.actionStripPill, { backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.3)' }]}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="robot-outline" size={14} color="#6366F1" />
                <Text style={[styles.actionStripText, { color: '#6366F1', fontWeight: '800' }]}>{t('commandCenter.askAI')}</Text>
              </TouchableOpacity>
            </View>

            {/* ── 3. AI DAILY BRIEFING CARD ── */}
            <View style={styles.sectionWrap}>
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

            {/* ── 4. DEDICATED COLLECTIONS FOLLOW-UP QUEUE (Matching Web App) ── */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.sectionHeading, { color: tokens.textPrimary }]}>
                    {t('commandCenter.todaysQueue')}
                  </Text>
                  {priorityCustomers.length > 0 && (
                    <View style={[styles.headingCountBadge, { backgroundColor: tokens.dangerSoft }]}>
                      <Text style={[styles.headingCountText, { color: tokens.danger }]}>
                        {priorityCustomers.length}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => router.push('/(app)/customers' as any)}>
                  <Text style={[styles.viewAllLink, { color: tokens.accent }]}>
                    {t('common.viewAll')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionSubheading, { color: tokens.textSecondary }]}>
                {t('commandCenter.queueSubtitle')}
              </Text>

              {/* Filter Tabs (All, Broken Promises, Past Due, High Urgency) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterTabsContainer}
              >
                <TouchableOpacity
                  onPress={() => setFollowUpFilter('ALL')}
                  style={[
                    styles.filterTabPill,
                    followUpFilter === 'ALL'
                      ? { backgroundColor: '#00A581', borderColor: '#00A581' }
                      : { backgroundColor: tokens.surface, borderColor: tokens.border },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: followUpFilter === 'ALL' ? '#FFFFFF' : tokens.textSecondary },
                    ]}
                  >
                    {t('commandCenter.tabAll', { count: priorityCustomers.length })}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFollowUpFilter('BROKEN_PROMISES')}
                  style={[
                    styles.filterTabPill,
                    followUpFilter === 'BROKEN_PROMISES'
                      ? { backgroundColor: '#EF4444', borderColor: '#EF4444' }
                      : { backgroundColor: tokens.surface, borderColor: tokens.border },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: followUpFilter === 'BROKEN_PROMISES' ? '#FFFFFF' : tokens.textSecondary },
                    ]}
                  >
                    ⚠️ {t('commandCenter.tabBrokenPromises')} ({brokenPromisesCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFollowUpFilter('OVERDUE')}
                  style={[
                    styles.filterTabPill,
                    followUpFilter === 'OVERDUE'
                      ? { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }
                      : { backgroundColor: tokens.surface, borderColor: tokens.border },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: followUpFilter === 'OVERDUE' ? '#FFFFFF' : tokens.textSecondary },
                    ]}
                  >
                    ⏰ {t('commandCenter.tabPastDue')} ({overdueCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFollowUpFilter('HIGH_URGENCY')}
                  style={[
                    styles.filterTabPill,
                    followUpFilter === 'HIGH_URGENCY'
                      ? { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }
                      : { backgroundColor: tokens.surface, borderColor: tokens.border },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: followUpFilter === 'HIGH_URGENCY' ? '#FFFFFF' : tokens.textSecondary },
                    ]}
                  >
                    🔥 {t('commandCenter.tabHighUrgency')} ({highUrgencyCount})
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Follow-Up Cards Stream */}
              {filteredFollowUps.length > 0 ? (
                filteredFollowUps.map((cust) => (
                  <FollowUpCustomerCard
                    key={cust.customerId}
                    customer={cust}
                    onPress={() => router.push(`/(app)/customers/${cust.customerId}` as any)}
                    onCall={() => {
                      if (cust.phone) {
                        const clean = cust.phone.replace(/[^0-9+]/g, '');
                        Linking.openURL(`tel:${clean}`).catch(() => {});
                      }
                    }}
                    onWhatsApp={() => {
                      if (cust.phone) {
                        const clean = cust.phone.replace(/[^0-9]/g, '');
                        const msg = encodeURIComponent(
                          `Hello ${cust.customerName}, this is a courtesy follow-up from our accounts team regarding your invoice balance of ${cust.currency} ${cust.totalOutstanding.toLocaleString()}. Kindly confirm if payment has been scheduled.`
                        );
                        Linking.openURL(`https://wa.me/${clean}?text=${msg}`).catch(() => {});
                      }
                    }}
                    onAiDraft={() => {
                      router.push({
                        pathname: '/(app)/copilot' as any,
                        params: {
                          initialPrompt: `Draft a polite payment follow-up for ${cust.customerName} regarding their outstanding balance of ${cust.currency} ${cust.totalOutstanding.toLocaleString()}`,
                        },
                      });
                    }}
                    onRecordPromise={() => {
                      router.push('/(app)/commitments' as any);
                    }}
                  />
                ))
              ) : (
                <View style={[styles.emptyFollowUpBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                  <Feather name="check-circle" size={28} color="#00A581" style={{ marginBottom: 8 }} />
                  <Text style={[styles.emptyFollowUpTitle, { color: tokens.textPrimary }]}>
                    No Pending Follow-Ups
                  </Text>
                  <Text style={[styles.emptyFollowUpDesc, { color: tokens.textSecondary }]}>
                    {followUpFilter === 'BROKEN_PROMISES'
                      ? 'No customers with broken payment promises in this filter.'
                      : followUpFilter === 'OVERDUE'
                      ? 'No past due accounts in this filter.'
                      : 'All debtor accounts in this queue are currently clear with no urgent collection flags.'}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── DISCREET FLOATING COPILOT ACTION BUTTON ── */}
      <TouchableOpacity
        style={styles.floatingCopilotFab}
        onPress={handleOpenCopilot}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={GRADIENTS.tealSheen as [string, string]}
          start={GRADIENT_DIRECTION.toBottomRight.start}
          end={GRADIENT_DIRECTION.toBottomRight.end}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="robot-outline" size={22} color="#FFFFFF" />
          <View style={styles.fabPulseDot} />
        </LinearGradient>
      </TouchableOpacity>

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

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerGreeting: {
    paddingHorizontal: 2,
  },
  orgPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '52%',
  },
  orgName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
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
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#00253E',
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
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  langFlag: {
    fontSize: 13,
  },
  langCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00B994',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  greetingAccentLine: {
    width: 14,
    height: 2.5,
    backgroundColor: '#00B994',
    borderRadius: 2,
  },
  greetingSubtext: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 1,
  },
  heroHeadline: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // ── Scroll Content ──────────────────────────────────────────────────────
  contentContainer: {
    paddingBottom: 90,
  },
  loadingPadding: {
    padding: 16,
  },

  // ── Executive Financial Bento Hero Card ─────────────────────────────────
  heroCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 165, 129, 0.35)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8FB7C7',
    letterSpacing: 0.8,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 165, 129, 0.18)',
    borderColor: 'rgba(0, 165, 129, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00A581',
  },
  syncText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#3AD0A9',
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  exposureBarContainer: {
    marginTop: 4,
    marginBottom: 14,
  },
  exposureBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  exposureBarFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 3,
  },
  exposureMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exposureMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8FB7C7',
  },
  heroBentoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 18, 32, 0.65)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 84, 112, 0.4)',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  heroBentoTile: {
    flex: 1,
    alignItems: 'center',
  },
  bentoDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(15, 84, 112, 0.5)',
  },
  bentoTileLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8FB7C7',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bentoTileValue: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 1,
  },
  bentoTileSub: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.55)',
  },

  // ── Action Strip ────────────────────────────────────────────────────────
  actionStripContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  actionStripPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionStripText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Section Wrappers ────────────────────────────────────────────────────
  sectionWrap: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headingCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headingCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  viewAllLink: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  sectionSubheading: {
    fontSize: 12.5,
    fontWeight: '500',
    marginBottom: 12,
  },

  // ── Follow-Up Queue Filter Tabs ─────────────────────────────────────────
  filterTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
  },
  filterTabPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Empty Follow-Up Box ─────────────────────────────────────────────────
  emptyFollowUpBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFollowUpTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyFollowUpDesc: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  // ── Floating Copilot FAB ────────────────────────────────────────────────
  floatingCopilotFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    borderRadius: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fabPulseDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});

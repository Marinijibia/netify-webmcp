import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth-store';
import { useBillingStore } from '@/store/billing-store';
import { useLanguageStore } from '@/store/language-store';
import { LANGUAGE_REGISTRY } from '@/i18n';
import {
  Button,
  Card,
  DailyBriefingCard,
  PriorityCustomerCard,
  LanguageSelectorModal,
  ProPaywallModal,
  BusinessPaywallModal,
  BusinessSwitcherModal,
} from '@/design/components';
import { BuildingIcon, ChevronRightIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import Feather from '@expo/vector-icons/Feather';
import { Ionicons } from '@expo/vector-icons';
import { commandCenterApi, CommandCenterAttentionData } from '@/services/api/command-center';
import { aiApi, PriorityCustomerItem } from '@/services/api/ai';
import { useNotificationStore } from '@/store/notification-store';

export default function AppHomeScreen() {
  const router = useRouter();
  const { user, organization, logout } = useAuthStore();
  const { tokens } = useTheme();

  const {
    plan,
    isPro,
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

  const langInfo = LANGUAGE_REGISTRY[currentLanguage] || LANGUAGE_REGISTRY.en;

  useEffect(() => {
    initializeLanguage();
  }, []);

  useEffect(() => {
    if (user?.id && organization?.id) {
      initializeBilling(user.id, organization.id);
    }
  }, [user?.id, organization?.id]);

  const loadCommandCenterData = useCallback(async () => {
    try {
      fetchUnreadCount();
      const [attResult, priorityResult] = await Promise.all([
        commandCenterApi.getAttention({ language: currentLanguage }),
        aiApi.getPriorityCustomers({ limit: 5 }),
      ]);
      setAttentionData(attResult);
      setPriorityCustomers(priorityResult.items);
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
    if (!canAccessFeature('AI_COLLECTION_COPILOT')) {
      openProPaywall();
      return;
    }
    router.push('/(app)/copilot' as any);
  };

  const formattedOutstanding = attentionData?.facts
    ? `${attentionData.currency} ${attentionData.facts.totalOutstanding.toLocaleString()}`
    : '₦0.00';

  const hasZeroData =
    attentionData?.facts.totalOutstanding === 0 &&
    attentionData?.facts.activeCustomersCount === 0;

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safeArea,
        { backgroundColor: tokens.background },
      ]}
    >
      {/* App Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: tokens.surface,
            borderBottomColor: tokens.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={openBusinessSwitcher}
          style={[
            styles.orgPill,
            { backgroundColor: tokens.surfaceMuted },
          ]}
        >
          <BuildingIcon size={16} color={tokens.accent} />
          <Text
            numberOfLines={1}
            style={[
              styles.orgName,
              { color: tokens.textPrimary },
            ]}
          >
            {organization?.name || 'Netify Business'}
          </Text>
          <ChevronRightIcon size={14} color={tokens.textMuted} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {/* Notification Bell */}
          <TouchableOpacity
            onPress={() => router.push('/notifications' as any)}
            style={[
              styles.langPill,
              {
                paddingHorizontal: 8,
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                position: 'relative',
              },
            ]}
          >
            <Ionicons name="notifications-outline" size={17} color={tokens.textPrimary} />
            {unreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  backgroundColor: '#EF4444',
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#ffffff' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Language Selector */}
          <TouchableOpacity
            onPress={openLanguageModal}
            style={[
              styles.langPill,
              {
                backgroundColor: tokens.accentSoft,
                borderColor: tokens.accent,
              },
            ]}
          >
            <Text style={styles.langPillFlag}>{langInfo.flag}</Text>
            <Text
              style={[
                styles.langPillText,
                { color: tokens.accent },
              ]}
            >
              {langInfo.code.toUpperCase()}
            </Text>
            <Feather
              name="chevron-down"
              size={12}
              color={tokens.accent}
            />
          </TouchableOpacity>

          {/* Settings Gear */}
          <TouchableOpacity
            onPress={() => router.push('/settings' as any)}
            style={[
              styles.langPill,
              {
                paddingHorizontal: 8,
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
              },
            ]}
          >
            <Ionicons name="settings-outline" size={17} color={tokens.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.accent}
          />
        }
      >
        {/* Command Center Hero Greeting */}
        <View style={styles.heroSection}>
          <Text
            style={[
              styles.greetingText,
              { color: tokens.textMuted },
            ]}
          >
            {langInfo.greeting.toUpperCase()}
          </Text>
          <Text
            style={[
              styles.heroHeadline,
              { color: tokens.textPrimary },
            ]}
          >
            {t('commandCenter.greeting')}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.accent} />
            <Text
              style={[
                styles.loadingText,
                { color: tokens.textMuted },
              ]}
            >
              {t('common.loading')}
            </Text>
          </View>
        ) : hasZeroData ? (
          /* Empty State for New Business */
          <Card style={styles.emptyCard}>
            <View style={styles.emptyStateContainer}>
              <Feather
                name="trending-up"
                size={40}
                color={tokens.accent}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: tokens.textPrimary },
                ]}
              >
                {t('commandCenter.noDataTitle')}
              </Text>
              <Text
                style={[
                  styles.emptyDesc,
                  { color: tokens.textSecondary },
                ]}
              >
                {t('commandCenter.noDataDesc')}
              </Text>
              <View style={styles.emptyActions}>
                <Button
                  label={t('commandCenter.addCustomer')}
                  onPress={() => router.push('/(app)/customers/create' as any)}
                  variant="primary"
                />
                <Button
                  label={t('commandCenter.addReceivable')}
                  onPress={() => router.push('/(app)/receivables/create' as any)}
                  variant="secondary"
                />
              </View>
            </View>
          </Card>
        ) : (
          <>
            {/* 4 Financial Attention Metrics Grid */}
            <View style={styles.metricsGrid}>
              {/* Total Outstanding */}
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: tokens.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metricBoxLabel,
                    { color: tokens.textMuted },
                  ]}
                >
                  {t('commandCenter.totalOutstanding')}
                </Text>
                <Text
                  style={[
                    styles.metricBoxValue,
                    { color: tokens.danger },
                  ]}
                >
                  {formattedOutstanding}
                </Text>
                <Text
                  style={[
                    styles.metricSub,
                    { color: tokens.textSecondary },
                  ]}
                >
                  {attentionData?.facts.activeCustomersCount || 0} active accounts
                </Text>
              </View>

              {/* Overdue Customers */}
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: tokens.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metricBoxLabel,
                    { color: tokens.textMuted },
                  ]}
                >
                  {t('commandCenter.overdueCustomers')}
                </Text>
                <Text
                  style={[
                    styles.metricBoxValue,
                    { color: tokens.warning },
                  ]}
                >
                  {attentionData?.facts.overdueCustomersCount || 0}
                </Text>
                <Text
                  style={[
                    styles.metricSub,
                    { color: tokens.textSecondary },
                  ]}
                >
                  {attentionData?.currency}{' '}
                  {(attentionData?.facts.totalOverdue || 0).toLocaleString()}{' '}
                  past due
                </Text>
              </View>

              {/* Promises Due Today */}
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: tokens.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metricBoxLabel,
                    { color: tokens.textMuted },
                  ]}
                >
                  {t('commandCenter.promisesDueToday')}
                </Text>
                <Text
                  style={[
                    styles.metricBoxValue,
                    { color: tokens.accent },
                  ]}
                >
                  {attentionData?.facts.promisesDueTodayCount || 0}
                </Text>
                <Text
                  style={[
                    styles.metricSub,
                    { color: tokens.textSecondary },
                  ]}
                >
                  {attentionData?.currency}{' '}
                  {(attentionData?.facts.promisesDueTodayAmount || 0).toLocaleString()}{' '}
                  expected
                </Text>
              </View>

              {/* High Risk Cases */}
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: tokens.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metricBoxLabel,
                    { color: tokens.textMuted },
                  ]}
                >
                  {t('commandCenter.highRiskCases')}
                </Text>
                <Text
                  style={[
                    styles.metricBoxValue,
                    { color: tokens.danger },
                  ]}
                >
                  {attentionData?.facts.highRiskCasesCount || 0}
                </Text>
                <Text
                  style={[
                    styles.metricSub,
                    { color: tokens.textSecondary },
                  ]}
                >
                  {attentionData?.facts.missedPromisesCount || 0} missed
                  commitments
                </Text>
              </View>
            </View>

            {/* Daily Intelligence Briefing */}
            {attentionData?.executiveBriefing && (
              <View style={styles.sectionContainer}>
                <DailyBriefingCard
                  briefing={attentionData.executiveBriefing}
                  calculatedAt={attentionData.calculatedAt}
                  onAskCopilot={handleOpenCopilot}
                />
              </View>
            )}

            {/* Priority Customer Queue */}
            {priorityCustomers.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: tokens.textPrimary },
                    ]}
                  >
                    {t('commandCenter.topPriority')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(app)/customers' as any)}
                  >
                    <Text
                      style={[
                        styles.viewAllText,
                        { color: tokens.accent },
                      ]}
                    >
                      {t('common.viewAll')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {priorityCustomers.map((cust) => (
                  <PriorityCustomerCard
                    key={cust.customerId}
                    customer={cust}
                    onPress={() =>
                      router.push(`/(app)/customers/${cust.customerId}` as any)
                    }
                    onQuickMessage={() => {
                      if (!canAccessFeature('AI_COLLECTION_COPILOT')) {
                        openProPaywall();
                        return;
                      }
                      router.push('/(app)/copilot' as any);
                    }}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating / Bottom Ask Copilot Bar */}
      <View
        style={[
          styles.floatingBarContainer,
          {
            backgroundColor: tokens.surface,
            borderTopColor: tokens.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleOpenCopilot}
          style={[
            styles.copilotBar,
            {
              backgroundColor: tokens.surfaceMuted,
              borderColor: tokens.accent,
            },
          ]}
        >
          <View style={styles.copilotBarLeft}>
            <View
              style={[
                styles.copilotIconCircle,
                { backgroundColor: tokens.accent },
              ]}
            >
              <Feather name="cpu" size={16} color="#FFFFFF" />
            </View>
            <Text
              style={[
                styles.copilotBarText,
                { color: tokens.textSecondary },
              ]}
            >
              {t('copilot.placeholder')}
            </Text>
          </View>
          <Feather
            name="arrow-up-right"
            size={18}
            color={tokens.accent}
          />
        </TouchableOpacity>
      </View>

      {/* Modals */}
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  orgPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '55%',
  },
  orgName: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  langPillFlag: {
    fontSize: 14,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  heroSection: {
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricBox: {
    width: '48%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  metricBoxLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  metricBoxValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricSub: {
    fontSize: 11.5,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  floatingBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  copilotBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  copilotBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  copilotIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copilotBarText: {
    fontSize: 13,
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 20,
    marginTop: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
  },
});

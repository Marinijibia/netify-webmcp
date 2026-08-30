import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/design/theme';
import {
  commitmentsApi,
  PaymentCommitmentItem,
  CommitmentStatus,
} from '@/services/api/commitments';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  CalendarIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@/design/icons';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Avatar, Shimmer } from '@/design/components';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';
import { useLanguageStore } from '@/store/language-store';

type TimeframeFilter = 'ALL' | 'TODAY' | 'UPCOMING' | 'MISSED' | 'FULFILLED';

export default function CommitmentsScreen() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();
  const { t } = useLanguageStore();

  const [activeTab, setActiveTab] = useState<TimeframeFilter>('TODAY');
  const [commitments, setCommitments] = useState<PaymentCommitmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchCommitments = useCallback(
    async (pageToFetch: number = 1, isRefresh: boolean = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else if (pageToFetch === 1) setLoading(true);

        const params: any = {
          timeframe: activeTab,
          page: pageToFetch,
          pageSize: 20,
        };

        const res = await commitmentsApi.getCommitments(params);
        if (res.success && res.data) {
          if (pageToFetch === 1) {
            setCommitments(res.data);
          } else {
            setCommitments((prev) => [...prev, ...res.data]);
          }
          setHasMore(res.pagination?.hasMore || false);
          setPage(pageToFetch);
        }
      } catch (err) {
        console.error('Failed to load commitments', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    fetchCommitments(1);
  }, [fetchCommitments]);

  const onRefresh = () => {
    fetchCommitments(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchCommitments(page + 1);
    }
  };

  const filteredCommitments = commitments.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.customer?.name.toLowerCase().includes(q) ||
      item.receivable?.reference?.toLowerCase().includes(q) ||
      item.notes?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: CommitmentStatus, isMissed?: boolean) => {
    if (status === 'FULFILLED') {
      return {
        label: 'FULFILLED',
        stripeColor: '#16A34A',
        bgColor: isDark ? 'rgba(22,163,74,0.2)' : 'rgba(22,163,74,0.12)',
        textColor: '#16A34A',
        icon: <CheckCircleIcon size={12} color="#16A34A" />,
      };
    }
    if (status === 'PARTIALLY_FULFILLED') {
      return {
        label: 'PARTIAL',
        stripeColor: '#3B82F6',
        bgColor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.12)',
        textColor: '#3B82F6',
        icon: <ClockIcon size={12} color="#3B82F6" />,
      };
    }
    if (status === 'MISSED' || isMissed) {
      return {
        label: 'MISSED',
        stripeColor: '#EF4444',
        bgColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)',
        textColor: '#EF4444',
        icon: <AlertCircleIcon size={12} color="#EF4444" />,
      };
    }
    if (status === 'CANCELLED') {
      return {
        label: 'CANCELLED',
        stripeColor: '#94A3B8',
        bgColor: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.12)',
        textColor: '#94A3B8',
        icon: <ClockIcon size={12} color="#94A3B8" />,
      };
    }
    return {
      label: 'PENDING',
      stripeColor: '#F59E0B',
      bgColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.12)',
      textColor: '#F59E0B',
      icon: <ClockIcon size={12} color="#F59E0B" />,
    };
  };

  const renderCommitmentItem = ({ item }: { item: PaymentCommitmentItem }) => {
    const badge = getStatusBadge(item.status, item.isMissed);
    const amountNum = parseFloat(item.amount);
    const formattedAmount = `${item.currency} ${amountNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const promisedDate = new Date(item.promisedFor).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        activeOpacity={0.75}
        onPress={() => router.push(`/(app)/commitments/${item.id}` as any)}
      >
        <View
          style={[
            styles.commitmentCard,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            },
          ]}
        >
          {/* Left colored stripe */}
          <View style={[styles.stripe, { backgroundColor: badge.stripeColor }]} />

          <View style={styles.cardInner}>
            <View style={styles.cardHeader}>
              <Avatar name={item.customer?.name || 'Customer'} size="sm" />
              <View style={styles.nameBlock}>
                <Text style={[styles.customerName, { color: tokens.textPrimary }]} numberOfLines={1}>
                  {item.customer?.name || 'Customer'}
                </Text>
                {item.receivable?.reference && (
                  <Text style={[styles.receivableRef, { color: tokens.textMuted }]}>
                    Ref: {item.receivable.reference}
                  </Text>
                )}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: badge.bgColor }]}>
                {badge.icon}
                <Text style={[styles.statusBadgeText, { color: badge.textColor }]}>{badge.label}</Text>
              </View>
            </View>

            <View style={[styles.cardDivider, { backgroundColor: tokens.border }]} />

            <View style={styles.cardBody}>
              <View style={styles.amountColumn}>
                <Text style={[styles.metricLabel, { color: tokens.textMuted }]}>Promised Amount</Text>
                <Text style={[styles.amountValue, { color: tokens.textPrimary }]}>{formattedAmount}</Text>
              </View>

              <View style={styles.dateColumn}>
                <Text style={[styles.metricLabel, { color: tokens.textMuted }]}>Promise Date</Text>
                <View style={styles.dateRow}>
                  <CalendarIcon size={12} color={tokens.textSecondary} />
                  <Text style={[styles.dateValue, { color: tokens.textPrimary }]}>{promisedDate}</Text>
                </View>
              </View>
            </View>

            {item.daysOverdue && item.daysOverdue > 0 && item.status !== 'FULFILLED' ? (
              <View style={[styles.overdueBanner, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2' }]}>
                <AlertCircleIcon size={13} color="#EF4444" />
                <Text style={styles.overdueBannerText}>
                  Missed by {item.daysOverdue} {item.daysOverdue === 1 ? 'day' : 'days'}
                </Text>
              </View>
            ) : null}

            {item.notes ? (
              <Text style={[styles.notesText, { color: tokens.textSecondary }]} numberOfLines={2}>
                "{item.notes}"
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const headerGradient = isDark ? GRADIENTS.darkHero : GRADIENTS.navyHero;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: tokens.background }]}>
      {/* ── PREMIUM HEADER ── */}
      <LinearGradient
        colors={headerGradient as [string, string]}
        start={GRADIENT_DIRECTION.toBottomRight.start}
        end={GRADIENT_DIRECTION.toBottomRight.end}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeftIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{t('commitments.title')}</Text>
            <Text style={styles.headerSubtitle}>Commitments & scheduled dues</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── SEARCH BAR & TIMEFRAME TABS ── */}
      <View style={[styles.controlsContainer, { backgroundColor: tokens.surface, borderBottomColor: tokens.border }]}>
        <View style={[styles.searchBar, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }]}>
          <SearchIcon size={16} color={tokens.textMuted} />
          <TextInput
            placeholder={t('commitments.searchPlaceholder')}
            placeholderTextColor={tokens.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: tokens.textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color={tokens.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Timeframe Filter Tabs */}
        <View style={styles.tabsRow}>
          {[
            { label: t('common.today'), value: 'TODAY' as const },
            { label: t('common.pending'), value: 'UPCOMING' as const },
            { label: t('common.broken'), value: 'MISSED' as const },
            { label: t('common.paid'), value: 'FULFILLED' as const },
            { label: t('common.all'), value: 'ALL' as const },
          ].map((tab) => {
            const isSelected = activeTab === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                onPress={() => setActiveTab(tab.value)}
                activeOpacity={0.75}
                style={styles.tabWrap}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={GRADIENTS.navyToTeal as [string, string]}
                    start={GRADIENT_DIRECTION.toRight.start}
                    end={GRADIENT_DIRECTION.toRight.end}
                    style={styles.tabActive}
                  >
                    <Text style={styles.tabActiveText}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.tabInactive, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }]}>
                    <Text style={[styles.tabInactiveText, { color: tokens.textSecondary }]}>{tab.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── CONTENT AREA ── */}
      {loading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <Shimmer width="100%" height={110} borderRadius={18} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredCommitments}
          keyExtractor={(item) => item.id}
          renderItem={renderCommitmentItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.accent} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <LinearGradient
                  colors={GRADIENTS.tealSheen as [string, string]}
                  style={styles.emptyGradient}
                >
                  <MaterialCommunityIcons name="handshake-outline" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={[styles.emptyTitle, { color: tokens.textPrimary }]}>
                {searchQuery ? 'No Promises Found' : 'No Promises in this View'}
              </Text>
              <Text style={[styles.emptyDesc, { color: tokens.textSecondary }]}>
                {searchQuery
                  ? `No payment promises matched "${searchQuery}".`
                  : 'Payment promises recorded from follow-ups and customer commitments will appear here.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  controlsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  tabWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  tabActive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabActiveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  tabInactive: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabInactiveText: {
    fontSize: 11,
    fontWeight: '700',
  },
  skeletonList: {
    padding: 16,
  },
  skeletonCard: {
    marginBottom: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  commitmentCard: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stripe: {
    width: 4,
  },
  cardInner: {
    flex: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  nameBlock: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 1,
  },
  receivableRef: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    marginBottom: 10,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  amountColumn: {
    flex: 1,
  },
  dateColumn: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  overdueBannerText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    marginBottom: 16,
  },
  emptyGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});

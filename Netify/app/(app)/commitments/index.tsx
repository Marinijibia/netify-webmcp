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
import { useTheme } from '../../../src/design/theme';
import {
  commitmentsApi,
  PaymentCommitmentItem,
  CommitmentStatus,
} from '../../../src/services/api/commitments';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  CalendarIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrendingUpIcon,
} from '../../../src/design/icons';

type TimeframeFilter = 'ALL' | 'TODAY' | 'UPCOMING' | 'MISSED' | 'FULFILLED';

const TIMEFRAME_TABS: { label: string; value: TimeframeFilter }[] = [
  { label: "Today's", value: 'TODAY' },
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Missed', value: 'MISSED' },
  { label: 'Fulfilled', value: 'FULFILLED' },
  { label: 'All', value: 'ALL' },
];

export default function CommitmentsScreen() {
  const router = useRouter();
  const { tokens } = useTheme();

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
        bgColor: '#DEF7EC',
        textColor: '#03543F',
        icon: <CheckCircleIcon size={14} color="#03543F" />,
      };
    }
    if (status === 'PARTIALLY_FULFILLED') {
      return {
        label: 'PARTIAL',
        bgColor: '#E1EFFE',
        textColor: '#1E429F',
        icon: <ClockIcon size={14} color="#1E429F" />,
      };
    }
    if (status === 'MISSED' || isMissed) {
      return {
        label: 'MISSED',
        bgColor: '#FDE8E8',
        textColor: '#9B1C1C',
        icon: <AlertCircleIcon size={14} color="#9B1C1C" />,
      };
    }
    if (status === 'CANCELLED') {
      return {
        label: 'CANCELLED',
        bgColor: '#F3F4F6',
        textColor: '#6B7280',
        icon: <ClockIcon size={14} color="#6B7280" />,
      };
    }
    return {
      label: 'PENDING',
      bgColor: '#FEF08A',
      textColor: '#713F12',
      icon: <ClockIcon size={14} color="#713F12" />,
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
        style={[
          styles.commitmentCard,
          {
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
          },
        ]}
        onPress={() => router.push(`/(app)/commitments/${item.id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.customerName, { color: tokens.textPrimary }]} numberOfLines={1}>
              {item.customer?.name || 'Customer'}
            </Text>
            {item.receivable?.reference && (
              <Text style={[styles.receivableRef, { color: tokens.textSecondary }]}>
                Ref: {item.receivable.reference}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bgColor }]}>
            {badge.icon}
            <Text style={[styles.statusBadgeText, { color: badge.textColor }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBody}>
          <View style={styles.amountColumn}>
            <Text style={[styles.metricLabel, { color: tokens.textSecondary }]}>Promised Amount</Text>
            <Text style={[styles.amountValue, { color: tokens.textPrimary }]}>{formattedAmount}</Text>
          </View>

          <View style={styles.dateColumn}>
            <Text style={[styles.metricLabel, { color: tokens.textSecondary }]}>Promise Date</Text>
            <View style={styles.dateRow}>
              <CalendarIcon size={14} color={tokens.textSecondary} />
              <Text style={[styles.dateValue, { color: tokens.textPrimary }]}>{promisedDate}</Text>
            </View>
          </View>
        </View>

        {item.daysOverdue && item.daysOverdue > 0 && item.status !== 'FULFILLED' ? (
          <View style={[styles.overdueBanner, { backgroundColor: '#FDE8E8' }]}>
            <AlertCircleIcon size={14} color="#9B1C1C" />
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tokens.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: tokens.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon size={24} color={tokens.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tokens.textPrimary }]}>Payment Promises</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Timeframe Filter Tabs */}
      <View style={[styles.tabsWrapper, { borderBottomColor: tokens.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TIMEFRAME_TABS}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item }) => {
            const isSelected = activeTab === item.value;
            return (
              <TouchableOpacity
                style={[
                  styles.tab,
                  isSelected && {
                    borderBottomColor: tokens.primary,
                    borderBottomWidth: 2,
                  },
                ]}
                onPress={() => setActiveTab(item.value)}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isSelected ? tokens.primary : tokens.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            },
          ]}
        >
          <SearchIcon size={18} color={tokens.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: tokens.textPrimary }]}
            placeholder="Search promises by customer..."
            placeholderTextColor={tokens.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.primary} />
          <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>
            Loading commitments...
          </Text>
        </View>
      ) : filteredCommitments.length === 0 ? (
        <View style={styles.centerContainer}>
          <TrendingUpIcon size={48} color={tokens.textSecondary} />
          <Text style={[styles.emptyTitle, { color: tokens.textPrimary }]}>No Promises Found</Text>
          <Text style={[styles.emptySubtitle, { color: tokens.textSecondary }]}>
            {activeTab === 'TODAY'
              ? 'No customer promises scheduled for today.'
              : activeTab === 'MISSED'
              ? 'No missed commitments.'
              : 'Record a collection activity to log customer promises.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCommitments}
          keyExtractor={(item) => item.id}
          renderItem={renderCommitmentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
        />
      )}
    </View>
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
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabsWrapper: {
    borderBottomWidth: 1,
  },
  tabsContainer: {
    paddingHorizontal: 12,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginRight: 4,
  },
  tabText: {
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 280,
  },
  commitmentCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  receivableRef: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountColumn: {
    flex: 1,
  },
  dateColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 10,
  },
  overdueBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B1C1C',
  },
  notesText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
});

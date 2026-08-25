import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/design/theme';
import { Shimmer, Button } from '@/design/components';
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  CalendarIcon,
} from '@/design/icons';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  receivablesApi,
  ReceivableItem,
} from '@/services/api/receivables';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';

type StatusFilter = 'ALL' | 'OPEN' | 'PARTIALLY_PAID' | 'OVERDUE' | 'PAID';

export default function ReceivablesScreen() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();

  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReceivables = useCallback(
    async (pageNum: number = 1, isRefreshing: boolean = false) => {
      try {
        if (pageNum === 1 && !isRefreshing) setLoading(true);
        setError(null);

        const params: any = {
          page: pageNum,
          pageSize: 20,
        };

        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        if (statusFilter === 'OVERDUE') {
          params.isOverdue = true;
        } else if (statusFilter !== 'ALL') {
          params.status = statusFilter;
        }

        const res = await receivablesApi.list(params);

        if (res.data) {
          if (pageNum === 1) {
            setReceivables(res.data);
          } else {
            setReceivables((prev) => [...prev, ...res.data!]);
          }
          setHasMore(!!res.pagination?.hasMore);
          setPage(pageNum);
        } else {
          setError(res.message || 'Failed to load receivables');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, statusFilter]
  );

  useEffect(() => {
    fetchReceivables(1);
  }, [fetchReceivables]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReceivables(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      fetchReceivables(page + 1);
    }
  };

  const formatMoney = (amount: string | number, currency: string = 'NGN') => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num)) return `${currency} 0.00`;
    return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusConfig = (receivable: ReceivableItem) => {
    if (receivable.status === 'PAID') {
      return {
        label: 'PAID',
        stripeColor: '#16A34A',
        badgeBg: isDark ? 'rgba(22,163,74,0.2)' : 'rgba(22,163,74,0.12)',
        badgeColor: '#16A34A',
      };
    }
    if (receivable.isOverdue) {
      return {
        label: `OVERDUE (${receivable.daysOverdue}d)`,
        stripeColor: '#EF4444',
        badgeBg: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)',
        badgeColor: '#EF4444',
      };
    }
    if (receivable.status === 'PARTIALLY_PAID') {
      return {
        label: 'PARTIAL',
        stripeColor: '#F59E0B',
        badgeBg: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.12)',
        badgeColor: '#F59E0B',
      };
    }
    if (receivable.status === 'CANCELLED') {
      return {
        label: 'CANCELLED',
        stripeColor: '#94A3B8',
        badgeBg: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.12)',
        badgeColor: '#94A3B8',
      };
    }
    return {
      label: 'OPEN',
      stripeColor: '#00A581',
      badgeBg: isDark ? 'rgba(0,165,129,0.2)' : 'rgba(0,165,129,0.12)',
      badgeColor: '#00A581',
    };
  };

  const renderReceivableItem = ({ item }: { item: ReceivableItem }) => {
    const config = getStatusConfig(item);

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => router.push(`/(app)/receivables/${item.id}` as any)}
        style={styles.cardWrapper}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.surface,
              borderColor: item.isOverdue ? 'rgba(239,68,68,0.3)' : tokens.border,
            },
          ]}
        >
          {/* Left colored stripe */}
          <View style={[styles.stripe, { backgroundColor: config.stripeColor }]} />

          <View style={styles.cardInner}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleBlock}>
                <Text
                  style={[styles.customerName, { color: tokens.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.customer?.name || 'Customer'}
                </Text>
                {item.reference ? (
                  <Text style={[styles.referenceText, { color: tokens.textMuted }]}>
                    Ref: {item.reference}
                  </Text>
                ) : null}
              </View>

              <View style={[styles.statusBadge, { backgroundColor: config.badgeBg }]}>
                <Text style={[styles.statusBadgeText, { color: config.badgeColor }]}>
                  {config.label}
                </Text>
              </View>
            </View>

            {item.description ? (
              <Text
                style={[styles.descriptionText, { color: tokens.textSecondary }]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}

            {/* Financial Breakdown */}
            <View style={[styles.financialRow, { borderTopColor: tokens.border }]}>
              <View>
                <Text style={[styles.amountLabel, { color: tokens.textMuted }]}>
                  Remaining Balance
                </Text>
                <Text style={[styles.balanceAmount, { color: item.isOverdue ? tokens.danger : tokens.textPrimary }]}>
                  {formatMoney(item.balance, item.currency)}
                </Text>
              </View>

              <View style={styles.dueDateBlock}>
                <View style={styles.dueDateRow}>
                  <CalendarIcon
                    size={12}
                    color={item.isOverdue ? tokens.danger : tokens.textSecondary}
                  />
                  <Text
                    style={[
                      styles.dueDateText,
                      { color: item.isOverdue ? tokens.danger : tokens.textSecondary },
                    ]}
                  >
                    Due {formatDate(item.dueDate)}
                  </Text>
                </View>
                <Text style={[styles.origAmountText, { color: tokens.textMuted }]}>
                  Orig: {formatMoney(item.originalAmount, item.currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
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
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
            activeOpacity={0.7}
          >
            <ChevronLeftIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Receivables</Text>
            <Text style={styles.headerSubtitle}>Authoritative debts & balances</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(app)/receivables/create' as any)}
          activeOpacity={0.8}
          style={styles.addBtnWrap}
        >
          <LinearGradient
            colors={GRADIENTS.tealSheen as [string, string]}
            start={GRADIENT_DIRECTION.toRight.start}
            end={GRADIENT_DIRECTION.toRight.end}
            style={styles.addBtn}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Record</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <View style={[styles.controlsContainer, { backgroundColor: tokens.surface, borderBottomColor: tokens.border }]}>
        <View style={[styles.searchBar, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }]}>
          <SearchIcon size={16} color={tokens.textMuted} />
          <TextInput
            placeholder="Search by customer, reference..."
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

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {(['ALL', 'OPEN', 'PARTIALLY_PAID', 'OVERDUE', 'PAID'] as StatusFilter[]).map((tab) => {
            const active = statusFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setStatusFilter(tab)}
                activeOpacity={0.75}
                style={styles.tabWrap}
              >
                {active ? (
                  <LinearGradient
                    colors={GRADIENTS.navyToTeal as [string, string]}
                    start={GRADIENT_DIRECTION.toRight.start}
                    end={GRADIENT_DIRECTION.toRight.end}
                    style={styles.tabActive}
                  >
                    <Text style={styles.tabActiveText}>{tab.replace('_', ' ')}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.tabInactive, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }]}>
                    <Text style={[styles.tabInactiveText, { color: tokens.textSecondary }]}>
                      {tab.replace('_', ' ')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── CONTENT BODY ── */}
      <View style={styles.contentArea}>
        {loading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <Shimmer width="100%" height={96} borderRadius={18} />
              </View>
            ))}
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={38} color={tokens.danger} />
            <Text style={[styles.errorTitle, { color: tokens.textPrimary }]}>
              Unable to Load Receivables
            </Text>
            <Text style={[styles.errorDesc, { color: tokens.textSecondary }]}>{error}</Text>
            <Button
              label="Try Again"
              variant="secondary"
              size="sm"
              style={{ marginTop: 14 }}
              onPress={() => fetchReceivables(1)}
            />
          </View>
        ) : (
          <FlatList
            data={receivables}
            keyExtractor={(item) => item.id}
            renderItem={renderReceivableItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={tokens.accent}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreWrap}>
                  <ActivityIndicator size="small" color={tokens.accent} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <LinearGradient
                    colors={GRADIENTS.tealSheen as [string, string]}
                    style={styles.emptyGradient}
                  >
                    <FileTextIcon size={32} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <Text style={[styles.emptyTitle, { color: tokens.textPrimary }]}>
                  {searchQuery ? 'No Receivables Found' : 'No Receivables Recorded'}
                </Text>
                <Text style={[styles.emptyDesc, { color: tokens.textSecondary }]}>
                  {searchQuery
                    ? `No receivables matched "${searchQuery}".`
                    : 'Record customer debts, invoices, or credit sales to begin deterministic balance and intelligence tracking.'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={styles.emptyAddBtnWrap}
                    onPress={() => router.push('/(app)/receivables/create' as any)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={GRADIENTS.navyToTeal as [string, string]}
                      start={GRADIENT_DIRECTION.toRight.start}
                      end={GRADIENT_DIRECTION.toRight.end}
                      style={styles.emptyAddBtn}
                    >
                      <Feather name="plus" size={16} color="#FFFFFF" />
                      <Text style={styles.emptyAddBtnText}>Record First Receivable</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>
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
  addBtnWrap: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
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
    gap: 8,
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
    fontSize: 10.5,
    fontWeight: '800',
  },
  tabInactive: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabInactiveText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  contentArea: {
    flex: 1,
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
  card: {
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitleBlock: {
    flex: 1,
    marginRight: 8,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  referenceText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  amountLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  dueDateBlock: {
    alignItems: 'flex-end',
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  dueDateText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  origAmountText: {
    fontSize: 11,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  errorDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  loadingMoreWrap: {
    paddingVertical: 14,
    alignItems: 'center',
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
    marginBottom: 20,
  },
  emptyAddBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});

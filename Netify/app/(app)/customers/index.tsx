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
import { Avatar, CustomerRowSkeleton, Button } from '@/design/components';
import {
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  PhoneIcon,
  MailIcon,
  AlertCircleIcon,
} from '@/design/icons';
import Feather from '@expo/vector-icons/Feather';
import { customersApi, CustomerItem } from '@/services/api/customers';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export default function CustomersListScreen() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchCustomers = useCallback(
    async (pageToFetch = 1, isRefresh = false) => {
      try {
        if (pageToFetch === 1 && !isRefresh) {
          setLoading(true);
        }
        setError(null);

        const params: any = {
          page: pageToFetch,
          pageSize: 20,
        };

        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        if (statusFilter !== 'ALL') {
          params.status = statusFilter;
        }

        const response = await customersApi.list(params);

        if (response.success && response.data) {
          if (pageToFetch === 1) {
            setCustomers(response.data);
          } else {
            setCustomers((prev) => [...prev, ...(response.data || [])]);
          }

          if (response.pagination) {
            setHasMore(response.pagination.hasMore);
            setPage(response.pagination.page);
          } else {
            setHasMore(false);
          }
        } else {
          setError(response.error?.message || 'Failed to load customers');
        }
      } catch (err: any) {
        setError(err?.message || 'An unexpected error occurred while loading customers');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, statusFilter]
  );

  useEffect(() => {
    fetchCustomers(1);
  }, [fetchCustomers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCustomers(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      setLoadingMore(true);
      fetchCustomers(page + 1);
    }
  };

  const renderStatusBadge = (status: CustomerItem['status']) => {
    let bg = tokens.surfaceMuted;
    let text = tokens.textSecondary;

    if (status === 'ACTIVE') {
      bg = isDark ? 'rgba(0,185,148,0.2)' : 'rgba(0,165,129,0.12)';
      text = '#00A581';
    } else if (status === 'ARCHIVED' || status === 'BLOCKED') {
      bg = isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)';
      text = '#EF4444';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Text style={[styles.statusBadgeText, { color: text }]}>{status}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: CustomerItem }) => {
    const primaryPhone = item.phone || item.contacts?.find((c) => c.type === 'PHONE')?.value;
    const primaryEmail = item.email || item.contacts?.find((c) => c.type === 'EMAIL')?.value;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => router.push(`/(app)/customers/${item.id}` as any)}
        style={styles.cardWrapper}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Avatar name={item.name} size="md" />
            <View style={styles.cardTitleBlock}>
              <Text
                style={[styles.customerName, { color: tokens.textPrimary }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text style={[styles.createdDate, { color: tokens.textMuted }]}>
                Added {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {renderStatusBadge(item.status)}
          </View>

          {/* Contact Details Snippet */}
          <View style={[styles.contactSnippet, { borderTopColor: tokens.border }]}>
            <View style={styles.contactItems}>
              {primaryPhone ? (
                <View style={styles.contactRow}>
                  <PhoneIcon size={12} color={tokens.textSecondary} />
                  <Text style={[styles.contactText, { color: tokens.textSecondary }]}>
                    {primaryPhone}
                  </Text>
                </View>
              ) : null}

              {primaryEmail ? (
                <View style={styles.contactRow}>
                  <MailIcon size={12} color={tokens.textSecondary} />
                  <Text
                    style={[styles.contactText, { color: tokens.textSecondary }]}
                    numberOfLines={1}
                  >
                    {primaryEmail}
                  </Text>
                </View>
              ) : null}

              {!primaryPhone && !primaryEmail && (
                <Text style={[styles.noContactText, { color: tokens.textMuted }]}>
                  No contact info added
                </Text>
              )}
            </View>

            <ChevronRightIcon size={16} color={tokens.textMuted} />
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
            <Text style={styles.headerTitle}>Customers</Text>
            <Text style={styles.headerSubtitle}>Client records & accounts</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(app)/customers/create' as any)}
          activeOpacity={0.8}
          style={styles.addBtnWrap}
        >
          <LinearGradient
            colors={GRADIENTS.tealSheen as [string, string]}
            start={GRADIENT_DIRECTION.toRight.start}
            end={GRADIENT_DIRECTION.toRight.end}
            style={styles.addBtn}
          >
            <Feather name="user-plus" size={14} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <View style={[styles.controlsContainer, { backgroundColor: tokens.surface, borderBottomColor: tokens.border }]}>
        <View style={[styles.searchBar, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }]}>
          <SearchIcon size={16} color={tokens.textMuted} />
          <TextInput
            placeholder="Search by name, phone or email..."
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

        {/* Status Filter Tabs */}
        <View style={styles.tabsRow}>
          {(['ALL', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as StatusFilter[]).map((tab) => {
            const isSelected = statusFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setStatusFilter(tab)}
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
                    <Text style={styles.tabActiveText}>{tab}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.tabInactive, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }]}>
                    <Text style={[styles.tabInactiveText, { color: tokens.textSecondary }]}>{tab}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── CONTENT AREA ── */}
      <View style={styles.contentArea}>
        {loading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3, 4].map((i) => (
              <CustomerRowSkeleton key={i} />
            ))}
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertCircleIcon size={36} color={tokens.danger} />
            <Text style={[styles.errorText, { color: tokens.danger }]}>{error}</Text>
            <Button
              label="Try Again"
              variant="secondary"
              size="sm"
              style={{ marginTop: 14 }}
              onPress={() => fetchCustomers(1)}
            />
          </View>
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
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
                    <UsersIcon size={32} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <Text style={[styles.emptyTitle, { color: tokens.textPrimary }]}>
                  {searchQuery ? 'No Customers Found' : 'No Customers Yet'}
                </Text>
                <Text style={[styles.emptyDesc, { color: tokens.textSecondary }]}>
                  {searchQuery
                    ? `No customer records matched "${searchQuery}".`
                    : 'Add your customer records to start tracking accounts, balances, and AI intelligence.'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={styles.emptyAddBtnWrap}
                    onPress={() => router.push('/(app)/customers/create' as any)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={GRADIENTS.navyToTeal as [string, string]}
                      start={GRADIENT_DIRECTION.toRight.start}
                      end={GRADIENT_DIRECTION.toRight.end}
                      style={styles.emptyAddBtn}
                    >
                      <Feather name="user-plus" size={16} color="#FFFFFF" />
                      <Text style={styles.emptyAddBtnText}>Add First Customer</Text>
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
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tabActiveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  tabInactive: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabInactiveText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contentArea: {
    flex: 1,
  },
  skeletonList: {
    padding: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardTitleBlock: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  createdDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  contactSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  contactItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    flex: 1,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  contactText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  noContactText: {
    fontSize: 11.5,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
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

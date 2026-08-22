import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/design/theme';
import { Card } from '../../../src/design/components/Card';
import { Badge } from '../../../src/design/components/Badge';
import { EmptyState } from '../../../src/design/components/EmptyState';
import {
  SearchIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  CalendarIcon,
} from '../../../src/design/icons';
import {
  receivablesApi,
  ReceivableItem,
} from '../../../src/services/api/receivables';

type StatusFilter = 'ALL' | 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export default function ReceivablesScreen() {
  const router = useRouter();
  const { tokens } = useTheme();

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

  const renderStatusBadge = (receivable: ReceivableItem) => {
    if (receivable.status === 'CANCELLED') {
      return <Badge label="CANCELLED" variant="neutral" size="sm" />;
    }
    if (receivable.status === 'PAID') {
      return <Badge label="PAID" variant="success" size="sm" />;
    }
    if (receivable.isOverdue) {
      return <Badge label={`OVERDUE (${receivable.daysOverdue}d)`} variant="danger" size="sm" />;
    }
    if (receivable.status === 'PARTIALLY_PAID') {
      return <Badge label="PARTIAL" variant="warning" size="sm" />;
    }
    return <Badge label="OPEN" variant="primary" size="sm" />;
  };

  const renderReceivableItem = ({ item }: { item: ReceivableItem }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/(app)/receivables/${item.id}` as any)}
      className="mb-3"
    >
      <Card className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text
              style={{ color: tokens.textPrimary }}
              className="text-base font-bold"
              numberOfLines={1}
            >
              {item.customer?.name || 'Customer'}
            </Text>
            {item.reference ? (
              <Text
                style={{ color: tokens.textSecondary }}
                className="text-xs mt-0.5"
                numberOfLines={1}
              >
                Ref: {item.reference}
              </Text>
            ) : null}
          </View>
          {renderStatusBadge(item)}
        </View>

        {item.description ? (
          <Text
            style={{ color: tokens.textSecondary }}
            className="text-xs mb-3"
            numberOfLines={2}
          >
            {item.description}
          </Text>
        ) : null}

        {/* Financial Breakdown */}
        <View className="pt-2 border-t border-slate-100 dark:border-slate-800 flex-row justify-between items-end">
          <View>
            <Text style={{ color: tokens.textSecondary }} className="text-xs">
              Remaining Balance
            </Text>
            <Text style={{ color: tokens.primary }} className="text-base font-extrabold mt-0.5">
              {formatMoney(item.balance, item.currency)}
            </Text>
          </View>

          <View className="items-end">
            <View className="flex-row items-center mb-1">
              <CalendarIcon size={12} color={item.isOverdue ? tokens.danger : tokens.textSecondary} />
              <Text
                style={{
                  color: item.isOverdue ? tokens.danger : tokens.textSecondary,
                }}
                className="text-xs ml-1 font-medium"
              >
                Due {formatDate(item.dueDate)}
              </Text>
            </View>
            <Text style={{ color: tokens.textSecondary }} className="text-xs">
              Orig: {formatMoney(item.originalAmount, item.currency)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1 rounded-full active:opacity-70"
          >
            <ChevronLeftIcon size={24} color={tokens.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: tokens.textPrimary }} className="text-xl font-bold">
              Receivables
            </Text>
            <Text style={{ color: tokens.textSecondary }} className="text-xs">
              Authoritative Customer Debts & Balances
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(app)/receivables/create' as any)}
          style={{ backgroundColor: tokens.primary }}
          className="w-10 h-10 rounded-full items-center justify-center shadow-sm active:opacity-90"
        >
          <PlusIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View className="px-6 pt-4 pb-2">
        <View
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
          }}
          className="flex-row items-center px-3 py-2.5 rounded-xl border"
        >
          <SearchIcon size={18} color={tokens.textSecondary} />
          <TextInput
            placeholder="Search by customer, reference, or description..."
            placeholderTextColor={tokens.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ color: tokens.textPrimary }}
            className="flex-1 ml-2 text-sm"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: tokens.textSecondary }} className="text-xs font-bold px-1">
                CLEAR
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="px-6 py-2 flex-row">
        {(['ALL', 'OPEN', 'PARTIALLY_PAID', 'OVERDUE', 'PAID'] as StatusFilter[]).map((tab) => {
          const active = statusFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setStatusFilter(tab)}
              style={{
                backgroundColor: active ? tokens.primary : tokens.surface,
                borderColor: active ? tokens.primary : tokens.border,
              }}
              className="mr-2 px-3 py-1.5 rounded-lg border"
            >
              <Text
                style={{
                  color: active ? '#FFFFFF' : tokens.textSecondary,
                }}
                className="text-xs font-bold"
              >
                {tab.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content Body */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.primary} />
          <Text style={{ color: tokens.textSecondary }} className="text-sm mt-3 font-medium">
            Loading receivables...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 px-6 justify-center">
          <EmptyState
            icon={<FileTextIcon size={32} color={tokens.danger} />}
            title="Unable to Load Receivables"
            description={error}
            actionLabel="Try Again"
            onAction={() => fetchReceivables(1)}
          />
        </View>
      ) : (
        <FlatList
          data={receivables}
          keyExtractor={(item) => item.id}
          renderItem={renderReceivableItem}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 40,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tokens.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={tokens.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 py-16 justify-center">
              <EmptyState
                icon={<FileTextIcon size={32} color={tokens.primary} />}
                title={searchQuery ? 'No Receivables Found' : 'No Receivables Recorded'}
                description={
                  searchQuery
                    ? `No receivables matched "${searchQuery}".`
                    : 'Record debt obligations, wholesale credit, or credit sales to begin deterministic balance tracking.'
                }
                actionLabel={searchQuery ? undefined : 'Record First Receivable'}
                onAction={
                  searchQuery
                    ? undefined
                    : () => router.push('/(app)/receivables/create' as any)
                }
              />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

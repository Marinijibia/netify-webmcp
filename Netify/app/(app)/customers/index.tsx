import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/design/theme';
import { Input, Button, Card, Badge, EmptyState } from '@/design/components';
import {
  UsersIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  PhoneIcon,
  MailIcon,
  AlertCircleIcon,
} from '@/design/icons';
import { customersApi, CustomerItem } from '@/services/api/customers';

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
    switch (status) {
      case 'ACTIVE':
        return <Badge label="ACTIVE" variant="primary" size="sm" />;
      case 'INACTIVE':
        return <Badge label="INACTIVE" variant="neutral" size="sm" />;
      case 'ARCHIVED':
        return <Badge label="ARCHIVED" variant="danger" size="sm" />;
      case 'BLOCKED':
        return <Badge label="BLOCKED" variant="danger" size="sm" />;
      default:
        return <Badge label={status} variant="neutral" size="sm" />;
    }
  };

  const renderItem = ({ item }: { item: CustomerItem }) => {
    const primaryPhone = item.phone || item.contacts?.find((c) => c.type === 'PHONE')?.value;
    const primaryEmail = item.email || item.contacts?.find((c) => c.type === 'EMAIL')?.value;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => router.push(`/(app)/customers/${item.id}` as any)}
        className="mb-3"
      >
        <Card
          style={{
            backgroundColor: isDark ? tokens.surface : '#FFFFFF',
            borderColor: tokens.border,
            borderWidth: 1,
          }}
          className="p-4"
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center flex-1 mr-2">
              <View
                style={{ backgroundColor: tokens.primarySoft }}
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              >
                <Text style={{ color: tokens.primary }} className="font-black text-base">
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  style={{ color: tokens.textPrimary }}
                  className="text-base font-bold"
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={{ color: tokens.textSecondary }} className="text-xs">
                  Added {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            {renderStatusBadge(item.status)}
          </View>

          {/* Contact Details Snippet */}
          <View className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-row flex-wrap items-center justify-between">
            {primaryPhone ? (
              <View className="flex-row items-center mr-4 my-0.5">
                <PhoneIcon size={13} color={tokens.textSecondary} />
                <Text style={{ color: tokens.textSecondary }} className="text-xs ml-1.5 font-medium">
                  {primaryPhone}
                </Text>
              </View>
            ) : null}

            {primaryEmail ? (
              <View className="flex-row items-center my-0.5">
                <MailIcon size={13} color={tokens.textSecondary} />
                <Text
                  style={{ color: tokens.textSecondary }}
                  className="text-xs ml-1.5 font-medium"
                  numberOfLines={1}
                >
                  {primaryEmail}
                </Text>
              </View>
            ) : null}

            {!primaryPhone && !primaryEmail && (
              <Text style={{ color: tokens.textMuted }} className="text-xs italic">
                No contact info added
              </Text>
            )}

            <ChevronRightIcon size={16} color={tokens.textMuted} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl items-center justify-center mr-2"
            style={{ backgroundColor: isDark ? tokens.surface : '#F1F5F9' }}
          >
            <ChevronLeftIcon size={20} color={tokens.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: tokens.textPrimary }} className="text-xl font-bold">
              Customers
            </Text>
            <Text style={{ color: tokens.textSecondary }} className="text-xs">
              Manage client records & contacts
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(app)/customers/create' as any)}
          style={{ backgroundColor: tokens.primary }}
          className="flex-row items-center px-3.5 py-2 rounded-xl shadow-sm"
        >
          <PlusIcon size={16} color="#FFFFFF" />
          <Text className="text-white text-xs font-bold ml-1.5">Add Customer</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Controls */}
      <View className="px-6 py-3">
        <Input
          placeholder="Search by name, phone or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<SearchIcon size={18} color={tokens.textMuted} />}
        />

        {/* Status Filter Tabs */}
        <View className="flex-row items-center mt-2 space-x-2">
          {(['ALL', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as StatusFilter[]).map((tab) => {
            const isSelected = statusFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setStatusFilter(tab)}
                style={{
                  backgroundColor: isSelected ? tokens.primary : isDark ? tokens.surface : '#E2E8F0',
                }}
                className="px-3 py-1.5 rounded-lg mr-2"
              >
                <Text
                  style={{
                    color: isSelected ? '#FFFFFF' : tokens.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                  }}
                  className="text-xs"
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content Area */}
      <View className="flex-1 px-6 pt-2">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={tokens.primary} />
            <Text style={{ color: tokens.textSecondary }} className="text-sm mt-3 font-medium">
              Loading customer records...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center">
            <AlertCircleIcon size={36} color={tokens.danger} />
            <Text style={{ color: tokens.danger }} className="text-base font-bold mt-2 text-center">
              {error}
            </Text>
            <Button
              label="Try Again"
              variant="secondary"
              size="sm"
              className="mt-4"
              onPress={() => fetchCustomers(1)}
            />
          </View>
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
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
                  icon={<UsersIcon size={32} color={tokens.primary} />}
                  title={searchQuery ? 'No Customers Found' : 'No Customers Yet'}
                  description={
                    searchQuery
                      ? `No customer records matched "${searchQuery}".`
                      : 'Add your real customer and debtor records to begin tracking receivables and follow-ups.'
                  }
                  actionLabel={searchQuery ? undefined : 'Add First Customer'}
                  onAction={
                    searchQuery
                      ? undefined
                      : () => router.push('/(app)/customers/create' as any)
                  }
                />
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

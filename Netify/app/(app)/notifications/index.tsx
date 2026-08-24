import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/design/theme';
import { useNotificationStore } from '../../../src/store/notification-store';
import { AppNotification } from '../../../src/services/api/notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(true, activeTab === 'UNREAD');
  }, [activeTab]);

  const handleNotificationPress = (item: AppNotification) => {
    if (!item.readAt) {
      markAsRead(item.id);
    }

    if (item.data?.receivableId) {
      router.push(`/receivables/${item.data.receivableId}` as any);
    } else if (item.data?.customerId) {
      router.push(`/customers/${item.data.customerId}` as any);
    } else if (item.data?.commitmentId) {
      router.push(`/commitments/${item.data.commitmentId}` as any);
    }
  };

  const getSignalIcon = (signalType?: string | null, priority?: string) => {
    switch (signalType) {
      case 'PAYMENT_RECEIVED':
        return { name: 'cash-outline' as const, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'RECEIVABLE_OVERDUE':
        return { name: 'alert-circle-outline' as const, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'PROMISE_DUE':
        return { name: 'calendar-outline' as const, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'PROMISE_MISSED':
        return { name: 'warning-outline' as const, color: '#DC2626', bg: 'rgba(220, 38, 38, 0.15)' };
      case 'HIGH_PRIORITY_COLLECTION':
        return { name: 'flame-outline' as const, color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' };
      default:
        return { name: 'notifications-outline' as const, color: '#00E5FF', bg: 'rgba(0, 229, 255, 0.15)' };
    }
  };

  const formatTimestamp = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    activeTab === 'UNREAD' ? !n.readAt : true
  );

  return (
    <View style={{ flex: 1, backgroundColor: tokens.background }}>
      {/* Top Header */}
      <View
        style={{
          paddingTop: 50,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: tokens.surface,
          borderBottomWidth: 1,
          borderBottomColor: tokens.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: tokens.background,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={20} color={tokens.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '700', color: tokens.textPrimary }}>
            Notifications
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAllAsRead()}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 16,
              backgroundColor: 'rgba(0, 229, 255, 0.12)',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#00E5FF' }}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          paddingVertical: 12,
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('ALL')}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 18,
            borderRadius: 20,
            backgroundColor: activeTab === 'ALL' ? tokens.accent : tokens.surface,
            borderWidth: 1,
            borderColor: activeTab === 'ALL' ? tokens.accent : tokens.border,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: activeTab === 'ALL' ? '#001D31' : tokens.textSecondary,
            }}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('UNREAD')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 18,
            borderRadius: 20,
            backgroundColor: activeTab === 'UNREAD' ? tokens.accent : tokens.surface,
            borderWidth: 1,
            borderColor: activeTab === 'UNREAD' ? tokens.accent : tokens.border,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: activeTab === 'UNREAD' ? '#001D31' : tokens.textSecondary,
            }}
          >
            Unread
          </Text>
          {unreadCount > 0 && (
            <View
              style={{
                backgroundColor: activeTab === 'UNREAD' ? '#001D31' : '#EF4444',
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: activeTab === 'UNREAD' ? '#00E5FF' : '#ffffff',
                }}
              >
                {unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content List */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchNotifications(true, activeTab === 'UNREAD')}
              tintColor={tokens.accent}
            />
          }
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View
              style={{
                marginTop: 60,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 30,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: tokens.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons name="notifications-off-outline" size={32} color={tokens.textMuted} />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: tokens.textPrimary,
                  textAlign: 'center',
                  marginBottom: 6,
                }}
              >
                {activeTab === 'UNREAD' ? 'No Unread Notifications' : 'No Notifications Yet'}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: tokens.textSecondary,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                {activeTab === 'UNREAD'
                  ? 'All caught up! New business alerts and payment updates will appear here.'
                  : 'Important business signals, overdue debt alerts, and payment promises will show up here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const iconConfig = getSignalIcon(item.signalType, item.priority);
            const isUnread = !item.readAt;

            return (
              <TouchableOpacity
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  padding: 16,
                  borderRadius: 14,
                  backgroundColor: isUnread ? (isDark ? '#002B49' : '#F0F9FF') : tokens.surface,
                  borderWidth: 1,
                  borderColor: isUnread ? 'rgba(0, 229, 255, 0.3)' : tokens.border,
                  marginBottom: 10,
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: iconConfig.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
                </View>

                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: isUnread ? '700' : '600',
                        color: tokens.textPrimary,
                        flex: 1,
                        marginRight: 8,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: tokens.textMuted }}>
                      {formatTimestamp(item.createdAt)}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 13,
                      color: tokens.textSecondary,
                      lineHeight: 18,
                    }}
                    numberOfLines={2}
                  >
                    {item.body}
                  </Text>
                </View>

                {isUnread && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#00E5FF',
                      marginTop: 6,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

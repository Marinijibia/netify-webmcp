import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/design/theme';
import { useNotificationStore } from '@/store/notification-store';
import { AppNotification } from '@/services/api/notifications';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';

export default function NotificationsScreen() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
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

  const getSignalConfig = (signalType?: string | null) => {
    switch (signalType) {
      case 'PAYMENT_RECEIVED':
        return {
          icon: <MaterialCommunityIcons name="cash-check" size={20} color="#16A34A" />,
          bg: isDark ? 'rgba(22,163,74,0.2)' : 'rgba(22,163,74,0.12)',
          stripeColor: '#16A34A',
        };
      case 'RECEIVABLE_OVERDUE':
        return {
          icon: <MaterialCommunityIcons name="clock-alert-outline" size={20} color="#EF4444" />,
          bg: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)',
          stripeColor: '#EF4444',
        };
      case 'PROMISE_DUE':
        return {
          icon: <MaterialCommunityIcons name="handshake-outline" size={20} color="#F59E0B" />,
          bg: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.12)',
          stripeColor: '#F59E0B',
        };
      case 'PROMISE_MISSED':
        return {
          icon: <MaterialCommunityIcons name="alert-octagon-outline" size={20} color="#DC2626" />,
          bg: isDark ? 'rgba(220,38,38,0.2)' : 'rgba(220,38,38,0.12)',
          stripeColor: '#DC2626',
        };
      default:
        return {
          icon: <Ionicons name="notifications-outline" size={20} color="#00A581" />,
          bg: isDark ? 'rgba(0,165,129,0.2)' : 'rgba(0,165,129,0.12)',
          stripeColor: '#00A581',
        };
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
            <Feather name="arrow-left" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAllAsRead()}
            activeOpacity={0.8}
            style={styles.markAllBtn}
          >
            <Text style={styles.markAllBtnText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* ── TABS ROW ── */}
      <View style={[styles.tabsRow, { backgroundColor: tokens.surface, borderBottomColor: tokens.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('ALL')}
          activeOpacity={0.75}
          style={styles.tabWrap}
        >
          {activeTab === 'ALL' ? (
            <LinearGradient
              colors={GRADIENTS.navyToTeal as [string, string]}
              start={GRADIENT_DIRECTION.toRight.start}
              end={GRADIENT_DIRECTION.toRight.end}
              style={styles.tabActive}
            >
              <Text style={styles.tabActiveText}>All</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.tabInactive, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }]}>
              <Text style={[styles.tabInactiveText, { color: tokens.textSecondary }]}>All</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('UNREAD')}
          activeOpacity={0.75}
          style={styles.tabWrap}
        >
          {activeTab === 'UNREAD' ? (
            <LinearGradient
              colors={GRADIENTS.navyToTeal as [string, string]}
              start={GRADIENT_DIRECTION.toRight.start}
              end={GRADIENT_DIRECTION.toRight.end}
              style={[styles.tabActive, styles.tabUnreadActive]}
            >
              <Text style={styles.tabActiveText}>Unread</Text>
              {unreadCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </LinearGradient>
          ) : (
            <View style={[styles.tabInactive, styles.tabUnreadInactive, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }]}>
              <Text style={[styles.tabInactiveText, { color: tokens.textSecondary }]}>Unread</Text>
              {unreadCount > 0 && (
                <View style={[styles.tabBadgeInactive, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.tabBadgeInactiveText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── CONTENT LIST ── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <LinearGradient
                  colors={GRADIENTS.tealSheen as [string, string]}
                  style={styles.emptyGradient}
                >
                  <Ionicons name="notifications-off-outline" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={[styles.emptyTitle, { color: tokens.textPrimary }]}>
                {activeTab === 'UNREAD' ? 'No Unread Notifications' : 'No Notifications Yet'}
              </Text>
              <Text style={[styles.emptyDesc, { color: tokens.textSecondary }]}>
                {activeTab === 'UNREAD'
                  ? 'All caught up! New business alerts and payment updates will appear here.'
                  : 'Important business signals, overdue debt alerts, and payment promises will show up here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const config = getSignalConfig(item.signalType);
            const isUnread = !item.readAt;

            return (
              <TouchableOpacity
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.75}
                style={styles.cardWrapper}
              >
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isUnread
                        ? isDark
                          ? 'rgba(0,165,129,0.12)'
                          : 'rgba(0,165,129,0.06)'
                        : tokens.surface,
                      borderColor: isUnread ? 'rgba(0,185,148,0.35)' : tokens.border,
                    },
                  ]}
                >
                  {/* Left colored stripe for unread notifications */}
                  {isUnread && (
                    <View style={[styles.unreadStripe, { backgroundColor: config.stripeColor }]} />
                  )}

                  <View style={styles.cardInner}>
                    <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
                      {config.icon}
                    </View>

                    <View style={styles.contentBlock}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.notifTitle,
                            {
                              color: tokens.textPrimary,
                              fontWeight: isUnread ? '800' : '600',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={[styles.timestamp, { color: tokens.textMuted }]}>
                          {formatTimestamp(item.createdAt)}
                        </Text>
                      </View>

                      <Text
                        style={[styles.notifBody, { color: tokens.textSecondary }]}
                        numberOfLines={2}
                      >
                        {item.body}
                      </Text>
                    </View>

                    {isUnread && (
                      <View style={[styles.unreadDot, { backgroundColor: '#00A581' }]} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0,185,148,0.22)',
    borderWidth: 1,
    borderColor: '#00B994',
  },
  markAllBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00B994',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  tabWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  tabActive: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  tabActiveText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  tabInactive: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabInactiveText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  tabUnreadActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabUnreadInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabBadgeInactive: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeInactiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 10,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    flexDirection: 'row',
  },
  unreadStripe: {
    width: 4,
  },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  notifTitle: {
    fontSize: 14.5,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
  },
  notifBody: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
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
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});

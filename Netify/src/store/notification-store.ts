import { create } from 'zustand';
import { notificationApi, AppNotification } from '../services/api/notifications';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;

  fetchNotifications: (refresh?: boolean, unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isRefreshing: false,
  error: null,
  page: 1,
  hasMore: false,

  fetchNotifications: async (refresh = false, unreadOnly = false) => {
    const { page, notifications } = get();
    const targetPage = refresh ? 1 : page;

    set({
      isLoading: !refresh && notifications.length === 0,
      isRefreshing: refresh,
      error: null,
    });

    try {
      const response = await notificationApi.getNotifications({
        page: targetPage,
        pageSize: 20,
        unreadOnly,
      });

      set({
        notifications: refresh ? response.items : [...notifications, ...response.items],
        unreadCount: response.unreadCount,
        page: targetPage + 1,
        hasMore: response.pagination.hasMore,
        isLoading: false,
        isRefreshing: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to load notifications',
        isLoading: false,
        isRefreshing: false,
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // Graceful fallback
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString(), status: 'READ' } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // Fallback
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          readAt: n.readAt || new Date().toISOString(),
          status: 'READ',
        })),
        unreadCount: 0,
      }));
    } catch {
      // Fallback
    }
  },
}));

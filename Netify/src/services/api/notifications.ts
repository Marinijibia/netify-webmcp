import { apiClient } from './client';

export interface AppNotification {
  id: string;
  organizationId: string;
  userId?: string | null;
  type: string;
  signalType?: string | null;
  title: string;
  body: string;
  channel: 'IN_APP' | 'PUSH' | 'EMAIL';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  data?: Record<string, any>;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  items: AppNotification[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
  unreadCount: number;
}

export const notificationApi = {
  /**
   * Fetches paginated notifications.
   */
  getNotifications: async (params?: {
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<NotificationListResponse> => {
    const res = await apiClient.get<NotificationListResponse>('/notifications', {
      params,
    });
    return res.data;
  },

  /**
   * Fetches unread notifications count.
   */
  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    return res.data.unreadCount;
  },

  /**
   * Marks a single notification as read.
   */
  markAsRead: async (id: string): Promise<AppNotification> => {
    const res = await apiClient.patch<AppNotification>(`/notifications/${id}/read`);
    return res.data;
  },

  /**
   * Marks all notifications as read.
   */
  markAllAsRead: async (): Promise<{ updatedCount: number }> => {
    const res = await apiClient.post<{ updatedCount: number }>('/notifications/read-all');
    return res.data;
  },

  /**
   * Registers an Expo push token.
   */
  registerPushToken: async (token: string, platform: 'android' | 'ios' | 'web' = 'android', deviceInfo?: any) => {
    const res = await apiClient.post('/notifications/push-token', {
      token,
      platform,
      deviceInfo,
    });
    return res.data;
  },

  /**
   * Triggers a manual signal scan.
   */
  scanSignals: async () => {
    const res = await apiClient.post('/notifications/scan-signals');
    return res.data;
  },
};

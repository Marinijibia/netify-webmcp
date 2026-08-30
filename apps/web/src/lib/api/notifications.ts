import { apiClient } from './client';
import { ApiResponse } from './types';

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
  getNotifications: async (params?: {
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<NotificationListResponse> => {
    const res = await apiClient.get<any>('/notifications', { params });
    const payload = res.data?.data || res.data;
    if (Array.isArray(payload)) {
      return {
        items: payload,
        pagination: { page: 1, pageSize: 20, totalCount: payload.length, totalPages: 1, hasMore: false },
        unreadCount: payload.filter((n: any) => n.status !== 'READ').length,
      };
    }
    return payload || { items: [], pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasMore: false }, unreadCount: 0 };
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await apiClient.get<any>('/notifications/unread-count');
      return res.data?.unreadCount ?? res.data?.data?.unreadCount ?? 0;
    } catch {
      return 0;
    }
  },

  markAsRead: async (id: string): Promise<AppNotification> => {
    const res = await apiClient.patch<ApiResponse<AppNotification>>(`/notifications/${id}/read`);
    return (res.data?.data || res.data) as AppNotification;
  },

  markAllAsRead: async (): Promise<{ updatedCount: number }> => {
    const res = await apiClient.post<ApiResponse<{ updatedCount: number }>>('/notifications/read-all');
    return (res.data?.data || res.data) as { updatedCount: number };
  },

  scanSignals: async (): Promise<{ detectedCount: number; signals: any[] }> => {
    const res = await apiClient.post<ApiResponse<{ detectedCount: number; signals: any[] }>>('/notifications/scan-signals');
    return (res.data?.data || res.data) as { detectedCount: number; signals: any[] };
  },
};

import { Injectable, Logger, NotFoundException, MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
  prisma,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '@netify/database';
import { NotificationQueryInput, BulkNotificationActionInput, NotificationPreferencesInput } from '@netify/validation';

export interface NotificationStreamEvent {
  organizationId: string;
  type: 'NOTIFICATION_CREATED' | 'NOTIFICATION_READ' | 'ALL_READ' | 'NOTIFICATION_DELETED' | 'BULK_ACTION';
  payload: any;
  timestamp: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly eventBus$ = new Subject<NotificationStreamEvent>();

  /**
   * Real-time SSE stream for connected clients of a specific organization.
   */
  getEventStream(organizationId: string): Observable<MessageEvent> {
    return this.eventBus$.pipe(
      filter((e) => e.organizationId === organizationId),
      map((e) => ({
        data: {
          type: e.type,
          payload: e.payload,
          timestamp: e.timestamp,
        },
      } as MessageEvent))
    );
  }

  /**
   * Emit an event to active subscribers
   */
  emitEvent(organizationId: string, type: NotificationStreamEvent['type'], payload: any) {
    this.eventBus$.next({
      organizationId,
      type,
      payload,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * List paginated notifications for an organization with total unread count,
   * category filtering, and keyword search.
   */
  async list(
    organizationId: string,
    userId: string | undefined,
    query: NotificationQueryInput = { page: 1, pageSize: 20 }
  ) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {
      organizationId,
      ...(query.unreadOnly ? { readAt: null } : {}),
      ...(query.channel ? { channel: query.channel } : {}),
      ...(query.signalType ? { signalType: query.signalType } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
    };

    // Category mapping
    if (query.category && query.category !== 'ALL') {
      switch (query.category) {
        case 'RISK':
          where.signalType = {
            in: [
              'PROMISE_MISSED',
              'RECEIVABLE_OVERDUE',
              'COLLECTION_FOLLOWUP_DUE',
              'HIGH_PRIORITY_COLLECTION',
            ],
          };
          break;
        case 'PAYMENT':
          where.signalType = 'PAYMENT_RECEIVED';
          break;
        case 'COMMITMENT':
          where.signalType = 'PROMISE_DUE';
          break;
        case 'AI':
          where.OR = [
            { signalType: 'IMPORTANT_BUSINESS_CHANGE' },
            { type: 'AI_COPILOT' },
            { type: 'WEBMCP' },
          ];
          break;
        case 'SYSTEM':
          where.OR = [
            { signalType: 'SYSTEM_ALERT' },
            { type: 'SYSTEM' },
          ];
          break;
      }
    }

    // Keyword search on title and body
    if (query.search && query.search.trim().length > 0) {
      const searchTerm = query.search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { body: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [items, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          organizationId,
          readAt: null,
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: skip + items.length < totalCount,
      },
      unreadCount,
    };
  }

  /**
   * Returns unread count for organization.
   */
  async getUnreadCount(organizationId: string, userId?: string) {
    return prisma.notification.count({
      where: {
        organizationId,
        readAt: null,
      },
    });
  }

  /**
   * Mark single notification as read within active organization boundary.
   */
  async markAsRead(organizationId: string, id: string) {
    const existing = await prisma.notification.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Notification with ID ${id} not found in this organization`);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });

    const unreadCount = await this.getUnreadCount(organizationId);
    this.emitEvent(organizationId, 'NOTIFICATION_READ', { id, unreadCount });

    return updated;
  }

  /**
   * Mark all notifications as read for current organization.
   */
  async markAllAsRead(organizationId: string, userId?: string) {
    const result = await prisma.notification.updateMany({
      where: {
        organizationId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });

    this.emitEvent(organizationId, 'ALL_READ', { updatedCount: result.count, unreadCount: 0 });

    return { updatedCount: result.count };
  }

  /**
   * Delete single notification within active organization boundary.
   */
  async deleteNotification(organizationId: string, id: string) {
    const existing = await prisma.notification.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Notification with ID ${id} not found in this organization`);
    }

    await prisma.notification.delete({
      where: { id },
    });

    const unreadCount = await this.getUnreadCount(organizationId);
    this.emitEvent(organizationId, 'NOTIFICATION_DELETED', { id, unreadCount });

    return { success: true, id };
  }

  /**
   * Bulk action (mark read or delete) on multiple notifications.
   */
  async bulkAction(organizationId: string, input: BulkNotificationActionInput) {
    const { ids, action } = input;

    if (action === 'READ') {
      const result = await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          organizationId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
          status: NotificationStatus.READ,
        },
      });

      const unreadCount = await this.getUnreadCount(organizationId);
      this.emitEvent(organizationId, 'BULK_ACTION', { action, ids, unreadCount });

      return { action, count: result.count, ids };
    }

    if (action === 'DELETE') {
      const result = await prisma.notification.deleteMany({
        where: {
          id: { in: ids },
          organizationId,
        },
      });

      const unreadCount = await this.getUnreadCount(organizationId);
      this.emitEvent(organizationId, 'BULK_ACTION', { action, ids, unreadCount });

      return { action, count: result.count, ids };
    }

    return { action, count: 0, ids };
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(organizationId: string, userId: string): Promise<NotificationPreferencesInput> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingData: true },
    });

    const data = (user?.onboardingData as Record<string, any>) || {};
    return data._notificationPreferences || {
      soundEnabled: true,
      emailAlertsEnabled: true,
      pushAlertsEnabled: true,
      urgentRiskAlerts: true,
      paymentConfirmations: true,
      commitmentReminders: true,
      aiCopilotBriefings: true,
      quietHoursEnabled: false,
      quietHoursStart: '20:00',
      quietHoursEnd: '08:00',
    };
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    organizationId: string,
    userId: string,
    prefs: NotificationPreferencesInput
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingData: true },
    });

    const existingData = (user?.onboardingData as Record<string, any>) || {};
    const updatedPreferences = {
      ...(existingData._notificationPreferences || {}),
      ...prefs,
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingData: {
          ...existingData,
          _notificationPreferences: updatedPreferences,
        },
      },
    });

    return updatedPreferences;
  }

  /**
   * Creates a deduplicated in-app notification and streams it live to connected clients.
   * If an idempotencyKey exists and collides, it safely returns existing notification without error.
   */
  async createDeduplicated(item: {
    organizationId: string;
    userId?: string | null;
    type?: string;
    signalType?: string;
    title: string;
    body: string;
    channel?: NotificationChannel;
    priority?: NotificationPriority;
    data?: Record<string, any>;
    idempotencyKey?: string;
  }) {
    if (item.idempotencyKey) {
      const existing = await prisma.notification.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: item.organizationId,
            idempotencyKey: item.idempotencyKey,
          },
        },
      });

      if (existing) {
        return existing;
      }
    }

    try {
      const created = await prisma.notification.create({
        data: {
          organizationId: item.organizationId,
          userId: item.userId || null,
          type: item.type || 'SYSTEM',
          signalType: item.signalType || null,
          title: item.title,
          body: item.body,
          channel: item.channel || NotificationChannel.IN_APP,
          status: NotificationStatus.DELIVERED,
          priority: item.priority || NotificationPriority.MEDIUM,
          data: item.data || {},
          idempotencyKey: item.idempotencyKey || null,
        },
      });

      // Broadcast live event to all connected clients in this organization
      const unreadCount = await this.getUnreadCount(item.organizationId);
      this.emitEvent(item.organizationId, 'NOTIFICATION_CREATED', {
        notification: created,
        unreadCount,
      });

      return created;
    } catch (err: any) {
      if (err.code === 'P2002') {
        // Unique constraint collision on idempotencyKey
        return prisma.notification.findUnique({
          where: {
            organizationId_idempotencyKey: {
              organizationId: item.organizationId,
              idempotencyKey: item.idempotencyKey!,
            },
          },
        });
      }
      throw err;
    }
  }
}

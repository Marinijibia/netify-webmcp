import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  prisma,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '@netify/database';
import { NotificationQueryInput } from '@netify/validation';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * List paginated notifications for an organization with total unread count.
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

    return prisma.notification.update({
      where: { id },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });
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

    return { updatedCount: result.count };
  }

  /**
   * Creates a deduplicated in-app notification.
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
      return await prisma.notification.create({
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

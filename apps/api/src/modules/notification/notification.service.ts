import { Injectable } from '@nestjs/common';
import { prisma } from '@netify/database';

@Injectable()
export class NotificationService {
  async list(organizationId: string, userId?: string) {
    return prisma.notification.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(organizationId: string, id: string) {
    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async create(organizationId: string, item: {
    userId?: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }) {
    return prisma.notification.create({
      data: {
        organizationId,
        userId: item.userId,
        type: item.type,
        title: item.title,
        body: item.body,
        data: item.data || {},
      },
    });
  }
}

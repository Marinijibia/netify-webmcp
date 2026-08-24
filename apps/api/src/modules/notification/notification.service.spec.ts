import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { prisma, NotificationChannel, NotificationPriority, NotificationStatus } from '@netify/database';
import { NotFoundException } from '@nestjs/common';

jest.mock('@netify/database', () => {
  return {
    prisma: {
      notification: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    },
    NotificationChannel: {
      IN_APP: 'IN_APP',
      PUSH: 'PUSH',
      EMAIL: 'EMAIL',
    },
    NotificationPriority: {
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW',
    },
    NotificationStatus: {
      PENDING: 'PENDING',
      DELIVERED: 'DELIVERED',
      READ: 'READ',
    },
  };
});

describe('Domain 10: NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  describe('list', () => {
    it('returns paginated notifications strictly scoped to organizationId with unread count', async () => {
      const mockItems = [
        { id: 'notif-1', organizationId: 'org-1', title: 'Payment received', readAt: null },
        { id: 'notif-2', organizationId: 'org-1', title: 'Overdue invoice', readAt: new Date() },
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockItems);
      (prisma.notification.count as jest.Mock)
        .mockResolvedValueOnce(2) // totalCount
        .mockResolvedValueOnce(1); // unreadCount

      const result = await service.list('org-1', 'user-1', { page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.unreadCount).toBe(1);
      expect(result.pagination.totalCount).toBe(2);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org-1' }),
        })
      );
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read if it belongs to active organization', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue({
        id: 'notif-1',
        organizationId: 'org-1',
        readAt: null,
      });

      (prisma.notification.update as jest.Mock).mockResolvedValue({
        id: 'notif-1',
        organizationId: 'org-1',
        readAt: new Date(),
        status: NotificationStatus.READ,
      });

      const updated = await service.markAsRead('org-1', 'notif-1');

      expect(updated.status).toBe(NotificationStatus.READ);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1' },
          data: expect.objectContaining({ status: NotificationStatus.READ }),
        })
      );
    });

    it('throws NotFoundException if notification belongs to another organization (tenant isolation)', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.markAsRead('org-1', 'notif-of-org-2')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('createDeduplicated', () => {
    it('creates notification if idempotencyKey has not been seen before', async () => {
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notif-new',
        organizationId: 'org-1',
        idempotencyKey: 'idemp-1',
      });

      const notif = await service.createDeduplicated({
        organizationId: 'org-1',
        title: 'Alert',
        body: 'Body',
        idempotencyKey: 'idemp-1',
      });

      expect(notif?.id).toBe('notif-new');
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('returns existing notification without duplicate insert on idempotency collision', async () => {
      const existing = {
        id: 'notif-existing',
        organizationId: 'org-1',
        idempotencyKey: 'idemp-duplicate',
      };
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(existing);

      const notif = await service.createDeduplicated({
        organizationId: 'org-1',
        title: 'Alert',
        body: 'Body',
        idempotencyKey: 'idemp-duplicate',
      });

      expect(notif?.id).toBe('notif-existing');
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });
});

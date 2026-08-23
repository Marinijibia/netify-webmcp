import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { EntitlementService } from './entitlement.service';
import { prisma, SubscriptionPlan, SubscriptionStatus, UserRole } from '@netify/database';
import { NetifyFeature, PLAN_CONFIG, RevenueCatWebhookPayload } from '@netify/validation';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

jest.mock('@netify/database', () => ({
  prisma: {
    organization: {
      findUnique: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    subscriptionEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    membership: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    aIUsage: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
  SubscriptionPlan: {
    FREE: 'FREE',
    PRO: 'PRO',
    BUSINESS: 'BUSINESS',
    ENTERPRISE: 'ENTERPRISE',
  },
  SubscriptionStatus: {
    ACTIVE: 'ACTIVE',
    TRIALING: 'TRIALING',
    GRACE_PERIOD: 'GRACE_PERIOD',
    BILLING_ISSUE: 'BILLING_ISSUE',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    INACTIVE: 'INACTIVE',
  },
  UserRole: {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER',
    STAFF: 'STAFF',
  },
}));

describe('Domain 08: RevenueCat Billing, Subscriptions & Entitlements', () => {
  let subscriptionService: SubscriptionService;
  let entitlementService: EntitlementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionService, EntitlementService],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
    entitlementService = module.get<EntitlementService>(EntitlementService);

    jest.clearAllMocks();
  });

  describe('1. Organization Subscription Resolution', () => {
    it('returns PRO plan and limits for active Pro subscription', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: 'org-1',
        name: 'Umar Trading',
      });

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        organizationId: 'org-1',
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenewing: true,
      });

      (prisma.aIUsage.findFirst as jest.Mock).mockResolvedValue({
        usageCount: 15,
      });

      const res = await subscriptionService.getSubscription('org-1');

      expect(res.plan).toBe(SubscriptionPlan.PRO);
      expect(res.status).toBe(SubscriptionStatus.ACTIVE);
      expect(res.isPro).toBe(true);
      expect(res.features).toContain(NetifyFeature.AI_COLLECTION_COPILOT);
      expect(res.limits.maxAIRequestsPerMonth).toBe(PLAN_CONFIG.PRO.maxAIRequestsPerMonth);
      expect(res.aiUsage.used).toBe(15);
      expect(res.aiUsage.remaining).toBe(PLAN_CONFIG.PRO.maxAIRequestsPerMonth - 15);
    });

    it('defaults to FREE plan if subscription is expired or inactive', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: 'org-2',
        name: 'Expired Co',
      });

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-2',
        organizationId: 'org-2',
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.EXPIRED,
      });

      (prisma.aIUsage.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await subscriptionService.getSubscription('org-2');

      expect(res.plan).toBe(SubscriptionPlan.FREE);
      expect(res.isPro).toBe(false);
      expect(res.features).not.toContain(NetifyFeature.AI_COLLECTION_COPILOT);
    });

    it('throws NotFoundException if organization does not exist', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(subscriptionService.getSubscription('invalid-org')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('2. RevenueCat Webhook Idempotency & Lifecycle Events', () => {
    it('processes INITIAL_PURCHASE webhook and upgrades organization to PRO', async () => {
      (prisma.subscriptionEvent.findUnique as jest.Mock).mockResolvedValue(null);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'umar@netify.ng',
        memberships: [{ organizationId: 'org-100', role: UserRole.OWNER }],
      });

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-org-100',
        organizationId: 'org-100',
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
      });

      (prisma.subscription.update as jest.Mock).mockResolvedValue({
        id: 'sub-org-100',
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
      });

      (prisma.subscriptionEvent.create as jest.Mock).mockResolvedValue({
        id: 'event-record-1',
      });

      const payload: RevenueCatWebhookPayload = {
        event: {
          id: 'rc-event-001',
          type: 'INITIAL_PURCHASE',
          app_user_id: 'user-123',
          entitlement_id: 'netify_pro',
          product_id: 'netify_pro_monthly',
          purchased_at_ms: Date.now(),
          expiration_at_ms: Date.now() + 30 * 24 * 60 * 60 * 1000,
          environment: 'SANDBOX',
          store: 'APP_STORE',
        },
      };

      const result = await subscriptionService.processWebhookEvent(payload);

      expect(result.received).toBe(true);
      expect(result.idempotent).toBe(false);
      expect(result.plan).toBe(SubscriptionPlan.PRO);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(prisma.subscription.update).toHaveBeenCalled();
      expect(prisma.subscriptionEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            revenueCatEventId: 'rc-event-001',
            eventType: 'INITIAL_PURCHASE',
          }),
        })
      );
    });

    it('ignores duplicate webhook event idempotently without re-executing updates', async () => {
      (prisma.subscriptionEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-event-1',
        revenueCatEventId: 'rc-event-001',
      });

      const payload: RevenueCatWebhookPayload = {
        event: {
          id: 'rc-event-001',
          type: 'INITIAL_PURCHASE',
          app_user_id: 'user-123',
        },
      };

      const result = await subscriptionService.processWebhookEvent(payload);

      expect(result.received).toBe(true);
      expect(result.idempotent).toBe(true);
      expect(prisma.subscription.update).not.toHaveBeenCalled();
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });

    it('handles CANCELLATION with future expiration by keeping ACTIVE access until period ends', async () => {
      (prisma.subscriptionEvent.findUnique as jest.Mock).mockResolvedValue(null);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        memberships: [{ organizationId: 'org-100', role: UserRole.OWNER }],
      });

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-org-100',
        organizationId: 'org-100',
      });

      (prisma.subscription.update as jest.Mock).mockResolvedValue({
        id: 'sub-org-100',
      });

      const futureExpiration = Date.now() + 15 * 24 * 60 * 60 * 1000;

      const payload: RevenueCatWebhookPayload = {
        event: {
          id: 'rc-event-cancel-1',
          type: 'CANCELLATION',
          app_user_id: 'user-123',
          entitlement_id: 'netify_pro',
          expiration_at_ms: futureExpiration,
          cancel_reason: 'UNSUBSCRIBE',
        },
      };

      const result = await subscriptionService.processWebhookEvent(payload);

      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            autoRenewing: false,
            cancelledAt: expect.any(Date),
          }),
        })
      );
    });

    it('handles EXPIRATION by setting status to EXPIRED and reverting plan to FREE', async () => {
      (prisma.subscriptionEvent.findUnique as jest.Mock).mockResolvedValue(null);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        memberships: [{ organizationId: 'org-100', role: UserRole.OWNER }],
      });

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-org-100',
        organizationId: 'org-100',
      });

      (prisma.subscription.update as jest.Mock).mockResolvedValue({
        id: 'sub-org-100',
      });

      const payload: RevenueCatWebhookPayload = {
        event: {
          id: 'rc-event-exp-1',
          type: 'EXPIRATION',
          app_user_id: 'user-123',
          entitlement_id: 'netify_pro',
        },
      };

      const result = await subscriptionService.processWebhookEvent(payload);

      expect(result.status).toBe(SubscriptionStatus.EXPIRED);
      expect(result.plan).toBe(SubscriptionPlan.FREE);
    });
  });

  describe('3. Feature Gating & Entitlements', () => {
    it('authorizes AI_COLLECTION_COPILOT for PRO plan', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        organizationId: 'org-pro',
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
      });

      const canAccess = await entitlementService.canAccessFeature(
        'org-pro',
        NetifyFeature.AI_COLLECTION_COPILOT
      );

      expect(canAccess).toBe(true);
    });

    it('denies AI_COLLECTION_COPILOT for FREE plan', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

      const canAccess = await entitlementService.canAccessFeature(
        'org-free',
        NetifyFeature.AI_COLLECTION_COPILOT
      );

      expect(canAccess).toBe(false);
    });

    it('authorizes MULTI_BUSINESS for BUSINESS plan but denies for PRO plan', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValueOnce({
        organizationId: 'org-biz',
        plan: SubscriptionPlan.BUSINESS,
        status: SubscriptionStatus.ACTIVE,
      });

      const bizAccess = await entitlementService.canAccessFeature(
        'org-biz',
        NetifyFeature.MULTI_BUSINESS
      );
      expect(bizAccess).toBe(true);

      (prisma.subscription.findFirst as jest.Mock).mockResolvedValueOnce({
        organizationId: 'org-pro',
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
      });

      const proAccess = await entitlementService.canAccessFeature(
        'org-pro',
        NetifyFeature.MULTI_BUSINESS
      );
      expect(proAccess).toBe(false);
    });
  });

  describe('4. AI Usage Tracking & Limits', () => {
    it('increments usage when within quota', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        organizationId: 'org-pro',
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
      });

      (prisma.aIUsage.upsert as jest.Mock).mockResolvedValue({
        usageCount: 50,
      });

      await expect(
        entitlementService.recordAIUsage('org-pro', 'user-1', 'COLLECTION_COPILOT')
      ).resolves.not.toThrow();
    });

    it('throws ForbiddenException when AI usage exceeds plan limit', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        organizationId: 'org-free',
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
      });

      (prisma.aIUsage.upsert as jest.Mock).mockResolvedValue({
        usageCount: 25, // Free limit is 20
      });

      await expect(
        entitlementService.recordAIUsage('org-free', 'user-1', 'COLLECTION_COPILOT')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('5. Multi-Business Organization Creation Limits', () => {
    it('allows Free plan user to create 1 organization, but rejects second organization', async () => {
      // 0 organizations owned -> allowed
      (prisma.membership.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.subscription.findMany as jest.Mock).mockResolvedValueOnce([]);

      const check1 = await entitlementService.canCreateOrganization('user-free');
      expect(check1.allowed).toBe(true);
      expect(check1.maxAllowed).toBe(1);

      // 1 organization already owned on Free plan -> rejected
      (prisma.membership.findMany as jest.Mock).mockResolvedValueOnce([
        {
          role: UserRole.OWNER,
          organization: { subscriptions: [{ plan: SubscriptionPlan.FREE, status: SubscriptionStatus.ACTIVE }] },
        },
      ]);
      (prisma.subscription.findMany as jest.Mock).mockResolvedValueOnce([]);

      const check2 = await entitlementService.canCreateOrganization('user-free');
      expect(check2.allowed).toBe(false);
      expect(check2.currentCount).toBe(1);
      expect(check2.maxAllowed).toBe(1);
      expect(check2.requiredPlan).toBe(SubscriptionPlan.BUSINESS);
    });

    it('allows Business plan user to create multiple organizations up to limit', async () => {
      // 2 organizations owned, but has BUSINESS subscription
      (prisma.membership.findMany as jest.Mock).mockResolvedValueOnce([
        {
          role: UserRole.OWNER,
          organization: { subscriptions: [{ plan: SubscriptionPlan.BUSINESS, status: SubscriptionStatus.ACTIVE }] },
        },
        {
          role: UserRole.OWNER,
          organization: { subscriptions: [] },
        },
      ]);
      (prisma.subscription.findMany as jest.Mock).mockResolvedValueOnce([]);

      const check = await entitlementService.canCreateOrganization('user-biz');
      expect(check.allowed).toBe(true);
      expect(check.currentCount).toBe(2);
      expect(check.maxAllowed).toBe(5);
    });
  });
});

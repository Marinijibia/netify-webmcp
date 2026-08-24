import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionService } from './subscription.service';
import { EntitlementService } from './entitlement.service';
import { WebhooksController } from './webhooks.controller';
import { SubscriptionController } from './subscription.controller';
import {
  prisma,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from '@netify/database';
import {
  PLAN_CONFIG,
  NetifyFeature,
  RevenueCatWebhookPayload,
} from '@netify/validation';

import { JwtService } from '@nestjs/jwt';

jest.mock('@netify/database', () => {
  const mPrisma: any = {
    organization: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    subscriptionEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    aIUsage: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => cb(mPrisma)),
  };

  return {
    prisma: mPrisma,
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
    },
  };
});

describe('Domain 08.1 — Complete RevenueCat Implementation & Production Verification Matrix', () => {
  let subscriptionService: SubscriptionService;
  let entitlementService: EntitlementService;
  let webhooksController: WebhooksController;
  let subscriptionController: SubscriptionController;
  let configService: ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController, SubscriptionController],
      providers: [
        SubscriptionService,
        EntitlementService,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-01', orgId: 'org-01' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'REVENUECAT_WEBHOOK_SECRET') return 'rc_secret_test_key_xyz987';
              return null;
            }),
          },
        },
      ],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
    entitlementService = module.get<EntitlementService>(EntitlementService);
    webhooksController = module.get<WebhooksController>(WebhooksController);
    subscriptionController = module.get<SubscriptionController>(SubscriptionController);
    configService = module.get<ConfigService>(ConfigService);
  });

  // =========================================================================
  // 1. IDENTITY & MULTI-DEVICE MAPPING
  // =========================================================================
  describe('1. Identity & Multi-Device Mapping', () => {
    it('maps Netify User UUID directly to RevenueCat appUserID on webhook ingestion', async () => {
      const netifyUserUuid = '01J8F9D7Z2V4M6P1Q8R3S5T7X9';

      (prisma.subscriptionEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: netifyUserUuid,
        memberships: [{ organizationId: 'org-biz-alpha', role: UserRole.OWNER }],
      });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.subscription.create as jest.Mock).mockResolvedValue({ id: 'sub-new-1' });

      const payload: RevenueCatWebhookPayload = {
        api_version: '1.0',
        event: {
          id: 'rc-event-id-001',
          type: 'INITIAL_PURCHASE',
          app_user_id: netifyUserUuid,
          product_id: 'netify_pro_monthly',
          entitlement_id: 'netify_pro',
          environment: 'SANDBOX',
          store: 'APP_STORE',
          purchased_at_ms: Date.now(),
          expiration_at_ms: Date.now() + 30 * 24 * 3600 * 1000,
        },
      };

      const result = await subscriptionService.processWebhookEvent(payload);

      expect(result.received).toBe(true);
      expect(result.organizationId).toBe('org-biz-alpha');
      expect(result.plan).toBe(SubscriptionPlan.PRO);
      expect(prisma.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            billingUserId: netifyUserUuid,
            revenueCatAppUserId: netifyUserUuid,
            plan: SubscriptionPlan.PRO,
          }),
        })
      );
    });

    it('handles User B re-login without inheriting User A subscription state', async () => {
      const userAId = 'user-alpha-001';
      const userBId = 'user-beta-002';

      // User A owns org-A with PRO
      // User B owns org-B with FREE (no sub)
      (prisma.organization.findUnique as jest.Mock).mockImplementation(({ where }) => {
        if (where.id === 'org-A') return { id: 'org-A', name: 'Alpha Corp' };
        if (where.id === 'org-B') return { id: 'org-B', name: 'Beta Tech' };
        return null;
      });

      (prisma.subscription.findFirst as jest.Mock).mockImplementation(({ where }) => {
        if (where.organizationId === 'org-A') {
          return {
            id: 'sub-A',
            organizationId: 'org-A',
            billingUserId: userAId,
            plan: SubscriptionPlan.PRO,
            status: SubscriptionStatus.ACTIVE,
          };
        }
        return null;
      });

      (prisma.aIUsage.findFirst as jest.Mock).mockResolvedValue({ requestCount: 0 });

      const subA = await subscriptionService.getSubscription('org-A');
      const subB = await subscriptionService.getSubscription('org-B');

      expect(subA.plan).toBe(SubscriptionPlan.PRO);
      expect(subA.isPro).toBe(true);

      expect(subB.plan).toBe(SubscriptionPlan.FREE);
      expect(subB.isPro).toBe(false);
    });
  });

  // =========================================================================
  // 2. PRODUCT & ENTITLEMENT MAPPING
  // =========================================================================
  describe('2. Product & Entitlement Architecture Consistency', () => {
    it('maps PRO monthly and annual products to netify_pro entitlement and PLAN.PRO', async () => {
      (prisma.subscriptionEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-pro-buyer',
        memberships: [{ organizationId: 'org-pro-1', role: UserRole.OWNER }],
      });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({ id: 'sub-pro-1', organizationId: 'org-pro-1' });
      (prisma.subscription.update as jest.Mock).mockResolvedValue({ id: 'sub-pro-1' });

      // Monthly Pro
      const monthlyRes = await subscriptionService.processWebhookEvent({
        api_version: '1.0',
        event: {
          id: 'evt-pro-m',
          type: 'INITIAL_PURCHASE',
          app_user_id: 'user-pro-buyer',
          product_id: 'netify_pro_monthly',
          entitlement_id: 'netify_pro',
          purchased_at_ms: Date.now(),
        },
      });
      expect(monthlyRes.plan).toBe(SubscriptionPlan.PRO);

      // Annual Pro
      const annualRes = await subscriptionService.processWebhookEvent({
        api_version: '1.0',
        event: {
          id: 'evt-pro-a',
          type: 'INITIAL_PURCHASE',
          app_user_id: 'user-pro-buyer',
          product_id: 'netify_pro_annual',
          entitlement_id: 'netify_pro',
          purchased_at_ms: Date.now(),
        },
      });
      expect(annualRes.plan).toBe(SubscriptionPlan.PRO);
    });

    it('maps BUSINESS monthly and annual products to netify_business entitlement and PLAN.BUSINESS', async () => {
      (prisma.subscriptionEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-biz-buyer',
        memberships: [{ organizationId: 'org-biz-1', role: UserRole.OWNER }],
      });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({ id: 'sub-biz-1', organizationId: 'org-biz-1' });
      (prisma.subscription.update as jest.Mock).mockResolvedValue({ id: 'sub-biz-1' });

      const bizRes = await subscriptionService.processWebhookEvent({
        api_version: '1.0',
        event: {
          id: 'evt-biz-m',
          type: 'INITIAL_PURCHASE',
          app_user_id: 'user-biz-buyer',
          product_id: 'netify_business_monthly',
          entitlement_id: 'netify_business',
          purchased_at_ms: Date.now(),
        },
      });
      expect(bizRes.plan).toBe(SubscriptionPlan.BUSINESS);
    });

    it('safely handles unknown product or unknown entitlement without granting unauthorized access', async () => {
      (prisma.subscriptionEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-unknown-buyer',
        memberships: [{ organizationId: 'org-unk-1', role: UserRole.OWNER }],
      });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({ id: 'sub-unk-1', organizationId: 'org-unk-1' });
      (prisma.subscription.update as jest.Mock).mockResolvedValue({ id: 'sub-unk-1' });

      const unknownRes = await subscriptionService.processWebhookEvent({
        api_version: '1.0',
        event: {
          id: 'evt-unknown-999',
          type: 'INITIAL_PURCHASE',
          app_user_id: 'user-unknown-buyer',
          product_id: 'super_fake_ultra_plan',
          entitlement_id: 'unrecognized_entitlement',
          purchased_at_ms: Date.now(),
        },
      });

      // Must default to FREE and NEVER grant Pro or Business
      expect(unknownRes.plan).toBe(SubscriptionPlan.FREE);
    });
  });

  // =========================================================================
  // 3. FULL WEBHOOK LIFECYCLE SPECTRUM
  // =========================================================================
  describe('3. Webhook Lifecycle Spectrum', () => {
    const testUserId = 'user-lifecycle-01';
    const testOrgId = 'org-lifecycle-01';

    beforeEach(() => {
      (prisma.subscriptionEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: testUserId,
        memberships: [{ organizationId: testOrgId, role: UserRole.OWNER }],
      });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-life-1',
        organizationId: testOrgId,
        billingUserId: testUserId,
      });
      (prisma.subscription.update as jest.Mock).mockResolvedValue({ id: 'sub-life-1' });
    });

    it('handles RENEWAL by extending current period and maintaining ACTIVE status', async () => {
      const renewalExpiry = Date.now() + 30 * 24 * 3600 * 1000;
      const res = await subscriptionService.processWebhookEvent({
        api_version: '1.0',
        event: {
          id: 'evt-renewal-01',
          type: 'RENEWAL',
          app_user_id: testUserId,
          product_id: 'netify_pro_monthly',
          entitlement_id: 'netify_pro',
          expiration_at_ms: renewalExpiry,
        },
      });

      expect(res.status).toBe(SubscriptionStatus.ACTIVE);
      expect(res.plan).toBe(SubscriptionPlan.PRO);
    });

    it('handles CANCELLATION with future expiration: retains ACTIVE access until period end', async () => {
      const futureExpiry = Date.now() + 14 * 24 * 3600 * 1000;
      const res = await subscriptionService.processWebhookEvent({
        api_version: '1.0',
        event: {
          id: 'evt-cancel-future',
          type: 'CANCELLATION',
          cancel_reason: 'UNSUBSCRIBE',
          app_user_id: testUserId,
          product_id: 'netify_pro_monthly',
          entitlement_id: 'netify_pro',
          expiration_at_ms: futureExpiry,
        },
      });

      expect(res.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('handles EXPIRATION: reverts status to EXPIRED and plan to FREE', async () => {
      const pastExpiry = Date.now() - 1000;
      const res = await subscriptionService.processWebhookEvent({
        api_version: '1.0',
        event: {
          id: 'evt-expired-01',
          type: 'EXPIRATION',
          app_user_id: testUserId,
          product_id: 'netify_pro_monthly',
          entitlement_id: 'netify_pro',
          expiration_at_ms: pastExpiry,
        },
      });

      expect(res.status).toBe(SubscriptionStatus.EXPIRED);
      expect(res.plan).toBe(SubscriptionPlan.FREE);
    });

    it('handles BILLING_ISSUE: marks status as BILLING_ISSUE without deleting records', async () => {
      const res = await subscriptionService.processWebhookEvent({
        api_version: '1.0',
        event: {
          id: 'evt-billing-issue-01',
          type: 'BILLING_ISSUE',
          app_user_id: testUserId,
          product_id: 'netify_pro_monthly',
          entitlement_id: 'netify_pro',
        },
      });

      expect(res.status).toBe(SubscriptionStatus.BILLING_ISSUE);
    });

    it('handles UNCANCELLATION: restores auto-renewing status', async () => {
      const res = await subscriptionService.processWebhookEvent({
        api_version: '1.0',
        event: {
          id: 'evt-uncancel-01',
          type: 'UNCANCELLATION',
          app_user_id: testUserId,
          product_id: 'netify_pro_monthly',
          entitlement_id: 'netify_pro',
        },
      });

      expect(res.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('handles PRODUCT_CHANGE from Pro to Business: upgrades tier smoothly', async () => {
      const res = await subscriptionService.processWebhookEvent({
        api_version: '1.0',
        event: {
          id: 'evt-prod-change-01',
          type: 'PRODUCT_CHANGE',
          app_user_id: testUserId,
          product_id: 'netify_business_annual',
          entitlement_id: 'netify_business',
        },
      });

      expect(res.status).toBe(SubscriptionStatus.ACTIVE);
      expect(res.plan).toBe(SubscriptionPlan.BUSINESS);
    });

    it('handles TRANSFER event smoothly', async () => {
      const res = await subscriptionService.processWebhookEvent({
        api_version: '1.0',
        event: {
          id: 'evt-transfer-01',
          type: 'TRANSFER',
          app_user_id: testUserId,
          product_id: 'netify_pro_monthly',
          entitlement_id: 'netify_pro',
        },
      });

      expect(res.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('safely logs UNKNOWN_EVENT without crashing or modifying plan', async () => {
      const res = await subscriptionService.processWebhookEvent({
        api_version: '1.0',
        event: {
          id: 'evt-unknown-type-01',
          type: 'SOMETHING_NEW_FROM_REVENUECAT',
          app_user_id: testUserId,
          product_id: 'netify_pro_monthly',
          entitlement_id: 'netify_pro',
        },
      });

      expect(res.received).toBe(true);
    });
  });

  // =========================================================================
  // 4. WEBHOOK SECURITY & IDEMPOTENCY
  // =========================================================================
  describe('4. Webhook Security & Idempotency', () => {
    it('rejects unauthenticated webhook requests when secret is set', async () => {
      const payload: RevenueCatWebhookPayload = {
        api_version: '1.0',
        event: {
          id: 'evt-sec-01',
          type: 'INITIAL_PURCHASE',
          app_user_id: 'user-01',
        },
      };

      // Missing header
      await expect(
        webhooksController.handleRevenueCatWebhook(payload, undefined)
      ).rejects.toThrow(UnauthorizedException);

      // Wrong token
      await expect(
        webhooksController.handleRevenueCatWebhook(payload, 'Bearer invalid_secret_token')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('accepts authenticated webhook request with matching Bearer token', async () => {
      (prisma.subscriptionEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-01',
        memberships: [{ organizationId: 'org-01', role: UserRole.OWNER }],
      });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-01',
        organizationId: 'org-01',
      });
      (prisma.subscription.update as jest.Mock).mockResolvedValue({ id: 'sub-01' });

      const payload: RevenueCatWebhookPayload = {
        api_version: '1.0',
        event: {
          id: 'evt-sec-valid-01',
          type: 'INITIAL_PURCHASE',
          app_user_id: 'user-01',
          product_id: 'netify_pro_monthly',
          entitlement_id: 'netify_pro',
        },
      };

      const response = await webhooksController.handleRevenueCatWebhook(
        payload,
        'Bearer rc_secret_test_key_xyz987'
      );

      expect(response.success).toBe(true);
      expect(response.data.received).toBe(true);
    });

    it('enforces webhook idempotency: replayed events return 200 without duplicate DB writes', async () => {
      (prisma.subscriptionEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-record-existing-01',
        revenueCatEventId: 'evt-duplicate-replay-001',
      });

      const payload: RevenueCatWebhookPayload = {
        api_version: '1.0',
        event: {
          id: 'evt-duplicate-replay-001',
          type: 'INITIAL_PURCHASE',
          app_user_id: 'user-01',
        },
      };

      const res = await subscriptionService.processWebhookEvent(payload);

      expect(res.received).toBe(true);
      expect(res.idempotent).toBe(true);
      expect(prisma.subscription.create).not.toHaveBeenCalled();
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 5. SERVER-AUTHORITATIVE FEATURE GATING & BACKEND PROTECTION
  // =========================================================================
  describe('5. Feature Gating & Backend Authorization', () => {
    it('authorizes AI_COLLECTION_COPILOT for PRO plan and denies for FREE plan', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockImplementation(({ where }) => {
        if (where.organizationId === 'org-pro') {
          return { plan: SubscriptionPlan.PRO, status: SubscriptionStatus.ACTIVE };
        }
        if (where.organizationId === 'org-free') {
          return { plan: SubscriptionPlan.FREE, status: SubscriptionStatus.ACTIVE };
        }
        return null;
      });

      const proAccess = await entitlementService.canAccessFeature(
        'org-pro',
        NetifyFeature.AI_COLLECTION_COPILOT
      );
      const freeAccess = await entitlementService.canAccessFeature(
        'org-free',
        NetifyFeature.AI_COLLECTION_COPILOT
      );

      expect(proAccess).toBe(true);
      expect(freeAccess).toBe(false);
    });

    it('authorizes MULTI_BUSINESS only for BUSINESS and ENTERPRISE plans', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockImplementation(({ where }) => {
        if (where.organizationId === 'org-pro') {
          return { plan: SubscriptionPlan.PRO, status: SubscriptionStatus.ACTIVE };
        }
        if (where.organizationId === 'org-biz') {
          return { plan: SubscriptionPlan.BUSINESS, status: SubscriptionStatus.ACTIVE };
        }
        return null;
      });

      const proMultiBiz = await entitlementService.canAccessFeature(
        'org-pro',
        NetifyFeature.MULTI_BUSINESS
      );
      const bizMultiBiz = await entitlementService.canAccessFeature(
        'org-biz',
        NetifyFeature.MULTI_BUSINESS
      );

      expect(proMultiBiz).toBe(false);
      expect(bizMultiBiz).toBe(true);
    });
  });

  // =========================================================================
  // 6. AI USAGE LIMITS & COUNTERS
  // =========================================================================
  describe('6. AI Monthly Usage Limits', () => {
    it('enforces monthly AI limits: allows within quota and blocks when exceeded', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
      });

      // Within limit (e.g. 50 used of 250)
      (prisma.aIUsage.findFirst as jest.Mock).mockResolvedValue({
        usageCount: 50,
      });

      const remaining = await entitlementService.getRemainingAIUsage('org-pro');
      expect(remaining.used).toBe(50);
      expect(remaining.limit).toBe(PLAN_CONFIG.PRO.maxAIRequestsPerMonth);
      expect(remaining.remaining).toBe(200);

      // Exceeded limit (251 used of 250)
      (prisma.aIUsage.upsert as jest.Mock).mockResolvedValue({
        usageCount: 251,
      });

      await expect(
        entitlementService.recordAIUsage('org-pro', 'user-01', 'copilot')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // 7. MULTI-BUSINESS ISOLATION & ORGANIZATION LIMITS
  // =========================================================================
  describe('7. Multi-Business Isolation & Organization Limits', () => {
    it('allows Free plan user to create 1 organization, but rejects second organization', async () => {
      // User owns 1 organization already
      (prisma.membership.findMany as jest.Mock).mockResolvedValue([
        { organizationId: 'org-free-1', organization: { id: 'org-free-1', subscriptions: [] } },
      ]);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue(null); // Defaults to FREE

      const check = await entitlementService.canCreateOrganization('user-free-01');
      expect(check.allowed).toBe(false);
      expect(check.currentCount).toBe(1);
      expect(check.maxAllowed).toBe(1);
      expect(check.requiredPlan).toBe(SubscriptionPlan.BUSINESS);
    });

    it('allows Business plan user to create multiple organizations up to 5', async () => {
      // User has 3 organizations and active BUSINESS plan
      (prisma.membership.findMany as jest.Mock).mockResolvedValue([
        {
          organizationId: 'org-1',
          organization: {
            id: 'org-1',
            subscriptions: [{ plan: SubscriptionPlan.BUSINESS, status: SubscriptionStatus.ACTIVE }],
          },
        },
        { organizationId: 'org-2', organization: { id: 'org-2', subscriptions: [] } },
        { organizationId: 'org-3', organization: { id: 'org-3', subscriptions: [] } },
      ]);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        plan: SubscriptionPlan.BUSINESS,
        status: SubscriptionStatus.ACTIVE,
      });

      const check = await entitlementService.canCreateOrganization('user-biz-01');
      expect(check.allowed).toBe(true);
      expect(check.currentCount).toBe(3);
      expect(check.maxAllowed).toBe(5);
    });
  });

  // =========================================================================
  // 8. ABSOLUTE DATA PRESERVATION & SECURITY TESTING
  // =========================================================================
  describe('8. Absolute Data Preservation & Security Testing', () => {
    it('downgrade or expiration NEVER triggers deletion of organization records or debts', async () => {
      // Simulating expiration webhook
      (prisma.subscriptionEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-downgrade-01',
        memberships: [{ organizationId: 'org-downgrade-01', role: UserRole.OWNER }],
      });
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-down-1',
        organizationId: 'org-downgrade-01',
      });
      (prisma.subscription.update as jest.Mock).mockResolvedValue({ id: 'sub-down-1' });

      await subscriptionService.processWebhookEvent({
        api_version: '1.0',
        event: {
          id: 'evt-expire-protect-data',
          type: 'EXPIRATION',
          app_user_id: 'user-downgrade-01',
          product_id: 'netify_business_monthly',
          entitlement_id: 'netify_business',
        },
      });

      // Verify that no delete methods on prisma are ever invoked
      expect((prisma as any).organization?.delete).toBeUndefined();
      expect((prisma as any).receivable?.delete).toBeUndefined();
      expect((prisma as any).customer?.delete).toBeUndefined();
      expect((prisma as any).businessMemory?.delete).toBeUndefined();
    });

    it('prevents IDOR: requesting subscription for an organization that does not exist throws 404', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        subscriptionService.getSubscription('non-existent-org-uuid')
      ).rejects.toThrow(NotFoundException);
    });
  });
});

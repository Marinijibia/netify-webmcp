import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import {
  prisma,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from '@netify/database';
import {
  PLAN_CONFIG,
  NetifyFeature,
  PlanLimits,
} from '@netify/validation';

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  /**
   * Resolves the active subscription plan for an organization.
   * If no active subscription exists, defaults to FREE.
   */
  async getOrganizationPlan(organizationId: string): Promise<{
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    limits: PlanLimits;
  }> {
    const sub = await prisma.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    // Check if subscription is expired or inactive
    if (!sub || sub.status === SubscriptionStatus.EXPIRED || sub.status === SubscriptionStatus.INACTIVE) {
      return {
        plan: SubscriptionPlan.FREE,
        status: sub?.status || SubscriptionStatus.ACTIVE,
        limits: PLAN_CONFIG[SubscriptionPlan.FREE],
      };
    }

    const plan = sub.plan as SubscriptionPlan;
    return {
      plan,
      status: sub.status as SubscriptionStatus,
      limits: PLAN_CONFIG[plan] || PLAN_CONFIG[SubscriptionPlan.FREE],
    };
  }

  /**
   * Checks if an organization is entitled to a specific Netify feature.
   */
  async canAccessFeature(
    organizationId: string,
    feature: NetifyFeature
  ): Promise<boolean> {
    const { plan, status } = await this.getOrganizationPlan(organizationId);

    // If subscription is in billing issue or past due, we allow grace period access if still within limits
    if (status === SubscriptionStatus.EXPIRED || status === SubscriptionStatus.INACTIVE) {
      const freeFeatures = PLAN_CONFIG[SubscriptionPlan.FREE].features;
      return freeFeatures.includes(feature);
    }

    const planLimits = PLAN_CONFIG[plan] || PLAN_CONFIG[SubscriptionPlan.FREE];
    return planLimits.features.includes(feature);
  }

  /**
   * Gets current AI usage for the current monthly billing period.
   */
  async getRemainingAIUsage(organizationId: string): Promise<{
    used: number;
    limit: number;
    remaining: number;
  }> {
    const { limits } = await this.getOrganizationPlan(organizationId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usageRecord = await prisma.aIUsage.findFirst({
      where: {
        organizationId,
        periodStart: { gte: startOfMonth },
      },
    });

    const used = usageRecord?.usageCount || 0;
    const limit = limits.maxAIRequestsPerMonth;
    const remaining = Math.max(0, limit - used);

    return { used, limit, remaining };
  }

  /**
   * Records and increments AI usage for an organization.
   * Throws ForbiddenException if monthly limit has been exceeded.
   */
  async recordAIUsage(
    organizationId: string,
    userId?: string,
    capability: string = 'COLLECTION_COPILOT'
  ): Promise<void> {
    const { limits } = await this.getOrganizationPlan(organizationId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const usageRecord = await prisma.aIUsage.upsert({
      where: {
        organizationId_capability_periodStart: {
          organizationId,
          capability,
          periodStart: startOfMonth,
        },
      },
      update: {
        usageCount: { increment: 1 },
      },
      create: {
        organizationId,
        userId: userId || null,
        capability,
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        usageCount: 1,
        limit: limits.maxAIRequestsPerMonth,
      },
    });

    if (usageRecord.usageCount > limits.maxAIRequestsPerMonth) {
      throw new ForbiddenException({
        code: 'AI_USAGE_LIMIT_EXCEEDED',
        message: `Monthly AI request limit of ${limits.maxAIRequestsPerMonth} reached for this organization. Upgrade plan for higher capacity.`,
        limit: limits.maxAIRequestsPerMonth,
        used: usageRecord.usageCount,
      });
    }
  }

  /**
   * Evaluates whether a user is allowed to create another organization.
   * Checks the highest plan across all organizations where the user is an OWNER.
   */
  async canCreateOrganization(userId: string): Promise<{
    allowed: boolean;
    currentCount: number;
    maxAllowed: number;
    requiredPlan?: SubscriptionPlan;
  }> {
    // Count organizations owned by this user
    const ownedMemberships = await prisma.membership.findMany({
      where: {
        userId,
        role: UserRole.OWNER,
      },
      include: {
        organization: {
          include: {
            subscriptions: {
              where: { status: SubscriptionStatus.ACTIVE },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const currentCount = ownedMemberships.length;

    // Find the highest active plan among user's owned organizations or billed subscriptions
    let highestPlan: SubscriptionPlan = SubscriptionPlan.FREE;

    for (const m of ownedMemberships) {
      const activeSub = m.organization.subscriptions[0];
      if (activeSub) {
        if (activeSub.plan === SubscriptionPlan.ENTERPRISE) {
          highestPlan = SubscriptionPlan.ENTERPRISE;
          break;
        } else if (activeSub.plan === SubscriptionPlan.BUSINESS) {
          highestPlan = SubscriptionPlan.BUSINESS;
        } else if (activeSub.plan === SubscriptionPlan.PRO && highestPlan === SubscriptionPlan.FREE) {
          highestPlan = SubscriptionPlan.PRO;
        }
      }
    }

    // Also check any direct billed subscriptions for this user
    const userBilledSubs = await prisma.subscription.findMany({
      where: {
        billingUserId: userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    for (const s of userBilledSubs) {
      if (s.plan === SubscriptionPlan.ENTERPRISE) {
        highestPlan = SubscriptionPlan.ENTERPRISE;
        break;
      } else if (s.plan === SubscriptionPlan.BUSINESS) {
        highestPlan = SubscriptionPlan.BUSINESS;
      }
    }

    const limits = PLAN_CONFIG[highestPlan] || PLAN_CONFIG[SubscriptionPlan.FREE];
    const maxAllowed = limits.maxOrganizations;

    const allowed = currentCount < maxAllowed;

    return {
      allowed,
      currentCount,
      maxAllowed,
      requiredPlan: allowed ? undefined : SubscriptionPlan.BUSINESS,
    };
  }
}

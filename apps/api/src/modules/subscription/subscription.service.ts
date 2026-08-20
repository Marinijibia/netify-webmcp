import { Injectable } from '@nestjs/common';
import { prisma, SubscriptionPlan, SubscriptionStatus } from '@netify/database';

@Injectable()
export class SubscriptionService {
  async getSubscription(organizationId: string) {
    const [sub, entitlements] = await Promise.all([
      prisma.subscription.findFirst({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.entitlement.findMany({
        where: { organizationId },
      }),
    ]);

    return {
      plan: sub?.plan || SubscriptionPlan.FREE,
      status: sub?.status || SubscriptionStatus.ACTIVE,
      currentPeriodStart: sub?.currentPeriodStart,
      currentPeriodEnd: sub?.currentPeriodEnd,
      entitlements,
      isPro: sub?.plan === SubscriptionPlan.PRO && sub?.status === SubscriptionStatus.ACTIVE,
    };
  }

  async updateSubscriptionFromRevenueCat(organizationId: string, payload: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    revenueCatId?: string;
    periodEnd?: Date;
  }) {
    return prisma.subscription.upsert({
      where: { id: organizationId }, // Upsert logic
      update: {
        plan: payload.plan,
        status: payload.status,
        revenueCatId: payload.revenueCatId,
        currentPeriodEnd: payload.periodEnd,
      },
      create: {
        organizationId,
        plan: payload.plan,
        status: payload.status,
        revenueCatId: payload.revenueCatId,
        currentPeriodEnd: payload.periodEnd,
      },
    });
  }
}

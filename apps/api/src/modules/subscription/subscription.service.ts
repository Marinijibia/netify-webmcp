import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  prisma,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from '@netify/database';
import {
  PLAN_CONFIG,
  REVENUECAT_ENTITLEMENT_MAP,
  REVENUECAT_PRODUCT_MAP,
  RevenueCatWebhookPayload,
  NetifyFeature,
} from '@netify/validation';
import { EntitlementService } from './entitlement.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly entitlementService: EntitlementService) {}

  /**
   * Retrieves complete subscription, plan limits, feature list, and AI usage for an organization.
   */
  async getSubscription(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    const sub = await prisma.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        billingUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    const isSubActive =
      sub &&
      (sub.status === SubscriptionStatus.ACTIVE ||
        sub.status === SubscriptionStatus.TRIALING ||
        sub.status === SubscriptionStatus.GRACE_PERIOD);

    const plan = isSubActive ? (sub.plan as SubscriptionPlan) : SubscriptionPlan.FREE;
    const status = sub?.status || SubscriptionStatus.ACTIVE;
    const limits = PLAN_CONFIG[plan] || PLAN_CONFIG[SubscriptionPlan.FREE];
    const aiUsage = await this.entitlementService.getRemainingAIUsage(organizationId);

    return {
      organizationId,
      plan,
      status,
      isPro: plan === SubscriptionPlan.PRO || plan === SubscriptionPlan.BUSINESS || plan === SubscriptionPlan.ENTERPRISE,
      isBusiness: plan === SubscriptionPlan.BUSINESS || plan === SubscriptionPlan.ENTERPRISE,
      isEnterprise: plan === SubscriptionPlan.ENTERPRISE,
      currentPeriodStart: sub?.currentPeriodStart || null,
      currentPeriodEnd: sub?.currentPeriodEnd || null,
      expiresAt: sub?.expiresAt || null,
      autoRenewing: sub?.autoRenewing ?? false,
      productId: sub?.productId || null,
      store: sub?.store || null,
      environment: sub?.environment || null,
      billingUser: sub?.billingUser || null,
      limits,
      aiUsage,
      features: limits.features,
    };
  }

  /**
   * Processes an incoming RevenueCat webhook event idempotently.
   */
  async processWebhookEvent(payload: RevenueCatWebhookPayload): Promise<{
    received: boolean;
    idempotent?: boolean;
    eventType?: string;
    organizationId?: string;
    plan?: SubscriptionPlan;
    status?: SubscriptionStatus;
  }> {
    const event = payload?.event;
    if (!event || !event.id) {
      throw new BadRequestException('Invalid RevenueCat webhook payload: missing event ID');
    }

    // 1. Webhook Idempotency Check
    const existingEvent = await prisma.subscriptionEvent.findUnique({
      where: { revenueCatEventId: event.id },
    });

    if (existingEvent) {
      this.logger.log(`Duplicate RevenueCat event ${event.id} ignored (idempotency).`);
      return {
        received: true,
        idempotent: true,
        eventType: event.type,
      };
    }

    const appUserId = event.app_user_id || event.original_app_user_id;
    if (!appUserId) {
      this.logger.warn(`RevenueCat event ${event.id} missing app_user_id.`);
      return { received: true, eventType: event.type };
    }

    // 2. Resolve Netify User
    const user = await prisma.user.findUnique({
      where: { id: appUserId },
      include: {
        memberships: {
          where: { role: UserRole.OWNER },
          include: { organization: true },
        },
      },
    });

    if (!user) {
      this.logger.warn(`User with app_user_id ${appUserId} not found for event ${event.id}.`);
      return { received: true, eventType: event.type };
    }

    // 3. Resolve Organization for Billing
    // Find organization owned by user or existing subscription billed to this user
    let organizationId: string | null = null;

    const existingSub = await prisma.subscription.findFirst({
      where: {
        OR: [
          { billingUserId: user.id },
          { revenueCatAppUserId: appUserId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (existingSub) {
      organizationId = existingSub.organizationId;
    } else if (user.memberships.length > 0) {
      organizationId = user.memberships[0].organizationId;
    }

    if (!organizationId) {
      this.logger.warn(`No organization found for billing user ${user.id} in event ${event.id}.`);
      return { received: true, eventType: event.type };
    }

    // 4. Map Plan & Status
    const { targetPlan, targetStatus, expiresAt, currentPeriodEnd } = this.resolvePlanAndStatusFromEvent(event);

    // 5. Transactional Processing: Update Subscription + Record Event
    await prisma.$transaction(async (tx) => {
      // Find or create subscription for this organization
      const currentOrgSub = await tx.subscription.findFirst({
        where: { organizationId: organizationId! },
        orderBy: { createdAt: 'desc' },
      });

      let subId: string;

      if (currentOrgSub) {
        const updated = await tx.subscription.update({
          where: { id: currentOrgSub.id },
          data: {
            billingUserId: user.id,
            plan: targetPlan,
            status: targetStatus,
            revenueCatAppUserId: appUserId,
            productId: event.product_id || currentOrgSub.productId,
            entitlementId: event.entitlement_id || currentOrgSub.entitlementId,
            store: event.store || currentOrgSub.store,
            environment: event.environment || currentOrgSub.environment,
            expiresAt: expiresAt || currentOrgSub.expiresAt,
            currentPeriodEnd: currentPeriodEnd || currentOrgSub.currentPeriodEnd,
            autoRenewing: event.cancel_reason ? false : true,
            cancelledAt: event.cancel_reason ? new Date() : null,
          },
        });
        subId = updated.id;
      } else {
        const created = await tx.subscription.create({
          data: {
            organizationId: organizationId!,
            billingUserId: user.id,
            plan: targetPlan,
            status: targetStatus,
            revenueCatAppUserId: appUserId,
            productId: event.product_id || null,
            entitlementId: event.entitlement_id || null,
            store: event.store || null,
            environment: event.environment || null,
            startedAt: event.purchased_at_ms ? new Date(event.purchased_at_ms) : new Date(),
            expiresAt: expiresAt,
            currentPeriodEnd: currentPeriodEnd,
            autoRenewing: event.cancel_reason ? false : true,
          },
        });
        subId = created.id;
      }

      // Record Subscription Event
      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: subId,
          organizationId: organizationId!,
          revenueCatEventId: event.id,
          eventType: event.type,
          productId: event.product_id || null,
          environment: event.environment || null,
          payload: event as any,
          occurredAt: event.purchased_at_ms ? new Date(event.purchased_at_ms) : new Date(),
          processedAt: new Date(),
        },
      });
    });

    this.logger.log(
      `Successfully processed RevenueCat webhook ${event.type} (event: ${event.id}) for org ${organizationId} -> Plan: ${targetPlan}, Status: ${targetStatus}`
    );

    return {
      received: true,
      idempotent: false,
      eventType: event.type,
      organizationId,
      plan: targetPlan,
      status: targetStatus,
    };
  }

  /**
   * Resolves plan and status from RevenueCat event fields.
   */
  private resolvePlanAndStatusFromEvent(event: any): {
    targetPlan: SubscriptionPlan;
    targetStatus: SubscriptionStatus;
    expiresAt: Date | null;
    currentPeriodEnd: Date | null;
  } {
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
    const currentPeriodEnd = expiresAt;

    let targetPlan: SubscriptionPlan = SubscriptionPlan.FREE;

    // Resolve plan by entitlement_id
    if (event.entitlement_id && REVENUECAT_ENTITLEMENT_MAP[event.entitlement_id]) {
      targetPlan = REVENUECAT_ENTITLEMENT_MAP[event.entitlement_id];
    } else if (event.product_id && REVENUECAT_PRODUCT_MAP[event.product_id]) {
      targetPlan = REVENUECAT_PRODUCT_MAP[event.product_id].plan;
    } else if (event.entitlement_ids && event.entitlement_ids.length > 0) {
      for (const ent of event.entitlement_ids) {
        if (REVENUECAT_ENTITLEMENT_MAP[ent]) {
          targetPlan = REVENUECAT_ENTITLEMENT_MAP[ent];
          break;
        }
      }
    }

    let targetStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE;

    const eventType = event.type?.toUpperCase();

    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'NON_RENEWING_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'SUBSCRIPTION_EXTENDED':
        targetStatus = SubscriptionStatus.ACTIVE;
        break;

      case 'CANCELLATION':
        // If cancellation happened but expiration date is in the future, access remains ACTIVE until expiration
        if (expiresAt && expiresAt.getTime() > Date.now()) {
          targetStatus = SubscriptionStatus.ACTIVE;
        } else {
          targetStatus = SubscriptionStatus.CANCELLED;
        }
        break;

      case 'EXPIRATION':
        targetStatus = SubscriptionStatus.EXPIRED;
        targetPlan = SubscriptionPlan.FREE;
        break;

      case 'BILLING_ISSUE':
        targetStatus = SubscriptionStatus.BILLING_ISSUE;
        break;

      case 'PRODUCT_CHANGE':
        targetStatus = SubscriptionStatus.ACTIVE;
        break;

      default:
        targetStatus = SubscriptionStatus.ACTIVE;
        break;
    }

    return { targetPlan, targetStatus, expiresAt, currentPeriodEnd };
  }

  /**
   * Syncs active entitlements reported by mobile RevenueCat SDK to the backend database.
   */
  async syncMobileEntitlements(
    userId: string,
    organizationId: string,
    activeEntitlements: string[]
  ) {
    let resolvedPlan: SubscriptionPlan = SubscriptionPlan.FREE;

    for (const ent of activeEntitlements) {
      if (REVENUECAT_ENTITLEMENT_MAP[ent]) {
        resolvedPlan = REVENUECAT_ENTITLEMENT_MAP[ent];
        break;
      }
    }

    const currentSub = await prisma.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    if (currentSub) {
      await prisma.subscription.update({
        where: { id: currentSub.id },
        data: {
          billingUserId: userId,
          plan: resolvedPlan,
          status: SubscriptionStatus.ACTIVE,
          revenueCatAppUserId: userId,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          organizationId,
          billingUserId: userId,
          plan: resolvedPlan,
          status: SubscriptionStatus.ACTIVE,
          revenueCatAppUserId: userId,
        },
      });
    }

    return this.getSubscription(organizationId);
  }
}

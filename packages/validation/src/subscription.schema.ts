import { z } from 'zod';

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  GRACE_PERIOD = 'GRACE_PERIOD',
  BILLING_ISSUE = 'BILLING_ISSUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  INACTIVE = 'INACTIVE',
}

export enum NetifyFeature {
  BASIC_COLLECTIONS = 'BASIC_COLLECTIONS',
  BASIC_MEMORY = 'BASIC_MEMORY',
  AI_COLLECTION_COPILOT = 'AI_COLLECTION_COPILOT',
  CUSTOMER_INTELLIGENCE = 'CUSTOMER_INTELLIGENCE',
  DAILY_BRIEFING = 'DAILY_BRIEFING',
  AI_MESSAGE_DRAFTING = 'AI_MESSAGE_DRAFTING',
  BUSINESS_QA = 'BUSINESS_QA',
  BUSINESS_MEMORY_FULL = 'BUSINESS_MEMORY_FULL',
  MULTI_BUSINESS = 'MULTI_BUSINESS',
  ADVANCED_REPORTING = 'ADVANCED_REPORTING',
  CROSS_BUSINESS_OVERVIEW = 'CROSS_BUSINESS_OVERVIEW',
  ENTERPRISE_ADMIN = 'ENTERPRISE_ADMIN',
  AI_VOICE_ASSISTANT = 'AI_VOICE_ASSISTANT',
}

export interface PlanLimits {
  maxOrganizations: number;
  maxMembers: number;
  maxAIRequestsPerMonth: number;
  maxCustomers: number;
  memoryRetentionDays: number;
  features: NetifyFeature[];
}

export const PLAN_CONFIG: Record<SubscriptionPlan, PlanLimits> = {
  [SubscriptionPlan.FREE]: {
    maxOrganizations: 1,
    maxMembers: 1,
    maxAIRequestsPerMonth: 20,
    maxCustomers: 25,
    memoryRetentionDays: 30,
    features: [
      NetifyFeature.BASIC_COLLECTIONS,
      NetifyFeature.BASIC_MEMORY,
    ],
  },
  [SubscriptionPlan.PRO]: {
    maxOrganizations: 1,
    maxMembers: 3,
    maxAIRequestsPerMonth: 250,
    maxCustomers: 500,
    memoryRetentionDays: 365,
    features: [
      NetifyFeature.BASIC_COLLECTIONS,
      NetifyFeature.BASIC_MEMORY,
      NetifyFeature.AI_COLLECTION_COPILOT,
      NetifyFeature.CUSTOMER_INTELLIGENCE,
      NetifyFeature.DAILY_BRIEFING,
      NetifyFeature.AI_MESSAGE_DRAFTING,
      NetifyFeature.BUSINESS_QA,
      NetifyFeature.BUSINESS_MEMORY_FULL,
      NetifyFeature.AI_VOICE_ASSISTANT,
    ],
  },
  [SubscriptionPlan.BUSINESS]: {
    maxOrganizations: 5,
    maxMembers: 10,
    maxAIRequestsPerMonth: 1000,
    maxCustomers: 5000,
    memoryRetentionDays: 1825, // 5 years
    features: [
      NetifyFeature.BASIC_COLLECTIONS,
      NetifyFeature.BASIC_MEMORY,
      NetifyFeature.AI_COLLECTION_COPILOT,
      NetifyFeature.CUSTOMER_INTELLIGENCE,
      NetifyFeature.DAILY_BRIEFING,
      NetifyFeature.AI_MESSAGE_DRAFTING,
      NetifyFeature.BUSINESS_QA,
      NetifyFeature.BUSINESS_MEMORY_FULL,
      NetifyFeature.MULTI_BUSINESS,
      NetifyFeature.ADVANCED_REPORTING,
      NetifyFeature.CROSS_BUSINESS_OVERVIEW,
      NetifyFeature.AI_VOICE_ASSISTANT,
    ],
  },
  [SubscriptionPlan.ENTERPRISE]: {
    maxOrganizations: 9999,
    maxMembers: 9999,
    maxAIRequestsPerMonth: 10000,
    maxCustomers: 99999,
    memoryRetentionDays: 3650, // 10 years
    features: [
      NetifyFeature.BASIC_COLLECTIONS,
      NetifyFeature.BASIC_MEMORY,
      NetifyFeature.AI_COLLECTION_COPILOT,
      NetifyFeature.CUSTOMER_INTELLIGENCE,
      NetifyFeature.DAILY_BRIEFING,
      NetifyFeature.AI_MESSAGE_DRAFTING,
      NetifyFeature.BUSINESS_QA,
      NetifyFeature.BUSINESS_MEMORY_FULL,
      NetifyFeature.MULTI_BUSINESS,
      NetifyFeature.ADVANCED_REPORTING,
      NetifyFeature.CROSS_BUSINESS_OVERVIEW,
      NetifyFeature.ENTERPRISE_ADMIN,
      NetifyFeature.AI_VOICE_ASSISTANT,
    ],
  },
};

export const REVENUECAT_ENTITLEMENT_MAP: Record<string, SubscriptionPlan> = {
  netify_pro: SubscriptionPlan.PRO,
  netify_business: SubscriptionPlan.BUSINESS,
  netify_enterprise: SubscriptionPlan.ENTERPRISE,
};

export const REVENUECAT_PRODUCT_MAP: Record<
  string,
  { plan: SubscriptionPlan; interval: 'MONTHLY' | 'ANNUAL' }
> = {
  netify_pro_monthly: { plan: SubscriptionPlan.PRO, interval: 'MONTHLY' },
  netify_pro_annual: { plan: SubscriptionPlan.PRO, interval: 'ANNUAL' },
  netify_business_monthly: { plan: SubscriptionPlan.BUSINESS, interval: 'MONTHLY' },
  netify_business_annual: { plan: SubscriptionPlan.BUSINESS, interval: 'ANNUAL' },
};

export const switchOrganizationSchema = z.object({
  organizationId: z.string().uuid({ message: 'Valid organization ID is required' }),
});
export type SwitchOrganizationInput = z.infer<typeof switchOrganizationSchema>;

export const updateSubscriptionStatusSchema = z.object({
  status: z.nativeEnum(SubscriptionStatus),
});
export type UpdateSubscriptionStatusInput = z.infer<typeof updateSubscriptionStatusSchema>;

export const revenueCatWebhookEventSchema = z.object({
  api_version: z.string().optional(),
  event: z.object({
    id: z.string(),
    type: z.string(),
    app_user_id: z.string(),
    original_app_user_id: z.string().optional(),
    product_id: z.string().optional(),
    entitlement_id: z.string().optional(),
    entitlement_ids: z.array(z.string()).optional(),
    period_type: z.string().optional(),
    purchased_at_ms: z.number().optional(),
    expiration_at_ms: z.number().nullable().optional(),
    environment: z.string().optional(),
    store: z.string().optional(),
    is_trial_conversion: z.boolean().optional(),
    cancel_reason: z.string().optional(),
    presented_offering_id: z.string().optional(),
  }),
});
export type RevenueCatWebhookPayload = z.infer<typeof revenueCatWebhookEventSchema>;

export enum BillingPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export enum BillingStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  GRACE_PERIOD = 'GRACE_PERIOD',
  BILLING_ISSUE = 'BILLING_ISSUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  INACTIVE = 'INACTIVE',
}

export interface BillingProduct {
  identifier: string;
  description: string;
  title: string;
  price: number;
  priceString: string;
  currencyCode: string;
  introPrice?: {
    price: number;
    priceString: string;
    period: string;
    cycles: number;
  } | null;
}

export interface BillingPackage {
  identifier: string;
  packageType: 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | 'CUSTOM';
  plan: BillingPlan;
  product: BillingProduct;
}

export interface BillingCustomerInfo {
  activeEntitlements: string[];
  allPurchasedProductIdentifiers: string[];
  latestExpirationDate: string | null;
  originalPurchaseDate: string | null;
  managementUrl?: string | null;
}

export interface PlanLimitsData {
  maxOrganizations: number;
  maxMembers: number;
  maxAIRequestsPerMonth: number;
  maxCustomers: number;
  memoryRetentionDays: number;
  features: string[];
}

export interface AIUsageData {
  used: number;
  limit: number;
  remaining: number;
}

export interface OrganizationSubscriptionData {
  organizationId: string;
  plan: BillingPlan;
  status: BillingStatus;
  isPro: boolean;
  isBusiness: boolean;
  isEnterprise: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  expiresAt: string | null;
  autoRenewing: boolean;
  productId: string | null;
  store: string | null;
  environment: string | null;
  billingUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  limits: PlanLimitsData;
  aiUsage: AIUsageData;
  features: string[];
}

import { create } from 'zustand';
import {
  BillingPlan,
  BillingStatus,
  BillingPackage,
  BillingCustomerInfo,
  OrganizationSubscriptionData,
} from '../services/billing/billing.types';
import { billingProvider } from '../services/billing/revenuecat-provider';
import { subscriptionApi } from '../services/api/subscription';

interface BillingStoreState {
  plan: BillingPlan;
  status: BillingStatus;
  isPro: boolean;
  isBusiness: boolean;
  isEnterprise: boolean;
  activeEntitlements: string[];
  offerings: BillingPackage[];
  subscription: OrganizationSubscriptionData | null;
  isLoading: boolean;
  isPurchasing: boolean;
  error: string | null;

  // Paywall & UI Modal Controls
  isProPaywallVisible: boolean;
  isBusinessPaywallVisible: boolean;
  isBusinessSwitcherVisible: boolean;

  // Actions
  initializeBilling: (userId: string, organizationId: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  purchasePackage: (pkg: BillingPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  canAccessFeature: (feature: string) => boolean;
  openProPaywall: () => void;
  closeProPaywall: () => void;
  openBusinessPaywall: () => void;
  closeBusinessPaywall: () => void;
  openBusinessSwitcher: () => void;
  closeBusinessSwitcher: () => void;
  resetBilling: () => Promise<void>;
}

export const useBillingStore = create<BillingStoreState>((set, get) => ({
  plan: BillingPlan.FREE,
  status: BillingStatus.ACTIVE,
  isPro: false,
  isBusiness: false,
  isEnterprise: false,
  activeEntitlements: [],
  offerings: [],
  subscription: null,
  isLoading: false,
  isPurchasing: false,
  error: null,

  isProPaywallVisible: false,
  isBusinessPaywallVisible: false,
  isBusinessSwitcherVisible: false,

  initializeBilling: async (userId: string, organizationId: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Configure Provider & Log in with Netify User UUID
      await billingProvider.configure();
      const customerInfo = await billingProvider.login(userId);

      // 2. Fetch Offerings
      const offerings = await billingProvider.getOfferings();

      // 3. Fetch Server-Authoritative Subscription
      let subData: OrganizationSubscriptionData | null = null;
      try {
        subData = await subscriptionApi.getCurrentSubscription();
      } catch (err) {
        console.warn('Could not fetch backend subscription:', err);
      }

      // 4. Sync client entitlements if store reported active items
      if (customerInfo.activeEntitlements.length > 0) {
        try {
          subData = await subscriptionApi.syncEntitlements(
            customerInfo.activeEntitlements
          );
        } catch (syncErr) {
          console.warn('Failed to sync entitlements with backend:', syncErr);
        }
      }

      const plan = subData?.plan || BillingPlan.FREE;
      const status = subData?.status || BillingStatus.ACTIVE;
      const isPro = plan === BillingPlan.PRO || plan === BillingPlan.BUSINESS || plan === BillingPlan.ENTERPRISE;
      const isBusiness = plan === BillingPlan.BUSINESS || plan === BillingPlan.ENTERPRISE;
      const isEnterprise = plan === BillingPlan.ENTERPRISE;

      set({
        plan,
        status,
        isPro,
        isBusiness,
        isEnterprise,
        activeEntitlements: customerInfo.activeEntitlements,
        offerings,
        subscription: subData,
        isLoading: false,
      });
    } catch (err: any) {
      console.warn('Failed to initialize billing:', err);
      set({ isLoading: false, error: err.message || 'Billing initialization error' });
    }
  },

  refreshSubscription: async () => {
    try {
      const subData = await subscriptionApi.getCurrentSubscription();
      const plan = subData.plan || BillingPlan.FREE;
      const status = subData.status || BillingStatus.ACTIVE;
      const isPro = plan === BillingPlan.PRO || plan === BillingPlan.BUSINESS || plan === BillingPlan.ENTERPRISE;
      const isBusiness = plan === BillingPlan.BUSINESS || plan === BillingPlan.ENTERPRISE;
      const isEnterprise = plan === BillingPlan.ENTERPRISE;

      set({
        plan,
        status,
        isPro,
        isBusiness,
        isEnterprise,
        subscription: subData,
      });
    } catch (err) {
      console.warn('Failed to refresh subscription:', err);
    }
  },

  purchasePackage: async (pkg: BillingPackage) => {
    set({ isPurchasing: true, error: null });
    try {
      const customerInfo = await billingProvider.purchasePackage(pkg);

      // Sync entitlements with backend
      let subData: OrganizationSubscriptionData | null = null;
      if (customerInfo.activeEntitlements.length > 0) {
        subData = await subscriptionApi.syncEntitlements(
          customerInfo.activeEntitlements
        );
      } else {
        subData = await subscriptionApi.getCurrentSubscription();
      }

      const plan = subData.plan || BillingPlan.FREE;
      const status = subData.status || BillingStatus.ACTIVE;
      const isPro = plan === BillingPlan.PRO || plan === BillingPlan.BUSINESS || plan === BillingPlan.ENTERPRISE;
      const isBusiness = plan === BillingPlan.BUSINESS || plan === BillingPlan.ENTERPRISE;
      const isEnterprise = plan === BillingPlan.ENTERPRISE;

      set({
        plan,
        status,
        isPro,
        isBusiness,
        isEnterprise,
        activeEntitlements: customerInfo.activeEntitlements,
        subscription: subData,
        isPurchasing: false,
        isProPaywallVisible: false,
        isBusinessPaywallVisible: false,
      });

      return true;
    } catch (err: any) {
      set({ isPurchasing: false, error: err.message || 'Purchase failed' });
      return false;
    }
  },

  restorePurchases: async () => {
    set({ isLoading: true, error: null });
    try {
      const customerInfo = await billingProvider.restorePurchases();

      let subData: OrganizationSubscriptionData | null = null;
      if (customerInfo.activeEntitlements.length > 0) {
        subData = await subscriptionApi.syncEntitlements(
          customerInfo.activeEntitlements
        );
      } else {
        subData = await subscriptionApi.getCurrentSubscription();
      }

      const plan = subData.plan || BillingPlan.FREE;
      const status = subData.status || BillingStatus.ACTIVE;
      const isPro = plan === BillingPlan.PRO || plan === BillingPlan.BUSINESS || plan === BillingPlan.ENTERPRISE;
      const isBusiness = plan === BillingPlan.BUSINESS || plan === BillingPlan.ENTERPRISE;
      const isEnterprise = plan === BillingPlan.ENTERPRISE;

      set({
        plan,
        status,
        isPro,
        isBusiness,
        isEnterprise,
        activeEntitlements: customerInfo.activeEntitlements,
        subscription: subData,
        isLoading: false,
      });

      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Restore failed' });
      return false;
    }
  },

  canAccessFeature: (feature: string) => {
    const { subscription, isPro, isBusiness, isEnterprise } = get();

    if (subscription?.features?.includes(feature)) {
      return true;
    }

    if (feature.startsWith('AI_') || feature === 'BUSINESS_MEMORY_FULL') {
      return isPro || isBusiness || isEnterprise;
    }

    if (feature === 'MULTI_BUSINESS' || feature === 'CROSS_BUSINESS_OVERVIEW') {
      return isBusiness || isEnterprise;
    }

    return true;
  },

  openProPaywall: () => set({ isProPaywallVisible: true }),
  closeProPaywall: () => set({ isProPaywallVisible: false, error: null }),

  openBusinessPaywall: () => set({ isBusinessPaywallVisible: true }),
  closeBusinessPaywall: () => set({ isBusinessPaywallVisible: false, error: null }),

  openBusinessSwitcher: () => set({ isBusinessSwitcherVisible: true }),
  closeBusinessSwitcher: () => set({ isBusinessSwitcherVisible: false }),

  resetBilling: async () => {
    await billingProvider.logout();
    set({
      plan: BillingPlan.FREE,
      status: BillingStatus.ACTIVE,
      isPro: false,
      isBusiness: false,
      isEnterprise: false,
      activeEntitlements: [],
      offerings: [],
      subscription: null,
      isLoading: false,
      isPurchasing: false,
      error: null,
      isProPaywallVisible: false,
      isBusinessPaywallVisible: false,
      isBusinessSwitcherVisible: false,
    });
  },
}));

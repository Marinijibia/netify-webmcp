import { Platform } from 'react-native';
import { BillingProvider } from './billing-provider.interface';
import {
  BillingPackage,
  BillingCustomerInfo,
  BillingPlan,
} from './billing.types';

// RevenueCat SDK public API keys can be supplied via environment/constants
const REVENUECAT_APPLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || '';
const REVENUECAT_GOOGLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || '';

let Purchases: any = null;

try {
  // Dynamically load Purchases if native package is linked
  Purchases = require('react-native-purchases').default || require('react-native-purchases');
} catch (err) {
  // Graceful fallback for web/testing
  Purchases = null;
}

export class RevenueCatBillingProvider implements BillingProvider {
  private isConfigured = false;
  private currentUserId: string | null = null;

  async configure(apiKey?: string): Promise<void> {
    if (this.isConfigured) return;

    const key =
      apiKey ||
      (Platform.OS === 'ios' ? REVENUECAT_APPLE_KEY : REVENUECAT_GOOGLE_KEY);

    if (!key || !Purchases) {
      // SDK not configured or not supported on this platform
      this.isConfigured = true;
      return;
    }

    try {
      Purchases.configure({ apiKey: key });
      this.isConfigured = true;
    } catch (err) {
      console.warn('RevenueCat SDK configuration failed:', err);
    }
  }

  async login(userId: string): Promise<BillingCustomerInfo> {
    this.currentUserId = userId;

    if (!Purchases || !this.isConfigured) {
      return {
        activeEntitlements: [],
        allPurchasedProductIdentifiers: [],
        latestExpirationDate: null,
        originalPurchaseDate: null,
      };
    }

    try {
      const { customerInfo } = await Purchases.logIn(userId);
      return this.mapCustomerInfo(customerInfo);
    } catch (err) {
      console.warn('RevenueCat logIn error:', err);
      return this.getCustomerInfo();
    }
  }

  async logout(): Promise<void> {
    this.currentUserId = null;
    if (Purchases && this.isConfigured) {
      try {
        await Purchases.logOut();
      } catch (err) {
        console.warn('RevenueCat logOut error:', err);
      }
    }
  }

  async getCustomerInfo(): Promise<BillingCustomerInfo> {
    if (!Purchases || !this.isConfigured) {
      return {
        activeEntitlements: [],
        allPurchasedProductIdentifiers: [],
        latestExpirationDate: null,
        originalPurchaseDate: null,
      };
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.mapCustomerInfo(customerInfo);
    } catch (err) {
      console.warn('RevenueCat getCustomerInfo error:', err);
      return {
        activeEntitlements: [],
        allPurchasedProductIdentifiers: [],
        latestExpirationDate: null,
        originalPurchaseDate: null,
      };
    }
  }

  async getOfferings(): Promise<BillingPackage[]> {
    if (!Purchases || !this.isConfigured) {
      return [];
    }

    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings?.current;
      if (!currentOffering || !currentOffering.availablePackages) {
        return [];
      }

      return currentOffering.availablePackages.map((pkg: any) =>
        this.mapPackage(pkg)
      );
    } catch (err) {
      console.warn('RevenueCat getOfferings error:', err);
      return [];
    }
  }

  async purchasePackage(pkg: BillingPackage): Promise<BillingCustomerInfo> {
    if (!Purchases || !this.isConfigured) {
      throw new Error(
        'Store purchases are only available in standalone native builds with configured store credentials.'
      );
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return this.mapCustomerInfo(customerInfo);
    } catch (err: any) {
      if (err.userCancelled) {
        throw new Error('Purchase was cancelled.');
      }
      throw new Error(err.message || 'Store purchase failed.');
    }
  }

  async restorePurchases(): Promise<BillingCustomerInfo> {
    if (!Purchases || !this.isConfigured) {
      throw new Error(
        'Restore purchases is only available in standalone native builds.'
      );
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      return this.mapCustomerInfo(customerInfo);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to restore purchases.');
    }
  }

  async presentCustomerCenter(): Promise<void> {
    if (!Purchases) return;
    try {
      if (Purchases.presentCustomerCenter) {
        await Purchases.presentCustomerCenter();
      }
    } catch (err) {
      console.warn('RevenueCat presentCustomerCenter error:', err);
    }
  }

  private mapCustomerInfo(rcInfo: any): BillingCustomerInfo {
    if (!rcInfo) {
      return {
        activeEntitlements: [],
        allPurchasedProductIdentifiers: [],
        latestExpirationDate: null,
        originalPurchaseDate: null,
      };
    }

    const activeEntitlements = Object.keys(
      rcInfo.entitlements?.active || {}
    );

    return {
      activeEntitlements,
      allPurchasedProductIdentifiers:
        rcInfo.allPurchasedProductIdentifiers || [],
      latestExpirationDate: rcInfo.latestExpirationDate || null,
      originalPurchaseDate: rcInfo.originalPurchaseDate || null,
      managementUrl: rcInfo.managementURL || null,
    };
  }

  private mapPackage(rcPkg: any): BillingPackage {
    const prod = rcPkg.product || {};

    let plan = BillingPlan.PRO;
    if (rcPkg.identifier.includes('business') || prod.identifier?.includes('business')) {
      plan = BillingPlan.BUSINESS;
    }

    let packageType: 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | 'CUSTOM' = 'MONTHLY';
    if (rcPkg.packageType === 'ANNUAL' || rcPkg.identifier.includes('annual')) {
      packageType = 'ANNUAL';
    }

    return {
      identifier: rcPkg.identifier,
      packageType,
      plan,
      product: {
        identifier: prod.identifier || rcPkg.identifier,
        description: prod.description || '',
        title: prod.title || rcPkg.identifier,
        price: prod.price || 0,
        priceString: prod.priceString || '',
        currencyCode: prod.currencyCode || 'NGN',
        introPrice: prod.introPrice
          ? {
              price: prod.introPrice.price,
              priceString: prod.introPrice.priceString,
              period: prod.introPrice.period,
              cycles: prod.introPrice.cycles,
            }
          : null,
      },
    };
  }
}

export const billingProvider = new RevenueCatBillingProvider();

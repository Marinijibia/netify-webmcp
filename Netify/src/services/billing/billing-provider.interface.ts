import { BillingPackage, BillingCustomerInfo } from './billing.types';

export interface BillingProvider {
  configure(apiKey?: string): Promise<void>;
  login(userId: string): Promise<BillingCustomerInfo>;
  logout(): Promise<void>;
  getCustomerInfo(): Promise<BillingCustomerInfo>;
  getOfferings(): Promise<BillingPackage[]>;
  purchasePackage(pkg: BillingPackage): Promise<BillingCustomerInfo>;
  restorePurchases(): Promise<BillingCustomerInfo>;
  presentCustomerCenter(): Promise<void>;
}

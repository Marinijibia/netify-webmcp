import { apiClient } from './client';
import { OrganizationSubscriptionData } from '../billing/billing.types';
import { AuthResponse } from './auth';

export const subscriptionApi = {
  /**
   * Retrieves the current organization's subscription status, limits, and AI usage.
   */
  async getCurrentSubscription(): Promise<OrganizationSubscriptionData> {
    const res = await apiClient.get<OrganizationSubscriptionData>(
      '/subscriptions/current'
    );
    return res.data;
  },

  /**
   * Retrieves all available commercial plans and their feature limits.
   */
  async getPlans(): Promise<any> {
    const res = await apiClient.get<any>(
      '/subscriptions/plans'
    );
    return res.data;
  },

  /**
   * Syncs active mobile RevenueCat entitlements with the backend.
   */
  async syncEntitlements(
    entitlements: string[]
  ): Promise<OrganizationSubscriptionData> {
    const res = await apiClient.post<OrganizationSubscriptionData>(
      '/subscriptions/sync',
      { entitlements }
    );
    return res.data;
  },

  /**
   * Switches the active organization context for the authenticated user and retrieves new tokens.
   */
  async switchOrganization(organizationId: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>(
      '/auth/switch-organization',
      { organizationId }
    );
    return res.data;
  },
};

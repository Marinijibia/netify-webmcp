import { apiClient } from './client';
import { ApiResponse } from './types';

export type ActivityType =
  | 'CALL'
  | 'WHATSAPP'
  | 'SMS'
  | 'EMAIL'
  | 'IN_PERSON'
  | 'PAYMENT_REMINDER'
  | 'FOLLOW_UP'
  | 'OTHER';

export type CollectionChannel =
  | 'PHONE'
  | 'WHATSAPP'
  | 'SMS'
  | 'EMAIL'
  | 'IN_PERSON'
  | 'OTHER';

export type ActivityOutcome =
  | 'NO_RESPONSE'
  | 'CONTACTED'
  | 'PROMISED_PAYMENT'
  | 'PARTIAL_PAYMENT'
  | 'FULL_PAYMENT'
  | 'DISPUTE'
  | 'REQUESTED_EXTENSION'
  | 'WRONG_CONTACT'
  | 'CUSTOMER_UNAVAILABLE'
  | 'OTHER';

export interface CollectionActivityItem {
  id: string;
  organizationId: string;
  customerId: string;
  receivableId?: string | null;
  performedByUserId?: string;
  type: ActivityType;
  channel: CollectionChannel;
  outcome: ActivityOutcome;
  occurredAt: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  };
  receivable?: {
    id: string;
    reference?: string | null;
    description?: string | null;
    originalAmount: string | number;
    currency: string;
    status: string;
  };
}

export interface CreateCollectionActivityPayload {
  customerId: string;
  receivableId?: string;
  type: ActivityType;
  channel: CollectionChannel;
  outcome: ActivityOutcome;
  occurredAt?: string;
  notes?: string;
  commitment?: {
    amount: number | string;
    promisedFor: string;
    notes?: string;
  };
}

export const collectionActivitiesApi = {
  getActivities: async (params?: { customerId?: string; receivableId?: string }): Promise<CollectionActivityItem[]> => {
    const res = await apiClient.get<ApiResponse<any>>('/collection-activities', { params });
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : (payload?.items || []);
  },

  createActivity: async (data: CreateCollectionActivityPayload): Promise<CollectionActivityItem> => {
    const res = await apiClient.post<ApiResponse<CollectionActivityItem>>('/collection-activities', data);
    return res.data?.data || (res.data as unknown as CollectionActivityItem);
  },
};

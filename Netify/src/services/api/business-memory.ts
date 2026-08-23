import { apiClient } from './client';
import { ApiResponse } from './types';
import { BusinessEventItem } from './business-events';

export type MemoryCategory =
  | 'PAYMENT_BEHAVIOR'
  | 'COLLECTION_BEHAVIOR'
  | 'COMMITMENT_BEHAVIOR'
  | 'RECEIVABLE_HISTORY'
  | 'CUSTOMER_ACTIVITY'
  | 'CUSTOMER_PREFERENCE'
  | 'RELATIONSHIP_HISTORY';

export type MemoryType =
  | 'PAYMENT_FREQUENCY'
  | 'PAYMENT_TIMELINESS'
  | 'PAYMENT_COMMITMENT_HISTORY'
  | 'PAYMENT_COMMITMENT_FULFILLMENT_RATE'
  | 'PAYMENT_COMMITMENT_MISSED_RATE'
  | 'PARTIAL_PAYMENT_PATTERN'
  | 'COLLECTION_RESPONSE_PATTERN'
  | 'EXTENSION_PATTERN'
  | 'DISPUTE_PATTERN'
  | 'RECEIVABLE_OVERDUE_PATTERN'
  | 'CUSTOMER_ACTIVITY_PATTERN';

export type MemoryTimeWindow =
  | 'LAST_30_DAYS'
  | 'LAST_90_DAYS'
  | 'LAST_180_DAYS'
  | 'ALL_TIME';

export type MemoryStatus = 'ACTIVE' | 'SUPERSEDED' | 'INVALIDATED';

export interface BusinessMemoryItem {
  id: string;
  organizationId: string;
  customerId?: string | null;
  receivableId?: string | null;
  category: MemoryCategory;
  type: MemoryType;
  timeWindow: MemoryTimeWindow;
  statement: string;
  value: Record<string, any>;
  currency?: string | null;
  confidence: number;
  status: MemoryStatus;
  version: number;
  firstObservedAt: string;
  lastObservedAt: string;
  createdAt: string;
  updatedAt: string;
  evidenceCount: number;
}

export interface BusinessMemoryEvidenceItem {
  id: string;
  memoryId: string;
  businessEventId: string;
  metadata?: Record<string, any> | null;
  createdAt: string;
  businessEvent?: BusinessEventItem;
}

export interface CustomerMemoryQueryParams {
  page?: number;
  pageSize?: number;
  category?: MemoryCategory;
  type?: MemoryType;
  status?: MemoryStatus;
  timeWindow?: MemoryTimeWindow;
}

export interface MemoryEvidenceQueryParams {
  page?: number;
  pageSize?: number;
}

export const businessMemoryApi = {
  /**
   * Fetch active business memories for a customer
   */
  async getCustomerMemories(
    customerId: string,
    params?: CustomerMemoryQueryParams
  ): Promise<ApiResponse<BusinessMemoryItem[]>> {
    const queryParams: Record<string, string | number> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.pageSize) queryParams.pageSize = params.pageSize;
    if (params?.category) queryParams.category = params.category;
    if (params?.type) queryParams.type = params.type;
    if (params?.status) queryParams.status = params.status;
    if (params?.timeWindow) queryParams.timeWindow = params.timeWindow;

    return apiClient.get<BusinessMemoryItem[]>(`/customers/${customerId}/memories`, {
      params: queryParams,
    });
  },

  /**
   * Fetch a single business memory by ID
   */
  async getMemoryById(
    customerId: string,
    memoryId: string
  ): Promise<ApiResponse<BusinessMemoryItem>> {
    return apiClient.get<BusinessMemoryItem>(`/customers/${customerId}/memories/${memoryId}`);
  },

  /**
   * Fetch supporting business event evidence for a specific memory
   */
  async getMemoryEvidence(
    customerId: string,
    memoryId: string,
    params?: MemoryEvidenceQueryParams
  ): Promise<ApiResponse<BusinessMemoryEvidenceItem[]>> {
    const queryParams: Record<string, string | number> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.pageSize) queryParams.pageSize = params.pageSize;

    return apiClient.get<BusinessMemoryEvidenceItem[]>(
      `/customers/${customerId}/memories/${memoryId}/evidence`,
      { params: queryParams }
    );
  },
};

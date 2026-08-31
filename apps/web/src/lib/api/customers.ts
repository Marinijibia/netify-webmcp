import { apiClient } from './client';
import { ApiResponse } from './types';

export interface CustomerContactItem {
  id: string;
  customerId: string;
  type: 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'OTHER';
  value: string;
  label?: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerItem {
  id: string;
  organizationId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  country: string;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'BLOCKED';
  notes?: string | null;
  tags: string[];
  metadata?: Record<string, any>;
  contacts?: CustomerContactItem[];
  totalOutstanding?: number;
  totalOverdue?: number;
  oldestOverdueDays?: number;
  openReceivablesCount?: number;
  missedPromisesCount?: number;
  riskScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NORMAL';
  assignedStaffId?: string | null;
  assignedStaff?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerQueryParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateCustomerPayload {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'BLOCKED';
  notes?: string;
}

export const customersApi = {
  async list(params?: CustomerQueryParams): Promise<CustomerItem[]> {
    const res = await apiClient.get<ApiResponse<any>>('/customers', { params: params as any });
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : (payload?.items || []);
  },

  async getById(id: string): Promise<CustomerItem> {
    const res = await apiClient.get<ApiResponse<CustomerItem>>(`/customers/${id}`);
    return res.data?.data || (res.data as unknown as CustomerItem);
  },

  async create(payload: CreateCustomerPayload): Promise<CustomerItem> {
    const res = await apiClient.post<ApiResponse<CustomerItem>>('/customers', payload);
    return res.data?.data || (res.data as unknown as CustomerItem);
  },

  async update(id: string, payload: UpdateCustomerPayload): Promise<CustomerItem> {
    const res = await apiClient.patch<ApiResponse<CustomerItem>>(`/customers/${id}`, payload);
    return res.data?.data || (res.data as unknown as CustomerItem);
  },

  async assignStaff(id: string, staffUserId: string | null): Promise<CustomerItem> {
    const res = await apiClient.patch<ApiResponse<CustomerItem>>(`/customers/${id}/assign`, { staffUserId });
    return res.data?.data || (res.data as unknown as CustomerItem);
  },

  async archive(id: string): Promise<CustomerItem> {
    const res = await apiClient.patch<ApiResponse<CustomerItem>>(`/customers/${id}/archive`, {});
    return res.data?.data || (res.data as unknown as CustomerItem);
  },

  async getContacts(customerId: string): Promise<CustomerContactItem[]> {
    const res = await apiClient.get<ApiResponse<CustomerContactItem[]>>(`/customers/${customerId}/contacts`);
    return res.data?.data || (res.data as unknown as CustomerContactItem[]);
  },
};

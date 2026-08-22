import { apiClient } from './client';
import { ApiResponse } from './types';

export interface CreateOrganizationPayload {
  name: string;
  businessType: string;
  currency: string;
  country: string;
  timezone: string;
  phone?: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  businessType?: string;
  timezone?: string;
  logoUrl?: string | null;
  settings?: Record<string, any>;
}

export interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  currency: string;
  country: string;
  timezone: string;
  status: string;
  role: string;
  membershipStatus?: string;
  logoUrl?: string | null;
  settings?: Record<string, any>;
  joinedAt?: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  role: string;
  status: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export const organizationsApi = {
  async create(payload: CreateOrganizationPayload): Promise<ApiResponse<OrganizationItem>> {
    return apiClient.post<OrganizationItem>('/organizations', payload);
  },

  async getMyOrganizations(): Promise<ApiResponse<OrganizationItem[]>> {
    return apiClient.get<OrganizationItem[]>('/organizations');
  },

  async getCurrent(): Promise<ApiResponse<OrganizationItem>> {
    return apiClient.get<OrganizationItem>('/organizations/current');
  },

  async getById(id: string): Promise<ApiResponse<OrganizationItem>> {
    return apiClient.get<OrganizationItem>(`/organizations/${id}`);
  },

  async update(id: string, payload: UpdateOrganizationPayload): Promise<ApiResponse<OrganizationItem>> {
    return apiClient.patch<OrganizationItem>(`/organizations/${id}`, payload);
  },

  async getMembers(id: string): Promise<ApiResponse<OrganizationMember[]>> {
    return apiClient.get<OrganizationMember[]>(`/organizations/${id}/members`);
  },
};

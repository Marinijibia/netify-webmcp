import { apiClient } from './client';
import { ApiResponse } from './types';
import { UserProfile } from './auth';

export interface UpdateOnboardingPayload {
  step?: string;
  onboardingData?: Record<string, any>;
  onboardingCompleted?: boolean;
}

export const onboardingApi = {
  async getStatus(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>('/onboarding');
  },

  async updateStatus(payload: UpdateOnboardingPayload): Promise<ApiResponse<UserProfile>> {
    return apiClient.post<UserProfile>('/onboarding', payload);
  },
};

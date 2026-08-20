import { create } from 'zustand';
import { SecureStorageService } from '@/services/storage/secure-storage';

export interface UserSession {
  userId: string;
  email: string;
  organizationId?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserSession | null;
  setSession: (user: UserSession, accessToken: string, refreshToken?: string) => Promise<void>;
  clearSession: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,

  setSession: async (user, accessToken, refreshToken) => {
    await SecureStorageService.setAccessToken(accessToken);
    if (refreshToken) {
      await SecureStorageService.setRefreshToken(refreshToken);
    }
    set({ isAuthenticated: true, user, isLoading: false });
  },

  clearSession: async () => {
    await SecureStorageService.clearAuthTokens();
    set({ isAuthenticated: false, user: null, isLoading: false });
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStorageService.getAccessToken();
      if (token) {
        // Token exists, in the next phase this will validate with /auth/me
        set({ isAuthenticated: true, isLoading: false });
      } else {
        set({ isAuthenticated: false, user: null, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },
}));

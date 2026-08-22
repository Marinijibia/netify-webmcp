import { create } from 'zustand';
import { Platform } from 'react-native';
import { SecureStorageService } from '@/services/storage/secure-storage';
import { BiometricService, DeviceBiometricCapabilities } from '@/services/biometrics/biometric.service';
import { authApi, AuthResponse, UserProfile } from '@/services/api/auth';

export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  currency: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isBiometricsEnabled: boolean;
  isFaceIdEnabled: boolean;
  isFingerprintEnabled: boolean;
  biometricCapabilities: DeviceBiometricCapabilities | null;
  biometricTypeName: string;
  user: UserProfile | null;
  organization: OrganizationInfo | null;
  role: string | null;
  setAuthSession: (authData: AuthResponse) => Promise<void>;
  updateUserProfile: (user: Partial<UserProfile>) => void;
  setOrganization: (org: OrganizationInfo, role?: string) => void;
  setBiometricsEnabled: (enabled: boolean) => Promise<void>;
  setFaceIdEnabled: (enabled: boolean) => Promise<void>;
  setFingerprintEnabled: (enabled: boolean) => Promise<void>;
  loginWithFaceScan: () => Promise<boolean>;
  loginWithFingerprint: () => Promise<boolean>;
  loginWithBiometrics: (mode?: 'FACE_ID' | 'FINGERPRINT') => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  isBiometricsEnabled: false,
  isFaceIdEnabled: false,
  isFingerprintEnabled: false,
  biometricCapabilities: null,
  biometricTypeName: 'Biometric Unlock',
  user: null,
  organization: null,
  role: null,

  setAuthSession: async (authData: AuthResponse) => {
    if (authData.tokens) {
      await SecureStorageService.setAccessToken(authData.tokens.accessToken);
      await SecureStorageService.setRefreshToken(authData.tokens.refreshToken);
      await SecureStorageService.setBiometricRefreshToken(authData.tokens.refreshToken);
    }

    if (authData.user?.email) {
      await BiometricService.setRememberedEmail(authData.user.email);
    }

    set({
      isAuthenticated: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName: authData.user.firstName,
        lastName: authData.user.lastName,
        isEmailVerified: authData.user.isEmailVerified,
        onboardingCompleted: authData.user.onboardingCompleted,
        onboardingStep: authData.user.onboardingStep || 'ORGANIZATION',
      },
      organization: authData.organization || null,
      role: authData.role || null,
      isLoading: false,
    });
  },

  updateUserProfile: (updates: Partial<UserProfile>) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          ...updates,
        },
      });
    }
  },

  setOrganization: (org: OrganizationInfo, role?: string) => {
    set({
      organization: org,
      role: role || get().role || 'OWNER',
    });
  },

  setBiometricsEnabled: async (enabled: boolean) => {
    await BiometricService.setBiometricEnabled(enabled);
    if (!enabled) {
      await SecureStorageService.clearBiometricRefreshToken();
    }
    const caps = await BiometricService.getCapabilities();
    set({
      isBiometricsEnabled: caps.isAnyEnabled,
      isFaceIdEnabled: caps.isFaceIdEnabled,
      isFingerprintEnabled: caps.isFingerprintEnabled,
      biometricCapabilities: caps,
    });
  },

  setFaceIdEnabled: async (enabled: boolean) => {
    await BiometricService.setFaceIdEnabled(enabled);
    if (!enabled && !get().isFingerprintEnabled) {
      await SecureStorageService.clearBiometricRefreshToken();
    }
    const caps = await BiometricService.getCapabilities();
    set({
      isBiometricsEnabled: caps.isAnyEnabled,
      isFaceIdEnabled: caps.isFaceIdEnabled,
      isFingerprintEnabled: caps.isFingerprintEnabled,
      biometricCapabilities: caps,
    });
  },

  setFingerprintEnabled: async (enabled: boolean) => {
    await BiometricService.setFingerprintEnabled(enabled);
    if (!enabled && !get().isFaceIdEnabled) {
      await SecureStorageService.clearBiometricRefreshToken();
    }
    const caps = await BiometricService.getCapabilities();
    set({
      isBiometricsEnabled: caps.isAnyEnabled,
      isFaceIdEnabled: caps.isFaceIdEnabled,
      isFingerprintEnabled: caps.isFingerprintEnabled,
      biometricCapabilities: caps,
    });
  },

  /**
   * Completes sign in after biometric scan (Face ID or Fingerprint)
   */
  loginWithFaceScan: async (): Promise<boolean> => {
    try {
      const accessToken = await SecureStorageService.getAccessToken();
      const refreshToken = await SecureStorageService.getRefreshToken();
      const biometricRefreshToken = await SecureStorageService.getBiometricRefreshToken();

      const activeRefreshToken = refreshToken || biometricRefreshToken;

      if (!activeRefreshToken && !accessToken) {
        return false;
      }

      // 1. Try getMe with existing access token
      if (accessToken) {
        try {
          const profileResponse = await authApi.getMe();
          if (profileResponse.success && profileResponse.data) {
            const profile = profileResponse.data;
            const defaultOrg = profile.memberships?.[0]?.organization || null;
            const defaultRole = profile.memberships?.[0]?.role || null;

            set({
              isAuthenticated: true,
              user: profile,
              organization: defaultOrg
                ? {
                    id: defaultOrg.id,
                    name: defaultOrg.name,
                    slug: defaultOrg.slug,
                    currency: defaultOrg.currency,
                  }
                : null,
              role: defaultRole || null,
              isLoading: false,
            });
            return true;
          }
        } catch {
          // Access token expired, proceed to refresh
        }
      }

      // 2. Refresh tokens using refresh token or stored biometric token
      if (activeRefreshToken) {
        try {
          const refreshRes = await authApi.refresh(activeRefreshToken);
          if (refreshRes.success && refreshRes.data) {
            await SecureStorageService.setAccessToken(refreshRes.data.accessToken);
            await SecureStorageService.setRefreshToken(refreshRes.data.refreshToken);
            await SecureStorageService.setBiometricRefreshToken(refreshRes.data.refreshToken);

            const profileResponse = await authApi.getMe();
            if (profileResponse.success && profileResponse.data) {
              const profile = profileResponse.data;
              const defaultOrg = profile.memberships?.[0]?.organization || null;
              const defaultRole = profile.memberships?.[0]?.role || null;

              set({
                isAuthenticated: true,
                user: profile,
                organization: defaultOrg
                  ? {
                      id: defaultOrg.id,
                      name: defaultOrg.name,
                      slug: defaultOrg.slug,
                      currency: defaultOrg.currency,
                    }
                  : null,
                role: defaultRole || null,
                isLoading: false,
              });
              return true;
            }
          }
        } catch {
          // Refresh token revoked or expired
        }
      }

      return false;
    } catch {
      return false;
    }
  },

  /**
   * Prompts physical fingerprint hardware sensor to sign in
   */
  loginWithFingerprint: async (): Promise<boolean> => {
    try {
      const bioAuth = await BiometricService.authenticateWithFingerprint();
      if (!bioAuth.success) {
        return false;
      }
      return await get().loginWithFaceScan();
    } catch {
      return false;
    }
  },

  loginWithBiometrics: async (mode?: 'FACE_ID' | 'FINGERPRINT'): Promise<boolean> => {
    if (mode === 'FACE_ID') {
      return await get().loginWithFaceScan();
    }
    return await get().loginWithFingerprint();
  },

  logout: async () => {
    try {
      const refreshToken = await SecureStorageService.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      await SecureStorageService.clearAuthTokens();
      set({
        isAuthenticated: false,
        user: null,
        organization: null,
        role: null,
        isLoading: false,
      });
    }
  },

  logoutAll: async () => {
    try {
      await authApi.logoutAll();
    } catch {
      // Ignore network errors during logout
    } finally {
      await SecureStorageService.clearAuthTokens();
      await SecureStorageService.clearBiometricRefreshToken();
      set({
        isAuthenticated: false,
        user: null,
        organization: null,
        role: null,
        isLoading: false,
      });
    }
  },

  refreshUserProfile: async () => {
    try {
      const profileResponse = await authApi.getMe();
      if (profileResponse.success && profileResponse.data) {
        const profile = profileResponse.data;
        const defaultOrg = profile.memberships?.[0]?.organization || null;
        const defaultRole = profile.memberships?.[0]?.role || null;

        set({
          user: profile,
          organization: defaultOrg
            ? {
                id: defaultOrg.id,
                name: defaultOrg.name,
                slug: defaultOrg.slug,
                currency: defaultOrg.currency,
              }
            : get().organization,
          role: defaultRole || get().role,
        });
      }
    } catch {
      // Profile fetch error
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      // Check full biometrics capabilities
      const caps = await BiometricService.getCapabilities();
      const bioName = await BiometricService.getBiometricTypeName();

      set({
        isBiometricsEnabled: caps.isAnyEnabled,
        isFaceIdEnabled: caps.isFaceIdEnabled,
        isFingerprintEnabled: caps.isFingerprintEnabled,
        biometricCapabilities: caps,
        biometricTypeName: bioName,
      });

      const accessToken = await SecureStorageService.getAccessToken();
      const refreshToken = await SecureStorageService.getRefreshToken();
      const biometricRefreshToken = await SecureStorageService.getBiometricRefreshToken();

      const activeRefreshToken = refreshToken || biometricRefreshToken;

      if (!accessToken && !activeRefreshToken) {
        set({ isAuthenticated: false, user: null, organization: null, isLoading: false });
        return;
      }

      // Try fetching current user profile
      try {
        const profileResponse = await authApi.getMe();
        if (profileResponse.success && profileResponse.data) {
          const profile = profileResponse.data;
          const defaultOrg = profile.memberships?.[0]?.organization || null;
          const defaultRole = profile.memberships?.[0]?.role || null;

          set({
            isAuthenticated: true,
            user: profile,
            organization: defaultOrg
              ? {
                  id: defaultOrg.id,
                  name: defaultOrg.name,
                  slug: defaultOrg.slug,
                  currency: defaultOrg.currency,
                }
              : null,
            role: defaultRole || null,
            isLoading: false,
          });
          return;
        }
      } catch (err: any) {
        // If access token expired, try refreshing with refresh token
        if (activeRefreshToken) {
          try {
            const refreshRes = await authApi.refresh(activeRefreshToken);
            if (refreshRes.success && refreshRes.data) {
              await SecureStorageService.setAccessToken(refreshRes.data.accessToken);
              await SecureStorageService.setRefreshToken(refreshRes.data.refreshToken);
              await SecureStorageService.setBiometricRefreshToken(refreshRes.data.refreshToken);

              const profileResponse = await authApi.getMe();
              if (profileResponse.success && profileResponse.data) {
                const profile = profileResponse.data;
                const defaultOrg = profile.memberships?.[0]?.organization || null;
                const defaultRole = profile.memberships?.[0]?.role || null;

                set({
                  isAuthenticated: true,
                  user: profile,
                  organization: defaultOrg
                    ? {
                        id: defaultOrg.id,
                        name: defaultOrg.name,
                        slug: defaultOrg.slug,
                        currency: defaultOrg.currency,
                      }
                    : null,
                  role: defaultRole || null,
                  isLoading: false,
                });
                return;
              }
            }
          } catch {
            // Refresh token invalid or expired
          }
        }
      }

      // If all attempts failed, clear session
      await SecureStorageService.clearAuthTokens();
      set({ isAuthenticated: false, user: null, organization: null, isLoading: false });
    } catch {
      await SecureStorageService.clearAuthTokens();
      set({ isAuthenticated: false, user: null, organization: null, isLoading: false });
    }
  },
}));

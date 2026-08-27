'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  authApi, 
  UserProfile, 
  LoginPayload, 
  RegisterPayload, 
  WebStorageService 
} from '@/lib/api';

export interface ActiveOrganization {
  id: string;
  name: string;
  slug: string;
  currency: string;
  country?: string;
  role?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  organization: ActiveOrganization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<ActiveOrganization | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    try {
      const token = WebStorageService.getAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setOrganization(null);
        setIsLoading(false);
        return;
      }

      const res = await authApi.getMe();
      const profile = ((res.data as any)?.data || res.data) as UserProfile;
      if (profile && profile.id) {
        setUser(profile);
        WebStorageService.setUserProfile(profile);
        setIsAuthenticated(true);

        // Derive active organization
        if (profile.memberships && profile.memberships.length > 0) {
          const m = profile.memberships[0];
          const activeOrg: ActiveOrganization = {
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            currency: m.organization.currency || 'NGN',
            country: m.organization.country || 'NG',
            role: m.role,
          };
          setOrganization(activeOrg);
          WebStorageService.setActiveOrg(activeOrg);
        } else {
          // Fallback to stored org if available
          const storedOrg = WebStorageService.getActiveOrg<ActiveOrganization>();
          if (storedOrg) setOrganization(storedOrg);
        }
      }
    } catch (error) {
      console.warn('Failed to refresh profile:', error);
      // If token expired, clear state
      const token = WebStorageService.getAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setOrganization(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial check from localStorage cache
    const cachedUser = WebStorageService.getUserProfile<UserProfile>();
    const cachedOrg = WebStorageService.getActiveOrg<ActiveOrganization>();
    const token = WebStorageService.getAccessToken();

    if (token && cachedUser) {
      setUser(cachedUser);
      setOrganization(cachedOrg);
      setIsAuthenticated(true);
    }

    refreshProfile();
  }, [refreshProfile]);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(payload);
      const data = ((res.data as any)?.data || res.data);
      if (data?.tokens) {
        WebStorageService.setAccessToken(data.tokens.accessToken);
        WebStorageService.setRefreshToken(data.tokens.refreshToken);
      }
      if (data?.organization) {
        const org: ActiveOrganization = {
          id: data.organization.id,
          name: data.organization.name,
          slug: data.organization.slug,
          currency: data.organization.currency || 'NGN',
          role: data.role || 'OWNER',
        };
        setOrganization(org);
        WebStorageService.setActiveOrg(org);
      }
      await refreshProfile();
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      await authApi.register(payload);
      // Auto-login on successful registration
      await login({ email: payload.email, password: payload.password });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setOrganization(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

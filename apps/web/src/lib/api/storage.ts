const ACCESS_TOKEN_KEY = 'netify_access_token';
const REFRESH_TOKEN_KEY = 'netify_refresh_token';
const USER_KEY = 'netify_user_profile';
const ORG_KEY = 'netify_active_org';

export const WebStorageService = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to store access token', e);
    }
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to store refresh token', e);
    }
  },

  getUserProfile<T>(): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUserProfile<T>(user: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to store user profile', e);
    }
  },

  getActiveOrg<T>(): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(ORG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setActiveOrg<T>(org: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ORG_KEY, JSON.stringify(org));
    } catch (e) {
      console.error('Failed to store active org', e);
    }
  },

  clearAll(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ORG_KEY);
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
  },
};

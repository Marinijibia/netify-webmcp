import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'netify_access_token',
  REFRESH_TOKEN: 'netify_refresh_token',
  BIOMETRIC_REFRESH_TOKEN: 'netify_biometric_refresh_token',
  ACTIVE_ORG_ID: 'netify_active_org_id',
} as const;

export class SecureStorageService {
  private static memoryFallback = new Map<string, string>();

  static async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        this.memoryFallback.set(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn(`SecureStore.setItem failed for key "${key}", using memory fallback`, error);
      this.memoryFallback.set(key, value);
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return this.memoryFallback.get(key) ?? null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`SecureStore.getItem failed for key "${key}", reading from fallback`, error);
      return this.memoryFallback.get(key) ?? null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        this.memoryFallback.delete(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn(`SecureStore.removeItem failed for key "${key}"`, error);
      this.memoryFallback.delete(key);
    }
  }

  // Token Helpers
  static async getAccessToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  static async setAccessToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  static async getRefreshToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  static async setRefreshToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  // Biometric Token Helpers
  static async getBiometricRefreshToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.BIOMETRIC_REFRESH_TOKEN);
  }

  static async setBiometricRefreshToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.BIOMETRIC_REFRESH_TOKEN, token);
  }

  static async clearBiometricRefreshToken(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.BIOMETRIC_REFRESH_TOKEN);
  }

  static async clearAuthTokens(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  }
}

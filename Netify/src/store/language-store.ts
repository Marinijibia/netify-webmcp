import { create } from 'zustand';
import { SecureStorageService } from '../services/storage/secure-storage';
import { SupportedLanguage, LANGUAGE_REGISTRY, translate } from '../i18n';
import { apiClient } from '../services/api/client';

const LANGUAGE_STORAGE_KEY = 'netify_app_language';

interface LanguageState {
  currentLanguage: SupportedLanguage;
  isLanguageModalOpen: boolean;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
  initializeLanguage: () => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentLanguage: 'en',
  isLanguageModalOpen: false,

  setLanguage: async (lang: SupportedLanguage) => {
    set({ currentLanguage: lang, isLanguageModalOpen: false });
    try {
      await SecureStorageService.setItem(LANGUAGE_STORAGE_KEY, lang);
      // Sync to backend if authenticated
      await apiClient.patch('/ai/language', { language: lang }).catch(() => {
        // Non-blocking sync
      });
    } catch (err) {
      console.warn('Failed to persist language preference:', err);
    }
  },

  openLanguageModal: () => set({ isLanguageModalOpen: true }),
  closeLanguageModal: () => set({ isLanguageModalOpen: false }),

  initializeLanguage: async () => {
    try {
      const stored = await SecureStorageService.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && stored in LANGUAGE_REGISTRY) {
        set({ currentLanguage: stored as SupportedLanguage });
      }
    } catch (err) {
      console.warn('Failed to load language preference:', err);
    }
  },

  t: (key: string, params?: Record<string, string | number>) => {
    return translate(get().currentLanguage, key, params);
  },
}));

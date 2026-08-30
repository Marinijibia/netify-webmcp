'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from './translations/en';
import { ha } from './translations/ha';
import { yo } from './translations/yo';
import { ig } from './translations/ig';
import { pcm } from './translations/pcm';
import { ff } from './translations/ff';
import { SupportedLanguage, LANGUAGE_REGISTRY, SUPPORTED_LANGUAGES, LanguageInfo } from './language-registry';
import { apiClient } from '../api';

export * from './language-registry';

const translations: Record<SupportedLanguage, typeof en> = {
  en,
  ha,
  yo,
  ig,
  pcm,
  ff,
};

const LANGUAGE_STORAGE_KEY = 'netify_web_language';

export function translate(
  lang: SupportedLanguage,
  key: string,
  params?: Record<string, string | number>
): string {
  const currentDict = translations[lang] || translations.en;
  const parts = key.split('.');

  let value: any = currentDict;
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      value = undefined;
      break;
    }
  }

  if (typeof value !== 'string') {
    let fallback: any = translations.en;
    for (const part of parts) {
      if (fallback && typeof fallback === 'object' && part in fallback) {
        fallback = fallback[part];
      } else {
        return key;
      }
    }
    value = typeof fallback === 'string' ? fallback : key;
  }

  if (params) {
    let interpolated = value;
    for (const [paramKey, paramVal] of Object.entries(params)) {
      interpolated = interpolated
        .replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramVal))
        .replace(new RegExp(`{${paramKey}}`, 'g'), String(paramVal));
    }
    return interpolated;
  }

  return value;
}

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  currentLanguageInfo: LanguageInfo;
  isLanguageModalOpen: boolean;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>('en');
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
      if (stored && stored in LANGUAGE_REGISTRY) {
        setCurrentLanguageState(stored);
      }
    } catch (e) {
      console.warn('Could not read stored language:', e);
    }
  }, []);

  const setLanguage = async (lang: SupportedLanguage) => {
    if (!(lang in LANGUAGE_REGISTRY)) return;
    setCurrentLanguageState(lang);
    setIsLanguageModalOpen(false);

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      // Optional background sync with API if logged in
      await apiClient.patch('/ai/language', { language: lang }).catch(() => {});
    } catch (e) {
      console.warn('Could not save language preference:', e);
    }
  };

  const openLanguageModal = () => setIsLanguageModalOpen(true);
  const closeLanguageModal = () => setIsLanguageModalOpen(false);

  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(currentLanguage, key, params);
  };

  const currentLanguageInfo = LANGUAGE_REGISTRY[currentLanguage] || LANGUAGE_REGISTRY.en;

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        currentLanguageInfo,
        isLanguageModalOpen,
        setLanguage,
        openLanguageModal,
        closeLanguageModal,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

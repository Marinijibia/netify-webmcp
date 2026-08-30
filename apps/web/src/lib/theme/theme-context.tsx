'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { LIGHT_THEME_TOKENS, DARK_THEME_TOKENS, ThemeTokens } from './tokens';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  tokens: ThemeTokens;
  isLight: boolean;
  isDark: boolean;
}

const STORAGE_KEY = 'netify_web_theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
      const initialTheme: Theme = savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system'
        ? savedTheme
        : 'dark';

      setThemeState(initialTheme);

      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolved: ResolvedTheme = initialTheme === 'system' 
        ? (systemDark ? 'dark' : 'light') 
        : initialTheme;

      setResolvedTheme(resolved);
      applyThemeToDOM(resolved);
    } catch {
      // Fallback in restricted storage contexts
      setResolvedTheme('dark');
      applyThemeToDOM('dark');
    }
    setMounted(true);
  }, []);

  // Listen for OS system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolved);
      applyThemeToDOM(newResolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const applyThemeToDOM = (resolved: ResolvedTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (err) {
      console.warn('Failed to save theme in localStorage:', err);
    }

    let resolved: ResolvedTheme = 'dark';
    if (newTheme === 'system') {
      const systemDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = systemDark ? 'dark' : 'light';
    } else {
      resolved = newTheme;
    }

    setResolvedTheme(resolved);
    applyThemeToDOM(resolved);
  };

  const toggleTheme = () => {
    const next: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const tokens = useMemo<ThemeTokens>(() => {
    return resolvedTheme === 'light' ? LIGHT_THEME_TOKENS : DARK_THEME_TOKENS;
  }, [resolvedTheme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    tokens,
    isLight: resolvedTheme === 'light',
    isDark: resolvedTheme === 'dark',
  }), [theme, resolvedTheme, tokens]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if called outside provider
    return {
      theme: 'dark',
      resolvedTheme: 'dark',
      setTheme: () => {},
      toggleTheme: () => {},
      tokens: DARK_THEME_TOKENS,
      isLight: false,
      isDark: true,
    };
  }
  return context;
}

import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ThemeMode, ResolvedTheme, SemanticTokens } from './theme.types';
import { LIGHT_THEME_TOKENS, DARK_THEME_TOKENS } from './semantic-tokens';

const THEME_STORAGE_KEY = 'netify_theme_preference';

interface ThemeState {
  mode: ThemeMode;
  activeTheme: ResolvedTheme;
  isDark: boolean;
  tokens: SemanticTokens;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  initializeTheme: () => Promise<void>;
}

function resolveActiveTheme(mode: ThemeMode, systemScheme?: ColorSchemeName): ResolvedTheme {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  const scheme = systemScheme ?? Appearance.getColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}

function getTokensForResolvedTheme(theme: ResolvedTheme): SemanticTokens {
  return theme === 'dark' ? DARK_THEME_TOKENS : LIGHT_THEME_TOKENS;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialSystemScheme = Appearance.getColorScheme();
  const initialActive = resolveActiveTheme('system', initialSystemScheme);

  // Set up OS Appearance listener
  Appearance.addChangeListener(({ colorScheme }) => {
    const currentMode = get().mode;
    if (currentMode === 'system') {
      const newActive = resolveActiveTheme('system', colorScheme);
      set({
        activeTheme: newActive,
        isDark: newActive === 'dark',
        tokens: getTokensForResolvedTheme(newActive),
      });
    }
  });

  return {
    mode: 'system',
    activeTheme: initialActive,
    isDark: initialActive === 'dark',
    tokens: getTokensForResolvedTheme(initialActive),

    setThemeMode: async (newMode: ThemeMode) => {
      const active = resolveActiveTheme(newMode);
      try {
        await SecureStore.setItemAsync(THEME_STORAGE_KEY, newMode);
      } catch {
        // Storage fallback
      }

      set({
        mode: newMode,
        activeTheme: active,
        isDark: active === 'dark',
        tokens: getTokensForResolvedTheme(active),
      });
    },

    toggleTheme: async () => {
      const current = get().activeTheme;
      const nextMode: ThemeMode = current === 'dark' ? 'light' : 'dark';
      await get().setThemeMode(nextMode);
    },

    initializeTheme: async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          const active = resolveActiveTheme(stored);
          set({
            mode: stored,
            activeTheme: active,
            isDark: active === 'dark',
            tokens: getTokensForResolvedTheme(active),
          });
        }
      } catch {
        // Ignore read errors
      }
    },
  };
});

export function useTheme() {
  const mode = useThemeStore((s) => s.mode);
  const activeTheme = useThemeStore((s) => s.activeTheme);
  const isDark = useThemeStore((s) => s.isDark);
  const tokens = useThemeStore((s) => s.tokens);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const initializeTheme = useThemeStore((s) => s.initializeTheme);

  return {
    mode,
    activeTheme,
    isDark,
    tokens,
    setThemeMode,
    toggleTheme,
    initializeTheme,
  };
}

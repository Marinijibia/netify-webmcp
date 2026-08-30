export interface ThemeTokens {
  // Backgrounds
  background: string;
  backgroundSecondary: string;

  // Surfaces & Cards
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  surfaceSubtle: string;
  surfaceBorder: string;
  surfaceBorderStrong: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textInverse: string;

  // Navigation
  navBackground: string;
  navBorder: string;
  navActive: string;
  navInactive: string;

  // Primary Brand & Accents
  primary: string;
  primarySoft: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentBorder: string;

  // Financial & Alert States
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;

  // Shadows
  shadowCard: string;
  shadowPopover: string;
}

export const LIGHT_THEME_TOKENS: ThemeTokens = {
  // Backgrounds (Clean, crisp slate white)
  background: '#F8FAFC',
  backgroundSecondary: '#F1F5F9',

  // Surfaces & Cards (Pure white cards with soft slate accents)
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  surfaceSubtle: '#F8FAFC',
  surfaceBorder: '#E2E8F0',
  surfaceBorderStrong: '#CBD5E1',

  // Typography (Netify Deep Navy for maximum contrast & authority)
  textPrimary: '#003051',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textDisabled: '#94A3B8',
  textInverse: '#FFFFFF',

  // Navigation (Clean white bar with subtle border)
  navBackground: 'rgba(255, 255, 255, 0.95)',
  navBorder: '#E2E8F0',
  navActive: '#00A581',
  navInactive: '#64748B',

  // Primary Brand & Accents (Netify Navy & Emerald Teal)
  primary: '#003051',
  primarySoft: '#F0F6F9',
  accent: '#00A581',
  accentHover: '#008B6E',
  accentSoft: '#ECFDF8',
  accentBorder: 'rgba(0, 165, 129, 0.3)',

  // Financial & Alert States
  success: '#16A34A',
  successSoft: '#F0FDF4',
  warning: '#D97706',
  warningSoft: '#FFFBEB',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  info: '#0284C7',
  infoSoft: '#F0F9FF',

  // Shadows
  shadowCard: '0 4px 16px -2px rgba(0, 48, 81, 0.06), 0 1px 3px 0 rgba(0, 48, 81, 0.04)',
  shadowPopover: '0 10px 25px -5px rgba(0, 48, 81, 0.12), 0 8px 10px -6px rgba(0, 48, 81, 0.08)',
};

export const DARK_THEME_TOKENS: ThemeTokens = {
  // Backgrounds (Signature Deep Midnight Navy)
  background: '#001424',
  backgroundSecondary: '#001D31',

  // Surfaces & Cards (Midnight Navy 800)
  surface: '#003051',
  surfaceRaised: '#003B64',
  surfaceMuted: '#00253F',
  surfaceSubtle: '#001D31',
  surfaceBorder: 'rgba(15, 84, 112, 0.45)',
  surfaceBorderStrong: '#0F5470',

  // Typography (Luminescent slate & cyan tones)
  textPrimary: '#FFFFFF',
  textSecondary: '#DCEAF0',
  textMuted: '#8FB7C7',
  textDisabled: '#5F94A9',
  textInverse: '#003051',

  // Navigation (Deepest Navy glass with cyan borders)
  navBackground: 'rgba(0, 20, 36, 0.85)',
  navBorder: 'rgba(15, 84, 112, 0.4)',
  navActive: '#00A581',
  navInactive: '#8FB7C7',

  // Primary Brand & Accents (Emerald Teal)
  primary: '#00A581',
  primarySoft: 'rgba(0, 165, 129, 0.15)',
  accent: '#00A581',
  accentHover: '#00B994',
  accentSoft: 'rgba(0, 165, 129, 0.15)',
  accentBorder: 'rgba(0, 165, 129, 0.45)',

  // Financial & Alert States
  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.12)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.12)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239, 68, 68, 0.15)',
  info: '#38BDF8',
  infoSoft: 'rgba(56, 189, 248, 0.12)',

  // Shadows
  shadowCard: '0 4px 20px -4px rgba(0, 0, 0, 0.5)',
  shadowPopover: '0 12px 32px -4px rgba(0, 0, 0, 0.8)',
};

import { SemanticTokens } from './theme.types';

export const LIGHT_THEME_TOKENS: SemanticTokens = {
  // Backgrounds
  background: '#F8FAFC',

  // Surfaces
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  surfaceSubtle: '#F8FAFC',

  // Text
  textPrimary: '#003051', // Netify Navy
  textSecondary: '#475569',
  textMuted: '#64748B',
  textDisabled: '#94A3B8',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  // Primary Brand (Netify Navy)
  primary: '#003051',
  primaryPressed: '#001D31',
  primarySoft: '#F0F6F9',

  // Secondary Accent (Netify Teal)
  accent: '#00A581',
  accentPressed: '#008B6E',
  accentSoft: '#ECFDF8',

  // Status
  success: '#16A34A',
  successSoft: '#F0FDF4',
  warning: '#D97706',
  warningSoft: '#FFFBEB',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  info: '#00A581',
  infoSoft: '#ECFDF8',

  // AI Brand
  insightBackground: '#ECFDF8',
  insightAccent: '#00A581',

  // Navigation
  navBackground: '#FFFFFF',
  navBorder: '#E2E8F0',
  navActive: '#00A581',
  navInactive: '#64748B',
};

export const DARK_THEME_TOKENS: SemanticTokens = {
  // Backgrounds (Navy 950)
  background: '#001D31',

  // Surfaces (Navy 900 / Navy 700)
  surface: '#003051',
  surfaceRaised: '#003F5F',
  surfaceMuted: '#003051',
  surfaceSubtle: '#001D31',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#DCEAF0', // Navy 100
  textMuted: '#8FB7C7',     // Navy 300
  textDisabled: '#5F94A9',  // Navy 400
  textInverse: '#003051',

  // Borders (Navy 600 / Navy 500)
  border: '#0F5470',
  borderStrong: '#326F88',

  // Primary Brand in Dark Mode (Netify Teal)
  primary: '#00A581',
  primaryPressed: '#00B994',
  primarySoft: '#003A2D',

  // Secondary Accent (Teal 500)
  accent: '#00B994',
  accentPressed: '#3AD0A9',
  accentSoft: '#003A2D',

  // Status
  success: '#16A34A',
  successSoft: '#052E16',
  warning: '#FBBF24',
  warningSoft: '#451A03',
  danger: '#F87171',
  dangerSoft: '#450A0A',
  info: '#00B994',
  infoSoft: '#003A2D',

  // AI Brand
  insightBackground: '#003A2D',
  insightAccent: '#00B994',

  // Navigation
  navBackground: '#003051',
  navBorder: '#0F5470',
  navActive: '#00B994',
  navInactive: '#8FB7C7',
};

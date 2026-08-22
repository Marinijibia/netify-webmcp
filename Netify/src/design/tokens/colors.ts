export * from '../theme/semantic-tokens';
export * from '../theme/theme.types';

export const NETIFY_NAVY = {
  50: '#F0F6F9',
  100: '#DCEAF0',
  200: '#B9D5E0',
  300: '#8FB7C7',
  400: '#5F94A9',
  500: '#326F88',
  600: '#0F5470',
  700: '#003F5F',
  800: '#003658',
  900: '#003051', // Primary Brand Color
  950: '#001D31',
} as const;

export const NETIFY_TEAL = {
  50: '#ECFDF8',
  100: '#D3F8ED',
  200: '#A8F0DB',
  300: '#72E2C4',
  400: '#3AD0A9',
  500: '#00B994',
  600: '#00A581', // Official Netify Teal (Primary Accent)
  700: '#008B6E',
  800: '#006F59',
  900: '#005542',
  950: '#003A2D',
} as const;

export const NETIFY_SLATE = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
  950: '#020617',
} as const;

export const SEMANTIC_COLORS = {
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    900: '#14532D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    900: '#78350F',
  },
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    900: '#7F1D1D',
  },
  info: NETIFY_TEAL,
} as const;

// Backward-compatible fallback referencing active theme defaults
export { LIGHT_THEME_TOKENS as THEME_TOKENS } from '../theme/semantic-tokens';

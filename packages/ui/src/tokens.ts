export const colors = {
  // Brand & Accent Colors
  primary: '#0F766E', // Deep Emerald
  primaryLight: '#14B8A6', // Teal Green
  primaryDark: '#115E59', // Forest Dark
  primarySoft: '#F0FDFA', // Mint Soft

  // Financial States
  success: '#059669', // Emerald / Paid
  successLight: '#D1FAE5',
  warning: '#D97706', // Amber / Due Soon
  warningLight: '#FEF3C7',
  danger: '#DC2626', // Crimson / Overdue / High Risk
  dangerLight: '#FEE2E2',
  info: '#2563EB', // Blue / Processing
  infoLight: '#EFF6FF',

  // Backgrounds & Neutrals
  bgPrimary: '#0A0F1D', // Deep Slate (Dark Mode)
  bgSecondary: '#111827', // Slate Dark
  bgCard: '#1F2937', // Elevated Card Dark
  bgMuted: '#374151',

  // Light Mode Counterparts
  lightBgPrimary: '#F8FAFC',
  lightBgSecondary: '#FFFFFF',
  lightBgCard: '#FFFFFF',
  lightBgMuted: '#F1F5F9',

  // Typography
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInverse: '#111827',

  // Borders
  border: '#374151',
  borderLight: '#E2E8F0',
  borderFocus: '#14B8A6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
} as const;

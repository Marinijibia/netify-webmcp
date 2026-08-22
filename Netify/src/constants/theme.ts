import { NETIFY_NAVY, NETIFY_TEAL, NETIFY_SLATE, SEMANTIC_COLORS, THEME_TOKENS } from '@/design/tokens';

export const COLORS = {
  primary: THEME_TOKENS.primary,
  primaryDark: THEME_TOKENS.primaryPressed,
  background: THEME_TOKENS.background,
  surface: THEME_TOKENS.surface,
  surfaceBorder: THEME_TOKENS.border,
  surfaceHover: THEME_TOKENS.borderStrong,
  text: THEME_TOKENS.textPrimary,
  textMuted: THEME_TOKENS.textSecondary,
  textSubtle: THEME_TOKENS.textMuted,
  danger: THEME_TOKENS.danger,
  warning: THEME_TOKENS.warning,
  success: THEME_TOKENS.success,
  info: THEME_TOKENS.info,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

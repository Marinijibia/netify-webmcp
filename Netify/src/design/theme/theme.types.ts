export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface SemanticTokens {
  // Backgrounds
  background: string;

  // Surfaces
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  surfaceSubtle: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textInverse: string;

  // Borders
  border: string;
  borderStrong: string;

  // Primary Brand (Netify Navy in Light / Netify Teal in Dark)
  primary: string;
  primaryPressed: string;
  primarySoft: string;

  // Secondary Accent (Netify Teal)
  accent: string;
  accentPressed: string;
  accentSoft: string;

  // Status
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;

  // AI Brand
  insightBackground: string;
  insightAccent: string;

  // Navigation
  navBackground: string;
  navBorder: string;
  navActive: string;
  navInactive: string;
}

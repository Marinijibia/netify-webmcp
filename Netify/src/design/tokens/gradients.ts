import { Platform } from 'react-native';

// ─── Gradient color arrays for expo-linear-gradient ─────────────────────────

export const GRADIENTS = {
  // Hero header — dark navy to rich teal (for command center dark header)
  navyHero: ['#003051', '#004A6E'],

  // Navy to teal — used for primary CTAs/buttons
  navyToTeal: ['#003051', '#00A581'],

  // Teal sheen — used for accent chips and AI elements
  tealSheen: ['#00A581', '#00B994'],

  // Dark night — for dark mode hero sections
  darkHero: ['#001D31', '#003051'],

  // Success pulse — positive metrics
  successGradient: ['#16A34A', '#22C55E'],

  // Danger pulse — overdue/risk metrics
  dangerGradient: ['#B91C1C', '#EF4444'],

  // Warning pulse — caution metrics
  warningGradient: ['#B45309', '#F59E0B'],

  // Gold — Business plan badge
  goldGradient: ['#92400E', '#D97706'],
} as const;

// ─── Gradient directions for LinearGradient `start`/`end` props ─────────────

export const GRADIENT_DIRECTION = {
  toRight: { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
  toBottomRight: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  toBottom: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
  toTopRight: { start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
} as const;

// ─── Shadow tokens — extended from base shadows ──────────────────────────────

import { ViewStyle } from 'react-native';

/** Teal-tinted glow — used on AI/Copilot elements */
export const GLOW_SHADOW: ViewStyle = {
  ...Platform.select({
    ios: {
      shadowColor: '#00A581',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
    },
    android: { elevation: 8 },
    web: { boxShadow: '0 4px 24px 0 rgba(0,165,129,0.35)' } as any,
  }),
};

/** Extra-large shadow for floating elements (modals, copilot bar) */
export const SHADOW_XL: ViewStyle = {
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
    },
    android: { elevation: 16 },
    web: { boxShadow: '0 20px 40px 0 rgba(0,0,0,0.3)' } as any,
  }),
};

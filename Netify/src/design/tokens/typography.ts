export const FONT_FAMILY = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export const TYPOGRAPHY = {
  displayLarge: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700' as const,
  },
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  labelLarge: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
} as const;

/**
 * Formats financial figures with standard African SME currency representations
 */
export function formatCurrency(amount: number, currency = 'NGN'): string {
  const symbolMap: Record<string, string> = {
    NGN: '₦',
    GHS: 'GH₵',
    KES: 'KSh',
    RWF: 'RF',
    ZAR: 'R',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const symbol = symbolMap[currency] || currency + ' ';
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol}${formattedNumber}`;
}

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
  spaceSeparated: boolean;
  thousandsSeparator: string;
  decimalSeparator: string;
  flag: string;
  country: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  NGN: {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    decimalPlaces: 2,
    symbolPosition: 'before',
    spaceSeparated: false,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇳🇬',
    country: 'Nigeria',
  },
  GHS: {
    code: 'GHS',
    name: 'Ghanaian Cedi',
    symbol: 'GH₵',
    decimalPlaces: 2,
    symbolPosition: 'before',
    spaceSeparated: true,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇬🇭',
    country: 'Ghana',
  },
  KES: {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    decimalPlaces: 2,
    symbolPosition: 'before',
    spaceSeparated: true,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇰🇪',
    country: 'Kenya',
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    decimalPlaces: 2,
    symbolPosition: 'before',
    spaceSeparated: true,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇿🇦',
    country: 'South Africa',
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2,
    symbolPosition: 'before',
    spaceSeparated: false,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇺🇸',
    country: 'United States',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimalPlaces: 2,
    symbolPosition: 'before',
    spaceSeparated: false,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇬🇧',
    country: 'United Kingdom',
  },
};

export const DEFAULT_CURRENCY = 'NGN';

export function formatCurrency(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options?: { compact?: boolean }
): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.NGN;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formattedNumber: string;

  if (options?.compact) {
    if (absAmount >= 1_000_000_000) {
      formattedNumber = (absAmount / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    } else if (absAmount >= 1_000_000) {
      formattedNumber = (absAmount / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (absAmount >= 1_000) {
      formattedNumber = (absAmount / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    } else {
      formattedNumber = absAmount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: config.decimalPlaces,
      });
    }
  } else {
    const parts = absAmount.toFixed(config.decimalPlaces).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
    formattedNumber = parts.join(config.decimalSeparator);
  }

  const space = config.spaceSeparated ? ' ' : '';
  const formatted =
    config.symbolPosition === 'before'
      ? `${config.symbol}${space}${formattedNumber}`
      : `${formattedNumber}${space}${config.symbol}`;

  return isNegative ? `-${formatted}` : formatted;
}

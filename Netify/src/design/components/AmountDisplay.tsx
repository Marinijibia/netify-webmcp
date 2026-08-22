import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../tokens/typography';
import { useTheme } from '../theme';

export interface AmountDisplayProps extends ViewProps {
  amount: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'display';
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'muted';
  className?: string;
}

export function AmountDisplay({
  amount,
  currency = 'NGN',
  size = 'md',
  variant = 'default',
  className,
  ...props
}: AmountDisplayProps) {
  const { tokens } = useTheme();
  const formatted = formatCurrency(amount, currency);

  const sizeStyles = {
    sm: 'text-sm font-semibold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-black tracking-tight',
    display: 'text-3xl font-black tracking-tight',
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
        return tokens.success;
      case 'danger':
        return tokens.danger;
      case 'warning':
        return tokens.warning;
      case 'muted':
        return tokens.textMuted;
      case 'default':
      default:
        return tokens.textPrimary;
    }
  };

  return (
    <View className={cn('flex-row items-baseline', className)} {...props}>
      <Text
        style={{ color: getTextColor() }}
        className={cn(sizeStyles[size])}
      >
        {formatted}
      </Text>
    </View>
  );
}

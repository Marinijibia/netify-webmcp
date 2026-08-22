import React from 'react';
import { View, Text } from 'react-native';
import { Card } from './Card';
import { Badge } from './Badge';
import { AmountDisplay } from './AmountDisplay';
import { useTheme } from '../theme';

export interface MetricCardProps {
  label: string;
  amount: number;
  currency?: string;
  badgeLabel?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  subtitle?: string;
  className?: string;
}

export function MetricCard({
  label,
  amount,
  currency = 'NGN',
  badgeLabel,
  badgeVariant = 'neutral',
  subtitle,
  className,
}: MetricCardProps) {
  const { tokens } = useTheme();

  return (
    <Card className={`p-4 ${className || ''}`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text
          style={{ color: tokens.textMuted }}
          className="text-xs font-bold uppercase tracking-wider"
        >
          {label}
        </Text>
        {badgeLabel ? (
          <Badge label={badgeLabel} variant={badgeVariant} size="sm" />
        ) : null}
      </View>

      <AmountDisplay amount={amount} currency={currency} size="lg" />

      {subtitle ? (
        <Text style={{ color: tokens.textMuted }} className="text-xs mt-1">
          {subtitle}
        </Text>
      ) : null}
    </Card>
  );
}

import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { useTheme } from '../theme';
import { InfoIcon } from '../icons';

export interface InsightCardProps extends ViewProps {
  title?: string;
  insight: string;
  recommendation?: string;
  className?: string;
}

export function InsightCard({
  title = 'AI Financial Insight',
  insight,
  recommendation,
  className,
  style,
  ...props
}: InsightCardProps) {
  const { tokens } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: tokens.insightBackground,
          borderColor: tokens.insightAccent,
          borderWidth: 1,
          borderRadius: 16,
        },
        style,
      ]}
      className={cn('p-4 rounded-2xl', className)}
      {...props}
    >
      <View className="flex-row items-center mb-2">
        <InfoIcon size={18} color={tokens.insightAccent} />
        <Text
          style={{ color: tokens.insightAccent }}
          className="text-xs font-bold uppercase tracking-wider ml-2"
        >
          {title}
        </Text>
      </View>

      <Text
        style={{ color: tokens.textPrimary }}
        className="text-sm font-semibold leading-5 mb-1"
      >
        {insight}
      </Text>

      {recommendation ? (
        <Text
          style={{ color: tokens.textSecondary }}
          className="text-xs leading-4 mt-1"
        >
          💡 {recommendation}
        </Text>
      ) : null}
    </View>
  );
}

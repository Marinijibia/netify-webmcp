import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { useTheme } from '../theme';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const { tokens, isDark } = useTheme();

  return (
    <View className={`items-center justify-center p-6 ${className || ''}`}>
      {icon ? (
        <View
          style={{
            backgroundColor: isDark ? tokens.surface : '#FFFFFF',
            borderColor: tokens.border,
            borderWidth: 1,
          }}
          className="h-16 w-16 rounded-2xl items-center justify-center mb-4"
        >
          {icon}
        </View>
      ) : null}

      <Text
        style={{ color: tokens.textPrimary }}
        className="text-base font-bold text-center mb-1"
      >
        {title}
      </Text>

      <Text
        style={{ color: tokens.textSecondary }}
        className="text-xs text-center leading-5 max-w-[280px] mb-4"
      >
        {description}
      </Text>

      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          variant="secondary"
          size="sm"
          onPress={onAction}
        />
      ) : null}
    </View>
  );
}

export interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  const { tokens } = useTheme();

  return (
    <View className={`items-center justify-center p-6 ${className || ''}`}>
      <Text
        style={{ color: tokens.danger }}
        className="text-base font-bold text-center mb-1"
      >
        {title}
      </Text>
      <Text
        style={{ color: tokens.textSecondary }}
        className="text-xs text-center leading-5 max-w-[280px] mb-4"
      >
        {description}
      </Text>
      {onRetry ? (
        <Button
          label="Try Again"
          variant="secondary"
          size="sm"
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

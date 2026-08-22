import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { CheckCircleIcon } from '../icons';
import { useTheme } from '../theme';

export interface SuccessStateProps {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function SuccessState({
  title = 'Success',
  description,
  actionLabel,
  onAction,
  className,
}: SuccessStateProps) {
  const { tokens } = useTheme();

  return (
    <View className={`items-center justify-center p-6 ${className || ''}`}>
      <View
        style={{
          backgroundColor: tokens.successSoft,
          borderColor: tokens.success,
          borderWidth: 1,
        }}
        className="h-16 w-16 rounded-2xl items-center justify-center mb-4"
      >
        <CheckCircleIcon size={32} color={tokens.success} />
      </View>

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
          variant="primary"
          size="sm"
          onPress={onAction}
        />
      ) : null}
    </View>
  );
}

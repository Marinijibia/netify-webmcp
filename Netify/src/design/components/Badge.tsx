import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { useTheme } from '../theme';

export interface BadgeProps extends ViewProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  labelClassName?: string;
}

export function Badge({
  label,
  variant = 'primary',
  size = 'md',
  className,
  labelClassName,
  style,
  ...props
}: BadgeProps) {
  const { tokens, isDark } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: tokens.primarySoft,
          borderColor: isDark ? tokens.primary : tokens.primary,
          textColor: tokens.primary,
        };
      case 'success':
        return {
          backgroundColor: tokens.successSoft,
          borderColor: tokens.success,
          textColor: tokens.success,
        };
      case 'warning':
        return {
          backgroundColor: tokens.warningSoft,
          borderColor: tokens.warning,
          textColor: tokens.warning,
        };
      case 'danger':
        return {
          backgroundColor: tokens.dangerSoft,
          borderColor: tokens.danger,
          textColor: tokens.danger,
        };
      case 'neutral':
      default:
        return {
          backgroundColor: tokens.surfaceMuted,
          borderColor: tokens.border,
          textColor: tokens.textSecondary,
        };
    }
  };

  const currentVariant = getVariantStyles();

  const sizeStyles = {
    sm: 'px-2 py-0.5 rounded-md',
    md: 'px-2.5 py-1 rounded-lg',
  };

  return (
    <View
      style={[
        {
          backgroundColor: currentVariant.backgroundColor,
          borderColor: currentVariant.borderColor,
          borderWidth: 1,
        },
        style,
      ]}
      className={cn(
        'flex-row items-center self-start',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <Text
        style={{ color: currentVariant.textColor }}
        className={cn(
          'font-bold uppercase tracking-wider',
          size === 'sm' ? 'text-[10px]' : 'text-xs',
          labelClassName
        )}
      >
        {label}
      </Text>
    </View>
  );
}

import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
} from 'react-native';
import { cn } from '@/lib/utils';
import { useTheme } from '../theme';

export interface IconButtonProps extends TouchableOpacityProps {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel: string;
  className?: string;
}

export function IconButton({
  icon,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  accessibilityLabel,
  className,
  style,
  ...props
}: IconButtonProps) {
  const { tokens, isDark } = useTheme();
  const isDisabled = disabled || loading;

  const getContainerStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: tokens.primary };
      case 'secondary':
        return {
          backgroundColor: isDark ? tokens.surface : '#FFFFFF',
          borderColor: tokens.border,
          borderWidth: 1,
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'destructive':
        return {
          backgroundColor: tokens.dangerSoft,
          borderColor: tokens.danger,
          borderWidth: 1,
        };
      default:
        return { backgroundColor: tokens.surface };
    }
  };

  const sizeStyles = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-11 h-11 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[getContainerStyle(), isDisabled ? { opacity: 0.5 } : undefined, style]}
      className={cn(
        'items-center justify-center',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading ? <ActivityIndicator size="small" color={tokens.textSecondary} /> : icon}
    </TouchableOpacity>
  );
}

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { cn } from '@/lib/utils';
import { CheckIcon } from '../icons';
import { useTheme } from '../theme';

export interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingLabel?: string;
  success?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel,
  success = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  labelClassName,
  style,
  ...props
}: ButtonProps) {
  const { tokens, isDark } = useTheme();
  const isDisabled = disabled || loading || success;

  const minHeight = size === 'sm' ? 36 : size === 'lg' ? 56 : 48;

  // Dynamic Theme Variant Styles conforming to Section 12
  const getContainerStyle = () => {
    if (success) {
      return {
        backgroundColor: tokens.success,
        borderColor: tokens.success,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isDark ? tokens.primary : tokens.accent,
        };
      case 'secondary':
        return {
          backgroundColor: isDark ? tokens.surface : '#FFFFFF',
          borderColor: isDark ? tokens.borderStrong : tokens.borderStrong,
          borderWidth: 1,
        };
      case 'tertiary':
        return {
          backgroundColor: 'transparent',
          borderColor: tokens.border,
          borderWidth: 1,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'destructive':
        return {
          backgroundColor: tokens.danger,
        };
      default:
        return {
          backgroundColor: isDark ? tokens.primary : tokens.accent,
        };
    }
  };

  const getTextColor = () => {
    if (success) return '#FFFFFF';

    switch (variant) {
      case 'primary':
        return isDark ? tokens.textInverse : '#FFFFFF';
      case 'destructive':
        return '#FFFFFF';
      case 'secondary':
        return tokens.textPrimary;
      case 'tertiary':
      case 'ghost':
        return tokens.textSecondary;
      default:
        return isDark ? tokens.textInverse : '#FFFFFF';
    }
  };

  const sizeClasses = {
    sm: 'py-2 px-3.5',
    md: 'py-3.5 px-5',
    lg: 'py-4 px-6',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm font-bold',
    lg: 'text-base font-bold',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        { minHeight, borderRadius: 12 },
        getContainerStyle(),
        isDisabled && !success ? { opacity: 0.5 } : undefined,
        style,
      ]}
      className={cn(
        'flex-row items-center justify-center rounded-xl',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <View className="flex-row items-center justify-center">
          <ActivityIndicator size="small" color={getTextColor()} />
          {loadingLabel ? (
            <Text
              style={{ color: getTextColor() }}
              className={cn('ml-2 font-medium', textSizeClasses[size], labelClassName)}
            >
              {loadingLabel}
            </Text>
          ) : null}
        </View>
      ) : success ? (
        <View className="flex-row items-center justify-center">
          <CheckIcon size={16} color="#FFFFFF" />
          <Text className="ml-2 text-white font-bold text-sm">Success</Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
          <Text
            style={{ color: getTextColor() }}
            className={cn(
              variant === 'primary' || variant === 'destructive'
                ? 'font-bold'
                : 'font-semibold',
              textSizeClasses[size],
              labelClassName
            )}
          >
            {label}
          </Text>
          {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

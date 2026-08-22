import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  Platform,
} from 'react-native';
import { cn } from '@/lib/utils';
import { useTheme } from '../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  containerClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightAction,
  className,
  containerClassName,
  inputClassName,
  placeholderTextColor,
  onFocus,
  onBlur,
  disabled,
  editable,
  style,
  ...props
}: InputProps) {
  const { tokens, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const isInputDisabled = disabled || editable === false;

  const defaultPlaceholderColor =
    placeholderTextColor || (isDark ? tokens.textDisabled : tokens.textDisabled);

  // Theme-aware container border & background conforming to Section 13
  const getContainerStyle = () => {
    if (error) {
      return {
        backgroundColor: tokens.dangerSoft,
        borderColor: tokens.danger,
        borderWidth: 1,
      };
    }
    if (isFocused) {
      return {
        backgroundColor: isDark ? tokens.surface : '#FFFFFF',
        borderColor: tokens.accent,
        borderWidth: 1.5,
      };
    }
    return {
      backgroundColor: isDark ? tokens.surface : '#FFFFFF',
      borderColor: tokens.borderStrong,
      borderWidth: 1,
    };
  };

  return (
    <View className={cn('w-full', containerClassName)}>
      {label ? (
        <Text
          style={{ color: tokens.textSecondary }}
          className="text-xs font-semibold uppercase tracking-wider mb-2"
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          { minHeight: 50, borderRadius: 12 },
          getContainerStyle(),
          isInputDisabled ? { opacity: 0.6 } : undefined,
        ]}
        className={cn('w-full min-h-[50px] flex-row items-center rounded-xl px-4 py-3', className)}
      >
        {leftIcon ? <View className="mr-3 items-center justify-center">{leftIcon}</View> : null}

        <TextInput
          editable={!isInputDisabled}
          placeholderTextColor={defaultPlaceholderColor}
          style={[
            {
              color: tokens.textPrimary,
              fontSize: 14,
            },
            Platform.OS === 'android'
              ? { includeFontPadding: false, textAlignVertical: 'center' }
              : undefined,
            style,
          ]}
          className={cn('flex-1 py-0', inputClassName)}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {rightAction ? <View className="ml-2 items-center justify-center">{rightAction}</View> : null}
      </View>

      {error ? (
        <Text style={{ color: tokens.danger }} className="text-xs mt-1.5 font-medium">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={{ color: tokens.textMuted }} className="text-xs mt-1.5">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

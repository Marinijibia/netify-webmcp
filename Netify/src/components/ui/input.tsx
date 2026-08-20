import React from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
} from 'react-native';
import { cn } from '@/lib/utils';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helperText,
  className,
  containerClassName,
  placeholderTextColor = '#64748b',
  ...props
}: InputProps) {
  return (
    <View className={cn('w-full', containerClassName)}>
      {label ? (
        <Text className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          {label}
        </Text>
      ) : null}

      <TextInput
        placeholderTextColor={placeholderTextColor}
        className={cn(
          'w-full bg-slate-900 border rounded-xl px-4 py-3.5 text-slate-100 text-sm font-normal',
          error
            ? 'border-red-500/80 bg-red-950/20'
            : 'border-slate-800 focus:border-emerald-500/80',
          className
        )}
        {...props}
      />

      {error ? (
        <Text className="text-xs text-red-400 mt-1.5 font-medium">{error}</Text>
      ) : helperText ? (
        <Text className="text-xs text-slate-500 mt-1.5">{helperText}</Text>
      ) : null}
    </View>
  );
}

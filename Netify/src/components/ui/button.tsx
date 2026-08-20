import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { cn } from '@/lib/utils';

export interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  labelClassName,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseContainer = 'flex-row items-center justify-center rounded-xl font-medium';
  
  const variantStyles = {
    primary: 'bg-emerald-500 active:bg-emerald-600 shadow-sm shadow-emerald-500/20',
    secondary: 'bg-slate-800 active:bg-slate-700 border border-slate-700',
    outline: 'bg-transparent border border-slate-700 active:bg-slate-900',
    danger: 'bg-red-600 active:bg-red-700',
    ghost: 'bg-transparent active:bg-slate-900',
  };

  const sizeStyles = {
    sm: 'py-2 px-3.5',
    md: 'py-3.5 px-5',
    lg: 'py-4 px-6',
  };

  const textVariantStyles = {
    primary: 'text-slate-950 font-bold',
    secondary: 'text-slate-100 font-semibold',
    outline: 'text-slate-200 font-semibold',
    danger: 'text-white font-bold',
    ghost: 'text-slate-300 font-medium',
  };

  const textSizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      className={cn(
        baseContainer,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && 'opacity-50',
        className
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#020617' : '#f8fafc'}
        />
      ) : (
        <Text
          className={cn(
            textVariantStyles[variant],
            textSizeStyles[size],
            labelClassName
          )}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

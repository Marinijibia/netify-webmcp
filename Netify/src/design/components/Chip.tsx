import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import { cn } from '@/lib/utils';
import { useTheme } from '../theme';

export interface ChipProps extends TouchableOpacityProps {
  label: string;
  selected?: boolean;
  leftIcon?: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export function Chip({
  label,
  selected = false,
  leftIcon,
  className,
  labelClassName,
  style,
  ...props
}: ChipProps) {
  const { tokens, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[
        {
          backgroundColor: selected
            ? tokens.accentSoft
            : isDark
            ? tokens.surfaceRaised
            : tokens.surfaceMuted,
          borderColor: selected ? tokens.accent : tokens.border,
          borderWidth: selected ? 1.5 : 1,
          borderRadius: 20,
        },
        style,
      ]}
      className={cn('flex-row items-center px-3.5 py-2 rounded-full self-start', className)}
      {...props}
    >
      {leftIcon ? <React.Fragment>{leftIcon}</React.Fragment> : null}
      <Text
        style={{
          color: selected ? tokens.accent : tokens.textPrimary,
          fontWeight: selected ? '700' : '500',
        }}
        className={cn('text-xs', leftIcon ? 'ml-1.5' : '', labelClassName)}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

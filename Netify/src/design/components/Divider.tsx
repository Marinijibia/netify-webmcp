import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { useTheme } from '../theme';

export interface DividerProps extends ViewProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className, ...props }: DividerProps) {
  const { tokens } = useTheme();

  if (label) {
    return (
      <View className={cn('flex-row items-center my-4', className)} {...props}>
        <View style={{ backgroundColor: tokens.border }} className="flex-1 h-[1px]" />
        <Text
          style={{ color: tokens.textMuted }}
          className="text-xs font-medium px-3 uppercase tracking-wider"
        >
          {label}
        </Text>
        <View style={{ backgroundColor: tokens.border }} className="flex-1 h-[1px]" />
      </View>
    );
  }

  return (
    <View
      style={{ backgroundColor: tokens.border }}
      className={cn('h-[1px] w-full my-3', className)}
      {...props}
    />
  );
}

import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { useTheme } from '../theme';

export interface SkeletonProps extends ViewProps {
  className?: string;
}

export function Skeleton({ className, style, ...props }: SkeletonProps) {
  const { tokens } = useTheme();

  return (
    <View
      style={[{ backgroundColor: tokens.surfaceMuted }, style]}
      className={cn('rounded-lg', className)}
      {...props}
    />
  );
}

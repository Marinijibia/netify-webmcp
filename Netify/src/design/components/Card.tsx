import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { SHADOWS } from '../tokens/shadows';
import { useTheme } from '../theme';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'raised' | 'muted' | 'subtle';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  elevation = 'none',
  className,
  children,
  style,
  ...props
}: CardProps) {
  const { tokens, isDark } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'raised':
        return tokens.surfaceRaised;
      case 'muted':
        return tokens.surfaceMuted;
      case 'subtle':
        return tokens.surfaceSubtle;
      default:
        return tokens.surface;
    }
  };

  return (
    <View
      style={[
        {
          backgroundColor: getBackgroundColor(),
          borderColor: tokens.border,
          borderWidth: 1,
          borderRadius: 16,
        },
        elevation !== 'none' ? SHADOWS[elevation] : undefined,
        style,
      ]}
      className={cn('rounded-2xl p-5', className)}
      {...props}
    >
      {children}
    </View>
  );
}

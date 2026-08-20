import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'muted' | 'outline';
  className?: string;
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  className,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: 'bg-slate-900 border border-slate-800',
    muted: 'bg-slate-950 border border-slate-900',
    outline: 'bg-transparent border border-slate-800',
  };

  return (
    <View
      className={cn('rounded-2xl p-5', variantStyles[variant], className)}
      {...props}
    >
      {children}
    </View>
  );
}

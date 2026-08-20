import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'small',
  color = '#10b981',
  className,
}: LoadingSpinnerProps) {
  return (
    <View className={cn('items-center justify-center p-4', className)}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

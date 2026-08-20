import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <View className={cn('items-center justify-center p-8 text-center', className)}>
      <View className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-900/60 items-center justify-center mb-4">
        <Text className="text-xl text-red-400 font-bold">!</Text>
      </View>

      <Text className="text-base font-bold text-slate-100 text-center mb-1.5">
        {title}
      </Text>
      <Text className="text-xs text-slate-400 text-center max-w-[280px] leading-5 mb-6">
        {message}
      </Text>

      {onRetry ? (
        <Button
          label="Try Again"
          onPress={onRetry}
          variant="secondary"
          size="sm"
        />
      ) : null}
    </View>
  );
}

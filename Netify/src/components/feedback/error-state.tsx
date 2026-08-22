import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/design/components/Button';
import { AlertCircleIcon } from '@/design/icons';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}: ErrorStateProps) {
  return (
    <View className={`items-center justify-center p-6 text-center ${className}`}>
      <View className="h-16 w-16 rounded-2xl bg-red-950/40 border border-red-500/30 items-center justify-center mb-4">
        <AlertCircleIcon size={32} color="#ef4444" />
      </View>

      <Text className="text-base font-bold text-slate-100 text-center mb-1">
        {title}
      </Text>

      <Text className="text-xs text-slate-400 text-center leading-5 max-w-[280px] mb-5">
        {message}
      </Text>

      {onRetry ? (
        <Button
          label={retryLabel}
          variant="secondary"
          size="sm"
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

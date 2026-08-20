import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center p-8 text-center', className)}>
      <View className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 items-center justify-center mb-4">
        <Text className="text-xl text-slate-500 font-bold">∅</Text>
      </View>

      <Text className="text-base font-bold text-slate-200 text-center mb-1.5">
        {title}
      </Text>
      <Text className="text-xs text-slate-400 text-center max-w-[260px] leading-5 mb-6">
        {description}
      </Text>

      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="outline"
          size="sm"
        />
      ) : null}
    </View>
  );
}

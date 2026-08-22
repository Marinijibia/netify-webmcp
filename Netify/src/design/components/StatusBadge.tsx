import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { useTheme } from '../theme';

export type InvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED';

export interface StatusBadgeProps extends ViewProps {
  status: InvoiceStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({
  status,
  size = 'md',
  className,
  style,
  ...props
}: StatusBadgeProps) {
  const { tokens } = useTheme();

  const getStatusStyles = () => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return {
          backgroundColor: tokens.successSoft,
          borderColor: tokens.success,
          textColor: tokens.success,
          label: 'Paid',
        };
      case 'OVERDUE':
        return {
          backgroundColor: tokens.dangerSoft,
          borderColor: tokens.danger,
          textColor: tokens.danger,
          label: 'Overdue',
        };
      case 'PENDING':
      case 'PARTIAL':
        return {
          backgroundColor: tokens.warningSoft,
          borderColor: tokens.warning,
          textColor: tokens.warning,
          label: status.toUpperCase() === 'PARTIAL' ? 'Partially Paid' : 'Pending',
        };
      case 'CANCELLED':
      default:
        return {
          backgroundColor: tokens.surfaceMuted,
          borderColor: tokens.border,
          textColor: tokens.textSecondary,
          label: status,
        };
    }
  };

  const current = getStatusStyles();

  const sizeStyles = {
    sm: 'px-2 py-0.5 rounded-md',
    md: 'px-2.5 py-1 rounded-lg',
  };

  return (
    <View
      style={[
        {
          backgroundColor: current.backgroundColor,
          borderColor: current.borderColor,
          borderWidth: 1,
        },
        style,
      ]}
      className={cn(
        'flex-row items-center self-start',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <Text
        style={{ color: current.textColor }}
        className={cn(
          'font-bold uppercase tracking-wider',
          size === 'sm' ? 'text-[10px]' : 'text-xs'
        )}
      >
        {current.label}
      </Text>
    </View>
  );
}

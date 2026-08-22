import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { AlertCircleIcon, CheckCircleIcon, InfoIcon } from '../icons';
import { useTheme } from '../theme';

export interface AlertProps extends ViewProps {
  variant?: 'danger' | 'warning' | 'success' | 'info';
  title?: string;
  message: string;
  className?: string;
}

export function Alert({
  variant = 'danger',
  title,
  message,
  className,
  style,
  ...props
}: AlertProps) {
  const { tokens } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          backgroundColor: tokens.dangerSoft,
          borderColor: tokens.danger,
          textColor: tokens.danger,
          icon: <AlertCircleIcon size={18} color={tokens.danger} />,
        };
      case 'warning':
        return {
          backgroundColor: tokens.warningSoft,
          borderColor: tokens.warning,
          textColor: tokens.warning,
          icon: <AlertCircleIcon size={18} color={tokens.warning} />,
        };
      case 'success':
        return {
          backgroundColor: tokens.successSoft,
          borderColor: tokens.success,
          textColor: tokens.success,
          icon: <CheckCircleIcon size={18} color={tokens.success} />,
        };
      case 'info':
      default:
        return {
          backgroundColor: tokens.infoSoft,
          borderColor: tokens.info,
          textColor: tokens.info,
          icon: <InfoIcon size={18} color={tokens.info} />,
        };
    }
  };

  const currentVariant = getVariantStyles();

  return (
    <View
      style={[
        {
          backgroundColor: currentVariant.backgroundColor,
          borderColor: currentVariant.borderColor,
          borderWidth: 1,
          borderRadius: 12,
        },
        style,
      ]}
      className={cn(
        'flex-row items-start rounded-xl p-3.5',
        className
      )}
      {...props}
    >
      <View className="mr-2.5 mt-0.5">{currentVariant.icon}</View>
      <View className="flex-1">
        {title ? (
          <Text
            style={{ color: currentVariant.textColor }}
            className="text-xs font-bold mb-0.5"
          >
            {title}
          </Text>
        ) : null}
        <Text
          style={{ color: currentVariant.textColor }}
          className="text-xs font-medium leading-5"
        >
          {message}
        </Text>
      </View>
    </View>
  );
}

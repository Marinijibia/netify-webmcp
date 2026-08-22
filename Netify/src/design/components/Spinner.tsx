import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';

export interface SpinnerProps {
  label?: string;
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}

export function Spinner({
  label,
  size = 'small',
  color,
  className = '',
}: SpinnerProps) {
  const { tokens } = useTheme();

  return (
    <View className={`items-center justify-center p-4 ${className}`}>
      <ActivityIndicator size={size} color={color || tokens.primary} />
      {label ? (
        <Text
          style={{ color: tokens.textMuted }}
          className="text-xs font-medium mt-2.5 text-center"
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

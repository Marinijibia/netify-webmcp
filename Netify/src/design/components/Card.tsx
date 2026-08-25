import React from 'react';
import { View, ViewProps } from 'react-native';
import { SHADOWS } from '../tokens/shadows';
import { GLOW_SHADOW } from '../tokens/gradients';
import { useTheme } from '../theme';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'raised' | 'muted' | 'subtle';
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'glow';
  /**
   * Draws a 4px colored left border — great for urgency/priority indicators.
   * Pass a CSS color string e.g. '#EF4444'
   */
  accentBorder?: string;
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  elevation = 'sm',
  accentBorder,
  children,
  style,
  ...props
}: CardProps) {
  const { tokens } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'raised':  return tokens.surfaceRaised;
      case 'muted':   return tokens.surfaceMuted;
      case 'subtle':  return tokens.surfaceSubtle;
      default:        return tokens.surface;
    }
  };

  const getShadow = () => {
    if (elevation === 'glow') return GLOW_SHADOW;
    if (elevation === 'none') return undefined;
    return SHADOWS[elevation];
  };

  return (
    <View
      style={[
        {
          backgroundColor: getBackgroundColor(),
          borderColor: tokens.border,
          borderWidth: 1,
          borderRadius: 18,
          overflow: 'hidden',
        },
        getShadow(),
        style,
      ]}
      {...props}
    >
      {/* Colored left accent border */}
      {accentBorder ? (
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <View style={{ width: 4, backgroundColor: accentBorder, borderRadius: 2 }} />
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      ) : (
        children
      )}
    </View>
  );
}

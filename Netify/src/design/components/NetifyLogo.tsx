import React from 'react';
import { View, Text, Image, ViewProps } from 'react-native';
import { useTheme } from '../theme';

export interface NetifyLogoProps extends ViewProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showIcon?: boolean;
  showWordmark?: boolean;
  className?: string;
}

export function NetifyLogo({
  size = 'md',
  showTagline = false,
  showIcon = true,
  showWordmark = true,
  className = '',
  style,
  ...props
}: NetifyLogoProps) {
  const { tokens } = useTheme();

  const iconDimensions = {
    sm: { width: 44, height: 44 },
    md: { width: 68, height: 68 },
    lg: { width: 88, height: 88 },
    xl: { width: 110, height: 110 },
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <View className={`items-center ${className}`} style={style} {...props}>
      {showIcon ? (
        <View className="items-center justify-center mb-2">
          <Image
            source={require('../../../assets/images/logo-icon.png')}
            style={{
              width: iconDimensions[size].width,
              height: iconDimensions[size].height,
            }}
            resizeMode="contain"
          />
        </View>

      ) : null}

      {/* Official Netify Dual-Tone Wordmark */}
      {showWordmark ? (
        <View className="flex-row items-baseline">
          <Text
            style={{ color: tokens.textPrimary }}
            className={`${textSizes[size]} font-black tracking-tight`}
          >
            Net
          </Text>
          <Text
            style={{ color: tokens.accent }}
            className={`${textSizes[size]} font-black tracking-tight`}
          >
            ify
          </Text>
        </View>
      ) : null}

      {showTagline ? (
        <Text
          style={{ color: tokens.textSecondary }}
          className="text-xs font-semibold mt-1 tracking-wide text-center"
        >
          Collect more. <Text style={{ color: tokens.accent }}>Know more.</Text> Grow faster.
        </Text>
      ) : null}
    </View>
  );
}

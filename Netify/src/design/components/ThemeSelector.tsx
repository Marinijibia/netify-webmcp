import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme, ThemeMode } from '../theme';
import { Card } from './Card';
import { SmartphoneIcon, CheckCircleIcon } from '../icons';

export interface ThemeSelectorProps {
  className?: string;
}

const THEME_OPTIONS: Array<{
  mode: ThemeMode;
  label: string;
  description: string;
}> = [
  {
    mode: 'system',
    label: 'System Default',
    description: 'Automatically match device appearance',
  },
  {
    mode: 'light',
    label: 'Light',
    description: 'Clean high-contrast Netify Light theme',
  },
  {
    mode: 'dark',
    label: 'Dark',
    description: 'Deep Netify Navy dark theme',
  },
];

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { mode, setThemeMode, tokens, isDark } = useTheme();

  return (
    <Card className={`p-5 ${className || ''}`}>
      <View className="flex-row items-center mb-1">
        <SmartphoneIcon size={18} color={isDark ? tokens.accent : tokens.primary} />
        <Text
          style={{ color: tokens.textPrimary }}
          className="text-sm font-bold ml-2"
        >
          Appearance
        </Text>
      </View>
      <Text
        style={{ color: tokens.textSecondary }}
        className="text-xs mb-4 mt-0.5"
      >
        Choose how Netify looks on this device
      </Text>

      <View className="gap-2.5">
        {THEME_OPTIONS.map((opt) => {
          const isSelected = mode === opt.mode;
          const highlightColor = isDark ? tokens.accent : tokens.primary;
          return (
            <TouchableOpacity
              key={opt.mode}
              activeOpacity={0.75}
              onPress={() => setThemeMode(opt.mode)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={{
                backgroundColor: isSelected
                  ? tokens.primarySoft
                  : isDark
                  ? tokens.surfaceRaised
                  : tokens.surfaceMuted,
                borderColor: isSelected ? highlightColor : tokens.border,
                borderWidth: isSelected ? 1.5 : 1,
              }}
              className="flex-row items-center justify-between p-3.5 rounded-xl"
            >
              <View className="flex-1 mr-3">
                <Text
                  style={{
                    color: isSelected ? highlightColor : tokens.textPrimary,
                    fontWeight: isSelected ? '700' : '600',
                  }}
                  className="text-sm"
                >
                  {opt.label}
                </Text>
                <Text
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {opt.description}
                </Text>
              </View>

              {isSelected ? (
                <CheckCircleIcon size={18} color={highlightColor} />
              ) : (
                <View
                  style={{ borderColor: tokens.borderStrong }}
                  className="w-4 h-4 rounded-full border"
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
}

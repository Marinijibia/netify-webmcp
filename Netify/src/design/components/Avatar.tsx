import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/** Deterministic color from any string (customer name, org name, etc.) */
function hashColor(name: string): string {
  const PALETTE = [
    '#003051', // Netify Navy
    '#00A581', // Netify Teal
    '#0F5470', // Navy 600
    '#7C3AED', // Violet
    '#DC2626', // Red
    '#D97706', // Amber
    '#059669', // Emerald
    '#2563EB', // Blue
    '#DB2777', // Pink
    '#0891B2', // Cyan
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/** Derives 1–2 uppercase initials from a full name */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const SIZE_MAP = {
  xs: { container: 24, fontSize: 9 },
  sm: { container: 32, fontSize: 12 },
  md: { container: 44, fontSize: 16 },
  lg: { container: 56, fontSize: 20 },
  xl: { container: 72, fontSize: 26 },
} as const;

export type AvatarSize = keyof typeof SIZE_MAP;

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  /** Override background color */
  color?: string;
  /** Override border radius (default: circular) */
  borderRadius?: number;
}

export function Avatar({ name, size = 'md', color, borderRadius }: AvatarProps) {
  const { container, fontSize } = SIZE_MAP[size];
  const bgColor = color ?? hashColor(name);
  const br = borderRadius ?? container / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: container,
          height: container,
          borderRadius: br,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

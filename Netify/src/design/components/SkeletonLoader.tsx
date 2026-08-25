import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';

interface ShimmerProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * A single shimmer/skeleton placeholder element.
 * Pulses between light and lighter to indicate loading.
 */
export function Shimmer({ width, height, borderRadius = 8, style }: ShimmerProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E2E8F0',
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Pre-built skeleton for the command center metric 2×2 grid */
export function MetricGridSkeleton() {
  return (
    <View style={styles.grid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.metricBox}>
          <Shimmer width={70} height={11} borderRadius={4} style={{ marginBottom: 10 }} />
          <Shimmer width={90} height={22} borderRadius={6} style={{ marginBottom: 6 }} />
          <Shimmer width={60} height={10} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

/** Pre-built skeleton for a customer list row */
export function CustomerRowSkeleton() {
  return (
    <View style={styles.customerRow}>
      <Shimmer width={44} height={44} borderRadius={22} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Shimmer width="60%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <Shimmer width="40%" height={11} borderRadius={4} />
      </View>
      <Shimmer width={60} height={14} borderRadius={4} />
    </View>
  );
}

/** Pre-built skeleton for the AI briefing card */
export function BriefingCardSkeleton() {
  return (
    <View style={styles.briefingCard}>
      <Shimmer width={100} height={12} borderRadius={4} style={{ marginBottom: 10 }} />
      <Shimmer width="90%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
      <Shimmer width="75%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
      <Shimmer width="55%" height={13} borderRadius={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricBox: {
    width: '48%',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  briefingCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,165,129,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,165,129,0.15)',
    marginBottom: 16,
  },
});

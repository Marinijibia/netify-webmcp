import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { TodayAttentionData } from '../../services/api/ai';
import { GRADIENTS, GRADIENT_DIRECTION } from '../tokens/gradients';

interface DailyBriefingCardProps {
  data?: TodayAttentionData | null;
  briefing?: string;
  calculatedAt?: string;
  loading?: boolean;
  onAskCopilot?: () => void;
  onRefresh?: () => void;
}

export function DailyBriefingCard({
  data,
  briefing,
  calculatedAt,
  loading = false,
  onAskCopilot,
  onRefresh,
}: DailyBriefingCardProps) {
  const { tokens, isDark } = useTheme();

  // Sparkle dot pulse animation
  const dotOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 0.5, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const briefingText = briefing || data?.executiveBriefing;
  const timestamp = calculatedAt || data?.calculatedAt;

  if (loading && !briefingText) return null;
  if (!briefingText) return null;

  const cardBg = isDark
    ? ['rgba(0,165,129,0.14)', 'rgba(0,48,81,0.6)'] as [string, string]
    : ['rgba(0,165,129,0.06)', 'rgba(236,253,248,0.9)'] as [string, string];

  const borderColor = isDark ? 'rgba(0,185,148,0.3)' : 'rgba(0,165,129,0.2)';

  return (
    <View style={[styles.wrapper, { borderColor }]}>
      <LinearGradient
        colors={cardBg}
        start={GRADIENT_DIRECTION.toBottomRight.start}
        end={GRADIENT_DIRECTION.toBottomRight.end}
        style={styles.container}
      >
        {/* Header row: AI badge + Ask Copilot button */}
        <View style={styles.headerRow}>
          <View style={styles.badgeContainer}>
            {/* Animated pulse dot */}
            <Animated.View style={[styles.pulseDot, { opacity: dotOpacity }]} />
            <MaterialCommunityIcons name="robot-outline" size={15} color="#00A581" />
            <Text style={styles.badgeText}>AI BUSINESS BRIEFING</Text>
          </View>

          {onAskCopilot && (
            <TouchableOpacity onPress={onAskCopilot} activeOpacity={0.8}>
              <LinearGradient
                colors={GRADIENTS.tealSheen as [string, string]}
                start={GRADIENT_DIRECTION.toRight.start}
                end={GRADIENT_DIRECTION.toRight.end}
                style={styles.copilotButton}
              >
                <Feather name="message-square" size={12} color="#FFFFFF" />
                <Text style={styles.copilotButtonText}>Ask Copilot</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Executive narrative */}
        <Text style={[styles.briefingText, { color: tokens.textPrimary }]}>
          {briefingText}
        </Text>

        {/* Inline metrics (if data object is present) */}
        {data && (
          <View style={[styles.metricsRow, { borderTopColor: isDark ? 'rgba(0,185,148,0.15)' : 'rgba(0,165,129,0.12)' }]}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: tokens.textSecondary }]}>Overdue</Text>
              <Text style={[styles.metricValue, { color: data.totalOverdue > 0 ? '#EF4444' : '#10B981' }]}>
                {data.currency} {data.totalOverdue.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: borderColor }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: tokens.textSecondary }]}>Promises Due</Text>
              <Text style={[styles.metricValue, { color: '#00A581' }]}>
                {data.commitmentsDueCount}{' '}
                <Text style={styles.metricUnit}>({data.currency} {data.commitmentsDueAmount.toLocaleString()})</Text>
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: borderColor }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: tokens.textSecondary }]}>High Risk</Text>
              <Text style={[styles.metricValue, { color: data.highPriorityCount > 0 ? '#F59E0B' : '#10B981' }]}>
                {data.highPriorityCount}
              </Text>
            </View>
          </View>
        )}

        {/* Footer: timestamp */}
        {timestamp && (
          <View style={styles.footerRow}>
            <View style={styles.footerLeft}>
              <Animated.View style={[styles.pulseDot, styles.pulseDotSmall, { opacity: dotOpacity }]} />
              <Text style={[styles.timestampText, { color: tokens.textMuted }]}>
                AI-grounded · Updated{' '}
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            {onRefresh && (
              <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                <Feather name="refresh-cw" size={11} color="#00A581" />
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  container: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00A581',
  },
  pulseDotSmall: {
    width: 5,
    height: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00A581',
    letterSpacing: 1,
  },
  copilotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  copilotButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  briefingText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  metricUnit: {
    fontSize: 10,
    fontWeight: '400',
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00A581',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { TodayAttentionData } from '../../services/api/ai';

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

  const briefingText = briefing || data?.executiveBriefing;
  const timestamp = calculatedAt || data?.calculatedAt;

  if (loading && !briefingText) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(0, 165, 129, 0.08)' : 'rgba(0, 165, 129, 0.05)',
            borderColor: isDark ? 'rgba(0, 165, 129, 0.2)' : 'rgba(0, 165, 129, 0.15)',
          },
        ]}
      >
        <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>
          Analyzing receivables intelligence...
        </Text>
      </View>
    );
  }

  if (!briefingText) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(0, 165, 129, 0.08)' : '#F0FDF8',
          borderColor: isDark ? 'rgba(0, 165, 129, 0.25)' : 'rgba(0, 165, 129, 0.2)',
        },
      ]}
    >
      {/* Header Badge */}
      <View style={styles.headerRow}>
        <View style={styles.badgeContainer}>
          <MaterialCommunityIcons name="robot" size={16} color="#00A581" />
          <Text style={styles.badgeText}>Command Center Daily Briefing</Text>
        </View>

        {onAskCopilot && (
          <TouchableOpacity
            style={[styles.copilotButton, { backgroundColor: '#00A581' }]}
            onPress={onAskCopilot}
            activeOpacity={0.8}
          >
            <Feather name="message-square" size={13} color="#FFFFFF" />
            <Text style={styles.copilotButtonText}>Ask Copilot</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Executive Narrative */}
      <Text style={[styles.briefingText, { color: tokens.textPrimary }]}>
        {briefingText}
      </Text>

      {/* Metrics Row if data is available */}
      {data && (
        <View
          style={[
            styles.metricsRow,
            {
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: tokens.textSecondary }]}>
              Overdue Balance
            </Text>
            <Text style={[styles.metricValue, { color: data.totalOverdue > 0 ? '#EF4444' : '#10B981' }]}>
              {data.currency} {data.totalOverdue.toLocaleString()}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: tokens.textSecondary }]}>
              Promises Due Today
            </Text>
            <Text style={[styles.metricValue, { color: '#00A581' }]}>
              {data.commitmentsDueCount}{' '}
              <Text style={styles.metricUnit}>
                ({data.currency} {data.commitmentsDueAmount.toLocaleString()})
              </Text>
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: tokens.textSecondary }]}>
              Priority Cases
            </Text>
            <Text
              style={[
                styles.metricValue,
                { color: data.highPriorityCount > 0 ? '#F59E0B' : '#10B981' },
              ]}
            >
              {data.highPriorityCount}
            </Text>
          </View>
        </View>
      )}

      {/* Footer Timestamp */}
      {timestamp && (
        <View style={styles.footerRow}>
          <Feather name="clock" size={11} color={tokens.textMuted} />
          <Text style={[styles.timestampText, { color: tokens.textMuted }]}>
            Updated {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {onRefresh && (
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Feather name="refresh-cw" size={11} color="#00A581" />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00A581',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  copilotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  copilotButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  briefingText: {
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    marginBottom: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  metricUnit: {
    fontSize: 10,
    fontWeight: '400',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timestampText: {
    fontSize: 11,
    flex: 1,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00A581',
  },
  loadingText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
});

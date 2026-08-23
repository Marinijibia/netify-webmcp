import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { TodayAttentionData } from '../../services/api/ai';

interface DailyBriefingCardProps {
  data: TodayAttentionData | null;
  loading?: boolean;
  onAskCopilot?: () => void;
  onRefresh?: () => void;
}

export function DailyBriefingCard({
  data,
  loading = false,
  onAskCopilot,
  onRefresh,
}: DailyBriefingCardProps) {
  const { tokens, isDark } = useTheme();

  if (loading && !data) {
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

  if (!data) return null;

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
          <Text style={styles.badgeText}>Collection Copilot Daily Briefing</Text>
        </View>

        {onAskCopilot && (
          <TouchableOpacity
            style={[styles.copilotButton, { backgroundColor: '#00A581' }]}
            onPress={onAskCopilot}
            activeOpacity={0.8}
          >
            <Feather name="message-square" size={13} color="#FFFFFF" />
            <Text style={styles.copilotButtonText}>Ask AI</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Executive Narrative */}
      <Text style={[styles.briefingText, { color: tokens.textPrimary }]}>
        {data.executiveBriefing}
      </Text>

      {/* Metrics Row */}
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
            High Priority
          </Text>
          <View style={styles.priorityCountBadge}>
            <Text style={styles.priorityCountText}>
              {data.highPriorityCount} accounts
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  copilotButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  briefingText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  metricUnit: {
    fontSize: 10,
    fontWeight: '500',
  },
  priorityCountBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityCountText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
});

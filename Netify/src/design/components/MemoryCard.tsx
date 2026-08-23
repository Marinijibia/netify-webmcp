import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import {
  BusinessMemoryItem,
  MemoryCategory,
  businessMemoryApi,
  BusinessMemoryEvidenceItem,
} from '../../services/api/business-memory';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface MemoryCardProps {
  memory: BusinessMemoryItem;
  customerId: string;
}

export function MemoryCard({ memory, customerId }: MemoryCardProps) {
  const { tokens, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [evidenceList, setEvidenceList] = useState<BusinessMemoryEvidenceItem[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  const getCategoryConfig = (category: MemoryCategory) => {
    switch (category) {
      case 'COMMITMENT_BEHAVIOR':
        return {
          label: 'Commitment Behavior',
          iconName: 'handshake-outline' as const,
          iconFamily: 'material' as const,
          badgeColor: '#00A581',
          bgColor: isDark ? 'rgba(0, 165, 129, 0.12)' : 'rgba(0, 165, 129, 0.08)',
        };
      case 'PAYMENT_BEHAVIOR':
        return {
          label: 'Payment Behavior',
          iconName: 'credit-card' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#10B981',
          bgColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
        };
      case 'COLLECTION_BEHAVIOR':
        return {
          label: 'Collection Response',
          iconName: 'message-circle' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#3B82F6',
          bgColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
        };
      case 'RECEIVABLE_HISTORY':
        return {
          label: 'Receivable History',
          iconName: 'file-text' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#F59E0B',
          bgColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
        };
      case 'CUSTOMER_ACTIVITY':
        return {
          label: 'Customer Activity',
          iconName: 'activity' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#8B5CF6',
          bgColor: isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.08)',
        };
      default:
        return {
          label: 'Business Knowledge',
          iconName: 'info' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#6B7280',
          bgColor: isDark ? 'rgba(107, 114, 128, 0.12)' : 'rgba(107, 114, 128, 0.08)',
        };
    }
  };

  const formatWindow = (win: string) => {
    switch (win) {
      case 'LAST_30_DAYS':
        return 'Last 30 days';
      case 'LAST_90_DAYS':
        return 'Last 90 days';
      case 'LAST_180_DAYS':
        return 'Last 180 days';
      case 'ALL_TIME':
        return 'All time';
      default:
        return win;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const toggleEvidence = async () => {
    if (!expanded && evidenceList.length === 0) {
      setLoadingEvidence(true);
      try {
        const res = await businessMemoryApi.getMemoryEvidence(customerId, memory.id, {
          pageSize: 20,
        });
        if (res.data) {
          setEvidenceList(res.data);
        }
      } catch (err) {
        console.error('Failed to load memory evidence:', err);
      } finally {
        setLoadingEvidence(false);
      }
    }
    setExpanded(!expanded);
  };

  const catConfig = getCategoryConfig(memory.category);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? tokens.surface : '#FFFFFF',
          borderColor: tokens.border,
        },
      ]}
    >
      {/* Category & Time Window Bar */}
      <View style={styles.topRow}>
        <View style={[styles.categoryBadge, { backgroundColor: catConfig.bgColor }]}>
          {catConfig.iconFamily === 'material' ? (
            <MaterialCommunityIcons
              name={catConfig.iconName as any}
              size={14}
              color={catConfig.badgeColor}
              style={{ marginRight: 4 }}
            />
          ) : (
            <Feather
              name={catConfig.iconName as any}
              size={13}
              color={catConfig.badgeColor}
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={[styles.categoryText, { color: catConfig.badgeColor }]}>
            {catConfig.label}
          </Text>
        </View>

        <View
          style={[
            styles.windowChip,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
            },
          ]}
        >
          <Text style={[styles.windowText, { color: tokens.textSecondary }]}>
            {formatWindow(memory.timeWindow)}
          </Text>
        </View>
      </View>

      {/* Memory Statement */}
      <Text style={[styles.statement, { color: tokens.textPrimary }]}>
        {memory.statement}
      </Text>

      {/* Structured Metrics Row if available */}
      {memory.value && (
        <View style={styles.metricsRow}>
          {memory.value.rate !== undefined && (
            <View
              style={[
                styles.metricPill,
                {
                  backgroundColor: isDark ? 'rgba(0, 165, 129, 0.15)' : 'rgba(0, 165, 129, 0.1)',
                },
              ]}
            >
              <Text style={[styles.metricPillLabel, { color: tokens.primary }]}>
                {Math.round(memory.value.rate * 100)}%
              </Text>
              <Text style={[styles.metricPillSub, { color: tokens.textSecondary }]}>
                Rate
              </Text>
            </View>
          )}

          {memory.value.averageDaysDifference !== undefined && (
            <View
              style={[
                styles.metricPill,
                {
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                },
              ]}
            >
              <Text style={[styles.metricPillLabel, { color: '#3B82F6' }]}>
                {memory.value.averageDaysDifference > 0
                  ? `+${memory.value.averageDaysDifference}d`
                  : `${memory.value.averageDaysDifference}d`}
              </Text>
              <Text style={[styles.metricPillSub, { color: tokens.textSecondary }]}>
                Avg Delay
              </Text>
            </View>
          )}

          {memory.value.channel && (
            <View
              style={[
                styles.metricPill,
                {
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                },
              ]}
            >
              <Text style={[styles.metricPillLabel, { color: '#8B5CF6' }]}>
                {memory.value.channel.replace(/_/g, ' ')}
              </Text>
              <Text style={[styles.metricPillSub, { color: tokens.textSecondary }]}>
                Channel
              </Text>
            </View>
          )}

          {memory.currency && (
            <View
              style={[
                styles.metricPill,
                {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                },
              ]}
            >
              <Text style={[styles.metricPillLabel, { color: '#F59E0B' }]}>
                {memory.currency}
              </Text>
              <Text style={[styles.metricPillSub, { color: tokens.textSecondary }]}>
                Currency
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Observation Timeline Bar */}
      <View style={styles.observationRow}>
        <Feather name="clock" size={12} color={tokens.textSecondary} style={{ marginRight: 4 }} />
        <Text style={[styles.observationText, { color: tokens.textSecondary }]}>
          Evidence observed: {formatDate(memory.firstObservedAt)} – {formatDate(memory.lastObservedAt)}
        </Text>
      </View>

      {/* "Why do you know this?" Evidence Button */}
      <TouchableOpacity
        style={[
          styles.evidenceButton,
          {
            borderColor: tokens.border,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          },
        ]}
        onPress={toggleEvidence}
        activeOpacity={0.7}
      >
        <View style={styles.evidenceBtnLeft}>
          <Feather
            name="layers"
            size={14}
            color={tokens.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.evidenceBtnText, { color: tokens.primary }]}>
            Why do you know this?
          </Text>
          <View
            style={[
              styles.evidenceCountBadge,
              {
                backgroundColor: isDark ? 'rgba(0, 165, 129, 0.2)' : 'rgba(0, 165, 129, 0.12)',
              },
            ]}
          >
            <Text style={[styles.evidenceCountText, { color: tokens.primary }]}>
              {memory.evidenceCount || 0} events
            </Text>
          </View>
        </View>

        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={tokens.textSecondary}
        />
      </TouchableOpacity>

      {/* Expanded Evidence List */}
      {expanded && (
        <View
          style={[
            styles.evidenceContainer,
            {
              borderTopColor: tokens.border,
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.015)',
            },
          ]}
        >
          <Text style={[styles.evidenceHeader, { color: tokens.textSecondary }]}>
            SUPPORTING BUSINESS EVENTS EVIDENCE
          </Text>

          {loadingEvidence ? (
            <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>
              Loading evidence records...
            </Text>
          ) : evidenceList.length === 0 ? (
            <Text style={[styles.emptyEvidenceText, { color: tokens.textSecondary }]}>
              No direct event references available.
            </Text>
          ) : (
            evidenceList.map((item, idx) => {
              const evt = item.businessEvent;
              if (!evt) return null;
              return (
                <View
                  key={item.id || idx}
                  style={[
                    styles.evidenceItem,
                    {
                      borderBottomColor:
                        idx === evidenceList.length - 1 ? 'transparent' : tokens.border,
                    },
                  ]}
                >
                  <View style={styles.evidenceDot} />
                  <View style={styles.evidenceItemContent}>
                    <View style={styles.evidenceItemTop}>
                      <Text style={[styles.evidenceItemType, { color: tokens.textPrimary }]}>
                        {evt.type.replace(/_/g, ' ')}
                      </Text>
                      <Text
                        style={[
                          styles.evidenceItemDate,
                          { color: tokens.textSecondary },
                        ]}
                      >
                        {formatDate(evt.occurredAt)}
                      </Text>
                    </View>

                    {evt.data && Object.keys(evt.data).length > 0 && (
                      <Text
                        style={[
                          styles.evidenceItemSnippet,
                          { color: tokens.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {evt.data.amount
                          ? `Amount: ${evt.data.currency || 'NGN'} ${Number(evt.data.amount).toLocaleString()}`
                          : evt.data.outcome
                          ? `Outcome: ${evt.data.outcome.replace(/_/g, ' ')}`
                          : evt.data.reference
                          ? `Ref: ${evt.data.reference}`
                          : JSON.stringify(evt.data)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  windowChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  windowText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statement: {
    fontSize: 14.5,
    fontWeight: '600',
    lineHeight: 21,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metricPillLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricPillSub: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  observationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  observationText: {
    fontSize: 11.5,
    fontWeight: '400',
  },
  evidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  evidenceBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  evidenceBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    marginRight: 8,
  },
  evidenceCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  evidenceCountText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  evidenceContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  evidenceHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  emptyEvidenceText: {
    fontSize: 12,
    paddingVertical: 6,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  evidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00A581',
    marginTop: 6,
    marginRight: 8,
  },
  evidenceItemContent: {
    flex: 1,
  },
  evidenceItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  evidenceItemType: {
    fontSize: 12,
    fontWeight: '600',
  },
  evidenceItemDate: {
    fontSize: 11,
  },
  evidenceItemSnippet: {
    fontSize: 11.5,
    marginTop: 2,
  },
});

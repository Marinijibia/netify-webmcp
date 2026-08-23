import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { BusinessEventItem, BusinessEventType } from '../../services/api/business-events';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface TimelineEventCardProps {
  event: BusinessEventItem;
  isLast?: boolean;
}

export function TimelineEventCard({ event, isLast = false }: TimelineEventCardProps) {
  const { tokens, isDark } = useTheme();

  const getEventConfig = (type: BusinessEventType) => {
    switch (type) {
      case 'PAYMENT_CONFIRMED':
        return {
          title: 'Payment Received',
          iconName: 'check-circle' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#10B981',
          bgColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
        };
      case 'PAYMENT_REVERSED':
        return {
          title: 'Payment Reversed',
          iconName: 'rotate-ccw' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#F59E0B',
          bgColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
        };
      case 'RECEIVABLE_CREATED':
        return {
          title: 'Receivable Issued',
          iconName: 'file-plus' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#00A581',
          bgColor: isDark ? 'rgba(0, 165, 129, 0.12)' : 'rgba(0, 165, 129, 0.08)',
        };
      case 'RECEIVABLE_PAID':
        return {
          title: 'Receivable Fully Settled',
          iconName: 'award' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#10B981',
          bgColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
        };
      case 'RECEIVABLE_PARTIALLY_PAID':
        return {
          title: 'Partial Payment Settled',
          iconName: 'pie-chart' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#3B82F6',
          bgColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
        };
      case 'RECEIVABLE_CANCELLED':
        return {
          title: 'Receivable Cancelled',
          iconName: 'slash' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#6B7280',
          bgColor: isDark ? 'rgba(107, 114, 128, 0.12)' : 'rgba(107, 114, 128, 0.08)',
        };
      case 'RECEIVABLE_OVERDUE':
        return {
          title: 'Receivable Overdue',
          iconName: 'alert-triangle' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#EF4444',
          bgColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
        };
      case 'COLLECTION_ACTIVITY_RECORDED':
        return {
          title: 'Collection Follow-up',
          iconName: 'phone-call' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#8B5CF6',
          bgColor: isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.08)',
        };
      case 'PAYMENT_COMMITMENT_CREATED':
        return {
          title: 'Payment Promise Recorded',
          iconName: 'calendar' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#6366F1',
          bgColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
        };
      case 'PAYMENT_COMMITMENT_FULFILLED':
        return {
          title: 'Payment Promise Fulfilled',
          iconName: 'check-circle' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#10B981',
          bgColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
        };
      case 'PAYMENT_COMMITMENT_PARTIALLY_FULFILLED':
        return {
          title: 'Promise Partially Met',
          iconName: 'clock' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#F59E0B',
          bgColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
        };
      case 'PAYMENT_COMMITMENT_MISSED':
        return {
          title: 'Payment Promise Missed',
          iconName: 'x-circle' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#EF4444',
          bgColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
        };
      case 'PAYMENT_COMMITMENT_CANCELLED':
        return {
          title: 'Payment Promise Cancelled',
          iconName: 'x' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#6B7280',
          bgColor: isDark ? 'rgba(107, 114, 128, 0.12)' : 'rgba(107, 114, 128, 0.08)',
        };
      case 'CUSTOMER_CREATED':
        return {
          title: 'Customer Added',
          iconName: 'user-plus' as const,
          iconFamily: 'feather' as const,
          badgeColor: '#0EA5E9',
          bgColor: isDark ? 'rgba(14, 165, 233, 0.12)' : 'rgba(14, 165, 233, 0.08)',
        };
      default:
        return {
          title: 'Business Event',
          iconName: 'activity' as const,
          iconFamily: 'feather' as const,
          badgeColor: tokens.primary,
          bgColor: isDark ? 'rgba(0, 48, 81, 0.2)' : 'rgba(0, 48, 81, 0.08)',
        };
    }
  };

  const config = getEventConfig(event.type);

  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatAmount = (numStr?: string | number) => {
    if (!numStr) return '';
    const num = typeof numStr === 'number' ? numStr : parseFloat(numStr);
    if (isNaN(num)) return numStr.toString();
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const renderEventDetails = () => {
    const d = event.data || {};

    if (event.type === 'PAYMENT_CONFIRMED') {
      return (
        <View style={styles.detailRow}>
          <Text style={[styles.amountText, { color: '#10B981' }]}>
            +{d.currency || 'NGN'} {formatAmount(d.amount)}
          </Text>
          {d.method && (
            <Text style={[styles.methodBadge, { color: tokens.textSecondary }]}>
              • {d.method.replace('_', ' ')}
            </Text>
          )}
          {d.reference && (
            <Text style={[styles.subdetailText, { color: tokens.textSecondary }]}>
              Ref: {d.reference}
            </Text>
          )}
        </View>
      );
    }

    if (event.type === 'PAYMENT_REVERSED') {
      return (
        <View style={styles.detailRow}>
          <Text style={[styles.amountText, { color: '#F59E0B' }]}>
            -{d.currency || 'NGN'} {formatAmount(d.amount)}
          </Text>
          {d.originalReference && (
            <Text style={[styles.subdetailText, { color: tokens.textSecondary }]}>
              Ref: {d.originalReference}
            </Text>
          )}
        </View>
      );
    }

    if (event.type === 'RECEIVABLE_CREATED') {
      return (
        <View style={styles.detailRow}>
          <Text style={[styles.amountText, { color: tokens.textPrimary }]}>
            {d.currency || 'NGN'} {formatAmount(d.originalAmount)}
          </Text>
          {d.reference && (
            <Text style={[styles.subdetailText, { color: tokens.textSecondary }]}>
              Ref: {d.reference}
            </Text>
          )}
          {d.dueDate && (
            <Text style={[styles.subdetailText, { color: tokens.textSecondary }]}>
              Due: {new Date(d.dueDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      );
    }

    if (
      event.type === 'PAYMENT_COMMITMENT_CREATED' ||
      event.type === 'PAYMENT_COMMITMENT_FULFILLED' ||
      event.type === 'PAYMENT_COMMITMENT_PARTIALLY_FULFILLED' ||
      event.type === 'PAYMENT_COMMITMENT_MISSED'
    ) {
      return (
        <View style={styles.detailRow}>
          {d.amount && (
            <Text style={[styles.amountText, { color: config.badgeColor }]}>
              {d.currency || 'NGN'} {formatAmount(d.amount)}
            </Text>
          )}
          {d.promisedFor && (
            <Text style={[styles.subdetailText, { color: tokens.textSecondary }]}>
              Promised: {new Date(d.promisedFor).toLocaleDateString()}
            </Text>
          )}
        </View>
      );
    }

    if (event.type === 'COLLECTION_ACTIVITY_RECORDED') {
      return (
        <View style={styles.detailColumn}>
          <View style={styles.channelRow}>
            {d.channel && (
              <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Text style={[styles.pillText, { color: tokens.textPrimary }]}>
                  {d.channel}
                </Text>
              </View>
            )}
            {d.outcome && (
              <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)' }]}>
                <Text style={[styles.pillText, { color: '#8B5CF6' }]}>
                  {d.outcome.replace(/_/g, ' ')}
                </Text>
              </View>
            )}
          </View>
          {d.notes ? (
            <Text style={[styles.notesText, { color: tokens.textSecondary }]} numberOfLines={2}>
              {d.notes}
            </Text>
          ) : null}
        </View>
      );
    }

    if (event.type === 'CUSTOMER_CREATED') {
      return (
        <View style={styles.detailRow}>
          <Text style={[styles.subdetailText, { color: tokens.textSecondary }]}>
            {d.name} ({d.currency || 'NGN'})
          </Text>
        </View>
      );
    }

    return null;
  };

  const getActorLabel = () => {
    if (event.actorUser) {
      const first = event.actorUser.firstName || '';
      const last = event.actorUser.lastName || '';
      return `${first} ${last}`.trim() || 'User Action';
    }
    if (event.actorType === 'SYSTEM') {
      return 'System Automated';
    }
    return 'User Action';
  };

  return (
    <View style={styles.container}>
      {/* Left Timeline Rail */}
      <View style={styles.railContainer}>
        <View style={[styles.iconCircle, { backgroundColor: config.bgColor, borderColor: config.badgeColor }]}>
          <Feather name={config.iconName} size={15} color={config.badgeColor} />
        </View>
        {!isLast && <View style={[styles.line, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />}
      </View>

      {/* Right Content Card */}
      <View style={[styles.card, { backgroundColor: isDark ? tokens.surface : '#FFFFFF', borderColor: isDark ? tokens.border : 'rgba(0,0,0,0.06)' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>{config.title}</Text>
          <Text style={[styles.dateText, { color: tokens.textSecondary }]}>
            {formatEventDate(event.occurredAt)}
          </Text>
        </View>

        {renderEventDetails()}

        <View style={styles.cardFooter}>
          <View style={styles.actorRow}>
            <Feather name={event.actorType === 'SYSTEM' ? 'cpu' : 'user'} size={11} color={tokens.textSecondary} />
            <Text style={[styles.actorText, { color: tokens.textSecondary }]}>
              {getActorLabel()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  railContainer: {
    width: 32,
    alignItems: 'center',
    paddingTop: 4,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: -4,
  },
  card: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detailColumn: {
    marginBottom: 6,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  methodBadge: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  subdetailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  channelRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actorText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

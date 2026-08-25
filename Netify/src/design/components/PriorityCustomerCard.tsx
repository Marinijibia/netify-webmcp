import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PriorityCustomerItem, AIUrgencyLevel } from '../../services/api/ai';
import { Avatar } from './Avatar';

interface PriorityCustomerCardProps {
  customer: PriorityCustomerItem;
  onPress: () => void;
  onQuickMessage?: () => void;
}

export function PriorityCustomerCard({ customer, onPress, onQuickMessage }: PriorityCustomerCardProps) {
  const { tokens, isDark } = useTheme();

  const getUrgencyConfig = (urgency: AIUrgencyLevel) => {
    switch (urgency) {
      case 'HIGH':
        return {
          label: 'HIGH',
          stripeColor: '#EF4444',
          badgeBg: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
          badgeColor: '#EF4444',
        };
      case 'MEDIUM':
        return {
          label: 'MED',
          stripeColor: '#F59E0B',
          badgeBg: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.1)',
          badgeColor: '#F59E0B',
        };
      default:
        return {
          label: 'LOW',
          stripeColor: '#64748B',
          badgeBg: isDark ? 'rgba(100,116,139,0.2)' : 'rgba(100,116,139,0.1)',
          badgeColor: '#64748B',
        };
    }
  };

  const urgencyConfig = getUrgencyConfig(customer.urgency);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Left urgency stripe */}
      <View style={[styles.stripe, { backgroundColor: urgencyConfig.stripeColor }]} />

      <View style={styles.inner}>
        {/* Header row: Avatar + Name + Urgency Badge */}
        <View style={styles.headerRow}>
          <Avatar name={customer.customerName} size="sm" />
          <View style={styles.nameBlock}>
            <Text style={[styles.customerName, { color: tokens.textPrimary }]} numberOfLines={1}>
              {customer.customerName}
            </Text>
            <View style={styles.scoreRow}>
              <MaterialCommunityIcons name="target" size={11} color="#00A581" />
              <Text style={[styles.scoreText, { color: tokens.textSecondary }]}>
                Score: <Text style={styles.scoreValue}>{customer.priorityScore}</Text>/100
              </Text>
            </View>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyConfig.badgeBg }]}>
            <Text style={[styles.urgencyText, { color: urgencyConfig.badgeColor }]}>
              {urgencyConfig.label}
            </Text>
          </View>
        </View>

        {/* Financial row */}
        <View style={styles.financialRow}>
          <View>
            <Text style={[styles.amountLabel, { color: tokens.textMuted }]}>Outstanding</Text>
            <Text style={[styles.amountValue, { color: tokens.textPrimary }]}>
              {customer.currency} {customer.totalOutstanding.toLocaleString()}
            </Text>
          </View>

          {customer.totalOverdue > 0 && (
            <View style={[styles.overdueChip, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.07)' }]}>
              <MaterialCommunityIcons name="clock-alert-outline" size={12} color="#EF4444" />
              <Text style={styles.overdueChipText}>
                {customer.currency} {customer.totalOverdue.toLocaleString()} overdue
              </Text>
            </View>
          )}
        </View>

        {/* Reason bullets */}
        {customer.reasons.length > 0 && (
          <View style={[styles.reasonsContainer, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
          }]}>
            {customer.reasons.slice(0, 2).map((reason, idx) => (
              <View key={idx} style={styles.reasonItem}>
                <View style={[styles.reasonDot, { backgroundColor: urgencyConfig.stripeColor }]} />
                <Text style={[styles.reasonText, { color: tokens.textSecondary }]} numberOfLines={1}>
                  {reason}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footerRow}>
          <View style={styles.viewInsightsRow}>
            <Text style={styles.viewInsightsText}>View Copilot Insights</Text>
            <Feather name="chevron-right" size={13} color="#00A581" />
          </View>

          {onQuickMessage && (
            <TouchableOpacity
              style={[styles.draftBtn, { backgroundColor: isDark ? 'rgba(0,165,129,0.15)' : 'rgba(0,165,129,0.08)' }]}
              onPress={(e) => { e.stopPropagation(); onQuickMessage(); }}
              activeOpacity={0.8}
            >
              <Feather name="send" size={11} color="#00A581" />
              <Text style={styles.draftBtnText}>Draft</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  stripe: {
    width: 4,
  },
  inner: {
    flex: 1,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  nameBlock: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '500',
  },
  scoreValue: {
    fontWeight: '800',
    color: '#00A581',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  overdueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  overdueChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  reasonsContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    gap: 5,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  reasonDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  viewInsightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewInsightsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00A581',
  },
  draftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  draftBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00A581',
  },
});

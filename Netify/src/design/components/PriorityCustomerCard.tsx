import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PriorityCustomerItem, AIUrgencyLevel } from '../../services/api/ai';

interface PriorityCustomerCardProps {
  customer: PriorityCustomerItem;
  onPress: () => void;
  onQuickMessage?: () => void;
}

export function PriorityCustomerCard({
  customer,
  onPress,
  onQuickMessage,
}: PriorityCustomerCardProps) {
  const { tokens, isDark } = useTheme();

  const getUrgencyConfig = (urgency: AIUrgencyLevel) => {
    switch (urgency) {
      case 'HIGH':
        return {
          label: 'HIGH PRIORITY',
          badgeBg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
          badgeColor: '#EF4444',
          borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
        };
      case 'MEDIUM':
        return {
          label: 'MEDIUM PRIORITY',
          badgeBg: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
          badgeColor: '#F59E0B',
          borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)',
        };
      case 'LOW':
      default:
        return {
          label: 'LOW PRIORITY',
          badgeBg: isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(100, 116, 139, 0.1)',
          badgeColor: '#64748B',
          borderColor: isDark ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.2)',
        };
    }
  };

  const urgencyConfig = getUrgencyConfig(customer.urgency);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: tokens.surface,
          borderColor: urgencyConfig.borderColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top Row: Customer Name & Urgency Pill */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text
            style={[styles.customerName, { color: tokens.textPrimary }]}
            numberOfLines={1}
          >
            {customer.customerName}
          </Text>
          <View style={styles.scoreRow}>
            <MaterialCommunityIcons name="target" size={12} color="#00A581" />
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

      {/* Financial Numbers */}
      <View style={styles.financialRow}>
        <View>
          <Text style={[styles.amountLabel, { color: tokens.textSecondary }]}>
            Total Outstanding
          </Text>
          <Text style={[styles.amountValue, { color: tokens.textPrimary }]}>
            {customer.currency} {customer.totalOutstanding.toLocaleString()}
          </Text>
        </View>

        {customer.totalOverdue > 0 && (
          <View style={styles.overdueContainer}>
            <Text style={styles.overdueLabel}>Overdue</Text>
            <Text style={styles.overdueValue}>
              {customer.currency} {customer.totalOverdue.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Deterministic Reason Bullets */}
      {customer.reasons.length > 0 && (
        <View
          style={[
            styles.reasonsContainer,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
            },
          ]}
        >
          {customer.reasons.slice(0, 2).map((reason, idx) => (
            <View key={idx} style={styles.reasonItem}>
              <Feather name="alert-circle" size={12} color={urgencyConfig.badgeColor} />
              <Text
                style={[styles.reasonText, { color: tokens.textSecondary }]}
                numberOfLines={1}
              >
                {reason}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer Quick Action */}
      <View style={styles.footerRow}>
        <View style={styles.viewInsightsRow}>
          <Text style={styles.viewInsightsText}>View Copilot Insights</Text>
          <Feather name="chevron-right" size={14} color="#00A581" />
        </View>

        {onQuickMessage && (
          <TouchableOpacity
            style={[styles.messageButton, { backgroundColor: isDark ? 'rgba(0, 165, 129, 0.15)' : 'rgba(0, 165, 129, 0.1)' }]}
            onPress={(e) => {
              e.stopPropagation();
              onQuickMessage();
            }}
            activeOpacity={0.8}
          >
            <Feather name="send" size={12} color="#00A581" />
            <Text style={styles.messageButtonText}>Draft</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
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
    fontWeight: '700',
    color: '#00A581',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 9,
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
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  overdueContainer: {
    alignItems: 'flex-end',
  },
  overdueLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#EF4444',
  },
  overdueValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 1,
  },
  reasonsContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    gap: 4,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    gap: 4,
  },
  viewInsightsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00A581',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00A581',
  },
});

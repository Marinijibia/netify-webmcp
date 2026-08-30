import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../theme';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PriorityCustomerItem, AIUrgencyLevel } from '../../services/api/ai';
import { Avatar } from './Avatar';
import { useLanguageStore } from '../../store/language-store';

interface FollowUpCustomerCardProps {
  customer: PriorityCustomerItem;
  onPress: () => void;
  onCall?: () => void;
  onWhatsApp?: () => void;
  onAiDraft?: () => void;
  onRecordPromise?: () => void;
}

export function FollowUpCustomerCard({
  customer,
  onPress,
  onCall,
  onWhatsApp,
  onAiDraft,
  onRecordPromise,
}: FollowUpCustomerCardProps) {
  const { tokens, isDark } = useTheme();
  const { t } = useLanguageStore();

  const getUrgencyConfig = (urgency: AIUrgencyLevel, score: number, brokenCount: number) => {
    if (brokenCount > 0 || urgency === 'HIGH' || score >= 75) {
      return {
        label: brokenCount > 0 ? 'BROKEN PROMISE' : 'HIGH URGENCY',
        stripeColor: '#EF4444',
        badgeBg: isDark ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.12)',
        badgeColor: '#EF4444',
        badgeBorder: 'rgba(239,68,68,0.3)',
      };
    }
    if (urgency === 'MEDIUM' || score >= 50) {
      return {
        label: 'MEDIUM RISK',
        stripeColor: '#F59E0B',
        badgeBg: isDark ? 'rgba(245,158,11,0.22)' : 'rgba(245,158,11,0.12)',
        badgeColor: '#F59E0B',
        badgeBorder: 'rgba(245,158,11,0.3)',
      };
    }
    return {
      label: 'MONITORING',
      stripeColor: '#00A581',
      badgeBg: isDark ? 'rgba(0,165,129,0.22)' : 'rgba(0,165,129,0.12)',
      badgeColor: '#00A581',
      badgeBorder: 'rgba(0,165,129,0.3)',
    };
  };

  const urgencyConfig = getUrgencyConfig(
    customer.urgency,
    customer.priorityScore,
    customer.missedCommitmentsCount || 0
  );

  const handleCall = () => {
    if (onCall) {
      onCall();
    } else if (customer.phone) {
      const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
      Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
    }
  };

  const handleWhatsApp = () => {
    if (onWhatsApp) {
      onWhatsApp();
    } else if (customer.phone) {
      const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
      const msg = encodeURIComponent(
        `Hello ${customer.customerName}, this is a courtesy follow-up from our accounts team regarding your invoice balance of ${customer.currency} ${customer.totalOutstanding.toLocaleString()}. Kindly let us know if payment has been arranged.`
      );
      Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`).catch(() => {});
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: tokens.surface,
          borderColor: tokens.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Dynamic Urgency Left Stripe */}
      <View style={[styles.stripe, { backgroundColor: urgencyConfig.stripeColor }]} />

      <View style={styles.content}>
        {/* Top: Avatar, Name, Phone & Urgency Badge */}
        <View style={styles.headerRow}>
          <Avatar name={customer.customerName} size="md" />
          <View style={styles.nameContainer}>
            <Text style={[styles.customerName, { color: tokens.textPrimary }]} numberOfLines={1}>
              {customer.customerName}
            </Text>
            <View style={styles.contactRow}>
              {customer.phone ? (
                <Text style={[styles.contactText, { color: tokens.textSecondary }]} numberOfLines={1}>
                  {customer.phone}
                </Text>
              ) : (
                <Text style={[styles.contactText, { color: tokens.textMuted }]}>No phone recorded</Text>
              )}
            </View>
          </View>

          <View
            style={[
              styles.urgencyBadge,
              {
                backgroundColor: urgencyConfig.badgeBg,
                borderColor: urgencyConfig.badgeBorder,
              },
            ]}
          >
            <Text style={[styles.urgencyText, { color: urgencyConfig.badgeColor }]}>
              {urgencyConfig.label}
            </Text>
            <Text style={[styles.scorePill, { color: urgencyConfig.badgeColor }]}>
              {customer.priorityScore}
            </Text>
          </View>
        </View>

        {/* Financial & Status Metrics */}
        <View style={[styles.metricsContainer, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }]}>
          <View style={styles.metricColumn}>
            <Text style={[styles.metricLabel, { color: tokens.textMuted }]}>Outstanding</Text>
            <Text style={[styles.metricValue, { color: tokens.textPrimary }]}>
              {customer.currency} {customer.totalOutstanding.toLocaleString()}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricColumn}>
            <Text style={[styles.metricLabel, { color: tokens.textMuted }]}>Overdue Days</Text>
            <View style={styles.overdueRow}>
              <MaterialCommunityIcons
                name="clock-alert-outline"
                size={13}
                color={customer.oldestOverdueDays > 30 ? '#EF4444' : tokens.textSecondary}
              />
              <Text
                style={[
                  styles.overdueValue,
                  { color: customer.oldestOverdueDays > 30 ? '#EF4444' : tokens.textPrimary },
                ]}
              >
                {customer.oldestOverdueDays} days
              </Text>
            </View>
          </View>
        </View>

        {/* Broken Promise Banner */}
        {customer.missedCommitmentsCount > 0 && (
          <View style={[styles.brokenPromiseAlert, { backgroundColor: isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.08)' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#EF4444" />
            <Text style={styles.brokenPromiseText}>
              {customer.missedCommitmentsCount} broken payment promise{customer.missedCommitmentsCount > 1 ? 's' : ''} detected
            </Text>
          </View>
        )}

        {/* AI Reasons Snippet */}
        {customer.reasons && customer.reasons.length > 0 && (
          <View style={styles.reasonsList}>
            {customer.reasons.slice(0, 1).map((reason, idx) => (
              <View key={idx} style={styles.reasonRow}>
                <View style={[styles.reasonDot, { backgroundColor: urgencyConfig.stripeColor }]} />
                <Text style={[styles.reasonText, { color: tokens.textSecondary }]} numberOfLines={1}>
                  {reason}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 1-Tap Action Toolbar */}
        <View style={styles.actionsToolbar}>
          {/* Call Button */}
          {customer.phone && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(0,165,129,0.14)' : 'rgba(0,165,129,0.08)', borderColor: 'rgba(0,165,129,0.3)' }]}
              onPress={(e) => {
                e.stopPropagation();
                handleCall();
              }}
              activeOpacity={0.75}
            >
              <Feather name="phone" size={13} color="#00A581" />
              <Text style={[styles.actionBtnText, { color: '#00A581' }]}>{t('common.call')}</Text>
            </TouchableOpacity>
          )}

          {/* WhatsApp Button */}
          {customer.phone && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(34,197,94,0.14)' : 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)' }]}
              onPress={(e) => {
                e.stopPropagation();
                handleWhatsApp();
              }}
              activeOpacity={0.75}
            >
              <Ionicons name="logo-whatsapp" size={13} color="#22C55E" />
              <Text style={[styles.actionBtnText, { color: '#22C55E' }]}>{t('common.whatsApp')}</Text>
            </TouchableOpacity>
          )}

          {/* AI Draft Button */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.16)' : 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.35)' }]}
            onPress={(e) => {
              e.stopPropagation();
              onAiDraft?.();
            }}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="robot-outline" size={14} color="#6366F1" />
            <Text style={[styles.actionBtnText, { color: '#6366F1' }]}>{t('commandCenter.askAI')}</Text>
          </TouchableOpacity>

          {/* Promise Button */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(245,158,11,0.14)' : 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }]}
            onPress={(e) => {
              e.stopPropagation();
              onRecordPromise?.();
            }}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="handshake-outline" size={13} color="#F59E0B" />
            <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>{t('commandCenter.promisesAction')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  stripe: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  nameContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 12,
    fontWeight: '500',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  scorePill: {
    fontSize: 10,
    fontWeight: '900',
    opacity: 0.85,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  metricColumn: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(150,150,150,0.2)',
    marginHorizontal: 8,
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  overdueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overdueValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  brokenPromiseAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  brokenPromiseText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  reasonsList: {
    marginBottom: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reasonDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  actionsToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    paddingTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

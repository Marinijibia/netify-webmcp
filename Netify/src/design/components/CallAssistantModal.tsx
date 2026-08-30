import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme';
import { useLanguageStore } from '../../store/language-store';
import { openDialer, formatDisplayPhone } from '../../lib/deeplink';
import { receivablesApi, ReceivableItem } from '../../services/api/receivables';
import { collectionActivitiesApi } from '../../services/api/collection-activities';
import { commitmentsApi } from '../../services/api/commitments';

export interface CallAssistantCustomerInfo {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  currency?: string;
  totalOutstanding?: number;
  oldestOverdueDays?: number;
  riskLevel?: string;
}

interface CallAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CallAssistantCustomerInfo | null;
  scriptText?: string;
  onActionComplete?: (notes: string) => void;
}

type CallOutcomeType = 'PROMISED' | 'CALLBACK' | 'NO_ANSWER' | 'DISPUTED';

export function CallAssistantModal({
  isOpen,
  onClose,
  customer,
  scriptText,
  onActionComplete,
}: CallAssistantModalProps) {
  const { tokens, isDark } = useTheme();
  const { t } = useLanguageStore();

  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcomeType | null>(null);
  const [promisedAmount, setPromisedAmount] = useState<string>('');
  const [promiseDays, setPromiseDays] = useState<number>(3);
  const [callNotes, setCallNotes] = useState<string>('');
  const [showScript, setShowScript] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync default promised amount
  useEffect(() => {
    if (customer?.totalOutstanding) {
      setPromisedAmount(String(customer.totalOutstanding));
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleDialNow = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    await openDialer(customer.phone);
  };

  const getCalculatedDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleSaveOutcome = async () => {
    if (!selectedOutcome) {
      Alert.alert('Select Outcome', 'Please tap a call outcome button before saving.');
      return;
    }

    if (selectedOutcome === 'PROMISED') {
      const amt = parseFloat(promisedAmount);
      if (isNaN(amt) || amt <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid positive promised amount.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Resolve target receivable
      let targetRecId: string | undefined;
      try {
        const recsRes = await receivablesApi.list({ customerId: customer.id });
        const list: ReceivableItem[] = Array.isArray(recsRes.data)
          ? recsRes.data
          : (recsRes.data as any)?.items || [];
        const openRec =
          list.find((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_PAID' || r.status === 'OVERDUE') ||
          list[0];
        targetRecId = openRec?.id;
      } catch (e) {
        console.warn('Could not query receivables:', e);
      }

      // Auto-create initial receivable if debtor has no invoice on file
      if (!targetRecId) {
        try {
          const newRecRes = await receivablesApi.create({
            customerId: customer.id,
            amount: Number(customer.totalOutstanding || promisedAmount || 100000),
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
            currency: customer.currency || 'NGN',
            description: 'Direct call follow-up ledger',
            reference: `INV-${Date.now().toString().slice(-4)}`,
          });
          targetRecId = newRecRes.data?.id;
        } catch (e) {
          console.warn('Could not auto-create fallback receivable:', e);
        }
      }

      // Outcome labels
      let outcomeLabel: any = 'CONTACTED';
      let outcomeText = '';

      if (selectedOutcome === 'PROMISED') {
        outcomeLabel = 'PROMISED_PAYMENT';
        outcomeText = `Customer promised payment of ${customer.currency || '₦'}${Number(promisedAmount).toLocaleString()} for ${getCalculatedDate(promiseDays)}. Notes: ${callNotes || 'Verbal promise on call'}`;
      } else if (selectedOutcome === 'CALLBACK') {
        outcomeLabel = 'REQUESTED_EXTENSION';
        outcomeText = `Customer requested callback / extension. Notes: ${callNotes || 'Customer was busy'}`;
      } else if (selectedOutcome === 'NO_ANSWER') {
        outcomeLabel = 'NO_RESPONSE';
        outcomeText = `Called customer line (${customer.phone || 'N/A'}), no answer / switched off.`;
      } else if (selectedOutcome === 'DISPUTED') {
        outcomeLabel = 'DISPUTE';
        outcomeText = `Customer disputed invoice balance during phone call. Notes: ${callNotes || 'Dispute raised'}`;
      }

      // Log collection activity
      if (targetRecId) {
        await collectionActivitiesApi.createActivity({
          receivableId: targetRecId,
          customerId: customer.id,
          type: 'CALL',
          channel: 'PHONE',
          outcome: outcomeLabel,
          notes: outcomeText,
        });
      }

      // If promise was made, create formal commitment
      if (selectedOutcome === 'PROMISED' && targetRecId) {
        try {
          await commitmentsApi.createCommitment({
            receivableId: targetRecId,
            customerId: customer.id,
            amount: Number(promisedAmount),
            currency: customer.currency || 'NGN',
            promisedFor: new Date(Date.now() + 86400000 * promiseDays).toISOString(),
            notes: `Recorded via Call Assistant phone follow-up: ${callNotes || 'Verbal promise on call'}`,
          });
        } catch (commitErr) {
          console.warn('Could not auto-bind commitment:', commitErr);
        }
      }

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      Alert.alert('Call Recorded', 'Call outcome and debtor ledger updated successfully.');
      if (onActionComplete) {
        onActionComplete(outcomeText);
      }
      setSelectedOutcome(null);
      setCallNotes('');
      onClose();
    } catch (err: any) {
      console.error('Failed to log call outcome:', err);
      Alert.alert('Error', err?.message || 'Failed to save call outcome.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#001D31' : '#FFFFFF',
              borderColor: isDark ? '#0F5470' : '#E2E8F0',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.phoneIconWrap, { backgroundColor: '#7C3AED' }]}>
                <MaterialCommunityIcons name="phone-in-talk" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: tokens.textPrimary }]}>
                  {t('common.call')} Assistant
                </Text>
                <Text style={[styles.headerSubtitle, { color: tokens.textSecondary }]}>
                  Direct device call with AI live cheat-sheet
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={tokens.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Customer Summary & Quick Dial Card */}
            <View
              style={[
                styles.customerCard,
                {
                  backgroundColor: isDark ? '#00253F' : '#F8FAFC',
                  borderColor: isDark ? '#0F5470' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.customerCardTop}>
                <View>
                  <Text style={[styles.customerName, { color: tokens.textPrimary }]}>
                    {customer.name}
                  </Text>
                  <Text style={[styles.customerPhone, { color: tokens.textSecondary }]}>
                    {formatDisplayPhone(customer.phone)}
                  </Text>
                </View>

                {/* Instant Dial Button */}
                <TouchableOpacity
                  style={styles.dialButton}
                  onPress={handleDialNow}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="phone" size={16} color="#FFFFFF" />
                  <Text style={styles.dialButtonText}>{t('common.call')} (₦0)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.financialMetrics}>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricLabel, { color: tokens.textMuted }]}>{t('commandCenter.totalOutstanding')}</Text>
                  <Text style={[styles.metricValue, { color: '#EF4444' }]}>
                    {customer.currency || '₦'}{' '}
                    {Number(customer.totalOutstanding || 0).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={[styles.metricLabel, { color: tokens.textMuted }]}>{t('common.overdue')}</Text>
                  <Text style={[styles.metricValue, { color: tokens.textPrimary }]}>
                    {customer.oldestOverdueDays ? `${customer.oldestOverdueDays} days` : 'Current'}
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={[styles.metricLabel, { color: tokens.textMuted }]}>Risk Profile</Text>
                  <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
                    {customer.riskLevel || 'NORMAL'}
                  </Text>
                </View>
              </View>
            </View>

            {/* AI Talking Points / Script Accordion */}
            <View
              style={[
                styles.scriptCard,
                {
                  backgroundColor: isDark ? '#001625' : '#F1F5F9',
                  borderColor: isDark ? '#0F5470' : '#CBD5E1',
                },
              ]}
            >
              <TouchableOpacity
                style={styles.scriptHeader}
                onPress={() => setShowScript(!showScript)}
                activeOpacity={0.7}
              >
                <View style={styles.scriptTitleRow}>
                  <MaterialCommunityIcons name="brain" size={16} color="#3AD0A9" />
                  <Text style={[styles.scriptTitle, { color: '#3AD0A9' }]}>
                    AI Suggested Talking Points
                  </Text>
                </View>
                <Feather
                  name={showScript ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={tokens.textMuted}
                />
              </TouchableOpacity>

              {showScript && (
                <View style={styles.scriptContent}>
                  <Text style={[styles.scriptText, { color: tokens.textPrimary }]}>
                    {scriptText ||
                      `"Good day ${customer.name}, I hope your business is thriving. I am following up regarding your outstanding balance of ${customer.currency || '₦'}${Number(customer.totalOutstanding || 0).toLocaleString()}. When should our accounts team expect the settlement so we can update your credit record?"`}
                  </Text>
                  <View style={styles.scriptTip}>
                    <Feather name="check" size={12} color="#00A581" />
                    <Text style={styles.scriptTipText}>
                      Tip: Always secure an exact agreed commitment date before concluding the call.
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Call Outcome Options */}
            <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>
              Log Call Outcome:
            </Text>

            <View style={styles.outcomeGrid}>
              {[
                {
                  id: 'PROMISED',
                  label: 'Customer Promised Payment',
                  icon: 'handshake-outline',
                  color: '#00A581',
                },
                {
                  id: 'CALLBACK',
                  label: 'Request Callback / Extension',
                  icon: 'clock-outline',
                  color: '#3B82F6',
                },
                {
                  id: 'NO_ANSWER',
                  label: 'No Answer / Switched Off',
                  icon: 'phone-missed',
                  color: '#64748B',
                },
                {
                  id: 'DISPUTED',
                  label: 'Disputed Invoice Balance',
                  icon: 'alert-circle-outline',
                  color: '#EF4444',
                },
              ].map((item) => {
                const isSelected = selectedOutcome === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.outcomeCard,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(0,165,129,0.15)'
                            : 'rgba(0,165,129,0.08)'
                          : isDark
                          ? '#00253F'
                          : '#F8FAFC',
                        borderColor: isSelected ? item.color : isDark ? '#0F5470' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => setSelectedOutcome(item.id as CallOutcomeType)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={20}
                      color={isSelected ? item.color : tokens.textMuted}
                    />
                    <Text
                      style={[
                        styles.outcomeText,
                        {
                          color: isSelected ? item.color : tokens.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Promise Amount & Date Inputs (If Promised Payment selected) */}
            {selectedOutcome === 'PROMISED' && (
              <View
                style={[
                  styles.promiseForm,
                  {
                    backgroundColor: isDark ? '#002238' : '#ECFDF5',
                    borderColor: '#00A581',
                  },
                ]}
              >
                <Text style={[styles.promiseFormTitle, { color: '#00A581' }]}>
                  🤝 Schedule Commitment to Debtor Ledger
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: tokens.textSecondary }]}>
                    Agreed Amount ({customer.currency || '₦'})
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        color: tokens.textPrimary,
                        backgroundColor: isDark ? '#001625' : '#FFFFFF',
                        borderColor: isDark ? '#0F5470' : '#CBD5E1',
                      },
                    ]}
                    keyboardType="numeric"
                    value={promisedAmount}
                    onChangeText={setPromisedAmount}
                    placeholder="e.g. 250000"
                    placeholderTextColor={tokens.textMuted}
                  />
                </View>

                {/* Days Presets */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: tokens.textSecondary }]}>
                    Promised Date Preset:
                  </Text>
                  <View style={styles.presetRow}>
                    {[
                      { days: 3, label: '3 Days' },
                      { days: 7, label: '1 Week' },
                      { days: 14, label: '2 Weeks' },
                    ].map((p) => (
                      <TouchableOpacity
                        key={p.days}
                        style={[
                          styles.presetChip,
                          promiseDays === p.days && {
                            backgroundColor: '#00A581',
                            borderColor: '#00A581',
                          },
                          promiseDays !== p.days && {
                            borderColor: isDark ? '#0F5470' : '#CBD5E1',
                          },
                        ]}
                        onPress={() => setPromiseDays(p.days)}
                      >
                        <Text
                          style={[
                            styles.presetText,
                            {
                              color: promiseDays === p.days ? '#FFFFFF' : tokens.textSecondary,
                              fontWeight: promiseDays === p.days ? '700' : '500',
                            },
                          ]}
                        >
                          {p.label} ({getCalculatedDate(p.days)})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* General Notes Input */}
            <View style={styles.notesContainer}>
              <Text style={[styles.inputLabel, { color: tokens.textSecondary }]}>
                Call Summary & Notes (Optional):
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    color: tokens.textPrimary,
                    backgroundColor: isDark ? '#001625' : '#FFFFFF',
                    borderColor: isDark ? '#0F5470' : '#CBD5E1',
                  },
                ]}
                multiline
                numberOfLines={2}
                value={callNotes}
                onChangeText={setCallNotes}
                placeholder="e.g. Customer promised to send transfer receipt before 2 PM..."
                placeholderTextColor={tokens.textMuted}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.footer, { borderTopColor: isDark ? '#0F5470' : '#E2E8F0' }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={[styles.cancelBtnText, { color: tokens.textMuted }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: selectedOutcome ? '#00A581' : '#64748B',
                  opacity: isSubmitting ? 0.6 : 1,
                },
              ]}
              onPress={handleSaveOutcome}
              disabled={isSubmitting || !selectedOutcome}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="check-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>{t('customers.createButton')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    paddingHorizontal: 20,
  },
  customerCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  customerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  customerPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  dialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dialButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  financialMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricCol: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  scriptCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  scriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scriptTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scriptTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  scriptContent: {
    marginTop: 10,
  },
  scriptText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  scriptTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  scriptTipText: {
    fontSize: 11,
    color: '#00A581',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  outcomeGrid: {
    gap: 8,
    marginBottom: 16,
  },
  outcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  outcomeText: {
    fontSize: 13,
  },
  promiseForm: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  promiseFormTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontSize: 10.5,
  },
  notesContainer: {
    marginBottom: 16,
    gap: 4,
  },
  notesInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

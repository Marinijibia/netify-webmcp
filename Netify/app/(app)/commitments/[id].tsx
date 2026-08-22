import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../src/design/theme';
import {
  commitmentsApi,
  PaymentCommitmentItem,
  CommitmentStatus,
} from '../../../src/services/api/commitments';
import {
  ChevronLeftIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  CalendarIcon,
  DollarSignIcon,
  UsersIcon,
  FileTextIcon,
  MessageSquareIcon,
  TrashIcon,
} from '../../../src/design/icons';

export default function CommitmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tokens } = useTheme();

  const [commitment, setCommitment] = useState<PaymentCommitmentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation Modal State
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchCommitment();
  }, [id]);

  const fetchCommitment = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await commitmentsApi.getCommitment(id);
      if (res.success && res.data) {
        setCommitment(res.data);
      } else {
        setError('Failed to load commitment details');
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading commitment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCommitment = async () => {
    if (!id) return;
    try {
      setCancelling(true);
      const res = await commitmentsApi.cancelCommitment(id, {
        notes: cancelReason.trim() || undefined,
      });
      if (res.success && res.data) {
        setCommitment(res.data);
        setCancelModalVisible(false);
        Alert.alert('Success', 'Payment commitment has been cancelled.');
      } else {
        Alert.alert('Error', res.message || 'Failed to cancel commitment.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to cancel commitment.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: tokens.background }]}>
        <ActivityIndicator size="large" color={tokens.primary} />
        <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>
          Loading commitment...
        </Text>
      </View>
    );
  }

  if (error || !commitment) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: tokens.background }]}>
        <AlertCircleIcon size={40} color={tokens.danger} />
        <Text style={[styles.errorTitle, { color: tokens.textPrimary }]}>Unable to load</Text>
        <Text style={[styles.errorSubtitle, { color: tokens.textSecondary }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: tokens.primary }]}
          onPress={fetchCommitment}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const amountNum = parseFloat(commitment.amount);
  const formattedAmount = `${commitment.currency} ${amountNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const promisedDate = new Date(commitment.promisedFor).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={[styles.container, { backgroundColor: tokens.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: tokens.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon size={24} color={tokens.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tokens.textPrimary }]}>Promise Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Commitment Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <Text style={[styles.heroLabel, { color: tokens.textSecondary }]}>Committed Payment</Text>
          <Text style={[styles.heroAmount, { color: tokens.primary }]}>{formattedAmount}</Text>

          <View style={styles.promiseDateRow}>
            <CalendarIcon size={16} color={tokens.textSecondary} />
            <Text style={[styles.promiseDateText, { color: tokens.textPrimary }]}>
              Promised for {promisedDate}
            </Text>
          </View>

          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    commitment.status === 'FULFILLED'
                      ? '#DEF7EC'
                      : commitment.status === 'PARTIALLY_FULFILLED'
                      ? '#E1EFFE'
                      : commitment.status === 'MISSED' || commitment.isMissed
                      ? '#FDE8E8'
                      : commitment.status === 'CANCELLED'
                      ? '#F3F4F6'
                      : '#FEF08A',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color:
                      commitment.status === 'FULFILLED'
                        ? '#03543F'
                        : commitment.status === 'PARTIALLY_FULFILLED'
                        ? '#1E429F'
                        : commitment.status === 'MISSED' || commitment.isMissed
                        ? '#9B1C1C'
                        : commitment.status === 'CANCELLED'
                        ? '#6B7280'
                        : '#713F12',
                  },
                ]}
              >
                {commitment.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Debtor & Receivable Reference */}
        <Text style={[styles.sectionHeading, { color: tokens.textPrimary }]}>Associated Debt</Text>
        <View style={[styles.infoCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: tokens.textSecondary }]}>Customer:</Text>
            <Text style={[styles.infoValue, { color: tokens.textPrimary }]}>
              {commitment.customer?.name || 'Customer'}
            </Text>
          </View>

          {commitment.receivable && (
            <>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: tokens.textSecondary }]}>Receivable Reference:</Text>
                <Text style={[styles.infoValue, { color: tokens.textPrimary }]}>
                  {commitment.receivable.reference || commitment.receivable.id.substring(0, 8)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: tokens.textSecondary }]}>Original Debt:</Text>
                <Text style={[styles.infoValue, { color: tokens.textPrimary }]}>
                  {commitment.receivable.currency}{' '}
                  {parseFloat(commitment.receivable.originalAmount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Source Activity Evidence Card */}
        {commitment.sourceActivity && (
          <>
            <Text style={[styles.sectionHeading, { color: tokens.textPrimary }]}>
              Collection Evidence
            </Text>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: tokens.textSecondary }]}>Channel:</Text>
                <Text style={[styles.infoValue, { color: tokens.textPrimary }]}>
                  {commitment.sourceActivity.channel}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: tokens.textSecondary }]}>Type:</Text>
                <Text style={[styles.infoValue, { color: tokens.textPrimary }]}>
                  {commitment.sourceActivity.type}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: tokens.textSecondary }]}>Outcome:</Text>
                <Text style={[styles.infoValue, { color: tokens.textPrimary }]}>
                  {commitment.sourceActivity.outcome}
                </Text>
              </View>
              {commitment.sourceActivity.notes ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.infoLabel, { color: tokens.textSecondary }]}>Activity Notes:</Text>
                  <Text style={[styles.activityNotes, { color: tokens.textPrimary }]}>
                    "{commitment.sourceActivity.notes}"
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        )}

        {/* Commitment Notes */}
        {commitment.notes ? (
          <>
            <Text style={[styles.sectionHeading, { color: tokens.textPrimary }]}>Promise Notes</Text>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              <Text style={[styles.activityNotes, { color: tokens.textPrimary }]}>
                {commitment.notes}
              </Text>
            </View>
          </>
        ) : null}

        {/* Cancel Action */}
        {commitment.status !== 'FULFILLED' && commitment.status !== 'CANCELLED' && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: tokens.danger }]}
            onPress={() => setCancelModalVisible(true)}
          >
            <TrashIcon size={18} color={tokens.danger} />
            <Text style={[styles.cancelButtonText, { color: tokens.danger }]}>Cancel Commitment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Cancellation Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Text style={[styles.modalTitle, { color: tokens.textPrimary }]}>Cancel Commitment</Text>
            <Text style={[styles.modalSubtitle, { color: tokens.textSecondary }]}>
              Cancellation preserves historical audit records. Please specify a reason.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: tokens.background,
                  borderColor: tokens.border,
                  color: tokens.textPrimary,
                },
              ]}
              placeholder="e.g. Customer renegotiated promised amount or date..."
              placeholderTextColor={tokens.textSecondary}
              multiline
              numberOfLines={3}
              value={cancelReason}
              onChangeText={setCancelReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: tokens.border }]}
                onPress={() => setCancelModalVisible(false)}
                disabled={cancelling}
              >
                <Text style={[styles.modalCancelText, { color: tokens.textPrimary }]}>Keep Active</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: tokens.danger }]}
                onPress={handleCancelCommitment}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  promiseDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  promiseDateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badgeContainer: {
    marginTop: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityNotes: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalCancelText: {
    fontWeight: '600',
  },
  modalConfirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

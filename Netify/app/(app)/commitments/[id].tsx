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
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/design/theme';
import {
  commitmentsApi,
  PaymentCommitmentItem,
  CommitmentStatus,
} from '../../../src/services/api/commitments';
import {
  ChevronLeftIcon,
  AlertCircleIcon,
  CalendarIcon,
  TrashIcon,
} from '../../../src/design/icons';
import { GRADIENTS } from '../../../src/design/tokens/gradients';

function getStatusColors(status: CommitmentStatus, isMissed?: boolean): { bg: string; text: string } {
  if (status === 'FULFILLED') return { bg: '#DEF7EC', text: '#03543F' };
  if (status === 'PARTIALLY_FULFILLED') return { bg: '#E1EFFE', text: '#1E429F' };
  if (status === 'MISSED' || isMissed) return { bg: '#FDE8E8', text: '#9B1C1C' };
  if (status === 'CANCELLED') return { bg: '#F3F4F6', text: '#6B7280' };
  return { bg: '#FEF08A', text: '#713F12' }; // PENDING
}

export default function CommitmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tokens } = useTheme();

  const [commitment, setCommitment] = useState<PaymentCommitmentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const statusColors = getStatusColors(commitment.status as CommitmentStatus, commitment.isMissed);
  const isActionable = commitment.status !== 'FULFILLED' && commitment.status !== 'CANCELLED';

  return (
    <View style={[styles.container, { backgroundColor: tokens.background }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={GRADIENTS.navyHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ChevronLeftIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promise Details</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Card */}
        <LinearGradient
          colors={['rgba(0,165,129,0.08)', 'rgba(0,48,81,0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: 'rgba(0,165,129,0.2)' }]}
        >
          <Text style={[styles.heroLabel, { color: tokens.textSecondary }]}>Committed Payment</Text>
          <Text style={[styles.heroAmount, { color: tokens.primary }]}>{formattedAmount}</Text>

          <View style={styles.promiseDateRow}>
            <CalendarIcon size={16} color={tokens.textSecondary} />
            <Text style={[styles.promiseDateText, { color: tokens.textPrimary }]}>
              Promised for {promisedDate}
            </Text>
          </View>

          <View style={styles.badgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                {commitment.status}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Associated Debt */}
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

        {/* Source Activity Evidence */}
        {commitment.sourceActivity && (
          <>
            <Text style={[styles.sectionHeading, { color: tokens.textPrimary }]}>
              Collection Evidence
            </Text>
            <View
              style={[styles.infoCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
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
              style={[styles.infoCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            >
              <Text style={[styles.activityNotes, { color: tokens.textPrimary }]}>
                {commitment.notes}
              </Text>
            </View>
          </>
        ) : null}

        {/* Cancel Action */}
        {isActionable && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: tokens.danger, backgroundColor: tokens.dangerSoft }]}
            onPress={() => setCancelModalVisible(true)}
            activeOpacity={0.8}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#003051',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroAmount: {
    fontSize: 30,
    fontWeight: '800',
    marginTop: 6,
  },
  promiseDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  promiseDateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badgeContainer: {
    marginTop: 14,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  infoCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
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
    maxWidth: '55%',
    textAlign: 'right',
  },
  activityNotes: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
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
    borderRadius: 12,
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
    borderRadius: 10,
    borderWidth: 1,
  },
  modalCancelText: {
    fontWeight: '600',
  },
  modalConfirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

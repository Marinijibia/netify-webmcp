import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/design/theme';
import { Badge, TimelineEventCard, Avatar } from '@/design/components';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  ActivityIcon,
  ClockIcon,
  CreditCardIcon,
} from '@/design/icons';
import { receivablesApi, ReceivableItem } from '@/services/api/receivables';
import { collectionActivitiesApi, CollectionActivityItem } from '@/services/api/collection-activities';
import { commitmentsApi, PaymentCommitmentItem } from '@/services/api/commitments';
import { businessEventsApi, BusinessEventItem } from '@/services/api/business-events';

const safeArray = <T,>(data: any): T[] =>
  Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];

const formatMoney = (amount: number | string, currency: string) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount as string);
  return `${currency} ${isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export default function ReceivableDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tokens, isDark } = useTheme();

  const [receivable, setReceivable] = useState<ReceivableItem | null>(null);
  const [activities, setActivities] = useState<CollectionActivityItem[]>([]);
  const [commitments, setCommitments] = useState<PaymentCommitmentItem[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<BusinessEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchReceivableData = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const [recRes, actRes, commRes, timelineRes] = await Promise.all([
        receivablesApi.getById(id),
        collectionActivitiesApi.getReceivableActivities(id).catch(() => ({ success: false, data: [] })),
        commitmentsApi.getReceivableCommitments(id).catch(() => ({ success: false, data: [] })),
        businessEventsApi.getReceivableTimeline(id).catch(() => ({ success: false, data: [] })),
      ]);
      if (recRes.data) {
        setReceivable(recRes.data);
      } else {
        setError(recRes.message || 'Receivable not found');
      }
      setActivities(safeArray<CollectionActivityItem>(actRes.data));
      setCommitments(safeArray<PaymentCommitmentItem>(commRes.data));
      setTimelineEvents(safeArray<BusinessEventItem>(timelineRes.data));
    } catch (err: any) {
      setError(err.message || 'Failed to load receivable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchReceivableData(); }, [fetchReceivableData]);

  const handleRefresh = () => { setRefreshing(true); fetchReceivableData(); };

  const handleConfirmCancel = async () => {
    if (!receivable) return;
    try {
      setCancelling(true);
      const res = await receivablesApi.cancel(receivable.id);
      if (res.data) {
        setReceivable(res.data);
        setShowCancelModal(false);
      }
    } catch {
      // silent
    } finally {
      setCancelling(false);
    }
  };

  const headerGradient = isDark ? GRADIENTS.darkHero : GRADIENTS.navyHero;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tokens.background }]}>
        <View style={styles.centreState}>
          <ActivityIndicator size="large" color="#00A581" />
          <Text style={[styles.centreText, { color: tokens.textSecondary }]}>Loading receivable...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !receivable) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tokens.background }]}>
        <View style={styles.centreState}>
          <AlertCircleIcon size={44} color={tokens.danger} />
          <Text style={[styles.centreTitle, { color: tokens.textPrimary }]}>Unable to Load</Text>
          <Text style={[styles.centreText, { color: tokens.textSecondary }]}>
            {error || 'The requested receivable could not be found.'}
          </Text>
          <TouchableOpacity
            style={[styles.backFallbackBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backFallbackText, { color: tokens.textPrimary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isFullyPaid = receivable.status === 'PAID';
  const isCancelled = receivable.status === 'CANCELLED';
  const isOverdue = receivable.isOverdue && !isFullyPaid && !isCancelled;
  const canCancel = !isCancelled && (receivable.payments || []).length === 0;

  // Hero gradient based on status
  const heroColors: [string, string] = isFullyPaid
    ? ['#064E3B', '#065F46']
    : isOverdue
    ? ['#7F1D1D', '#991B1B']
    : isCancelled
    ? ['#1E293B', '#334155']
    : headerGradient as [string, string];

  const balanceColor = isFullyPaid ? '#34D399' : isOverdue ? '#FCA5A5' : '#FFFFFF';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.background }]}>
      {/* ── HEADER ── */}
      <LinearGradient
        colors={headerGradient as [string, string]}
        start={GRADIENT_DIRECTION.toBottomRight.start}
        end={GRADIENT_DIRECTION.toBottomRight.end}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <ChevronLeftIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Receivable Details</Text>
            {receivable.customer?.name ? (
              <Text style={styles.headerSub} numberOfLines={1}>{receivable.customer.name}</Text>
            ) : null}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#00A581" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO AMOUNT CARD ── */}
        <LinearGradient
          colors={heroColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Source + Status row */}
          <View style={styles.heroTopRow}>
            <View style={styles.sourcePill}>
              <Text style={styles.sourcePillText}>{receivable.source}</Text>
            </View>
            <Badge
              label={receivable.status}
              variant={
                isFullyPaid ? 'success'
                : isOverdue ? 'danger'
                : receivable.status === 'PARTIALLY_PAID' ? 'primary'
                : isCancelled ? 'neutral' : 'warning'
              }
              size="sm"
            />
          </View>

          {/* Reference */}
          {receivable.reference ? (
            <Text style={styles.heroRef}>Ref: {receivable.reference}</Text>
          ) : null}

          {/* Balance */}
          <Text style={styles.heroLabel}>Outstanding Balance</Text>
          <Text style={[styles.heroBalance, { color: balanceColor }]}>
            {formatMoney(receivable.balance, receivable.currency)}
          </Text>

          {/* Overdue banner */}
          {isOverdue ? (
            <View style={styles.overduePill}>
              <AlertCircleIcon size={13} color="#FCA5A5" />
              <Text style={styles.overduePillText}>
                OVERDUE by {receivable.daysOverdue} {receivable.daysOverdue === 1 ? 'day' : 'days'}
              </Text>
            </View>
          ) : null}

          {/* Stats row */}
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Original</Text>
              <Text style={styles.heroStatValue}>
                {formatMoney(receivable.originalAmount, receivable.currency)}
              </Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Paid</Text>
              <Text style={[styles.heroStatValue, { color: '#34D399' }]}>
                {formatMoney(receivable.amountPaid, receivable.currency)}
              </Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Due Date</Text>
              <Text style={[styles.heroStatValue, { color: isOverdue ? '#FCA5A5' : 'rgba(255,255,255,0.9)' }]}>
                {formatDate(receivable.dueDate)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── ACTION BUTTONS ── */}
        {!isFullyPaid && !isCancelled && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.primaryActionWrapper}
              onPress={() => router.push(`/(app)/receivables/${receivable.id}/record-payment` as any)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={GRADIENTS.navyToTeal as unknown as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.primaryActionGradient}
              >
                <MaterialCommunityIcons name="credit-card-check-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Record Payment</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryAction, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
              onPress={() => router.push(`/(app)/receivables/${receivable.id}/record-activity` as any)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="clipboard-text-outline" size={16} color={tokens.textPrimary} />
              <Text style={[styles.secondaryActionText, { color: tokens.textPrimary }]}>Log Activity</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── CUSTOMER CARD ── */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
          onPress={() => router.push(`/(app)/customers/${receivable.customerId}` as any)}
          activeOpacity={0.8}
        >
          <View style={styles.customerCardRow}>
            <Avatar name={receivable.customer?.name || 'C'} size="md" />
            <View style={styles.customerCardInfo}>
              <Text style={[styles.customerCardSub, { color: tokens.textMuted }]}>Customer Record</Text>
              <Text style={[styles.customerCardName, { color: tokens.textPrimary }]}>
                {receivable.customer?.name || 'Customer'}
              </Text>
              {receivable.customer?.phone ? (
                <Text style={[styles.customerCardPhone, { color: tokens.textSecondary }]}>
                  {receivable.customer.phone}
                </Text>
              ) : null}
            </View>
            <ChevronRightIcon size={18} color={tokens.textMuted} />
          </View>
        </TouchableOpacity>

        {/* ── PAYMENT PROMISES ── */}
        <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>
              Payment Promises
            </Text>
            <Text style={[styles.sectionCount, { color: tokens.textMuted }]}>
              {commitments.length} recorded
            </Text>
          </View>

          {commitments.length === 0 ? (
            <View style={styles.emptyState}>
              <ClockIcon size={22} color={tokens.textMuted} />
              <Text style={[styles.emptyText, { color: tokens.textMuted }]}>No active promises yet.</Text>
            </View>
          ) : (
            commitments.map((comm) => (
              <TouchableOpacity
                key={comm.id}
                style={[styles.commitRow, { borderBottomColor: tokens.border }]}
                onPress={() => router.push(`/(app)/commitments/${comm.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={styles.commitLeft}>
                  <Text style={styles.commitAmount}>
                    {formatMoney(comm.amount, comm.currency)}
                  </Text>
                  <Text style={[styles.commitDate, { color: tokens.textMuted }]}>
                    Promised for {formatDate(comm.promisedFor)}
                    {comm.notes ? ` · "${comm.notes}"` : ''}
                  </Text>
                </View>
                <Badge
                  label={comm.status}
                  variant={
                    comm.status === 'FULFILLED' ? 'success'
                    : comm.status === 'MISSED' || comm.isMissed ? 'danger'
                    : comm.status === 'PARTIALLY_FULFILLED' ? 'primary'
                    : 'warning'
                  }
                  size="sm"
                />
                <ChevronRightIcon size={16} color={tokens.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ── COLLECTION ACTIVITIES ── */}
        <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>Collection Timeline</Text>
            <Text style={[styles.sectionCount, { color: tokens.textMuted }]}>{activities.length} logged</Text>
          </View>

          {activities.length === 0 ? (
            <View style={styles.emptyState}>
              <ActivityIcon size={22} color={tokens.textMuted} />
              <Text style={[styles.emptyText, { color: tokens.textMuted }]}>No activities logged yet.</Text>
            </View>
          ) : (
            activities.map((act, idx) => (
              <View
                key={act.id}
                style={[
                  styles.activityRow,
                  idx < activities.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tokens.border },
                ]}
              >
                <View style={styles.activityTop}>
                  <View style={styles.activityTypeWrap}>
                    <Text style={styles.activityType}>{act.type}</Text>
                    <Text style={[styles.activityChannel, { color: tokens.textMuted }]}> via {act.channel}</Text>
                  </View>
                  <Badge label={act.outcome} variant="primary" size="sm" />
                </View>
                <Text style={[styles.activityMeta, { color: tokens.textMuted }]}>
                  {formatDate(act.occurredAt)} · {act.performedByUser?.firstName || 'Collector'}
                </Text>
                {act.notes ? (
                  <Text style={[styles.activityNotes, { color: tokens.textSecondary }]}>
                    "{act.notes}"
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* ── PAYMENT HISTORY ── */}
        <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>Payment History</Text>
            <Text style={[styles.sectionCount, { color: tokens.textMuted }]}>
              {(receivable.payments || []).length} confirmed
            </Text>
          </View>

          {(receivable.payments || []).length === 0 ? (
            <View style={styles.emptyState}>
              <CreditCardIcon size={22} color={tokens.textMuted} />
              <Text style={[styles.emptyText, { color: tokens.textMuted }]}>No payments recorded yet.</Text>
            </View>
          ) : (
            (receivable.payments || []).map((pay, idx) => {
              const isReversed = pay.status === 'REVERSED';
              return (
                <TouchableOpacity
                  key={pay.id}
                  style={[
                    styles.paymentRow,
                    idx < (receivable.payments || []).length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tokens.border },
                  ]}
                  onPress={() => router.push(`/(app)/receivables/${receivable.id}/payments/${pay.id}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.paymentLeft}>
                    <Text style={[
                      styles.paymentAmount,
                      { color: isReversed ? tokens.textMuted : tokens.textPrimary },
                      isReversed && { textDecorationLine: 'line-through' },
                    ]}>
                      {formatMoney(pay.amount, pay.currency || receivable.currency)}
                    </Text>
                    <Text style={[styles.paymentMeta, { color: tokens.textMuted }]}>
                      {formatDate(pay.paidAt)} · {pay.method || pay.paymentMethod}
                      {pay.reference ? ` (${pay.reference})` : ''}
                    </Text>
                  </View>
                  <Badge
                    label={pay.status}
                    variant={pay.status === 'CONFIRMED' ? 'success' : pay.status === 'REVERSED' ? 'danger' : 'neutral'}
                    size="sm"
                  />
                  <ChevronRightIcon size={16} color={tokens.textMuted} />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── CASE HISTORY / TIMELINE ── */}
        <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <ActivityIcon size={14} color="#00A581" />
              <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>
                Case History ({timelineEvents.length})
              </Text>
            </View>
            <Text style={[styles.sectionCount, { color: tokens.textMuted }]}>Immutable</Text>
          </View>

          {timelineEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: tokens.textMuted }]}>No events recorded yet.</Text>
            </View>
          ) : (
            timelineEvents.map((evt, idx) => (
              <TimelineEventCard key={evt.id} event={evt} isLast={idx === timelineEvents.length - 1} />
            ))
          )}
        </View>

        {/* ── CANCEL RECEIVABLE ── */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setShowCancelModal(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.cancelBtnText}>Cancel Receivable</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── CANCEL CONFIRM MODAL ── */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={[styles.confirmModal, { backgroundColor: tokens.background, borderColor: tokens.border }]}>
            <View style={styles.confirmIconWrap}>
              <MaterialCommunityIcons name="close-circle-outline" size={28} color="#EF4444" />
            </View>
            <Text style={[styles.confirmTitle, { color: tokens.textPrimary }]}>Cancel Receivable?</Text>
            <Text style={[styles.confirmDesc, { color: tokens.textSecondary }]}>
              Cancelled receivables cannot receive payments. All historical records will be preserved.
            </Text>
            <TouchableOpacity
              style={styles.confirmDestructBtn}
              onPress={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.confirmDestructText}>Yes, Cancel It</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmKeepBtn, { borderColor: tokens.border }]}
              onPress={() => setShowCancelModal(false)}
            >
              <Text style={[styles.confirmKeepText, { color: tokens.textPrimary }]}>Keep Active</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  centreState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  centreTitle: { fontSize: 18, fontWeight: '800' },
  centreText: { fontSize: 13, textAlign: 'center' },
  backFallbackBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  backFallbackText: { fontSize: 14, fontWeight: '700' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },

  // Hero card
  heroCard: { borderRadius: 20, padding: 18 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sourcePill: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sourcePillText: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heroRef: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  heroBalance: { fontSize: 34, fontWeight: '800', marginBottom: 10 },
  overduePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12, alignSelf: 'flex-start',
  },
  overduePillText: { color: '#FCA5A5', fontSize: 11, fontWeight: '800' },
  heroStats: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, paddingVertical: 12, marginTop: 4,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginBottom: 3 },
  heroStatValue: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Action buttons
  actionsRow: { flexDirection: 'row', gap: 10 },
  primaryActionWrapper: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  primaryActionGradient: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryActionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondaryAction: {
    flex: 1, height: 50, borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  secondaryActionText: { fontSize: 14, fontWeight: '700' },

  // Card
  card: {
    borderRadius: 18, borderWidth: 1, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },

  // Customer card
  customerCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerCardInfo: { flex: 1 },
  customerCardSub: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  customerCardName: { fontSize: 16, fontWeight: '800' },
  customerCardPhone: { fontSize: 12, marginTop: 1 },

  // Section headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCount: { fontSize: 11, fontWeight: '600' },

  // Empty states
  emptyState: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  emptyText: { fontSize: 12 },

  // Commitments
  commitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commitLeft: { flex: 1 },
  commitAmount: { fontSize: 15, fontWeight: '800', color: '#00A581', marginBottom: 2 },
  commitDate: { fontSize: 11 },

  // Activities
  activityRow: { paddingVertical: 12 },
  activityTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  activityTypeWrap: { flexDirection: 'row', alignItems: 'center' },
  activityType: { fontSize: 13, fontWeight: '700', color: '#00A581' },
  activityChannel: { fontSize: 12 },
  activityMeta: { fontSize: 11, marginBottom: 2 },
  activityNotes: { fontSize: 12, fontStyle: 'italic' },

  // Payments
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  paymentLeft: { flex: 1 },
  paymentAmount: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  paymentMeta: { fontSize: 11 },

  // Cancel button
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '800', color: '#EF4444' },

  // Confirm modal
  confirmBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  confirmModal: { width: '100%', borderRadius: 24, borderWidth: 1, padding: 24, alignItems: 'center', gap: 10 },
  confirmIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  confirmTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  confirmDesc: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 8 },
  confirmDestructBtn: { width: '100%', height: 50, borderRadius: 14, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  confirmDestructText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  confirmKeepBtn: { width: '100%', height: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  confirmKeepText: { fontSize: 15, fontWeight: '700' },
});

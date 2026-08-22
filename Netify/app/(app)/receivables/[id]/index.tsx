import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../../src/design/theme';
import { Button } from '../../../../src/design/components/Button';
import { Card } from '../../../../src/design/components/Card';
import { Badge } from '../../../../src/design/components/Badge';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  DollarSignIcon,
  CreditCardIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ActivityIcon,
  ClockIcon,
} from '../../../../src/design/icons';
import {
  receivablesApi,
  ReceivableItem,
} from '../../../../src/services/api/receivables';
import {
  collectionActivitiesApi,
  CollectionActivityItem,
} from '../../../../src/services/api/collection-activities';
import {
  commitmentsApi,
  PaymentCommitmentItem,
} from '../../../../src/services/api/commitments';

export default function ReceivableDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tokens } = useTheme();

  const [receivable, setReceivable] = useState<ReceivableItem | null>(null);
  const [activities, setActivities] = useState<CollectionActivityItem[]>([]);
  const [commitments, setCommitments] = useState<PaymentCommitmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchReceivableData = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const [recRes, actRes, commRes] = await Promise.all([
        receivablesApi.getById(id),
        collectionActivitiesApi.getReceivableActivities(id).catch(() => ({ success: false, data: [] as CollectionActivityItem[] })),
        commitmentsApi.getReceivableCommitments(id).catch(() => ({ success: false, data: [] as PaymentCommitmentItem[] })),
      ]);

      if (recRes.data) {
        setReceivable(recRes.data);
      } else {
        setError(recRes.message || 'Receivable not found');
      }

      if (actRes.data) {
        setActivities(actRes.data);
      }
      if (commRes.data) {
        setCommitments(commRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load receivable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReceivableData();
  }, [fetchReceivableData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReceivableData();
  };

  const handleCancelReceivable = () => {
    if (!receivable) return;

    Alert.alert(
      'Cancel Receivable',
      'Are you sure you want to cancel this receivable? Cancelled receivables cannot receive payments.',
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Cancel Receivable',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const res = await receivablesApi.cancel(receivable.id);
              if (res.data) {
                setReceivable(res.data);
                Alert.alert('Cancelled', 'Receivable has been cancelled.');
              } else {
                Alert.alert('Error', res.message || 'Failed to cancel receivable');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'An unexpected error occurred');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const formatMoney = (amount: number | string, currency: string) => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    return `${currency} ${isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }} edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={tokens.primary} />
          <Text style={{ color: tokens.textSecondary }} className="text-sm mt-3 font-medium">
            Loading receivable...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !receivable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }} edges={['top']}>
        <View className="flex-1 justify-center items-center px-6">
          <AlertCircleIcon size={48} color={tokens.danger} />
          <Text style={{ color: tokens.textPrimary }} className="text-lg font-bold mt-4 text-center">
            Unable to Load Receivable
          </Text>
          <Text style={{ color: tokens.textSecondary }} className="text-sm text-center mt-2">
            {error || 'The requested receivable record could not be found.'}
          </Text>
          <View className="mt-6 w-full max-w-xs">
            <Button label="Go Back" variant="secondary" onPress={() => router.back()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isFullyPaid = receivable.status === 'PAID';
  const isCancelled = receivable.status === 'CANCELLED';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }} edges={['top']}>
      {/* Header */}
      <View
        style={{ borderBottomColor: tokens.border }}
        className="px-4 py-3 border-b flex-row items-center justify-between"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1 rounded-full active:opacity-70"
        >
          <ChevronLeftIcon size={24} color={tokens.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: tokens.textPrimary }} className="text-lg font-bold">
          Receivable Details
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tokens.primary}
            colors={[tokens.primary]}
          />
        }
      >
        {/* Top Status & Reference Banner */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text style={{ color: tokens.textSecondary }} className="text-xs uppercase font-bold tracking-wider">
              {receivable.source} RECEIVABLE
            </Text>
            {receivable.reference ? (
              <Text style={{ color: tokens.textPrimary }} className="text-base font-bold">
                Ref: {receivable.reference}
              </Text>
            ) : null}
          </View>

          <Badge
            label={receivable.status}
            variant={
              receivable.status === 'PAID'
                ? 'success'
                : receivable.status === 'OVERDUE'
                ? 'danger'
                : receivable.status === 'PARTIALLY_PAID'
                ? 'primary'
                : receivable.status === 'CANCELLED'
                ? 'neutral'
                : 'warning'
            }
            size="md"
          />
        </View>

        {/* Financial Balance Summary Card */}
        <Card className="p-5 mb-5">
          <Text style={{ color: tokens.textSecondary }} className="text-xs font-semibold uppercase tracking-wider mb-1">
            Outstanding Balance
          </Text>
          <Text
            style={{
              color: isFullyPaid
                ? tokens.success
                : receivable.isOverdue
                ? tokens.danger
                : tokens.primary,
            }}
            className="text-3xl font-extrabold"
          >
            {formatMoney(receivable.balance, receivable.currency)}
          </Text>

          {/* Overdue Alert Banner */}
          {receivable.isOverdue && !isFullyPaid && !isCancelled ? (
            <View className="mt-3 flex-row items-center bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg">
              <AlertCircleIcon size={16} color={tokens.danger} />
              <Text style={{ color: tokens.danger }} className="text-xs font-bold ml-2">
                OVERDUE by {receivable.daysOverdue} {receivable.daysOverdue === 1 ? 'day' : 'days'}
              </Text>
            </View>
          ) : null}

          {/* Financial Breakdown Grid */}
          <View style={{ borderTopColor: tokens.border }} className="border-t mt-4 pt-4 flex-row justify-between">
            <View>
              <Text style={{ color: tokens.textSecondary }} className="text-xs font-medium">
                Original Amount
              </Text>
              <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold mt-0.5">
                {formatMoney(receivable.originalAmount, receivable.currency)}
              </Text>
            </View>

            <View>
              <Text style={{ color: tokens.textSecondary }} className="text-xs font-medium">
                Total Paid
              </Text>
              <Text style={{ color: tokens.success }} className="text-sm font-bold mt-0.5">
                {formatMoney(receivable.amountPaid, receivable.currency)}
              </Text>
            </View>

            <View className="items-end">
              <Text style={{ color: tokens.textSecondary }} className="text-xs font-medium">
                Payment Due
              </Text>
              <Text
                style={{
                  color: receivable.isOverdue ? tokens.danger : tokens.textPrimary,
                }}
                className="text-xs font-semibold mt-0.5"
              >
                {formatDate(receivable.dueDate)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Operational Actions Grid */}
        {!isFullyPaid && !isCancelled && (
          <View className="flex-row gap-3 mb-5">
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: tokens.primary,
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() =>
                router.push(`/(app)/receivables/${receivable.id}/record-payment` as any)
              }
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Record Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                borderWidth: 1,
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() =>
                router.push(`/(app)/receivables/${receivable.id}/record-activity` as any)
              }
            >
              <Text style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: '700' }}>Log Activity</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Customer Profile Link */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push(`/(app)/customers/${receivable.customerId}` as any)}
          className="mb-5"
        >
          <Card className="p-4 flex-row items-center justify-between">
            <View className="flex-1">
              <Text style={{ color: tokens.textSecondary }} className="text-xs uppercase font-bold tracking-wider mb-1">
                Customer Record
              </Text>
              <Text style={{ color: tokens.textPrimary }} className="text-base font-bold">
                {receivable.customer?.name || 'Customer'}
              </Text>
              {receivable.customer?.phone ? (
                <Text style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
                  {receivable.customer.phone}
                </Text>
              ) : null}
            </View>
            <ChevronRightIcon size={20} color={tokens.textSecondary} />
          </Card>
        </TouchableOpacity>

        {/* Active Payment Promises / Commitments Section */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: tokens.textPrimary }} className="text-base font-bold">
              Payment Promises
            </Text>
            <Text style={{ color: tokens.textSecondary }} className="text-xs">
              {commitments.length} recorded
            </Text>
          </View>

          {commitments.length === 0 ? (
            <Card className="p-4 items-center">
              <ClockIcon size={24} color={tokens.textSecondary} />
              <Text style={{ color: tokens.textSecondary }} className="text-xs mt-2">
                No active promises on this receivable.
              </Text>
            </Card>
          ) : (
            commitments.map((comm) => (
              <TouchableOpacity
                key={comm.id}
                activeOpacity={0.7}
                onPress={() => router.push(`/(app)/commitments/${comm.id}` as any)}
                className="mb-2.5"
              >
                <Card className="p-3.5 flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-1">
                      <Text style={{ color: tokens.textPrimary }} className="text-base font-bold mr-2">
                        {formatMoney(comm.amount, comm.currency)}
                      </Text>
                      <Badge
                        label={comm.status}
                        variant={
                          comm.status === 'FULFILLED'
                            ? 'success'
                            : comm.status === 'MISSED' || comm.isMissed
                            ? 'danger'
                            : comm.status === 'PARTIALLY_FULFILLED'
                            ? 'primary'
                            : 'warning'
                        }
                        size="sm"
                      />
                    </View>
                    <Text style={{ color: tokens.textSecondary }} className="text-xs">
                      Promised for {formatDate(comm.promisedFor)}
                      {comm.notes ? ` • "${comm.notes}"` : ''}
                    </Text>
                  </View>
                  <ChevronRightIcon size={18} color={tokens.textSecondary} />
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Collection Activities Timeline */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: tokens.textPrimary }} className="text-base font-bold">
              Collection Timeline
            </Text>
            <Text style={{ color: tokens.textSecondary }} className="text-xs">
              {activities.length} logged
            </Text>
          </View>

          {activities.length === 0 ? (
            <Card className="p-4 items-center">
              <ActivityIcon size={24} color={tokens.textSecondary} />
              <Text style={{ color: tokens.textSecondary }} className="text-xs mt-2">
                No collection activities logged yet.
              </Text>
            </Card>
          ) : (
            activities.map((act) => (
              <Card key={act.id} className="p-3.5 mb-2.5">
                <View className="flex-row items-center justify-between mb-1">
                  <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold">
                    {act.type} via {act.channel}
                  </Text>
                  <Badge label={act.outcome} variant="primary" size="sm" />
                </View>
                <Text style={{ color: tokens.textSecondary }} className="text-xs">
                  {formatDate(act.occurredAt)} • by {act.performedByUser?.firstName || 'Collector'}
                </Text>
                {act.notes ? (
                  <Text style={{ color: tokens.textPrimary }} className="text-xs mt-1.5 font-medium">
                    "{act.notes}"
                  </Text>
                ) : null}
              </Card>
            ))
          )}
        </View>

        {/* Payment History Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: tokens.textPrimary }} className="text-base font-bold">
              Payment History
            </Text>
            <Text style={{ color: tokens.textSecondary }} className="text-xs">
              {(receivable.payments || []).length} confirmed
            </Text>
          </View>

          {(receivable.payments || []).length === 0 ? (
            <Card className="p-4 items-center">
              <CreditCardIcon size={24} color={tokens.textSecondary} />
              <Text style={{ color: tokens.textSecondary }} className="text-xs mt-2">
                No payments recorded yet.
              </Text>
            </Card>
          ) : (
            (receivable.payments || []).map((pay) => {
              const isReversed = pay.status === 'REVERSED';
              return (
                <TouchableOpacity
                  key={pay.id}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push(
                      `/(app)/receivables/${receivable.id}/payments/${pay.id}` as any
                    )
                  }
                  className="mb-2.5"
                >
                  <Card className="p-3.5 flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center mb-1">
                        <Text
                          style={{
                            color: isReversed ? tokens.textSecondary : tokens.textPrimary,
                            textDecorationLine: isReversed ? 'line-through' : 'none',
                          }}
                          className="text-base font-bold mr-2"
                        >
                          {formatMoney(pay.amount, pay.currency || receivable.currency)}
                        </Text>
                        <Badge
                          label={pay.status}
                          variant={
                            pay.status === 'CONFIRMED'
                              ? 'success'
                              : pay.status === 'REVERSED'
                              ? 'danger'
                              : 'neutral'
                          }
                          size="sm"
                        />
                      </View>
                      <Text style={{ color: tokens.textSecondary }} className="text-xs">
                        {formatDate(pay.paidAt)} • via {pay.method || pay.paymentMethod}
                        {pay.reference ? ` (${pay.reference})` : ''}
                      </Text>
                    </View>
                    <ChevronRightIcon size={18} color={tokens.textSecondary} />
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Cancel Action */}
        {!isCancelled && (receivable.payments || []).length === 0 && (
          <View className="mt-2">
            <Button
              label={cancelling ? 'Cancelling...' : 'Cancel Receivable'}
              variant="destructive"
              size="md"
              disabled={cancelling}
              onPress={handleCancelReceivable}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

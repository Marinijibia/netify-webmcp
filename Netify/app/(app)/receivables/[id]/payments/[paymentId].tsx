import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../../../src/design/theme';
import { Button } from '../../../../../src/design/components/Button';
import { Card } from '../../../../../src/design/components/Card';
import { Badge } from '../../../../../src/design/components/Badge';
import {
  ChevronLeftIcon,
  CreditCardIcon,
  CheckCircleIcon,
  RotateCcwIcon,
  FileTextIcon,
} from '../../../../../src/design/icons';
import { paymentsApi, PaymentItem } from '../../../../../src/services/api/payments';

export default function PaymentDetailScreen() {
  const { id, paymentId } = useLocalSearchParams<{ id: string; paymentId: string }>();
  const router = useRouter();
  const { tokens } = useTheme();

  const [payment, setPayment] = useState<PaymentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [reversing, setReversing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayment() {
      if (!paymentId) return;
      try {
        setError(null);
        const res = await paymentsApi.getById(paymentId);
        if (res.data) {
          setPayment(res.data);
        } else {
          setError(res.message || 'Payment not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load payment');
      } finally {
        setLoading(false);
      }
    }
    loadPayment();
  }, [paymentId]);

  const formatMoney = (val: string | number, currency: string = 'NGN') => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return `${currency} 0.00`;
    return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleReversePayment = () => {
    if (!payment) return;

    Alert.alert(
      'Reverse Payment',
      `Are you sure you want to reverse this payment of ${formatMoney(payment.amount, payment.currency)}?\n\nThis will restore the receivable balance. Reversed payments cannot be un-reversed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reverse Payment',
          style: 'destructive',
          onPress: async () => {
            try {
              setReversing(true);
              const res = await paymentsApi.reverse(payment.id);
              if (res.data) {
                setPayment(res.data);
                Alert.alert('Payment Reversed', 'The payment has been marked as reversed and receivable balance has been restored.', [
                  {
                    text: 'OK',
                    onPress: () => router.replace(`/(app)/receivables/${id}` as any),
                  },
                ]);
              } else {
                Alert.alert('Error', res.message || 'Failed to reverse payment');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'An unexpected error occurred');
            } finally {
              setReversing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.primary} />
          <Text style={{ color: tokens.textSecondary }} className="text-sm mt-3 font-medium">
            Loading payment details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !payment) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
        <View className="px-6 py-4 flex-row items-center border-b border-slate-100 dark:border-slate-800">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <ChevronLeftIcon size={24} color={tokens.textPrimary} />
          </TouchableOpacity>
        </View>
        <View className="flex-1 p-6 justify-center items-center">
          <Text style={{ color: tokens.danger }} className="text-base font-bold">
            {error || 'Payment not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isConfirmed = payment.status === 'CONFIRMED';
  const isReversed = payment.status === 'REVERSED';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1 rounded-full active:opacity-70"
          >
            <ChevronLeftIcon size={24} color={tokens.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: tokens.textPrimary }} className="text-xl font-bold">
              Payment Receipt
            </Text>
            <Text style={{ color: tokens.textSecondary }} className="text-xs">
              Transaction ID: {payment.id.slice(0, 8)}...
            </Text>
          </View>
        </View>
        <Badge
          label={payment.status}
          variant={isConfirmed ? 'success' : isReversed ? 'danger' : 'neutral'}
          size="sm"
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        {/* Main Amount Card */}
        <Card className="p-6 items-center mb-5">
          <Text style={{ color: tokens.textSecondary }} className="text-xs uppercase font-bold tracking-wider mb-1">
            Amount Received
          </Text>
          <Text
            style={{
              color: isReversed ? tokens.textSecondary : tokens.primary,
              textDecorationLine: isReversed ? 'line-through' : 'none',
            }}
            className="text-3xl font-extrabold mb-2"
          >
            {formatMoney(payment.amount, payment.currency)}
          </Text>
          <Text style={{ color: tokens.textSecondary }} className="text-xs font-medium">
            Paid on {formatDate(payment.paidAt)}
          </Text>
        </Card>

        {/* Transaction Details Card */}
        <Card className="p-4 mb-5">
          <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold mb-3 uppercase tracking-wider">
            Payment Breakdown
          </Text>

          <View className="flex-row justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <Text style={{ color: tokens.textSecondary }} className="text-xs">
              Customer
            </Text>
            <Text style={{ color: tokens.textPrimary }} className="text-xs font-bold">
              {payment.customer?.name || 'Customer'}
            </Text>
          </View>

          <View className="flex-row justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <Text style={{ color: tokens.textSecondary }} className="text-xs">
              Payment Method
            </Text>
            <Text style={{ color: tokens.textPrimary }} className="text-xs font-bold">
              {payment.method}
            </Text>
          </View>

          {payment.reference ? (
            <View className="flex-row justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <Text style={{ color: tokens.textSecondary }} className="text-xs">
                Reference
              </Text>
              <Text style={{ color: tokens.textPrimary }} className="text-xs font-bold">
                {payment.reference}
              </Text>
            </View>
          ) : null}

          {payment.notes ? (
            <View className="pt-2">
              <Text style={{ color: tokens.textSecondary }} className="text-xs mb-1">
                Notes
              </Text>
              <Text style={{ color: tokens.textPrimary }} className="text-xs">
                {payment.notes}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Reverse Payment Action */}
        {isConfirmed && (
          <View className="mt-4">
            <Button
              label={reversing ? 'Reversing...' : 'Reverse Payment'}
              variant="destructive"
              size="lg"
              disabled={reversing}
              onPress={handleReversePayment}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

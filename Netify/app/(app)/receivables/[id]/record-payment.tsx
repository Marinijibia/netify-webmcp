import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../../src/design/theme';
import { Button } from '../../../../src/design/components/Button';
import { Card } from '../../../../src/design/components/Card';
import { Badge } from '../../../../src/design/components/Badge';
import {
  ChevronLeftIcon,
  CheckCircleIcon,
  CreditCardIcon,
} from '../../../../src/design/icons';
import {
  receivablesApi,
  ReceivableItem,
} from '../../../../src/services/api/receivables';
import { paymentsApi } from '../../../../src/services/api/payments';

export default function RecordPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tokens } = useTheme();

  const [receivable, setReceivable] = useState<ReceivableItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'POS' | 'OTHER'>('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReceivable() {
      if (!id) return;
      try {
        const res = await receivablesApi.getById(id);
        if (res.data) {
          setReceivable(res.data);
          // Default amount to full remaining balance
          setAmount(res.data.balance);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load receivable');
      } finally {
        setLoading(false);
      }
    }
    loadReceivable();
  }, [id]);

  const formatMoney = (val: string | number, currency: string = 'NGN') => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return `${currency} 0.00`;
    return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const numPaymentAmount = parseFloat(amount) || 0;
  const currentBalance = receivable ? parseFloat(receivable.balance) : 0;
  const remainingBalanceAfter = Math.max(0, currentBalance - numPaymentAmount);
  const isOverpaying = receivable ? numPaymentAmount > currentBalance : false;

  const handleSubmit = async () => {
    if (!receivable) return;

    if (numPaymentAmount <= 0) {
      Alert.alert('Validation Error', 'Payment amount must be greater than zero.');
      return;
    }

    if (isOverpaying) {
      Alert.alert(
        'Overpayment Rejected',
        `Payment amount (${formatMoney(numPaymentAmount, receivable.currency)}) exceeds current outstanding balance (${formatMoney(currentBalance, receivable.currency)}).`
      );
      return;
    }

    // Confirmation Alert
    Alert.alert(
      'Confirm Payment',
      `Record payment of ${formatMoney(numPaymentAmount, receivable.currency)} from ${receivable.customer?.name}?\n\nRemaining Balance: ${formatMoney(remainingBalanceAfter, receivable.currency)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Payment',
          style: 'default',
          onPress: async () => {
            try {
              setSubmitting(true);
              setError(null);

              const res = await paymentsApi.record({
                receivableId: receivable.id,
                amount: numPaymentAmount,
                method,
                reference: reference.trim() || undefined,
                notes: notes.trim() || undefined,
              });

              if (res.data) {
                Alert.alert('Success', 'Payment recorded successfully.', [
                  {
                    text: 'OK',
                    onPress: () => router.replace(`/(app)/receivables/${receivable.id}` as any),
                  },
                ]);
              } else {
                setError(res.message || 'Failed to record payment');
              }
            } catch (err: any) {
              setError(err.message || 'An unexpected error occurred');
            } finally {
              setSubmitting(false);
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
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!receivable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
        <View className="p-6">
          <Text style={{ color: tokens.danger }}>Receivable not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-1 rounded-full active:opacity-70"
        >
          <ChevronLeftIcon size={24} color={tokens.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={{ color: tokens.textPrimary }} className="text-xl font-bold">
            Record Payment
          </Text>
          <Text style={{ color: tokens.textSecondary }} className="text-xs">
            For {receivable.customer?.name || 'Customer'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800">
            <Text className="text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </Text>
          </View>
        ) : null}

        {/* Balance Preview Card */}
        <Card className="p-4 mb-5">
          <Text style={{ color: tokens.textSecondary }} className="text-xs uppercase font-bold tracking-wider mb-1">
            Current Outstanding Balance
          </Text>
          <Text style={{ color: tokens.primary }} className="text-2xl font-extrabold mb-3">
            {formatMoney(receivable.balance, receivable.currency)}
          </Text>

          {numPaymentAmount > 0 && (
            <View className="pt-3 border-t border-slate-100 dark:border-slate-800 flex-row justify-between">
              <View>
                <Text style={{ color: tokens.textSecondary }} className="text-xs font-medium">
                  Payment Amount
                </Text>
                <Text style={{ color: tokens.success }} className="text-sm font-bold mt-0.5">
                  - {formatMoney(numPaymentAmount, receivable.currency)}
                </Text>
              </View>
              <View className="items-end">
                <Text style={{ color: tokens.textSecondary }} className="text-xs font-medium">
                  Balance After Payment
                </Text>
                <Text
                  style={{
                    color: isOverpaying ? tokens.danger : tokens.textPrimary,
                  }}
                  className="text-sm font-bold mt-0.5"
                >
                  {formatMoney(remainingBalanceAfter, receivable.currency)}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Payment Amount Input */}
        <View className="mb-5">
          <Text style={{ color: tokens.textPrimary }} className="text-sm font-semibold mb-1.5">
            Payment Amount *
          </Text>
          <View
            style={{
              backgroundColor: tokens.surface,
              borderColor: isOverpaying ? tokens.danger : tokens.border,
            }}
            className="flex-row items-center px-3.5 py-3 rounded-xl border"
          >
            <Text style={{ color: tokens.primary }} className="text-base font-bold mr-2">
              ₦
            </Text>
            <TextInput
              placeholder="e.g. 200000.00"
              placeholderTextColor={tokens.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={{ color: tokens.textPrimary }}
              className="flex-1 text-base font-semibold"
            />
          </View>
          {isOverpaying ? (
            <Text className="text-xs text-red-500 mt-1 font-semibold">
              Payment cannot exceed outstanding balance of {formatMoney(currentBalance, receivable.currency)}.
            </Text>
          ) : null}
        </View>

        {/* Payment Method Selector */}
        <View className="mb-5">
          <Text style={{ color: tokens.textPrimary }} className="text-sm font-semibold mb-1.5">
            Payment Method
          </Text>
          <View className="flex-row flex-wrap">
            {(['BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'POS', 'CARD', 'OTHER'] as const).map((m) => {
              const active = method === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMethod(m)}
                  style={{
                    backgroundColor: active ? tokens.primary : tokens.surface,
                    borderColor: active ? tokens.primary : tokens.border,
                  }}
                  className="mr-2 mb-2 px-3 py-2 rounded-xl border items-center justify-center"
                >
                  <Text
                    style={{ color: active ? '#FFFFFF' : tokens.textPrimary }}
                    className="text-xs font-bold"
                  >
                    {m.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Payment Reference */}
        <View className="mb-5">
          <Text style={{ color: tokens.textPrimary }} className="text-sm font-semibold mb-1.5">
            Transaction Reference / Receipt # (Optional)
          </Text>
          <TextInput
            placeholder="e.g. GTB/TRF/9823412"
            placeholderTextColor={tokens.textSecondary}
            value={reference}
            onChangeText={setReference}
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.textPrimary,
            }}
            className="px-3.5 py-3 rounded-xl border text-sm"
          />
        </View>

        {/* Business Notes */}
        <View className="mb-8">
          <Text style={{ color: tokens.textPrimary }} className="text-sm font-semibold mb-1.5">
            Payment Notes (Optional)
          </Text>
          <TextInput
            placeholder="e.g. Paid via direct transfer from business account..."
            placeholderTextColor={tokens.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.textPrimary,
              minHeight: 80,
            }}
            className="px-3.5 py-3 rounded-xl border text-sm"
          />
        </View>

        {/* Submit Button */}
        <Button
          label={submitting ? 'Recording Payment...' : 'Confirm & Save Payment'}
          variant="primary"
          size="lg"
          disabled={submitting || isOverpaying || numPaymentAmount <= 0}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

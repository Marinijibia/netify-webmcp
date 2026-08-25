import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../../src/design/theme';
import { Button } from '../../../../src/design/components/Button';
import {
  ChevronLeftIcon,
  CreditCardIcon,
} from '../../../../src/design/icons';
import {
  receivablesApi,
  ReceivableItem,
} from '../../../../src/services/api/receivables';
import { paymentsApi } from '../../../../src/services/api/payments';
import { GRADIENTS } from '../../../../src/design/tokens/gradients';

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
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.primary} />
          <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!receivable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
        <View style={styles.centerContainer}>
          <Text style={{ color: tokens.danger }}>Receivable not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={GRADIENTS.navyHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <ChevronLeftIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Record Payment</Text>
          <Text style={styles.headerSubtitle}>
            {receivable.customer?.name || 'Customer'}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <CreditCardIcon size={20} color="rgba(255,255,255,0.7)" />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Balance Preview Card */}
        <View style={[styles.balanceCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <Text style={[styles.balanceLabel, { color: tokens.textSecondary }]}>
            CURRENT OUTSTANDING BALANCE
          </Text>
          <Text style={[styles.balanceAmount, { color: tokens.primary }]}>
            {formatMoney(receivable.balance, receivable.currency)}
          </Text>

          {numPaymentAmount > 0 && (
            <View style={[styles.balancePreview, { borderTopColor: tokens.border }]}>
              <View>
                <Text style={[styles.previewLabel, { color: tokens.textSecondary }]}>
                  Payment Amount
                </Text>
                <Text style={[styles.previewDeduction, { color: tokens.success }]}>
                  − {formatMoney(numPaymentAmount, receivable.currency)}
                </Text>
              </View>
              <View style={styles.previewRight}>
                <Text style={[styles.previewLabel, { color: tokens.textSecondary }]}>
                  Balance After
                </Text>
                <Text
                  style={[
                    styles.previewBalance,
                    { color: isOverpaying ? tokens.danger : tokens.textPrimary },
                  ]}
                >
                  {formatMoney(remainingBalanceAfter, receivable.currency)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Payment Amount Input */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: tokens.textPrimary }]}>
            Payment Amount *
          </Text>
          <View
            style={[
              styles.amountInput,
              {
                backgroundColor: tokens.surface,
                borderColor: isOverpaying ? tokens.danger : tokens.border,
              },
            ]}
          >
            <Text style={[styles.currencySymbol, { color: tokens.primary }]}>₦</Text>
            <TextInput
              placeholder="e.g. 200000.00"
              placeholderTextColor={tokens.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={[styles.amountTextInput, { color: tokens.textPrimary }]}
            />
          </View>
          {isOverpaying ? (
            <Text style={styles.overpayWarning}>
              Payment cannot exceed outstanding balance of {formatMoney(currentBalance, receivable.currency)}.
            </Text>
          ) : null}
        </View>

        {/* Payment Method Selector */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: tokens.textPrimary }]}>
            Payment Method
          </Text>
          <View style={styles.methodGrid}>
            {(['BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'POS', 'CARD', 'OTHER'] as const).map((m) => {
              const active = method === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMethod(m)}
                  style={[
                    styles.methodChip,
                    {
                      backgroundColor: active ? tokens.primary : tokens.surface,
                      borderColor: active ? tokens.primary : tokens.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.methodChipText,
                      { color: active ? '#FFFFFF' : tokens.textPrimary },
                    ]}
                  >
                    {m.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Payment Reference */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: tokens.textPrimary }]}>
            Transaction Reference / Receipt # (Optional)
          </Text>
          <TextInput
            placeholder="e.g. GTB/TRF/9823412"
            placeholderTextColor={tokens.textSecondary}
            value={reference}
            onChangeText={setReference}
            style={[
              styles.textInput,
              {
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                color: tokens.textPrimary,
              },
            ]}
          />
        </View>

        {/* Business Notes */}
        <View style={styles.fieldGroupLast}>
          <Text style={[styles.fieldLabel, { color: tokens.textPrimary }]}>
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
            style={[
              styles.textArea,
              {
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                color: tokens.textPrimary,
              },
            ]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  errorBanner: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FDE8E8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
  },
  balanceCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  balancePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  previewDeduction: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  previewRight: {
    alignItems: 'flex-end',
  },
  previewBalance: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldGroupLast: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  overpayWarning: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '600',
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  methodChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
});

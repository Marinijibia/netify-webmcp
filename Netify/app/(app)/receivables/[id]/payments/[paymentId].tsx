import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../../../src/design/theme';
import { Button } from '../../../../../src/design/components/Button';
import { Badge } from '../../../../../src/design/components/Badge';
import {
  ChevronLeftIcon,
  CreditCardIcon,
  CheckCircleIcon,
  RotateCcwIcon,
  FileTextIcon,
} from '../../../../../src/design/icons';
import { paymentsApi, PaymentItem } from '../../../../../src/services/api/payments';
import { GRADIENTS } from '../../../../../src/design/tokens/gradients';

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
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.primary} />
          <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>
            Loading payment details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !payment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
        <LinearGradient
          colors={GRADIENTS.navyHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
            <ChevronLeftIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Receipt</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={[styles.centerContainer, { padding: 24 }]}>
          <Text style={{ color: tokens.danger, fontSize: 15, fontWeight: '700' }}>
            {error || 'Payment not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isConfirmed = payment.status === 'CONFIRMED';
  const isReversed = payment.status === 'REVERSED';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={GRADIENTS.navyHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <ChevronLeftIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Payment Receipt</Text>
          <Text style={styles.headerSubtitle}>
            ID: {payment.id.slice(0, 8)}...
          </Text>
        </View>
        <Badge
          label={payment.status}
          variant={isConfirmed ? 'success' : isReversed ? 'danger' : 'neutral'}
          size="sm"
        />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Amount Card */}
        <LinearGradient
          colors={
            isReversed
              ? ['rgba(107,114,128,0.08)', 'rgba(107,114,128,0.03)']
              : ['rgba(0,165,129,0.08)', 'rgba(0,48,81,0.04)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.amountCard, { borderColor: isReversed ? tokens.border : 'rgba(0,165,129,0.2)' }]}
        >
          <View style={[styles.amountIconCircle, { backgroundColor: isReversed ? tokens.surfaceMuted : 'rgba(0,165,129,0.12)' }]}>
            {isReversed ? (
              <RotateCcwIcon size={22} color={tokens.textMuted} />
            ) : (
              <CheckCircleIcon size={22} color="#00A581" />
            )}
          </View>
          <Text style={[styles.amountLabel, { color: tokens.textSecondary }]}>Amount Received</Text>
          <Text
            style={[
              styles.amountValue,
              {
                color: isReversed ? tokens.textSecondary : tokens.primary,
                textDecorationLine: isReversed ? 'line-through' : 'none',
              },
            ]}
          >
            {formatMoney(payment.amount, payment.currency)}
          </Text>
          <Text style={[styles.paidDate, { color: tokens.textSecondary }]}>
            Paid on {formatDate(payment.paidAt)}
          </Text>
        </LinearGradient>

        {/* Transaction Details */}
        <View style={[styles.detailCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <Text style={[styles.detailCardTitle, { color: tokens.textPrimary }]}>Payment Breakdown</Text>

          <View style={[styles.detailRow, { borderBottomColor: tokens.border }]}>
            <Text style={[styles.detailLabel, { color: tokens.textSecondary }]}>Customer</Text>
            <Text style={[styles.detailValue, { color: tokens.textPrimary }]}>
              {payment.customer?.name || 'Customer'}
            </Text>
          </View>

          <View style={[styles.detailRow, { borderBottomColor: tokens.border }]}>
            <Text style={[styles.detailLabel, { color: tokens.textSecondary }]}>Payment Method</Text>
            <Text style={[styles.detailValue, { color: tokens.textPrimary }]}>
              {payment.method}
            </Text>
          </View>

          {payment.reference ? (
            <View style={[styles.detailRow, { borderBottomColor: tokens.border }]}>
              <Text style={[styles.detailLabel, { color: tokens.textSecondary }]}>Reference</Text>
              <Text style={[styles.detailValue, { color: tokens.textPrimary }]}>
                {payment.reference}
              </Text>
            </View>
          ) : null}

          {payment.notes ? (
            <View style={styles.notesRow}>
              <Text style={[styles.detailLabel, { color: tokens.textSecondary }]}>Notes</Text>
              <Text style={[styles.notesText, { color: tokens.textPrimary }]}>
                {payment.notes}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Reverse Payment Action */}
        {isConfirmed && (
          <View style={styles.actionContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  amountCard: {
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    padding: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  amountIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
  },
  paidDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  detailCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  notesRow: {
    paddingTop: 10,
  },
  notesText: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  actionContainer: {
    marginTop: 8,
  },
});

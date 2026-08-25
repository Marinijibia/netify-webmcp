import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../../src/design/theme';
import {
  receivablesApi,
  ReceivableItem,
} from '../../../../src/services/api/receivables';
import {
  collectionActivitiesApi,
  ActivityType,
  CollectionChannel,
  ActivityOutcome,
} from '../../../../src/services/api/collection-activities';
import {
  ChevronLeftIcon,
  AlertCircleIcon,
} from '../../../../src/design/icons';
import { GRADIENTS } from '../../../../src/design/tokens/gradients';

const ACTIVITY_TYPES: { label: string; value: ActivityType }[] = [
  { label: 'Call', value: 'CALL' },
  { label: 'WhatsApp', value: 'WHATSAPP' },
  { label: 'SMS', value: 'SMS' },
  { label: 'In Person', value: 'IN_PERSON' },
  { label: 'Reminder', value: 'PAYMENT_REMINDER' },
  { label: 'Follow Up', value: 'FOLLOW_UP' },
  { label: 'Other', value: 'OTHER' },
];

const CHANNELS: { label: string; value: CollectionChannel }[] = [
  { label: 'Phone Call', value: 'PHONE' },
  { label: 'WhatsApp', value: 'WHATSAPP' },
  { label: 'SMS', value: 'SMS' },
  { label: 'In-Person', value: 'IN_PERSON' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'Other', value: 'OTHER' },
];

const OUTCOMES: { label: string; value: ActivityOutcome }[] = [
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'Promised Payment', value: 'PROMISED_PAYMENT' },
  { label: 'Requested Extension', value: 'REQUESTED_EXTENSION' },
  { label: 'Partial Payment Made', value: 'PARTIAL_PAYMENT' },
  { label: 'Full Payment Made', value: 'FULL_PAYMENT' },
  { label: 'No Response', value: 'NO_RESPONSE' },
  { label: 'Customer Unavailable', value: 'CUSTOMER_UNAVAILABLE' },
  { label: 'Disputed Invoice', value: 'DISPUTE' },
  { label: 'Wrong Contact', value: 'WRONG_CONTACT' },
];

export default function RecordActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tokens } = useTheme();

  const [receivable, setReceivable] = useState<ReceivableItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedType, setSelectedType] = useState<ActivityType>('CALL');
  const [selectedChannel, setSelectedChannel] = useState<CollectionChannel>('PHONE');
  const [selectedOutcome, setSelectedOutcome] = useState<ActivityOutcome>('CONTACTED');
  const [notes, setNotes] = useState('');

  // Inline Commitment State
  const [hasCommitment, setHasCommitment] = useState(false);
  const [commitmentAmount, setCommitmentAmount] = useState('');
  const [promiseDays, setPromiseDays] = useState(3);
  const [commitmentNotes, setCommitmentNotes] = useState('');

  useEffect(() => {
    fetchReceivable();
  }, [id]);

  const fetchReceivable = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await receivablesApi.getById(id);
      if (res.data) {
        setReceivable(res.data);
        setCommitmentAmount(res.data.balance || res.data.originalAmount);
      } else {
        setError('Failed to load receivable details');
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading receivable');
    } finally {
      setLoading(false);
    }
  };

  const handleOutcomeSelect = (outcome: ActivityOutcome) => {
    setSelectedOutcome(outcome);
    if (outcome === 'PROMISED_PAYMENT') {
      setHasCommitment(true);
    }
  };

  const calculatePromiseDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const handleSubmit = async () => {
    if (!receivable) return;

    if (hasCommitment) {
      const commAmt = parseFloat(commitmentAmount);
      const balance = parseFloat(receivable.balance);
      if (isNaN(commAmt) || commAmt <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid positive promised amount.');
        return;
      }
      if (commAmt > balance) {
        Alert.alert(
          'Validation Error',
          `Promised amount (${receivable.currency} ${commAmt.toLocaleString()}) cannot exceed outstanding balance (${receivable.currency} ${balance.toLocaleString()}).`
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload: any = {
        receivableId: receivable.id,
        customerId: receivable.customerId,
        type: selectedType,
        channel: selectedChannel,
        outcome: selectedOutcome,
        notes: notes.trim() || undefined,
      };

      if (hasCommitment) {
        payload.commitment = {
          amount: parseFloat(commitmentAmount),
          promisedFor: calculatePromiseDate(promiseDays),
          notes: commitmentNotes.trim() || undefined,
        };
      }

      const res = await collectionActivitiesApi.createActivity(payload);
      if (res.success) {
        Alert.alert('Success', 'Collection activity recorded successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to record collection activity.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record activity.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: tokens.background }]}>
        <ActivityIndicator size="large" color={tokens.primary} />
        <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>
          Loading receivable...
        </Text>
      </View>
    );
  }

  if (error || !receivable) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: tokens.background }]}>
        <AlertCircleIcon size={40} color={tokens.danger} />
        <Text style={[styles.errorTitle, { color: tokens.textPrimary }]}>Unable to load</Text>
        <Text style={[styles.errorSubtitle, { color: tokens.textSecondary }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: tokens.primary }]}
          onPress={fetchReceivable}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Record Collection Activity</Text>
          <Text style={styles.headerSubtitle}>
            {receivable.customer?.name || 'Customer'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <Text style={[styles.customerName, { color: tokens.textPrimary }]}>
            {receivable.customer?.name || 'Customer'}
          </Text>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceLabel, { color: tokens.textSecondary }]}>Outstanding Debt:</Text>
            <Text style={[styles.balanceValue, { color: tokens.primary }]}>
              {receivable.currency} {parseFloat(receivable.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Communication Channel */}
        <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>Communication Channel</Text>
        <View style={styles.chipGrid}>
          {CHANNELS.map((ch) => {
            const isSelected = selectedChannel === ch.value;
            return (
              <TouchableOpacity
                key={ch.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? tokens.primary : tokens.surface,
                    borderColor: isSelected ? tokens.primary : tokens.border,
                  },
                ]}
                onPress={() => setSelectedChannel(ch.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : tokens.textPrimary }]}>
                  {ch.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Interaction Type */}
        <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>Interaction Type</Text>
        <View style={styles.chipGrid}>
          {ACTIVITY_TYPES.map((t) => {
            const isSelected = selectedType === t.value;
            return (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? tokens.primary : tokens.surface,
                    borderColor: isSelected ? tokens.primary : tokens.border,
                  },
                ]}
                onPress={() => setSelectedType(t.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : tokens.textPrimary }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Outcome */}
        <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>Interaction Outcome</Text>
        <View style={styles.chipGrid}>
          {OUTCOMES.map((o) => {
            const isSelected = selectedOutcome === o.value;
            return (
              <TouchableOpacity
                key={o.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? tokens.primary : tokens.surface,
                    borderColor: isSelected ? tokens.primary : tokens.border,
                  },
                ]}
                onPress={() => handleOutcomeSelect(o.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : tokens.textPrimary }]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}
        <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>Human Notes / Conversation Detail</Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.textPrimary,
            },
          ]}
          placeholder="e.g. Customer stated supplier delayed payment and requested 3 days..."
          placeholderTextColor={tokens.textSecondary}
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />

        {/* Commitment Toggle */}
        <View style={[styles.commitmentSection, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View style={styles.commitmentHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.commitmentTitle, { color: tokens.textPrimary }]}>
                Customer Promised Payment?
              </Text>
              <Text style={[styles.commitmentSubtitle, { color: tokens.textSecondary }]}>
                Record a formal commitment date and promised amount
              </Text>
            </View>
            <Switch
              value={hasCommitment}
              onValueChange={setHasCommitment}
              trackColor={{ false: tokens.border, true: tokens.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {hasCommitment && (
            <View style={[styles.commitmentFields, { borderTopColor: tokens.border }]}>
              <Text style={[styles.fieldLabel, { color: tokens.textPrimary }]}>
                Promised Amount ({receivable.currency})
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: tokens.background,
                    borderColor: tokens.border,
                    color: tokens.textPrimary,
                  },
                ]}
                keyboardType="numeric"
                value={commitmentAmount}
                onChangeText={setCommitmentAmount}
                placeholder="0.00"
                placeholderTextColor={tokens.textSecondary}
              />

              <Text style={[styles.fieldLabel, { color: tokens.textPrimary }]}>Promised Within</Text>
              <View style={styles.daysRow}>
                {[1, 3, 7, 14, 30].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: promiseDays === days ? tokens.primary : tokens.background,
                        borderColor: promiseDays === days ? tokens.primary : tokens.border,
                      },
                    ]}
                    onPress={() => setPromiseDays(days)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        { color: promiseDays === days ? '#FFFFFF' : tokens.textPrimary },
                      ]}
                    >
                      {days === 1 ? 'Tomorrow' : `${days} Days`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: tokens.textPrimary }]}>Promise Notes</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: tokens.background,
                    borderColor: tokens.border,
                    color: tokens.textPrimary,
                  },
                ]}
                value={commitmentNotes}
                onChangeText={setCommitmentNotes}
                placeholder="Optional promise conditions or notes..."
                placeholderTextColor={tokens.textSecondary}
              />
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { opacity: submitting ? 0.7 : 1 },
          ]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={GRADIENTS.navyToTeal}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Save Collection Activity</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 16,
  },
  commitmentSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  commitmentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commitmentTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  commitmentSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  commitmentFields: {
    marginTop: 16,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

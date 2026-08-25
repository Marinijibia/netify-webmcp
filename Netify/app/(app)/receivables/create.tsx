import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/design/theme';
import { Avatar } from '@/design/components';
import { ChevronLeftIcon, UserIcon } from '@/design/icons';
import { receivablesApi } from '@/services/api/receivables';
import { customersApi, CustomerItem } from '@/services/api/customers';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';

const SOURCE_OPTIONS = [
  { value: 'MANUAL', label: 'Manual', icon: 'pencil-outline' },
  { value: 'CREDIT_SALE', label: 'Credit Sale', icon: 'cart-outline' },
  { value: 'INVOICE', label: 'Invoice', icon: 'file-document-outline' },
  { value: 'OTHER', label: 'Other', icon: 'dots-horizontal' },
] as const;

const TERM_OPTIONS = [7, 14, 30, 60];

export default function CreateReceivableScreen() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [dueDateDays, setDueDateDays] = useState(14);
  const [source, setSource] = useState<'MANUAL' | 'INVOICE' | 'CREDIT_SALE' | 'OTHER'>('MANUAL');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await customersApi.list({ pageSize: 50, status: 'ACTIVE' });
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.items)
          ? (res.data as any).items
          : [];
        if (list.length > 0) {
          setCustomers(list);
          setSelectedCustomerId(list[0].id);
          setSelectedCustomer(list[0]);
        }
      } catch {
        // silent fail
      } finally {
        setLoadingCustomers(false);
      }
    }
    loadCustomers();
  }, []);

  const calculateDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + dueDateDays);
    return d.toISOString();
  };

  const handleSelectCustomer = (c: CustomerItem) => {
    setSelectedCustomerId(c.id);
    setSelectedCustomer(c);
    setError(null);
  };

  const handleSave = async () => {
    if (!selectedCustomerId) {
      setError('Please select a customer to assign this receivable to.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await receivablesApi.create({
        customerId: selectedCustomerId,
        amount: numAmount,
        dueDate: calculateDueDate(),
        description: description.trim() || undefined,
        reference: reference.trim() || undefined,
        source,
        notes: notes.trim() || undefined,
      });

      if (res.data) {
        router.replace(`/(app)/receivables/${res.data.id}` as any);
      } else {
        setError(res.message || 'Failed to create receivable');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const headerGradient = isDark ? GRADIENTS.darkHero : GRADIENTS.navyHero;

  const dueDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + dueDateDays);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  })();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.background }]}>
      {/* ── HEADER ── */}
      <LinearGradient
        colors={headerGradient as [string, string]}
        start={GRADIENT_DIRECTION.toBottomRight.start}
        end={GRADIENT_DIRECTION.toBottomRight.end}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeftIcon size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Record Receivable</Text>
          <Text style={styles.headerSub}>Authoritative debtor obligation</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── CUSTOMER SELECTOR ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(0,165,129,0.1)' }]}>
                <MaterialCommunityIcons name="account-outline" size={16} color="#00A581" />
              </View>
              <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>Customer / Debtor *</Text>
            </View>

            {loadingCustomers ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#00A581" />
                <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>Loading customers...</Text>
              </View>
            ) : customers.length === 0 ? (
              <View style={styles.emptyCustomers}>
                <MaterialCommunityIcons name="account-plus-outline" size={28} color={tokens.textMuted} />
                <Text style={[styles.emptyCustomersText, { color: tokens.textSecondary }]}>
                  No active customers found.
                </Text>
                <TouchableOpacity
                  style={styles.addCustomerBtn}
                  onPress={() => router.push('/(app)/customers/create' as any)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={GRADIENTS.tealSheen as unknown as [string, string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.addCustomerGradient}
                  >
                    <Feather name="user-plus" size={14} color="#FFFFFF" />
                    <Text style={styles.addCustomerText}>Add Customer First</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Selected customer preview */}
                {selectedCustomer && (
                  <View style={[styles.selectedCustomerRow, { backgroundColor: isDark ? 'rgba(0,165,129,0.08)' : 'rgba(0,165,129,0.05)', borderColor: 'rgba(0,165,129,0.2)' }]}>
                    <Avatar name={selectedCustomer.name} size="sm" />
                    <View style={styles.selectedCustomerInfo}>
                      <Text style={[styles.selectedCustomerName, { color: tokens.textPrimary }]}>
                        {selectedCustomer.name}
                      </Text>
                      <Text style={[styles.selectedCustomerMeta, { color: tokens.textMuted }]}>
                        Selected debtor
                      </Text>
                    </View>
                    <View style={styles.selectedCheck}>
                      <Feather name="check-circle" size={18} color="#00A581" />
                    </View>
                  </View>
                )}

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.customerScroll}>
                  {customers.map((c) => {
                    const selected = selectedCustomerId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => handleSelectCustomer(c)}
                        style={[
                          styles.customerChip,
                          {
                            backgroundColor: selected ? '#00A581' : tokens.background,
                            borderColor: selected ? '#00A581' : tokens.border,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <UserIcon size={12} color={selected ? '#FFFFFF' : tokens.textSecondary} />
                        <Text style={[styles.customerChipText, { color: selected ? '#FFFFFF' : tokens.textPrimary }]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>

          {/* ── AMOUNT ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <MaterialCommunityIcons name="currency-usd" size={16} color="#EF4444" />
              </View>
              <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>Amount Owed *</Text>
            </View>

            <View style={[styles.amountInputRow, { backgroundColor: tokens.background, borderColor: amount ? '#00A581' : tokens.border }]}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput
                placeholder="0.00"
                placeholderTextColor={tokens.textMuted}
                value={amount}
                onChangeText={(t) => { setAmount(t); setError(null); }}
                keyboardType="decimal-pad"
                style={[styles.amountInput, { color: tokens.textPrimary }]}
              />
              {amount ? (
                <Text style={[styles.amountPreview, { color: tokens.textMuted }]}>
                  ≈ {parseFloat(amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              ) : null}
            </View>
          </View>

          {/* ── PAYMENT TERMS ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color="#F59E0B" />
              </View>
              <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>Payment Term</Text>
              <Text style={[styles.dueDatePreview, { color: '#00A581' }]}>Due {dueDate}</Text>
            </View>

            <View style={styles.termRow}>
              {TERM_OPTIONS.map((days) => {
                const active = dueDateDays === days;
                return (
                  <TouchableOpacity
                    key={days}
                    onPress={() => setDueDateDays(days)}
                    style={[
                      styles.termChip,
                      {
                        backgroundColor: active ? '#00A581' : tokens.background,
                        borderColor: active ? '#00A581' : tokens.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.termChipText, { color: active ? '#FFFFFF' : tokens.textPrimary }]}>
                      {days}d
                    </Text>
                    <Text style={[styles.termChipLabel, { color: active ? 'rgba(255,255,255,0.75)' : tokens.textMuted }]}>
                      {days === 7 ? 'Week' : days === 14 ? 'Net-14' : days === 30 ? 'Month' : '2 Mo'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── SOURCE ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                <MaterialCommunityIcons name="source-branch" size={16} color="#6366F1" />
              </View>
              <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>Source</Text>
            </View>

            <View style={styles.sourceRow}>
              {SOURCE_OPTIONS.map((s) => {
                const active = source === s.value;
                return (
                  <TouchableOpacity
                    key={s.value}
                    onPress={() => setSource(s.value)}
                    style={[
                      styles.sourceChip,
                      {
                        backgroundColor: active ? '#6366F1' : tokens.background,
                        borderColor: active ? '#6366F1' : tokens.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={s.icon as any}
                      size={14}
                      color={active ? '#FFFFFF' : tokens.textSecondary}
                    />
                    <Text style={[styles.sourceChipText, { color: active ? '#FFFFFF' : tokens.textSecondary }]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── DETAILS ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                <MaterialCommunityIcons name="file-document-outline" size={16} color="#10B981" />
              </View>
              <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>Details</Text>
            </View>

            <Text style={[styles.inputLabel, { color: tokens.textSecondary }]}>Reference / Invoice #</Text>
            <TextInput
              placeholder="e.g. INV-2026-089"
              placeholderTextColor={tokens.textMuted}
              value={reference}
              onChangeText={setReference}
              style={[styles.textInput, { backgroundColor: tokens.background, borderColor: tokens.border, color: tokens.textPrimary }]}
            />

            <Text style={[styles.inputLabel, { color: tokens.textSecondary, marginTop: 14 }]}>Description</Text>
            <TextInput
              placeholder="e.g. 50 bags of cement, wholesale delivery"
              placeholderTextColor={tokens.textMuted}
              value={description}
              onChangeText={setDescription}
              style={[styles.textInput, { backgroundColor: tokens.background, borderColor: tokens.border, color: tokens.textPrimary }]}
            />

            <Text style={[styles.inputLabel, { color: tokens.textSecondary, marginTop: 14 }]}>Internal Notes</Text>
            <TextInput
              placeholder="Additional context or credit arrangements..."
              placeholderTextColor={tokens.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[styles.textArea, { backgroundColor: tokens.background, borderColor: tokens.border, color: tokens.textPrimary }]}
            />
          </View>

          {/* ── SUBMIT ── */}
          <TouchableOpacity
            style={[styles.submitWrapper, (submitting || customers.length === 0) && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={submitting || customers.length === 0}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={GRADIENTS.navyToTeal as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="receipt" size={18} color="#FFFFFF" />
                  <Text style={styles.submitText}>Record Receivable</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.legalNote, { color: tokens.textMuted }]}>
            This receivable will be tracked in your active ledger and available for collection activities.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  scrollContent: { padding: 16, paddingBottom: 48, gap: 14 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: '#EF4444', fontWeight: '500' },

  card: {
    borderRadius: 18, borderWidth: 1, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },

  // Customer selector
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  loadingText: { fontSize: 13 },
  emptyCustomers: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  emptyCustomersText: { fontSize: 13 },
  addCustomerBtn: { borderRadius: 12, overflow: 'hidden' },
  addCustomerGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  addCustomerText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  selectedCustomerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12,
  },
  selectedCustomerInfo: { flex: 1 },
  selectedCustomerName: { fontSize: 14, fontWeight: '700' },
  selectedCustomerMeta: { fontSize: 11, marginTop: 1 },
  selectedCheck: {},
  customerScroll: { marginHorizontal: -2 },
  customerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginRight: 8,
  },
  customerChipText: { fontSize: 12, fontWeight: '700' },

  // Amount
  amountInputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, gap: 8,
  },
  currencySymbol: { fontSize: 22, fontWeight: '800', color: '#00A581' },
  amountInput: { flex: 1, fontSize: 22, fontWeight: '800' },
  amountPreview: { fontSize: 12, fontWeight: '500' },

  // Terms
  dueDatePreview: { fontSize: 12, fontWeight: '700' },
  termRow: { flexDirection: 'row', gap: 8 },
  termChip: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    paddingVertical: 10, alignItems: 'center',
  },
  termChipText: { fontSize: 15, fontWeight: '800' },
  termChipLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  // Source
  sourceRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sourceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  sourceChipText: { fontSize: 12, fontWeight: '700' },

  // Inputs
  inputLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6, letterSpacing: 0.2 },
  textInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textArea: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 80 },

  // Submit
  submitWrapper: { borderRadius: 16, overflow: 'hidden' },
  submitGradient: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  legalNote: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
});

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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/design/theme';
import { Button } from '../../../src/design/components/Button';
import { Card } from '../../../src/design/components/Card';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  UserIcon,
} from '../../../src/design/icons';
import { receivablesApi } from '../../../src/services/api/receivables';
import { customersApi, CustomerItem } from '../../../src/services/api/customers';

export default function CreateReceivableScreen() {
  const router = useRouter();
  const { tokens } = useTheme();

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [dueDateDays, setDueDateDays] = useState(14); // Default 14 days
  const [source, setSource] = useState<'MANUAL' | 'INVOICE' | 'CREDIT_SALE' | 'OTHER'>('MANUAL');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await customersApi.list({ pageSize: 50, status: 'ACTIVE' });
        if (res.data && res.data.length > 0) {
          setCustomers(res.data);
          setSelectedCustomerId(res.data[0].id);
        }
      } catch (err: any) {
        // Fallback
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

  const handleSave = async () => {
    if (!selectedCustomerId) {
      Alert.alert('Validation Error', 'Please select a customer.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than 0.');
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
        Alert.alert('Success', 'Receivable recorded successfully.', [
          {
            text: 'OK',
            onPress: () => router.replace(`/(app)/receivables/${res.data!.id}` as any),
          },
        ]);
      } else {
        setError(res.message || 'Failed to create receivable');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

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
            Record Receivable
          </Text>
          <Text style={{ color: tokens.textSecondary }} className="text-xs">
            Create an authoritative debtor obligation
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

        {/* Customer Selector */}
        <View className="mb-5">
          <Text style={{ color: tokens.textPrimary }} className="text-sm font-semibold mb-2">
            Customer / Debtor *
          </Text>
          {loadingCustomers ? (
            <ActivityIndicator size="small" color={tokens.primary} className="py-2" />
          ) : customers.length === 0 ? (
            <Card className="p-4 items-center">
              <Text style={{ color: tokens.textSecondary }} className="text-xs mb-2">
                No active customers found. Please add a customer first.
              </Text>
              <Button
                label="Add Customer"
                size="sm"
                onPress={() => router.push('/(app)/customers/create' as any)}
              />
            </Card>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
              {customers.map((c) => {
                const selected = selectedCustomerId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedCustomerId(c.id)}
                    style={{
                      backgroundColor: selected ? tokens.primary : tokens.surface,
                      borderColor: selected ? tokens.primary : tokens.border,
                    }}
                    className="mr-2 px-3.5 py-2.5 rounded-xl border flex-row items-center"
                  >
                    <UserIcon size={14} color={selected ? '#FFFFFF' : tokens.textSecondary} />
                    <Text
                      style={{ color: selected ? '#FFFFFF' : tokens.textPrimary }}
                      className="text-xs font-bold ml-1.5"
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Amount Input */}
        <View className="mb-5">
          <Text style={{ color: tokens.textPrimary }} className="text-sm font-semibold mb-1.5">
            Amount (Owed) *
          </Text>
          <View
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            }}
            className="flex-row items-center px-3.5 py-3 rounded-xl border"
          >
            <Text style={{ color: tokens.primary }} className="text-base font-bold mr-2">
              ₦
            </Text>
            <TextInput
              placeholder="e.g. 450000.00"
              placeholderTextColor={tokens.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={{ color: tokens.textPrimary }}
              className="flex-1 text-base font-semibold"
            />
          </View>
        </View>

        {/* Payment Term / Due Date Selection */}
        <View className="mb-5">
          <Text style={{ color: tokens.textPrimary }} className="text-sm font-semibold mb-1.5">
            Payment Term (Due In)
          </Text>
          <View className="flex-row">
            {[7, 14, 30, 60].map((days) => {
              const active = dueDateDays === days;
              return (
                <TouchableOpacity
                  key={days}
                  onPress={() => setDueDateDays(days)}
                  style={{
                    backgroundColor: active ? tokens.primary : tokens.surface,
                    borderColor: active ? tokens.primary : tokens.border,
                  }}
                  className="flex-1 mr-2 last:mr-0 py-2.5 rounded-xl border items-center justify-center"
                >
                  <Text
                    style={{ color: active ? '#FFFFFF' : tokens.textPrimary }}
                    className="text-xs font-bold"
                  >
                    {days} Days
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Source Selection */}
        <View className="mb-5">
          <Text style={{ color: tokens.textPrimary }} className="text-sm font-semibold mb-1.5">
            Receivable Source
          </Text>
          <View className="flex-row">
            {(['MANUAL', 'CREDIT_SALE', 'INVOICE', 'OTHER'] as const).map((s) => {
              const active = source === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSource(s)}
                  style={{
                    backgroundColor: active ? tokens.primary : tokens.surface,
                    borderColor: active ? tokens.primary : tokens.border,
                  }}
                  className="flex-1 mr-1.5 last:mr-0 py-2 rounded-lg border items-center justify-center"
                >
                  <Text
                    style={{ color: active ? '#FFFFFF' : tokens.textSecondary }}
                    className="text-[10px] font-bold"
                  >
                    {s.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reference */}
        <View className="mb-5">
          <Text style={{ color: tokens.textPrimary }} className="text-sm font-semibold mb-1.5">
            Reference / Invoice # (Optional)
          </Text>
          <TextInput
            placeholder="e.g. INV-2026-089"
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

        {/* Description */}
        <View className="mb-5">
          <Text style={{ color: tokens.textPrimary }} className="text-sm font-semibold mb-1.5">
            Description (Optional)
          </Text>
          <TextInput
            placeholder="e.g. 50 bags of cement, wholesale delivery"
            placeholderTextColor={tokens.textSecondary}
            value={description}
            onChangeText={setDescription}
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
            Internal Notes (Optional)
          </Text>
          <TextInput
            placeholder="Additional context or credit arrangements..."
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
          label={submitting ? 'Saving Receivable...' : 'Record Receivable'}
          variant="primary"
          size="lg"
          disabled={submitting || customers.length === 0}
          onPress={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

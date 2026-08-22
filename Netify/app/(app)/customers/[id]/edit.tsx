import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/design/theme';
import { Input, Button, Card, Alert } from '@/design/components';
import { ChevronLeftIcon, UserIcon } from '@/design/icons';
import { customersApi, CustomerItem } from '@/services/api/customers';

export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tokens, isDark } = useTheme();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'BLOCKED'>('ACTIVE');

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomer() {
      if (!id) return;
      try {
        setInitialLoading(true);
        const res = await customersApi.getById(id);
        if (res.success && res.data) {
          setName(res.data.name);
          setAddress(res.data.address || '');
          setNotes(res.data.notes || '');
          setStatus(res.data.status);
        } else {
          setErrorMessage(res.error?.message || 'Failed to load customer');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to load customer');
      } finally {
        setInitialLoading(false);
      }
    }
    loadCustomer();
  }, [id]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMessage('Customer name is required');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      const response = await customersApi.update(id!, {
        name: name.trim(),
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      });

      if (response.success) {
        router.back();
      } else {
        setErrorMessage(response.error?.message || 'Failed to update customer');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: isDark ? tokens.surface : '#F1F5F9' }}
        >
          <ChevronLeftIcon size={20} color={tokens.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={{ color: tokens.textPrimary }} className="text-xl font-bold">
            Edit Customer
          </Text>
          <Text style={{ color: tokens.textSecondary }} className="text-xs">
            Update debtor profile and business notes
          </Text>
        </View>
      </View>

      {initialLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.primary} />
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {errorMessage && (
            <Alert variant="danger" title="Error" message={errorMessage} className="mb-4" />
          )}

          {/* Identity Card */}
          <Card
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="p-4 mb-4"
          >
            <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold mb-3 uppercase tracking-wider">
              Profile Details
            </Text>

            <Input
              label="Customer / Business Name *"
              value={name}
              onChangeText={setName}
              leftIcon={<UserIcon size={18} color={tokens.textMuted} />}
              className="mb-3"
            />

            <Input
              label="Office / Billing Address"
              value={address}
              onChangeText={setAddress}
              className="mb-3"
            />

            {/* Status Selection */}
            <Text style={{ color: tokens.textSecondary }} className="text-xs font-bold mb-2 uppercase">
              Status
            </Text>
            <View className="flex-row items-center mb-1">
              {(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).map((s) => {
                const isSelected = status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStatus(s)}
                    style={{
                      backgroundColor: isSelected ? tokens.primary : isDark ? tokens.background : '#F1F5F9',
                    }}
                    className="px-3 py-1.5 rounded-lg mr-2"
                  >
                    <Text
                      style={{
                        color: isSelected ? '#FFFFFF' : tokens.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      }}
                      className="text-xs"
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Notes Card */}
          <Card
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="p-4 mb-6"
          >
            <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold mb-3 uppercase tracking-wider">
              Internal Notes
            </Text>

            <Input
              label="Customer Notes & Terms"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </Card>

          <Button
            label="Save Changes"
            variant="primary"
            size="lg"
            loading={saving}
            onPress={handleSubmit}
            className="mb-8"
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

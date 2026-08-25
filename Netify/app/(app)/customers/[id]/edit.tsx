import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/design/theme';
import { Input, Button, Card, Alert } from '@/design/components';
import { ChevronLeftIcon, UserIcon } from '@/design/icons';
import { customersApi, CustomerItem } from '@/services/api/customers';
import { GRADIENTS } from '@/design/tokens/gradients';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={GRADIENTS.navyHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={editStyles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={editStyles.backButton}
          activeOpacity={0.8}
        >
          <ChevronLeftIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={editStyles.headerCenter}>
          <Text style={editStyles.headerTitle}>Edit Customer</Text>
          <Text style={editStyles.headerSubtitle}>Update debtor profile and business notes</Text>
        </View>
      </LinearGradient>

      {initialLoading ? (
        <View style={editStyles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {errorMessage && (
            <Alert variant="danger" title="Error" message={errorMessage} style={{ marginBottom: 16 }} />
          )}

          {/* Identity Card */}
          <Card
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderColor: tokens.border,
              borderWidth: 1,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: tokens.textPrimary, fontSize: 12, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Profile Details
            </Text>

            <Input
              label="Customer / Business Name *"
              value={name}
              onChangeText={setName}
              leftIcon={<UserIcon size={18} color={tokens.textMuted} />}
              style={{ marginBottom: 12 }}
            />

            <Input
              label="Office / Billing Address"
              value={address}
              onChangeText={setAddress}
              style={{ marginBottom: 12 }}
            />

            {/* Status Selection */}
            <Text style={{ color: tokens.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' }}>
              Status
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              {(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).map((s) => {
                const isSelected = status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStatus(s)}
                    style={{
                      backgroundColor: isSelected ? tokens.primary : isDark ? tokens.background : '#F1F5F9',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      marginRight: 8,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#FFFFFF' : tokens.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: 12,
                      }}
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
              padding: 16,
              marginBottom: 24,
            }}
          >
            <Text style={{ color: tokens.textPrimary, fontSize: 12, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>
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
            style={{ marginBottom: 32 }}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const editStyles = StyleSheet.create({
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
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

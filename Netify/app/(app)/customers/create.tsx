import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/design/theme';
import { Input, Button, Card, Alert } from '@/design/components';
import { ChevronLeftIcon, UserIcon, PhoneIcon, MailIcon } from '@/design/icons';
import { customersApi } from '@/services/api/customers';

export default function CreateCustomerScreen() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMessage('Customer name is required (min 2 characters)');
      return;
    }

    if (name.trim().length < 2) {
      setErrorMessage('Customer name must be at least 2 characters');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const payload: any = {
        name: name.trim(),
      };

      if (phone.trim()) {
        payload.phone = phone.trim();
      }

      if (email.trim()) {
        payload.email = email.trim();
      }

      if (address.trim()) {
        payload.address = address.trim();
      }

      if (notes.trim()) {
        payload.notes = notes.trim();
      }

      const response = await customersApi.create(payload);

      if (response.success && response.data) {
        router.replace(`/(app)/customers/${response.data.id}` as any);
      } else {
        setErrorMessage(response.error?.message || 'Failed to create customer');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
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
            Add New Customer
          </Text>
          <Text style={{ color: tokens.textSecondary }} className="text-xs">
            Create a real debtor or business client profile
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
        {errorMessage && (
          <Alert variant="danger" title="Error" message={errorMessage} className="mb-4" />
        )}

        {/* Customer Identity Card */}
        <Card
          style={{
            backgroundColor: isDark ? tokens.surface : '#FFFFFF',
            borderColor: tokens.border,
            borderWidth: 1,
          }}
          className="p-4 mb-4"
        >
          <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold mb-3 uppercase tracking-wider">
            Basic Information
          </Text>

          <Input
            label="Customer / Business Name *"
            placeholder="e.g. Netify Retail Outlets Ltd or Adebayo Agro Ventures"
            value={name}
            onChangeText={setName}
            leftIcon={<UserIcon size={18} color={tokens.textMuted} />}
            className="mb-3"
          />

          <Input
            label="Physical / Office Address"
            placeholder="e.g. Suite 4B, Netify Commercial Hub, Victoria Island, Lagos"
            value={address}
            onChangeText={setAddress}
            className="mb-1"
          />
        </Card>

        {/* Primary Contact Card */}
        <Card
          style={{
            backgroundColor: isDark ? tokens.surface : '#FFFFFF',
            borderColor: tokens.border,
            borderWidth: 1,
          }}
          className="p-4 mb-4"
        >
          <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold mb-3 uppercase tracking-wider">
            Primary Contact Details
          </Text>

          <Input
            label="Phone Number"
            placeholder="e.g. +234 802 345 6789 (Direct business line)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<PhoneIcon size={18} color={tokens.textMuted} />}
            className="mb-3"
          />

          <Input
            label="Email Address"
            placeholder="e.g. billing@netify-partner.com or finance@client.ng"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<MailIcon size={18} color={tokens.textMuted} />}
            className="mb-1"
          />
        </Card>

        {/* Business Notes Card */}
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
            placeholder="e.g. Netify Priority Tier: Net-14 payment terms, supplies wholesale grain, prefers WhatsApp payment reminders before due date..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </Card>

        <Button
          label="Save Customer Record"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSubmit}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

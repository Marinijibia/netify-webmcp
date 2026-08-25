import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/design/theme';
import { Input, Alert } from '@/design/components';
import { ChevronLeftIcon, UserIcon, PhoneIcon, MailIcon } from '@/design/icons';
import { customersApi } from '@/services/api/customers';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';

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
      setErrorMessage('Customer name is required');
      return;
    }
    if (name.trim().length < 2) {
      setErrorMessage('Customer name must be at least 2 characters');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const payload: any = { name: name.trim() };
      if (phone.trim()) payload.phone = phone.trim();
      if (email.trim()) payload.email = email.trim();
      if (address.trim()) payload.address = address.trim();
      if (notes.trim()) payload.notes = notes.trim();

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

  const headerGradient = isDark ? GRADIENTS.darkHero : GRADIENTS.navyHero;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.background }]}>
      {/* ── HEADER ── */}
      <LinearGradient
        colors={headerGradient as [string, string]}
        start={GRADIENT_DIRECTION.toBottomRight.start}
        end={GRADIENT_DIRECTION.toBottomRight.end}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Add New Customer</Text>
          <Text style={styles.headerSub}>Debtor or business client profile</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Error Banner */}
          {errorMessage ? (
            <Alert variant="danger" title="Error" message={errorMessage} />
          ) : null}

          {/* ── BASIC INFORMATION ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(0,165,129,0.1)' }]}>
                <MaterialCommunityIcons name="account-outline" size={16} color="#00A581" />
              </View>
              <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>Basic Information</Text>
            </View>

            <Input
              label="Customer / Business Name *"
              placeholder="e.g. Adebayo Agro Ventures or Kemi Stores Ltd"
              value={name}
              onChangeText={(t) => { setName(t); setErrorMessage(null); }}
              leftIcon={<UserIcon size={17} color={tokens.textMuted} />}
            />
            <View style={styles.spacer} />
            <Input
              label="Physical / Office Address"
              placeholder="e.g. Suite 4B, Victoria Island, Lagos"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* ── PRIMARY CONTACTS ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                <MaterialCommunityIcons name="phone-outline" size={16} color="#6366F1" />
              </View>
              <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>Primary Contacts</Text>
            </View>

            <Input
              label="Phone Number"
              placeholder="+234 802 345 6789"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon={<PhoneIcon size={17} color={tokens.textMuted} />}
            />
            <View style={styles.spacer} />
            <Input
              label="Email Address"
              placeholder="billing@client.ng"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<MailIcon size={17} color={tokens.textMuted} />}
            />
          </View>

          {/* ── INTERNAL NOTES ── */}
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                <MaterialCommunityIcons name="note-text-outline" size={16} color="#F59E0B" />
              </View>
              <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>Internal Notes</Text>
            </View>

            <Input
              label="Customer Notes & Terms"
              placeholder="e.g. Net-14 payment terms, prefers WhatsApp reminders, wholesale grain supplier..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />

            {/* Tips */}
            <View style={[styles.tipBox, { backgroundColor: isDark ? 'rgba(0,165,129,0.08)' : 'rgba(0,165,129,0.05)', borderColor: 'rgba(0,165,129,0.15)' }]}>
              <MaterialCommunityIcons name="lightbulb-outline" size={14} color="#00A581" />
              <Text style={[styles.tipText, { color: tokens.textSecondary }]}>
                Notes help the AI Copilot generate better collection strategies and payment reminders for this customer.
              </Text>
            </View>
          </View>

          {/* ── SUBMIT ── */}
          <TouchableOpacity
            style={[styles.submitWrapper, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={GRADIENTS.navyToTeal as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="user-plus" size={18} color="#FFFFFF" />
                  <Text style={styles.submitText}>Save Customer Record</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.legalNote, { color: tokens.textMuted }]}>
            The customer will be added to your active ledger and available for receivable assignment.
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

  card: {
    borderRadius: 18, borderWidth: 1, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  spacer: { height: 12 },

  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  tipText: { flex: 1, fontSize: 12, lineHeight: 17 },

  submitWrapper: { borderRadius: 16, overflow: 'hidden' },
  submitGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  legalNote: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
});

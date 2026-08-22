import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Alert, KeyboardAwareContainer } from '@/design/components';
import { onboardingApi } from '@/services/api/onboarding';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/design/theme';

const PRESET_GRACE_PERIODS = [
  { days: 1, label: '1 Day', description: 'Pay tomorrow / Fast daily retail turnover' },
  { days: 3, label: '3 Days', description: 'Short-term trust & weekend settlement' },
  { days: 7, label: '7 Days (1 Week)', description: 'Weekly supply & recurring buyers' },
  { days: 14, label: '14 Days (Standard)', description: 'Standard B2B wholesale trade credit' },
  { days: 30, label: '30 Days', description: 'Monthly supply contracts & Net 30' },
];

const REMINDER_TONES = [
  { id: 'PROFESSIONAL', title: 'Professional & Courteous', desc: 'Standard formal corporate tone' },
  { id: 'FRIENDLY', title: 'Friendly & Conversational', desc: 'Warm African SME relationship tone' },
  { id: 'FIRM', title: 'Firm & Direct', desc: 'Strict payment enforcement' },
];

const PAYMENT_METHODS = [
  'Bank Transfer',
  'Mobile Money / USSD',
  'POS / Cash',
  'Debit Card',
];

export default function BusinessOnboardingScreen() {
  const router = useRouter();
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile);
  const { tokens, isDark } = useTheme();

  const [isCustomGrace, setIsCustomGrace] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(14);
  const [customDaysText, setCustomDaysText] = useState('5');
  const [reminderTone, setReminderTone] = useState('FRIENDLY');
  const [selectedMethods, setSelectedMethods] = useState<string[]>([
    'Bank Transfer',
    'Mobile Money / USSD',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleMethod = (method: string) => {
    if (selectedMethods.includes(method)) {
      if (selectedMethods.length > 1) {
        setSelectedMethods(selectedMethods.filter((m) => m !== method));
      }
    } else {
      setSelectedMethods([...selectedMethods, method]);
    }
  };

  const handleSelectPreset = (days: number) => {
    setIsCustomGrace(false);
    setGracePeriod(days);
  };

  const handleSelectCustom = () => {
    setIsCustomGrace(true);
    const parsed = parseInt(customDaysText, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setGracePeriod(parsed);
    }
  };

  const handleCustomDaysChange = (text: string) => {
    setCustomDaysText(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setGracePeriod(parsed);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const finalGraceDays = isCustomGrace ? (parseInt(customDaysText, 10) || 14) : gracePeriod;

      const payload = {
        step: 'COMPLETED',
        onboardingData: {
          defaultGracePeriodDays: finalGraceDays,
          aiReminderTone: reminderTone,
          acceptedPaymentMethods: selectedMethods,
        },
      };

      const res = await onboardingApi.updateStatus(payload);
      if (res.success && res.data) {
        updateUserProfile({
          onboardingStep: 'COMPLETED',
          onboardingData: payload.onboardingData,
        });

        router.replace('/(onboarding)/complete' as any);
      } else {
        setErrorMessage(res.message || 'Failed to save preferences.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to update preferences. Check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      <KeyboardAwareContainer
        centerWhenClosed={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 24,
        }}
      >
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <View style={{ backgroundColor: tokens.accent }} className="h-1.5 flex-1 rounded-full" />
            <View style={{ backgroundColor: tokens.accent }} className="h-1.5 flex-1 rounded-full" />
          </View>
          <Text
            style={{ color: tokens.textPrimary }}
            className="text-2xl font-bold tracking-tight"
          >
            Collection Setup
          </Text>
          <Text
            style={{ color: tokens.textSecondary }}
            className="text-xs mt-1"
          >
            Configure default credit terms and AI follow-up tone for your business.
          </Text>
        </View>

        {errorMessage ? (
          <Alert variant="danger" message={errorMessage} className="mb-4" />
        ) : null}

        {/* Grace Period */}
        <Card className="p-5 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text
              style={{ color: tokens.textSecondary }}
              className="text-xs font-semibold uppercase tracking-wider"
            >
              Default Credit Terms (Grace Period)
            </Text>
            <View
              style={{ backgroundColor: tokens.accentSoft }}
              className="px-2.5 py-1 rounded-full"
            >
              <Text style={{ color: tokens.accent }} className="text-xs font-bold">
                {isCustomGrace ? `${customDaysText || '0'} Days` : `${gracePeriod} Days`} Default
              </Text>
            </View>
          </View>

          <View className="gap-2.5">
            {PRESET_GRACE_PERIODS.map((period) => {
              const isSelected = !isCustomGrace && gracePeriod === period.days;
              return (
                <TouchableOpacity
                  key={period.days}
                  onPress={() => handleSelectPreset(period.days)}
                  style={{
                    backgroundColor: isSelected
                      ? tokens.accentSoft
                      : isDark
                      ? tokens.surfaceRaised
                      : tokens.surfaceMuted,
                    borderColor: isSelected ? tokens.accent : tokens.border,
                    borderWidth: isSelected ? 2 : 1,
                  }}
                  className="p-3.5 rounded-xl"
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      style={{
                        color: isSelected ? tokens.accent : tokens.textPrimary,
                        fontWeight: '700',
                      }}
                      className="text-sm"
                    >
                      {period.label}
                    </Text>
                    {isSelected && (
                      <Text style={{ color: tokens.accent }} className="text-xs font-bold">
                        ✓ Selected
                      </Text>
                    )}
                  </View>
                  <Text
                    style={{ color: tokens.textSecondary }}
                    className="text-xs mt-0.5"
                  >
                    {period.description}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Custom Days Option */}
            <TouchableOpacity
              onPress={handleSelectCustom}
              style={{
                backgroundColor: isCustomGrace
                  ? tokens.accentSoft
                  : isDark
                  ? tokens.surfaceRaised
                  : tokens.surfaceMuted,
                borderColor: isCustomGrace ? tokens.accent : tokens.border,
                borderWidth: isCustomGrace ? 2 : 1,
              }}
              className="p-3.5 rounded-xl"
            >
              <View className="flex-row items-center justify-between">
                <Text
                  style={{
                    color: isCustomGrace ? tokens.accent : tokens.textPrimary,
                    fontWeight: '700',
                  }}
                  className="text-sm"
                >
                  Custom Days...
                </Text>
                {isCustomGrace && (
                  <Text style={{ color: tokens.accent }} className="text-xs font-bold">
                    ✓ Custom Active
                  </Text>
                )}
              </View>
              <Text
                style={{ color: tokens.textSecondary }}
                className="text-xs mt-0.5"
              >
                Set a specific number of credit days for your trade
              </Text>

              {isCustomGrace && (
                <View className="flex-row items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <Text style={{ color: tokens.textPrimary }} className="text-xs font-semibold mr-3">
                    Enter Grace Days:
                  </Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={customDaysText}
                    onChangeText={handleCustomDaysChange}
                    maxLength={3}
                    style={{
                      backgroundColor: isDark ? tokens.surface : '#FFFFFF',
                      color: tokens.textPrimary,
                      borderColor: tokens.accent,
                      borderWidth: 1.5,
                      width: 70,
                      height: 38,
                      borderRadius: 8,
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: 15,
                    }}
                  />
                  <Text style={{ color: tokens.textSecondary }} className="text-xs ml-2">
                    days from issue date
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Per-Customer Guidance Note */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(0, 165, 129, 0.08)' : '#F0FDF4',
              borderColor: tokens.accent,
              borderWidth: 1,
            }}
            className="p-3 rounded-xl mt-3 flex-row items-start"
          >
            <Text className="text-sm mr-2">💡</Text>
            <Text style={{ color: tokens.textSecondary }} className="text-xs flex-1 leading-4">
              <Text style={{ color: tokens.textPrimary, fontWeight: '700' }}>
                Per-Customer Flexibility:
              </Text>{' '}
              This establishes your baseline default. You can set individual credit terms for specific customers (e.g. 1 day for daily buyers, 3 days for weekly vendors) and customize exact due dates whenever giving out credit or issuing an invoice.
            </Text>
          </View>
        </Card>

        {/* Reminder Tone */}
        <Card className="p-5 mb-4">
          <Text
            style={{ color: tokens.textSecondary }}
            className="text-xs font-semibold uppercase tracking-wider mb-3"
          >
            AI Follow-Up Tone
          </Text>
          <View className="gap-2.5">
            {REMINDER_TONES.map((tone) => {
              const isSelected = reminderTone === tone.id;
              return (
                <TouchableOpacity
                  key={tone.id}
                  onPress={() => setReminderTone(tone.id)}
                  style={{
                    backgroundColor: isSelected
                      ? tokens.accentSoft
                      : isDark
                      ? tokens.surfaceRaised
                      : tokens.surfaceMuted,
                    borderColor: isSelected ? tokens.accent : tokens.border,
                    borderWidth: isSelected ? 2 : 1,
                  }}
                  className="p-3.5 rounded-xl"
                >
                  <Text
                    style={{
                      color: isSelected ? tokens.accent : tokens.textPrimary,
                      fontWeight: '700',
                    }}
                    className="text-sm"
                  >
                    {tone.title}
                  </Text>
                  <Text
                    style={{ color: tokens.textSecondary }}
                    className="text-xs mt-0.5"
                  >
                    {tone.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Accepted Payment Channels */}
        <Card className="p-5 mb-6">
          <Text
            style={{ color: tokens.textSecondary }}
            className="text-xs font-semibold uppercase tracking-wider mb-3"
          >
            Accepted Payment Channels
          </Text>
          <View className="flex-row flex-wrap gap-2.5">
            {PAYMENT_METHODS.map((method) => {
              const isSelected = selectedMethods.includes(method);
              return (
                <TouchableOpacity
                  key={method}
                  onPress={() => toggleMethod(method)}
                  style={{
                    backgroundColor: isSelected
                      ? tokens.accentSoft
                      : isDark
                      ? tokens.surfaceRaised
                      : tokens.surfaceMuted,
                    borderColor: isSelected ? tokens.accent : tokens.border,
                    borderWidth: 1,
                  }}
                  className="px-3.5 py-2.5 rounded-xl"
                >
                  <Text
                    style={{
                      color: isSelected ? tokens.accent : tokens.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    }}
                    className="text-xs"
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {method}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Button
          label="Save & Finalize Onboarding"
          loadingLabel="Saving preferences..."
          onPress={handleComplete}
          loading={isSubmitting}
          className="mb-8"
        />
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
}

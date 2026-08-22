import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Badge, Alert } from '@/design/components';
import { CheckCircleIcon } from '@/design/icons';
import { onboardingApi } from '@/services/api/onboarding';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/design/theme';

export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const { user, organization, updateUserProfile } = useAuthStore();
  const { tokens } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEnterApp = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await onboardingApi.updateStatus({
        onboardingCompleted: true,
        step: 'COMPLETED',
      });

      if (res.success && res.data) {
        updateUserProfile({
          onboardingCompleted: true,
          onboardingStep: 'COMPLETED',
        });
        router.replace('/(app)');
      } else {
        setErrorMessage(res.message || 'Failed to finalize onboarding.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to enter workspace. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
      >
        <View className="items-center mb-8">
          <View
            style={{
              backgroundColor: tokens.accentSoft,
              borderColor: tokens.accent,
              borderWidth: 1,
            }}
            className="h-20 w-20 items-center justify-center rounded-3xl mb-4"
          >
            <CheckCircleIcon size={40} color={tokens.accent} />
          </View>
          <Text
            style={{ color: tokens.textPrimary }}
            className="text-3xl font-bold tracking-tight text-center"
          >
            You're Ready to Collect
          </Text>
          <Text
            style={{ color: tokens.textSecondary }}
            className="text-sm mt-2 text-center px-4"
          >
            Your organization workspace has been provisioned and configured.
          </Text>
        </View>

        {errorMessage ? (
          <Alert variant="danger" message={errorMessage} className="mb-4" />
        ) : null}

        <Card className="p-5 mb-8">
          <View className="gap-3">
            <View
              style={{ borderColor: tokens.border }}
              className="flex-row justify-between items-center py-2 border-b"
            >
              <Text style={{ color: tokens.textMuted }} className="text-xs">
                Organization
              </Text>
              <Text style={{ color: tokens.textPrimary }} className="text-sm font-bold">
                {organization?.name || 'My Organization'}
              </Text>
            </View>

            <View
              style={{ borderColor: tokens.border }}
              className="flex-row justify-between items-center py-2 border-b"
            >
              <Text style={{ color: tokens.textMuted }} className="text-xs">
                Primary Currency
              </Text>
              <Text style={{ color: tokens.accent }} className="text-sm font-bold">
                {organization?.currency || 'NGN'}
              </Text>
            </View>

            <View
              style={{ borderColor: tokens.border }}
              className="flex-row justify-between items-center py-2 border-b"
            >
              <Text style={{ color: tokens.textMuted }} className="text-xs">
                Owner Profile
              </Text>
              <Text style={{ color: tokens.textPrimary }} className="text-sm font-semibold">
                {user?.firstName} {user?.lastName}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-2">
              <Text style={{ color: tokens.textMuted }} className="text-xs">
                Email Verification
              </Text>
              <Badge label="Verified" variant="success" size="sm" />
            </View>
          </View>
        </Card>

        <Button
          label="Enter Netify Workspace"
          loadingLabel="Opening workspace..."
          onPress={handleEnterApp}
          loading={isSubmitting}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

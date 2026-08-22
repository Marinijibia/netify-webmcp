import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  OtpInput,
  Button,
  Card,
  Alert,
  Badge,
  KeyboardAwareContainer,
} from '@/design/components';
import { MailIcon } from '@/design/icons';
import { authApi } from '@/services/api/auth';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/design/theme';

const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  code: z.string().trim().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits'),
});

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const { tokens, isDark } = useTheme();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: params.email || '',
      code: '',
    },
  });

  const emailValue = watch('email');
  const codeValue = watch('code');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = async (values: VerifyEmailFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await authApi.verifyEmail({
        email: values.email,
        code: values.code,
      });

      if (response.success && response.data) {
        await setAuthSession(response.data);

        // Route gateway
        if (!response.data.organization) {
          router.replace('/(onboarding)/create-organization' as any);
        } else if (!response.data.user.onboardingCompleted) {
          router.replace('/(onboarding)');
        } else {
          router.replace('/(app)');
        }
      } else {
        setErrorMessage(response.message || 'Verification failed. Please check the code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    }
  };

  const handleResend = async () => {
    if (!emailValue || countdown > 0) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsResending(true);

    try {
      const res = await authApi.resendVerification({ email: emailValue });
      if (res.success) {
        setSuccessMessage('A fresh 6-digit code has been dispatched to your email.');
        setCountdown(60);
      } else {
        setErrorMessage(res.message || 'Failed to resend code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code. Please check your email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      <KeyboardAwareContainer
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 28,
        }}
      >
        {/* Brand Header */}
        <View className="items-center mb-6">
          <View
            style={{
              backgroundColor: tokens.accentSoft,
              borderColor: tokens.accent,
              borderWidth: 1.5,
            }}
            className="h-16 w-16 items-center justify-center rounded-2xl mb-3 shadow-sm"
          >
            <MailIcon size={28} color={tokens.accent} />
          </View>
          <Text
            style={{ color: tokens.textPrimary }}
            className="text-2xl font-bold tracking-tight text-center"
          >
            Verify Your Email
          </Text>
          <Text
            style={{ color: tokens.textSecondary }}
            className="text-xs mt-1 text-center px-4 leading-4"
          >
            We've dispatched a 6-digit security code to verify your identity.
          </Text>

          {/* Email Chip */}
          {emailValue ? (
            <View
              style={{
                backgroundColor: isDark ? tokens.surfaceRaised : tokens.surfaceMuted,
                borderColor: tokens.border,
                borderWidth: 1,
              }}
              className="flex-row items-center px-3.5 py-1.5 rounded-full mt-3"
            >
              <Text
                style={{ color: tokens.textPrimary }}
                className="text-xs font-semibold"
              >
                {emailValue}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Verification Card */}
        <Card className="p-6 shadow-sm">
          <View className="gap-4">
            <View className="flex-row items-center justify-between pb-1">
              <Text
                style={{ color: tokens.textPrimary }}
                className="text-base font-bold"
              >
                Security Code
              </Text>
              <Badge label="Required" variant="primary" size="sm" />
            </View>

            {errorMessage ? (
              <Alert variant="danger" message={errorMessage} />
            ) : null}

            {successMessage ? (
              <Alert variant="success" message={successMessage} />
            ) : null}

            <Controller
              control={control}
              name="code"
              render={({ field: { value } }) => (
                <OtpInput
                  code={value}
                  onCodeChange={(code) => setValue('code', code, { shouldValidate: true })}
                  error={errors.code?.message}
                  disabled={isSubmitting}
                />
              )}
            />

            <Button
              label="Verify & Continue"
              loadingLabel="Validating code..."
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={codeValue.length !== 6}
              size="lg"
              className="mt-2"
            />

            {/* Resend & Back Row */}
            <View className="flex-row items-center justify-between pt-2">
              <TouchableOpacity
                onPress={handleResend}
                disabled={countdown > 0 || isResending}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={{
                    color:
                      countdown > 0 || isResending
                        ? tokens.textDisabled
                        : tokens.accent,
                  }}
                  className="text-xs font-bold"
                >
                  {countdown > 0
                    ? `Resend code in ${countdown}s`
                    : isResending
                    ? 'Sending...'
                    : 'Resend code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={{ color: tokens.textSecondary }}
                  className="text-xs font-medium"
                >
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Security Footer */}
        <View className="items-center mt-6">
          <Text
            style={{ color: tokens.textMuted }}
            className="text-[11px] text-center"
          >
            🔒 Automated fraud protection & session verification
          </Text>
        </View>
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
}

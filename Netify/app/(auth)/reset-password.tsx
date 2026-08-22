import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Input,
  PasswordInput,
  PasswordStrengthMeter,
  OtpInput,
  Button,
  Card,
  Alert,
  Badge,
  KeyboardAwareContainer,
} from '@/design/components';
import { KeyIcon, MailIcon } from '@/design/icons';
import { authApi } from '@/services/api/auth';
import { useTheme } from '@/design/theme';

const resetPasswordFormSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    code: z.string().trim().min(6, 'Reset code must be 6 digits').max(6, 'Reset code must be 6 digits'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { tokens, isDark } = useTheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      email: params.email || '',
      code: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const emailValue = watch('email');
  const codeValue = watch('code');
  const newPasswordValue = watch('newPassword');
  const confirmPasswordValue = watch('confirmPassword');

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await authApi.resetPassword({
        email: values.email,
        code: values.code,
        newPassword: values.newPassword,
      });

      if (response.success) {
        setSuccessMessage('Password reset successfully. Redirecting to sign in...');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 1500);
      } else {
        setErrorMessage(response.message || 'Password reset failed. Check your code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired reset code.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      <KeyboardAwareContainer
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 20,
        }}
      >
        {/* Header */}
        <View className="w-full items-center mb-5">
          <View
            style={{
              backgroundColor: tokens.accentSoft,
              borderColor: tokens.accent,
              borderWidth: 1.5,
            }}
            className="h-14 w-14 items-center justify-center rounded-2xl mb-2.5 shadow-sm"
          >
            <KeyIcon size={26} color={tokens.accent} />
          </View>
          <Text
            numberOfLines={1}
            style={{ color: tokens.textPrimary }}
            className="text-2xl font-bold tracking-tight text-center"
          >
            Set New Password
          </Text>
          <Text
            style={{ color: tokens.textSecondary }}
            className="text-xs mt-1 text-center px-4 leading-4"
          >
            Enter the 6-digit recovery code and choose your new secure password.
          </Text>
        </View>

        {/* Form Card */}
        <Card className="p-6 shadow-sm">
          <View className="gap-3.5">
            <View className="flex-row items-center justify-between pb-1">
              <Text
                style={{ color: tokens.textPrimary }}
                className="text-base font-bold"
              >
                Reset Credentials
              </Text>
              <Badge label="Security" variant="primary" size="sm" />
            </View>

            {errorMessage ? (
              <Alert variant="danger" message={errorMessage} />
            ) : null}

            {successMessage ? (
              <Alert variant="success" message={successMessage} />
            ) : null}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Work Email"
                  placeholder="name@company.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  leftIcon={<MailIcon size={18} color={tokens.textMuted} />}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.email?.message}
                />
              )}
            />

            <View>
              <Text
                style={{ color: tokens.textSecondary }}
                className="text-xs font-semibold uppercase tracking-wider mb-1"
              >
                6-Digit Recovery Code
              </Text>
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
            </View>

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="New Password"
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.newPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            {/* Live Interactive Password Strength Meter */}
            <PasswordStrengthMeter
              password={newPasswordValue}
              confirmPassword={confirmPasswordValue}
            />

            <Button
              label="Update Password"
              loadingLabel="Updating password..."
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={codeValue.length !== 6 || isSubmitting}
              size="lg"
              className="mt-1"
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              className="items-center pt-2"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={{ color: tokens.accent }}
                className="text-xs font-bold"
              >
                ← Return to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Security Footer */}
        <View className="items-center mt-5 mb-2">
          <Text
            style={{ color: tokens.textMuted }}
            className="text-[11px] text-center"
          >
            🔒 All existing device sessions will be securely rotated
          </Text>
        </View>
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
}

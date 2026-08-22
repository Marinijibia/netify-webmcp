import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Input,
  Button,
  Card,
  Alert,
  Badge,
  KeyboardAwareContainer,
} from '@/design/components';
import { MailIcon, KeyIcon } from '@/design/icons';
import { authApi } from '@/services/api/auth';
import { useTheme } from '@/design/theme';

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setErrorMessage(null);
    try {
      const response = await authApi.forgotPassword({
        email: values.email,
      });

      if (response.success) {
        router.push({
          pathname: '/(auth)/reset-password',
          params: { email: values.email },
        });
      } else {
        setErrorMessage(response.message || 'Failed to request password reset.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to request password reset. Please try again.');
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
        {/* Header */}
        <View className="w-full items-center mb-6">
          <View
            style={{
              backgroundColor: tokens.accentSoft,
              borderColor: tokens.accent,
              borderWidth: 1.5,
            }}
            className="h-16 w-16 items-center justify-center rounded-2xl mb-3 shadow-sm"
          >
            <KeyIcon size={28} color={tokens.accent} />
          </View>
          <Text
            numberOfLines={1}
            style={{ color: tokens.textPrimary }}
            className="text-2xl font-bold tracking-tight text-center"
          >
            Account Recovery
          </Text>
          <Text
            style={{ color: tokens.textSecondary }}
            className="text-xs mt-1 text-center px-4 leading-4"
          >
            Enter your registered business email to receive an instant 6-digit recovery code.
          </Text>
        </View>

        {/* Form Card */}
        <Card className="p-6 shadow-sm">
          <View className="gap-4">
            <View className="flex-row items-center justify-between pb-1">
              <Text
                style={{ color: tokens.textPrimary }}
                className="text-base font-bold"
              >
                Verification
              </Text>
              <Badge label="Security" variant="primary" size="sm" />
            </View>

            {errorMessage ? (
              <Alert variant="danger" message={errorMessage} />
            ) : null}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Registered Work Email"
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

            <Button
              label="Send Recovery Code"
              loadingLabel="Sending code..."
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
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
        <View className="items-center mt-6">
          <Text
            style={{ color: tokens.textMuted }}
            className="text-[11px] text-center"
          >
            🔒 Protected by Netify multi-layered authentication
          </Text>
        </View>
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
}

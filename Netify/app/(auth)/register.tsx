import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Input,
  PasswordInput,
  PasswordStrengthMeter,
  Button,
  Card,
  Alert,
  Badge,
  NetifyLogo,
  KeyboardAwareContainer,
} from '@/design/components';
import { MailIcon, UserIcon } from '@/design/icons';
import { authApi } from '@/services/api/auth';
import { NetworkError, TimeoutError, ValidationError } from '@/services/api/errors';
import { useTheme } from '@/design/theme';

const registerFormSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    phone: z.string().trim().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { tokens } = useTheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');

  const onSubmit = async (values: RegisterFormValues) => {
    setErrorMessage(null);
    try {
      const response = await authApi.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      });

      if (response.success) {
        router.push({
          pathname: '/(auth)/verify-email',
          params: { email: values.email },
        });
      } else {
        setErrorMessage(response.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      if (err instanceof NetworkError) {
        setErrorMessage('Network connection lost. Please check your internet and try again.');
      } else if (err instanceof TimeoutError) {
        setErrorMessage('Connection timed out. Please check your network and try again.');
      } else if (err instanceof ValidationError) {
        setErrorMessage(err.message || 'Please check your registration details.');
      } else {
        setErrorMessage(err.message || 'Unable to register. Please check your connection.');
      }
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
        {/* Brand Header */}
        <View className="items-center mb-5">
          <NetifyLogo size="md" showTagline={true} />

          {/* Value Metric Pill */}
          <View
            style={{
              backgroundColor: tokens.accentSoft,
              borderColor: tokens.accent,
              borderWidth: 1,
            }}
            className="flex-row items-center px-3 py-1 rounded-full mt-2.5"
          >
            <Text
              style={{ color: tokens.accent }}
              className="text-[11px] font-bold"
            >
              ⚡ Collect B2B invoices 3x faster with AI follow-ups
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <Card className="p-6 shadow-sm">
          <View className="gap-3.5">
            <View className="flex-row items-center justify-between pb-1">
              <Text
                style={{ color: tokens.textPrimary }}
                className="text-base font-bold"
              >
                Create Business Account
              </Text>
              <Badge label="Owner" variant="primary" size="sm" />
            </View>

            {errorMessage ? (
              <Alert variant="danger" message={errorMessage} />
            ) : null}

            {/* Name Row */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="First Name"
                      placeholder="First name"
                      leftIcon={<UserIcon size={18} color={tokens.textMuted} />}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={errors.firstName?.message}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Last Name"
                      placeholder="Last name"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={errors.lastName?.message}
                    />
                  )}
                />
              </View>
            </View>

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

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number (Optional)"
                  placeholder="+234 800 000 0000"
                  keyboardType="phone-pad"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.phone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="Password"
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="Confirm Password"
                  placeholder="Confirm password"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            {/* Live Interactive Strength Meter */}
            <PasswordStrengthMeter
              password={passwordValue}
              confirmPassword={confirmPasswordValue}
            />

            <Button
              label="Create Workspace Account"
              loadingLabel="Creating your account..."
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              size="lg"
              className="mt-2"
            />
          </View>
        </Card>

        {/* Sign In Footer */}
        <View className="flex-row items-center justify-center mt-5">
          <Text style={{ color: tokens.textSecondary }} className="text-sm">
            Already have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={{ color: tokens.accent }}
              className="text-sm font-bold"
            >
              Sign In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Financial Compliance Footer */}
        <View className="items-center mt-4 mb-2">
          <Text
            style={{ color: tokens.textMuted }}
            className="text-[11px] text-center"
          >
            🔒 256-bit AES encryption • Built for African SMEs
          </Text>
        </View>
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
}

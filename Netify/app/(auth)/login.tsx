import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Input,
  PasswordInput,
  Button,
  Card,
  Alert,
  Badge,
  NetifyLogo,
  KeyboardAwareContainer,
  FaceRecognitionScanner,
  FingerprintScannerModal,
} from '@/design/components';
import {
  MailIcon,
  LockIcon,
  FaceIdIcon,
  FingerprintIcon,
  ArrowRightIcon,
} from '@/design/icons';
import { authApi } from '@/services/api/auth';
import { NetworkError, TimeoutError, ValidationError } from '@/services/api/errors';
import { useAuthStore } from '@/store/auth-store';
import { BiometricService, DeviceBiometricCapabilities } from '@/services/biometrics/biometric.service';
import { useTheme } from '@/design/theme';

const loginFormSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { setAuthSession, loginWithFaceScan } = useAuthStore();
  const { tokens, isDark } = useTheme();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<DeviceBiometricCapabilities>({
    hasHardware: false,
    isEnrolled: false,
    hasFaceId: false,
    hasFingerprint: false,
    isFaceIdEnabled: false,
    isFingerprintEnabled: false,
    isAnyEnabled: false,
  });

  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  const [isBioAuthenticating, setIsBioAuthenticating] = useState(false);
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    async function initBiometrics() {
      try {
        const [caps, savedEmail] = await Promise.all([
          BiometricService.getCapabilities(),
          BiometricService.getRememberedEmail(),
        ]);

        setCapabilities(caps);

        if (savedEmail) {
          setRememberedEmail(savedEmail);
          setValue('email', savedEmail);
        }
      } catch {
        // Biometrics load error
      }
    }
    initBiometrics();
  }, [setValue]);

  // Front camera face scanner success handler
  const handleFaceScanSuccess = async () => {
    setShowFaceScanner(false);
    setIsBioAuthenticating(true);
    setErrorMessage(null);
    try {
      const success = await loginWithFaceScan();
      if (success) {
        router.replace('/(app)');
      } else {
        setErrorMessage(
          'Face ID session expired. Please sign in with your password to reconnect your workspace.'
        );
      }
    } catch {
      setErrorMessage('Face recognition failed. Please use your password.');
    } finally {
      setIsBioAuthenticating(false);
    }
  };

  // Physical fingerprint scanner success handler
  const handleFingerprintSuccess = async () => {
    setShowFingerprintModal(false);
    setIsBioAuthenticating(true);
    setErrorMessage(null);
    try {
      const success = await loginWithFaceScan();
      if (success) {
        router.replace('/(app)');
      } else {
        setErrorMessage(
          'Fingerprint session expired. Please enter your password.'
        );
      }
    } catch {
      setErrorMessage('Fingerprint verification canceled. Please use your password.');
    } finally {
      setIsBioAuthenticating(false);
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    try {
      const response = await authApi.login({
        email: values.email,
        password: values.password,
      });

      if (response.success && response.data) {
        await setAuthSession(response.data);

        // Check verification & onboarding status
        if (!response.data.user.isEmailVerified) {
          router.replace({
            pathname: '/(auth)/verify-email',
            params: { email: values.email },
          });
        } else if (!response.data.user.onboardingCompleted) {
          if (!response.data.organization) {
            router.replace('/(onboarding)/create-organization' as any);
          } else {
            router.replace('/(onboarding)');
          }
        } else {
          router.replace('/(app)');
        }
      } else {
        setErrorMessage(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      if (err.message?.includes('EMAIL_NOT_VERIFIED')) {
        router.push({
          pathname: '/(auth)/verify-email',
          params: { email: values.email },
        });
      } else if (err instanceof NetworkError) {
        setErrorMessage('Network connection lost. Please check your internet and try again.');
      } else if (err instanceof TimeoutError) {
        setErrorMessage('Connection timed out. Please check your network and try again.');
      } else if (err instanceof ValidationError) {
        setErrorMessage(err.message || 'Please check your login credentials.');
      } else {
        setErrorMessage(err.message || 'Unable to connect to server. Please try again.');
      }
    }
  };

  // Strictly check if user explicitly enabled Face ID or Fingerprint in Settings
  const showFaceId = capabilities.isFaceIdEnabled === true;
  const showFingerprint = capabilities.isFingerprintEnabled === true;
  const showAnyBiometrics = showFaceId || showFingerprint;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      {/* Front Camera Face Recognition Scanner Viewfinder Modal */}
      <FaceRecognitionScanner
        visible={showFaceScanner}
        title="Face ID Sign In"
        subtitle="Align your face inside the oval frame to unlock"
        onSuccess={handleFaceScanSuccess}
        onCancel={() => setShowFaceScanner(false)}
      />

      {/* Interactive Fingerprint Scanner Modal */}
      <FingerprintScannerModal
        visible={showFingerprintModal}
        title="Fingerprint Sign In"
        subtitle="Touch your device fingerprint sensor to unlock workspace"
        onSuccess={handleFingerprintSuccess}
        onCancel={() => setShowFingerprintModal(false)}
      />

      <KeyboardAwareContainer
        centerWhenClosed={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 20,
        }}
      >
        {/* Brand Header */}
        <View className="items-center mb-5">
          <NetifyLogo size="md" showTagline={true} />

          {/* Security Trust Pill */}
          <View
            style={{
              backgroundColor: isDark ? tokens.surfaceRaised : tokens.surfaceMuted,
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="flex-row items-center px-3.5 py-1 rounded-full mt-3.5"
          >
            <LockIcon size={12} color={tokens.accent} />
            <Text
              style={{ color: tokens.textSecondary }}
              className="text-[11px] font-semibold ml-1.5 tracking-wide"
            >
              Bank-Grade 256-Bit SSL Encryption
            </Text>
          </View>
        </View>

        {/* 1-Tap Biometric Quick Access Cards (ONLY shown if user explicitly turned them ON in Settings) */}
        {showAnyBiometrics && (
          <View className="gap-2.5 mb-4">
            {/* Option 1: Front Camera Face Recognition */}
            {showFaceId && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowFaceScanner(true)}
                disabled={isBioAuthenticating}
                style={{
                  backgroundColor: isDark ? tokens.surface : '#FFFFFF',
                  borderColor: tokens.accent,
                  borderWidth: 1.5,
                  shadowColor: tokens.accent,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                className="p-3.5 rounded-2xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View
                    style={{ backgroundColor: tokens.accentSoft }}
                    className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                  >
                    <FaceIdIcon size={24} color={tokens.accent} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text
                        style={{ color: tokens.textPrimary }}
                        className="text-sm font-bold mr-2"
                      >
                        {Platform.OS === 'ios' ? 'Scan Face ID' : 'Camera Face Recognition'}
                      </Text>
                      <Badge label="Front Camera" variant="primary" size="sm" />
                    </View>
                    <Text
                      style={{ color: tokens.textSecondary }}
                      className="text-[11px] mt-0.5"
                      numberOfLines={1}
                    >
                      {rememberedEmail ? `Unlock workspace for ${rememberedEmail}` : 'Open camera to verify your face'}
                    </Text>
                  </View>
                </View>

                <View
                  style={{ backgroundColor: tokens.accent }}
                  className="w-8 h-8 rounded-full items-center justify-center"
                >
                  <ArrowRightIcon size={15} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}

            {/* Option 2: Physical Fingerprint Sensor */}
            {showFingerprint && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowFingerprintModal(true)}
                disabled={isBioAuthenticating}
                style={{
                  backgroundColor: isDark ? tokens.surface : '#FFFFFF',
                  borderColor: tokens.border,
                  borderWidth: 1.5,
                }}
                className="p-3.5 rounded-2xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View
                    style={{ backgroundColor: tokens.accentSoft }}
                    className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                  >
                    <FingerprintIcon size={24} color={tokens.accent} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text
                        style={{ color: tokens.textPrimary }}
                        className="text-sm font-bold mr-2"
                      >
                        {Platform.OS === 'ios' ? 'Scan Touch ID' : 'Scan Fingerprint Sensor'}
                      </Text>
                      <Badge label="Sensor" variant="neutral" size="sm" />
                    </View>
                    <Text
                      style={{ color: tokens.textSecondary }}
                      className="text-[11px] mt-0.5"
                      numberOfLines={1}
                    >
                      Touch device fingerprint scanner to unlock
                    </Text>
                  </View>
                </View>

                <View
                  style={{ backgroundColor: isDark ? tokens.surfaceRaised : tokens.surfaceMuted }}
                  className="w-8 h-8 rounded-full items-center justify-center border border-slate-200 dark:border-slate-700"
                >
                  <ArrowRightIcon size={15} color={tokens.textPrimary} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Divider if Biometrics is explicitly enabled */}
        {showAnyBiometrics && (
          <View className="flex-row items-center my-2 mb-4">
            <View
              style={{ backgroundColor: tokens.border }}
              className="flex-1 h-[1px]"
            />
            <Text
              style={{ color: tokens.textMuted }}
              className="text-[11px] font-bold uppercase tracking-wider mx-3"
            >
              Or Sign In With Password
            </Text>
            <View
              style={{ backgroundColor: tokens.border }}
              className="flex-1 h-[1px]"
            />
          </View>
        )}

        {/* Password Login Card */}
        <Card className="p-6 shadow-sm">
          <View className="gap-4">
            <View className="flex-row items-center justify-between pb-1">
              <Text
                style={{ color: tokens.textPrimary }}
                className="text-base font-bold"
              >
                Workspace Sign In
              </Text>
              <Badge label="Secure Login" variant="primary" size="sm" />
            </View>

            {errorMessage ? (
              <Alert variant="danger" message={errorMessage} />
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
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    label="Password"
                    placeholder="Enter your password"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={errors.password?.message}
                  />
                )}
              />

              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                className="self-end mt-2"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={{ color: tokens.accent }}
                  className="text-xs font-semibold"
                >
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              label="Sign In to Workspace"
              loadingLabel="Authenticating..."
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              size="lg"
              className="mt-1"
            />
          </View>
        </Card>

        {/* Create Account Link */}
        <View className="flex-row items-center justify-center mt-6">
          <Text style={{ color: tokens.textSecondary }} className="text-sm">
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={{ color: tokens.accent }}
              className="text-sm font-bold"
            >
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Financial Compliance Footer */}
        <View className="items-center mt-6 mb-3">
          <Text
            style={{ color: tokens.textMuted }}
            className="text-[11px] text-center"
          >
            🔒 End-to-end encrypted • Built for African SMEs
          </Text>
        </View>
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
}

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Switch,
  Alert as NativeAlert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  PasswordInput,
  Button,
  Badge,
  Alert,
  ThemeSelector,
  KeyboardAwareContainer,
  FaceRecognitionScanner,
  FingerprintScannerModal,
} from '@/design/components';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldIcon,
  FaceIdIcon,
  FingerprintIcon,
  ClockIcon,
  CheckCircleIcon,
  XIcon,
} from '@/design/icons';
import { BiometricService, DeviceBiometricCapabilities } from '@/services/biometrics/biometric.service';
import { authApi } from '@/services/api/auth';
import { SecureStorageService } from '@/services/storage/secure-storage';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/design/theme';
import { useLanguageStore } from '@/store/language-store';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS, GRADIENT_DIRECTION } from '@/design/tokens/gradients';

const AUTO_LOCK_OPTIONS = [
  { label: 'Immediately on exit', value: 0, description: 'Locks as soon as you minimize or leave the app' },
  { label: 'After 1 minute', value: 60000, description: 'Locks after 1 minute in background' },
  { label: 'After 5 minutes (Default)', value: 300000, description: 'Recommended balance of security and speed' },
  { label: 'After 15 minutes', value: 900000, description: 'Locks after 15 minutes in background' },
  { label: 'After 30 minutes', value: 1800000, description: 'Locks after 30 minutes in background' },
];

const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
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

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const {
    isFaceIdEnabled,
    isFingerprintEnabled,
    setFaceIdEnabled,
    setFingerprintEnabled,
    autoLockTimeoutMs,
    setAutoLockTimeout,
  } = useAuthStore();
  const { tokens, isDark } = useTheme();
  const { t } = useLanguageStore();

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
  const [showAutoLockModal, setShowAutoLockModal] = useState(false);
  const [pwSuccessMessage, setPwSuccessMessage] = useState<string | null>(null);
  const [pwErrorMessage, setPwErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCapabilities() {
      const caps = await BiometricService.getCapabilities();
      setCapabilities(caps);
    }
    loadCapabilities();
  }, [isFaceIdEnabled, isFingerprintEnabled]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleToggleFaceId = async (value: boolean) => {
    if (value) {
      setShowFaceScanner(true);
    } else {
      await setFaceIdEnabled(false);
    }
  };

  const handleFaceScannerSuccess = async () => {
    setShowFaceScanner(false);
    await setFaceIdEnabled(true);
  };

  const handleToggleFingerprint = async (value: boolean) => {
    if (value) {
      setShowFingerprintModal(true);
    } else {
      await setFingerprintEnabled(false);
    }
  };

  const handleFingerprintSuccess = async () => {
    setShowFingerprintModal(false);
    await setFingerprintEnabled(true);
  };

  const onChangePasswordSubmit = async (values: ChangePasswordFormValues) => {
    setPwErrorMessage(null);
    setPwSuccessMessage(null);
    try {
      const response = await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      });

      if (response.success) {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.email) {
          await SecureStorageService.setBiometricVaultCredentials(currentUser.email, values.newPassword);
        }
        setPwSuccessMessage('Password changed successfully.');
        reset();
      } else {
        setPwErrorMessage(response.message || 'Failed to change password.');
      }
    } catch (err: any) {
      setPwErrorMessage(err.message || 'Unable to update password. Check your current password.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      {/* Front Camera Face Recognition Scanner Modal */}
      <FaceRecognitionScanner
        visible={showFaceScanner}
        isEnrollment={true}
        title="Setup Face Recognition"
        subtitle="Align your face to register camera face unlock"
        onSuccess={handleFaceScannerSuccess}
        onCancel={() => setShowFaceScanner(false)}
      />

      {/* Interactive Fingerprint Scanner Modal */}
      <FingerprintScannerModal
        visible={showFingerprintModal}
        title="Enable Fingerprint Sign-In"
        subtitle="Touch your fingerprint sensor to register fast biometric unlock"
        onSuccess={handleFingerprintSuccess}
        onCancel={() => setShowFingerprintModal(false)}
      />

      <KeyboardAwareContainer
        centerWhenClosed={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
      {/* ── PREMIUM HEADER ── */}
      <LinearGradient
        colors={(isDark ? GRADIENTS.darkHero : GRADIENTS.navyHero) as [string, string]}
        start={GRADIENT_DIRECTION.toBottomRight.start}
        end={GRADIENT_DIRECTION.toBottomRight.end}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 }}>
          {t('security.title')}
        </Text>
      </LinearGradient>

        {/* Theme Appearance Selector */}
        <ThemeSelector className="mb-5" />

        {/* Biometric Security Card (Face ID & Fingerprint) */}
        <Card className="p-5 mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text
                style={{ color: tokens.textPrimary }}
                className="text-base font-bold"
              >
                {t('security.biometricUnlock')}
              </Text>
              <Text
                style={{ color: tokens.textSecondary }}
                className="text-xs mt-0.5"
              >
                {t('security.biometricDesc')}
              </Text>
            </View>
            <Badge label="Hardware Protected" variant="primary" size="sm" />
          </View>

          {/* Option 1: Front Camera Face ID / Face Recognition */}
          <View
            style={{
              backgroundColor: isDark ? tokens.surfaceRaised : tokens.surfaceMuted,
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="p-3.5 rounded-2xl mb-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 mr-3">
              <View
                style={{ backgroundColor: tokens.accentSoft }}
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              >
                <FaceIdIcon size={22} color={tokens.accent} />
              </View>
              <View className="flex-1">
                <Text
                  style={{ color: tokens.textPrimary }}
                  className="text-sm font-bold"
                >
                  {Platform.OS === 'ios' ? 'Face ID Camera Scan' : 'Front Camera Face Recognition'}
                </Text>
                <Text
                  style={{ color: tokens.textSecondary }}
                  className="text-[11px] mt-0.5"
                >
                  Opens front-facing camera viewfinder to scan and verify your face
                </Text>
              </View>
            </View>
            <Switch
              value={isFaceIdEnabled}
              onValueChange={handleToggleFaceId}
              trackColor={{ false: tokens.borderStrong, true: tokens.accent }}
              thumbColor={isFaceIdEnabled ? '#FFFFFF' : tokens.textMuted}
            />
          </View>

          {/* Option 2: Fingerprint / Touch ID */}
          <View
            style={{
              backgroundColor: isDark ? tokens.surfaceRaised : tokens.surfaceMuted,
              borderColor: tokens.border,
              borderWidth: 1,
            }}
            className="p-3.5 rounded-2xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 mr-3">
              <View
                style={{ backgroundColor: tokens.accentSoft }}
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              >
                <FingerprintIcon size={22} color={tokens.accent} />
              </View>
              <View className="flex-1">
                <Text
                  style={{ color: tokens.textPrimary }}
                  className="text-sm font-bold"
                >
                  {Platform.OS === 'ios' ? 'Touch ID Sensor' : 'Fingerprint Sensor'}
                </Text>
                <Text
                  style={{ color: tokens.textSecondary }}
                  className="text-[11px] mt-0.5"
                >
                  {capabilities.hasFingerprint
                    ? 'Use device fingerprint sensor to unlock Netify'
                    : 'Fingerprint sensor not detected'}
                </Text>
              </View>
            </View>
            <Switch
              disabled={!capabilities.hasFingerprint}
              value={isFingerprintEnabled}
              onValueChange={handleToggleFingerprint}
              trackColor={{ false: tokens.borderStrong, true: tokens.accent }}
              thumbColor={isFingerprintEnabled ? '#FFFFFF' : tokens.textMuted}
            />
          </View>
        </Card>

        {/* Auto-Lock Inactivity Timeout Setting */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setShowAutoLockModal(true)}
          style={{
            backgroundColor: isDark ? tokens.surface : '#FFFFFF',
            borderColor: tokens.border,
            borderWidth: 1,
          }}
          className="rounded-2xl p-4 mb-5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View
              style={{ backgroundColor: tokens.accentSoft }}
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            >
              <ClockIcon size={20} color={tokens.accent} />
            </View>
            <View className="flex-1">
              <Text
                style={{ color: tokens.textPrimary }}
                className="text-sm font-bold"
              >
                Inactivity Auto-Lock
              </Text>
              <Text
                style={{ color: tokens.textSecondary }}
                className="text-xs mt-0.5"
              >
                Locks workspace when app is minimized or phone is locked
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <Text
              style={{ color: tokens.primary }}
              className="text-xs font-bold mr-2"
            >
              {AUTO_LOCK_OPTIONS.find((opt) => opt.value === autoLockTimeoutMs)?.label || '5 minutes'}
            </Text>
            <ChevronRightIcon size={16} color={tokens.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Active Sessions Link */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push('/(app)/security/sessions' as any)}
          style={{
            backgroundColor: isDark ? tokens.surface : '#FFFFFF',
            borderColor: tokens.border,
            borderWidth: 1,
          }}
          className="rounded-2xl p-4 mb-5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: tokens.accentSoft }}
              className="w-9 h-9 rounded-xl items-center justify-center mr-3"
            >
              <ShieldIcon size={18} color={tokens.accent} />
            </View>
            <View>
              <Text
                style={{ color: tokens.textPrimary }}
                className="text-sm font-bold"
              >
                Active Sessions & Devices
              </Text>
              <Text
                style={{ color: tokens.textSecondary }}
                className="text-xs mt-0.5"
              >
                Review and revoke active sign-ins on other devices
              </Text>
            </View>
          </View>
          <ChevronRightIcon size={18} color={tokens.textMuted} />
        </TouchableOpacity>

        {/* Change Password Card */}
        <Card className="p-5 mb-8">
          <View className="gap-4">
            <Text
              style={{ color: tokens.textPrimary }}
              className="text-sm font-bold"
            >
              Change Password
            </Text>

            {pwSuccessMessage ? (
              <Alert variant="success" message={pwSuccessMessage} />
            ) : null}

            {pwErrorMessage ? (
              <Alert variant="danger" message={pwErrorMessage} />
            ) : null}

            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="Current Password"
                  placeholder="Enter current password"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.currentPassword?.message}
                />
              )}
            />

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

            <Button
              label="Update Password"
              loadingLabel="Updating password..."
              onPress={handleSubmit(onChangePasswordSubmit)}
              loading={isSubmitting}
              className="mt-2"
            />
          </View>
        </Card>
      </KeyboardAwareContainer>

      {/* Auto-Lock Inactivity Timeout Selection Modal */}
      <Modal
        visible={showAutoLockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAutoLockModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? tokens.surface : '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: Platform.OS === 'ios' ? 40 : 28,
              borderWidth: 1,
              borderColor: tokens.border,
            }}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text style={{ color: tokens.textPrimary }} className="text-base font-bold">
                  Inactivity Auto-Lock
                </Text>
                <Text style={{ color: tokens.textSecondary }} className="text-xs mt-0.5">
                  Select when to require biometric or password unlock
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAutoLockModal(false)}
                className="w-8 h-8 rounded-full items-center justify-center bg-black/10 dark:bg-white/10"
              >
                <XIcon size={18} color={tokens.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <View className="gap-2.5 my-2">
              {AUTO_LOCK_OPTIONS.map((opt) => {
                const isSelected = opt.value === autoLockTimeoutMs;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    activeOpacity={0.7}
                    onPress={async () => {
                      await setAutoLockTimeout(opt.value);
                      setShowAutoLockModal(false);
                    }}
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(0,165,129,0.15)'
                          : 'rgba(0,165,129,0.08)'
                        : isDark
                        ? tokens.surfaceRaised
                        : tokens.surfaceMuted,
                      borderColor: isSelected ? tokens.accent : tokens.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    }}
                    className="p-3.5 rounded-2xl flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-3">
                      <Text
                        style={{
                          color: isSelected ? tokens.accent : tokens.textPrimary,
                          fontWeight: isSelected ? '700' : '600',
                        }}
                        className="text-sm"
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={{ color: tokens.textSecondary }}
                        className="text-[11px] mt-0.5"
                      >
                        {opt.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <CheckCircleIcon size={20} color={tokens.accent} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

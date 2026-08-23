import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  LockIcon,
  FaceIdIcon,
  FingerprintIcon,
  ShieldIcon,
  LogOutIcon,
  KeyIcon,
} from '@/design/icons';
import { PasswordInput, Button, Alert, Card, Badge, NetifyLogo } from '@/design/components';
import { FaceRecognitionScanner } from './FaceRecognitionScanner';
import { FingerprintScannerModal } from './FingerprintScannerModal';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/design/theme';

export function AppLockOverlay() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();

  const isLocked = useAuthStore((state) => state.isLocked);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isFaceIdEnabled = useAuthStore((state) => state.isFaceIdEnabled);
  const isFingerprintEnabled = useAuthStore((state) => state.isFingerprintEnabled);
  const user = useAuthStore((state) => state.user);
  const organization = useAuthStore((state) => state.organization);
  const unlockWithBiometrics = useAuthStore((state) => state.unlockWithBiometrics);
  const unlockWithPassword = useAuthStore((state) => state.unlockWithPassword);
  const logout = useAuthStore((state) => state.logout);

  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pulse lock icon animation
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLocked) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-prompt biometrics once on lock appearance
    const timer = setTimeout(() => {
      if (isFaceIdEnabled) {
        setShowFaceScanner(true);
      } else if (isFingerprintEnabled) {
        setShowFingerprintModal(true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isLocked, isFaceIdEnabled, isFingerprintEnabled, pulseAnim]);

  const handleBiometricSuccess = async () => {
    setShowFaceScanner(false);
    setShowFingerprintModal(false);
    setIsUnlocking(true);
    setErrorMessage(null);

    try {
      const success = await unlockWithBiometrics();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        setErrorMessage('Biometric unlock failed. Please enter your password.');
        setShowPasswordInput(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    } catch {
      setErrorMessage('Unable to unlock. Please enter your password.');
      setShowPasswordInput(true);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setErrorMessage('Password is required to unlock');
      return;
    }

    setIsUnlocking(true);
    setErrorMessage(null);

    try {
      const success = await unlockWithPassword(password.trim());
      if (success) {
        setPassword('');
        setShowPasswordInput(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        setErrorMessage('Incorrect password. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    } catch {
      setErrorMessage('Error unlocking workspace. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login' as any);
  };

  if (!isAuthenticated || !isLocked) {
    return null;
  }

  const hasAnyBiometrics = isFaceIdEnabled || isFingerprintEnabled;

  return (
    <Modal
      visible={isLocked}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      {/* Face Scanner Modal */}
      <FaceRecognitionScanner
        visible={showFaceScanner}
        title="Face ID Unlock"
        subtitle="Align your face to resume your session"
        onSuccess={handleBiometricSuccess}
        onCancel={() => setShowFaceScanner(false)}
      />

      {/* Fingerprint Modal */}
      <FingerprintScannerModal
        visible={showFingerprintModal}
        title="Fingerprint Unlock"
        subtitle="Touch sensor to resume your session"
        onSuccess={handleBiometricSuccess}
        onCancel={() => setShowFingerprintModal(false)}
      />

      <View style={[styles.container, { backgroundColor: isDark ? '#090E17' : '#F8FAFC' }]}>
        {/* Top Header */}
        <View style={styles.header}>
          <NetifyLogo size="sm" showTagline={false} />
          <View
            style={[
              styles.securityPill,
              { backgroundColor: isDark ? 'rgba(0,165,129,0.15)' : '#DCFCE7' },
            ]}
          >
            <ShieldIcon size={12} color="#00A581" />
            <Text style={[styles.securityPillText, { color: '#00A581' }]}>
              Workspace Protected
            </Text>
          </View>
        </View>

        {/* Center Content */}
        <View style={styles.centerCard}>
          {/* Animated Lock Icon */}
          <Animated.View
            style={[
              styles.lockIconContainer,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor: isDark ? tokens.surface : '#FFFFFF',
                borderColor: tokens.border,
              },
            ]}
          >
            <View style={[styles.lockIconInner, { backgroundColor: tokens.accentSoft }]}>
              <LockIcon size={32} color={tokens.accent} />
            </View>
          </Animated.View>

          <Text style={[styles.title, { color: tokens.textPrimary }]}>
            Workspace Locked
          </Text>

          {user && (
            <Text style={[styles.greeting, { color: tokens.textSecondary }]}>
              Welcome back, <Text style={{ fontWeight: '700', color: tokens.textPrimary }}>{user.firstName || 'User'}</Text>
            </Text>
          )}

          {organization && (
            <View className="mt-1 mb-4">
              <Badge label={organization.name} variant="primary" size="sm" />
            </View>
          )}

          {errorMessage && (
            <Alert
              variant="danger"
              title="Unlock Failed"
              message={errorMessage}
              className="mb-4 w-full"
            />
          )}

          {/* Password Input (Expandable) */}
          {showPasswordInput ? (
            <View style={styles.passwordSection}>
              <PasswordInput
                label="Enter Your Password"
                placeholder="Enter password to unlock"
                value={password}
                onChangeText={setPassword}
                className="mb-3 w-full"
              />
              <Button
                label="Unlock Workspace"
                variant="primary"
                size="md"
                loading={isUnlocking}
                onPress={handlePasswordSubmit}
                className="mb-2"
              />
              {hasAnyBiometrics && (
                <TouchableOpacity
                  onPress={() => {
                    setShowPasswordInput(false);
                    setErrorMessage(null);
                  }}
                  style={styles.switchModeButton}
                >
                  <Text style={[styles.switchModeText, { color: tokens.primary }]}>
                    Use Biometric Unlock Instead
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.biometricSection}>
              {/* Biometric Action Buttons */}
              {isFaceIdEnabled && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowFaceScanner(true)}
                  disabled={isUnlocking}
                  style={[
                    styles.primaryUnlockBtn,
                    {
                      backgroundColor: tokens.primary,
                      borderColor: tokens.primary,
                    },
                  ]}
                >
                  <FaceIdIcon size={20} color="#FFFFFF" />
                  <Text style={styles.primaryUnlockText}>
                    {Platform.OS === 'ios' ? 'Unlock with Face ID' : 'Scan Face to Unlock'}
                  </Text>
                </TouchableOpacity>
              )}

              {isFingerprintEnabled && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowFingerprintModal(true)}
                  disabled={isUnlocking}
                  style={[
                    styles.secondaryUnlockBtn,
                    {
                      backgroundColor: isDark ? tokens.surface : '#FFFFFF',
                      borderColor: tokens.border,
                    },
                  ]}
                >
                  <FingerprintIcon size={20} color={tokens.textPrimary} />
                  <Text style={[styles.secondaryUnlockText, { color: tokens.textPrimary }]}>
                    Touch Fingerprint Sensor
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  setShowPasswordInput(true);
                  setErrorMessage(null);
                }}
                style={styles.switchModeButton}
              >
                <KeyIcon size={14} color={tokens.textSecondary} />
                <Text style={[styles.switchModeText, { color: tokens.textSecondary, marginLeft: 6 }]}>
                  Enter Password to Unlock
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom Bar: Switch Account */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            activeOpacity={0.7}
          >
            <LogOutIcon size={14} color={tokens.textMuted} />
            <Text style={[styles.logoutText, { color: tokens.textMuted, marginLeft: 6 }]}>
              Log out & switch account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  securityPillText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lockIconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 8,
  },
  passwordSection: {
    width: '100%',
    marginTop: 12,
  },
  biometricSection: {
    width: '100%',
    marginTop: 16,
    gap: 10,
  },
  primaryUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#00A581',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryUnlockText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryUnlockText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  switchModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  switchModeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

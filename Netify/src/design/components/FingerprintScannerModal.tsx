import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  XIcon,
  FingerprintIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ShieldIcon,
  RefreshCwIcon,
} from '@/design/icons';
import { BiometricService } from '@/services/biometrics/biometric.service';
import { useTheme } from '@/design/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FingerprintStage = 'READY' | 'SCANNING' | 'VERIFIED' | 'FAILED';

interface FingerprintScannerModalProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
}

export function FingerprintScannerModal({
  visible,
  onSuccess,
  onCancel,
  title = 'Fingerprint Verification',
  subtitle = 'Touch your device fingerprint sensor to sign in',
}: FingerprintScannerModalProps) {
  const { tokens, isDark } = useTheme();

  const [stage, setStage] = useState<FingerprintStage>('READY');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPrompting, setIsPrompting] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  // Pulse & Ripple animation
  useEffect(() => {
    if (!visible) {
      setStage('READY');
      setErrorMessage(null);
      setIsPrompting(false);
      return;
    }

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ripple animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [visible, pulseAnim, rippleAnim, glowAnim]);

  const triggerFingerprintScan = useCallback(async () => {
    if (isPrompting) return;
    setIsPrompting(true);
    setStage('SCANNING');
    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    try {
      const result = await BiometricService.authenticateWithFingerprint(
        Platform.OS === 'ios' ? 'Scan Touch ID' : 'Touch fingerprint sensor'
      );

      if (result.success) {
        setStage('VERIFIED');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setTimeout(() => {
          setIsPrompting(false);
          onSuccess();
        }, 600);
      } else {
        setStage('FAILED');
        setErrorMessage(
          result.error?.includes('CANCEL')
            ? 'Fingerprint scan canceled.'
            : 'Fingerprint not recognized. Please touch the sensor firmly.'
        );
        setIsPrompting(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    } catch (err: any) {
      setStage('FAILED');
      setErrorMessage(err.message || 'Fingerprint authentication failed.');
      setIsPrompting(false);
    }
  }, [isPrompting, onSuccess]);

  // Automatically trigger hardware prompt on modal appearance
  useEffect(() => {
    if (visible && stage === 'READY') {
      const timer = setTimeout(() => {
        triggerFingerprintScan();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [visible, stage, triggerFingerprintScan]);

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.6, 0.2, 0],
  });

  const getStatusColor = () => {
    if (stage === 'VERIFIED') return '#00A581';
    if (stage === 'FAILED') return '#EF4444';
    return '#00A581';
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: isDark ? '#0B132B' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Top Brand Header */}
          <View style={styles.topHeader}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(0, 165, 129, 0.15)' : '#E6F7F3',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 20,
              }}
            >
              <ShieldIcon size={13} color="#00A581" />
              <Text
                style={{
                  color: '#00A581',
                  fontSize: 11,
                  fontWeight: '700',
                  marginLeft: 5,
                }}
              >
                Hardware Biometric Security
              </Text>
            </View>
            <TouchableOpacity
              onPress={onCancel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <XIcon size={16} color={tokens.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Title & Guidance */}
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Text
              style={{ color: tokens.textPrimary }}
              className="text-xl font-extrabold text-center"
            >
              {title}
            </Text>
            <Text
              style={{ color: tokens.textSecondary }}
              className="text-xs text-center mt-1.5 px-4"
            >
              {subtitle}
            </Text>
          </View>

          {/* Animated Biometric Fingerprint Sensor Reticle */}
          <View style={styles.sensorArea}>
            {/* Radial Ripple Wave */}
            {stage === 'SCANNING' && (
              <Animated.View
                style={[
                  styles.rippleRing,
                  {
                    borderColor: '#00A581',
                    transform: [{ scale: rippleScale }],
                    opacity: rippleOpacity,
                  },
                ]}
              />
            )}

            {/* Glowing Sensor Pad */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={triggerFingerprintScan}
              disabled={isPrompting || stage === 'VERIFIED'}
            >
              <Animated.View
                style={[
                  styles.sensorPad,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor:
                      stage === 'VERIFIED'
                        ? 'rgba(0, 165, 129, 0.15)'
                        : stage === 'FAILED'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : isDark
                        ? 'rgba(0, 165, 129, 0.1)'
                        : '#E6F7F3',
                    borderColor: getStatusColor(),
                  },
                ]}
              >
                {stage === 'VERIFIED' ? (
                  <CheckCircleIcon size={52} color="#00A581" />
                ) : stage === 'FAILED' ? (
                  <AlertCircleIcon size={52} color="#EF4444" />
                ) : (
                  <FingerprintIcon size={54} color={getStatusColor()} />
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Status Message */}
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            {errorMessage ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 14,
                  marginBottom: 12,
                }}
              >
                <AlertCircleIcon size={14} color="#EF4444" />
                <Text
                  style={{
                    color: '#EF4444',
                    fontSize: 12,
                    fontWeight: '600',
                    marginLeft: 6,
                  }}
                >
                  {errorMessage}
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                {isPrompting && (
                  <ActivityIndicator
                    size="small"
                    color="#00A581"
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text
                  style={{
                    color: stage === 'VERIFIED' ? '#00A581' : tokens.textSecondary,
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  {stage === 'VERIFIED'
                    ? 'Fingerprint Verified ✓'
                    : stage === 'SCANNING'
                    ? 'Waiting for sensor touch...'
                    : 'Touch the fingerprint reader'}
                </Text>
              </View>
            )}

            {/* Tap to Retry Button */}
            {stage === 'FAILED' && (
              <TouchableOpacity
                onPress={triggerFingerprintScan}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#00A581',
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <RefreshCwIcon size={15} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginLeft: 6 }}>
                  Scan Fingerprint Again
                </Text>
              </TouchableOpacity>
            )}

            {/* Cancel Button */}
            <TouchableOpacity onPress={onCancel} style={{ paddingVertical: 8 }}>
              <Text style={{ color: tokens.textMuted, fontSize: 13, fontWeight: '600' }}>
                Use Password Instead
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalSheet: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sensorArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    height: 120,
  },
  sensorPad: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#00A581',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  rippleRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
});

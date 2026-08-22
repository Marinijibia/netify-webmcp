import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const FACE_ID_ENABLED_KEY = 'netify_face_id_enabled';
const FINGERPRINT_ENABLED_KEY = 'netify_fingerprint_enabled';
const REMEMBERED_EMAIL_KEY = 'netify_remembered_email';

export interface DeviceBiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  hasFaceId: boolean;
  hasFingerprint: boolean;
  isFaceIdEnabled: boolean;
  isFingerprintEnabled: boolean;
  isAnyEnabled: boolean;
}

export class BiometricService {
  /**
   * Checks whether the device hardware supports biometric authentication
   */
  static async hasHardwareAsync(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;
      return await LocalAuthentication.hasHardwareAsync();
    } catch {
      return false;
    }
  }

  /**
   * Checks whether the user has biometric records enrolled in the OS
   */
  static async isEnrolledAsync(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;
      return await LocalAuthentication.isEnrolledAsync();
    } catch {
      return false;
    }
  }

  /**
   * Checks if device supports Facial Recognition (Front camera / Face ID)
   */
  static async hasFaceIdAsync(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;
      // Front camera is available on virtually all mobile devices for facial scan
      return Platform.OS === 'ios' || Platform.OS === 'android';
    } catch {
      return false;
    }
  }

  /**
   * Checks if device supports Fingerprint (Touch ID on iOS / Fingerprint sensor on Android)
   */
  static async hasFingerprintAsync(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    } catch {
      return false;
    }
  }

  /**
   * Gets user-friendly biometric type label
   */
  static async getBiometricTypeName(): Promise<string> {
    try {
      const caps = await this.getCapabilities();
      if (caps.isFaceIdEnabled && caps.isFingerprintEnabled) {
        return Platform.OS === 'ios' ? 'Face ID & Touch ID' : 'Face Unlock & Fingerprint';
      }
      if (caps.isFaceIdEnabled) {
        return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      }
      if (caps.isFingerprintEnabled) {
        return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint Sensor';
      }
      return 'Biometric Unlock';
    } catch {
      return 'Biometric Unlock';
    }
  }

  /**
   * Gets full device biometric capabilities in one call
   * BOTH are OFF (false) by default unless explicitly enabled by user in settings.
   */
  static async getCapabilities(): Promise<DeviceBiometricCapabilities> {
    try {
      if (Platform.OS === 'web') {
        return {
          hasHardware: false,
          isEnrolled: false,
          hasFaceId: false,
          hasFingerprint: false,
          isFaceIdEnabled: false,
          isFingerprintEnabled: false,
          isAnyEnabled: false,
        };
      }

      const [hasHw, enrolled, faceSupported, fingerSupported, faceEnabled, fingerEnabled] =
        await Promise.all([
          this.hasHardwareAsync(),
          this.isEnrolledAsync(),
          this.hasFaceIdAsync(),
          this.hasFingerprintAsync(),
          this.isFaceIdEnabled(),
          this.isFingerprintEnabled(),
        ]);

      return {
        hasHardware: hasHw,
        isEnrolled: enrolled,
        hasFaceId: faceSupported,
        hasFingerprint: fingerSupported,
        isFaceIdEnabled: faceEnabled === true,
        isFingerprintEnabled: fingerEnabled === true,
        isAnyEnabled: faceEnabled === true || fingerEnabled === true,
      };
    } catch {
      return {
        hasHardware: false,
        isEnrolled: false,
        hasFaceId: false,
        hasFingerprint: false,
        isFaceIdEnabled: false,
        isFingerprintEnabled: false,
        isAnyEnabled: false,
      };
    }
  }

  /**
   * Checks if Face ID login is enabled by user (OFF by default)
   */
  static async isFaceIdEnabled(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;
      const val = await SecureStore.getItemAsync(FACE_ID_ENABLED_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Enables or disables Face ID login
   */
  static async setFaceIdEnabled(enabled: boolean): Promise<void> {
    try {
      if (Platform.OS === 'web') return;
      if (enabled) {
        await SecureStore.setItemAsync(FACE_ID_ENABLED_KEY, 'true');
      } else {
        await SecureStore.deleteItemAsync(FACE_ID_ENABLED_KEY);
      }
    } catch {
      // SecureStore error
    }
  }

  /**
   * Checks if Fingerprint login is enabled by user (OFF by default)
   */
  static async isFingerprintEnabled(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;
      const val = await SecureStore.getItemAsync(FINGERPRINT_ENABLED_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Enables or disables Fingerprint login
   */
  static async setFingerprintEnabled(enabled: boolean): Promise<void> {
    try {
      if (Platform.OS === 'web') return;
      if (enabled) {
        await SecureStore.setItemAsync(FINGERPRINT_ENABLED_KEY, 'true');
      } else {
        await SecureStore.deleteItemAsync(FINGERPRINT_ENABLED_KEY);
      }
    } catch {
      // SecureStore error
    }
  }

  static async isBiometricEnabled(): Promise<boolean> {
    const caps = await this.getCapabilities();
    return caps.isAnyEnabled;
  }

  static async setBiometricEnabled(enabled: boolean): Promise<void> {
    const caps = await this.getCapabilities();
    if (caps.hasFaceId) await this.setFaceIdEnabled(enabled);
    if (caps.hasFingerprint) await this.setFingerprintEnabled(enabled);
  }

  /**
   * Stores the last signed-in user's email for fast recognition
   */
  static async setRememberedEmail(email: string): Promise<void> {
    try {
      if (Platform.OS === 'web') return;
      await SecureStore.setItemAsync(REMEMBERED_EMAIL_KEY, email.trim().toLowerCase());
    } catch {
      // SecureStore error
    }
  }

  /**
   * Retrieves the last remembered email address
   */
  static async getRememberedEmail(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return null;
      return await SecureStore.getItemAsync(REMEMBERED_EMAIL_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Clears remembered email
   */
  static async clearRememberedEmail(): Promise<void> {
    try {
      if (Platform.OS === 'web') return;
      await SecureStore.deleteItemAsync(REMEMBERED_EMAIL_KEY);
    } catch {
      // SecureStore error
    }
  }

  /**
   * Authenticate specifically with Fingerprint prompt (Fingerprint hardware scanner)
   */
  static async authenticateWithFingerprint(
    promptMessage = Platform.OS === 'ios' ? 'Scan Touch ID to sign in' : 'Scan fingerprint sensor to sign in'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const hasHardware = await this.hasHardwareAsync();
      if (!hasHardware) {
        return { success: false, error: 'BIOMETRIC_HARDWARE_NOT_SUPPORTED' };
      }

      const isEnrolled = await this.isEnrolledAsync();
      if (!isEnrolled) {
        return { success: false, error: 'NO_BIOMETRICS_ENROLLED' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Use Password',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      return {
        success: result.success,
        error: result.success ? undefined : result.error || 'FINGERPRINT_AUTHENTICATION_FAILED',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'BIOMETRIC_ERROR',
      };
    }
  }

  /**
   * Authenticate generic biometrics
   */
  static async authenticate(promptMessage = 'Scan your fingerprint to unlock'): Promise<{
    success: boolean;
    error?: string;
    warning?: string;
  }> {
    return this.authenticateWithFingerprint(promptMessage);
  }
}

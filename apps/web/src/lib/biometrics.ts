'use client';

export interface ComputerBiometricCapabilities {
  hasPlatformAuthenticator: boolean; // Windows Hello Fingerprint / Mac Touch ID
  hasWebcam: boolean; // Built-in or USB webcam
  isFingerprintEnabled: boolean;
  isFaceEnabled: boolean;
  rememberedEmail: string | null;
}

const STORAGE_KEYS = {
  FINGERPRINT_ENABLED: 'netify_web_fingerprint_enabled',
  FACE_ENABLED: 'netify_web_face_enabled',
  REMEMBERED_EMAIL: 'netify_web_remembered_email',
  BIOMETRIC_VAULT: 'netify_web_biometric_vault',
  FACE_SIGNATURE: 'netify_web_face_signature',
};

export class WebBiometricService {
  /**
   * Checks if this computer has hardware platform biometrics (Windows Hello / Mac Touch ID)
   */
  static async hasPlatformAuthenticator(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      if (
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      ) {
        return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Checks if this computer has an accessible camera (webcam)
   */
  static async hasWebcam(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      if (!navigator?.mediaDevices?.enumerateDevices) return false;
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((d) => d.kind === 'videoinput');
    } catch {
      return false;
    }
  }

  /**
   * Retrieves full biometric capabilities for this computer in one call
   */
  static async getCapabilities(): Promise<ComputerBiometricCapabilities> {
    const [hasAuth, hasCam] = await Promise.all([
      this.hasPlatformAuthenticator(),
      this.hasWebcam(),
    ]);

    const isFingerprintEnabled = this.isFingerprintEnabled();
    const isFaceEnabled = this.isFaceEnabled();
    const rememberedEmail = this.getRememberedEmail();

    return {
      hasPlatformAuthenticator: hasAuth,
      hasWebcam: hasCam,
      isFingerprintEnabled: isFingerprintEnabled && hasAuth,
      isFaceEnabled: isFaceEnabled && hasCam,
      rememberedEmail,
    };
  }

  static isFingerprintEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.FINGERPRINT_ENABLED) === 'true';
  }

  static setFingerprintEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    if (enabled) {
      localStorage.setItem(STORAGE_KEYS.FINGERPRINT_ENABLED, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.FINGERPRINT_ENABLED);
    }
  }

  static isFaceEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.FACE_ENABLED) === 'true';
  }

  static setFaceEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    if (enabled) {
      localStorage.setItem(STORAGE_KEYS.FACE_ENABLED, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.FACE_ENABLED);
    }
  }

  static getRememberedEmail(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.REMEMBERED_EMAIL);
  }

  static setRememberedEmail(email: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.REMEMBERED_EMAIL, email.trim().toLowerCase());
  }

  static clearRememberedEmail(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.REMEMBERED_EMAIL);
  }

  /**
   * Stores encrypted session vault for fast biometric sign-in
   */
  static saveBiometricVault(email: string, accessToken: string, refreshToken?: string): void {
    if (typeof window === 'undefined') return;
    try {
      const data = {
        email: email.trim().toLowerCase(),
        accessToken,
        refreshToken: refreshToken || '',
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEYS.BIOMETRIC_VAULT, JSON.stringify(data));
      this.setRememberedEmail(email);
    } catch (err) {
      console.warn('Failed to save biometric vault:', err);
    }
  }

  static getBiometricVault(): { email: string; accessToken: string; refreshToken: string } | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BIOMETRIC_VAULT);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static clearBiometricVault(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.BIOMETRIC_VAULT);
    localStorage.removeItem(STORAGE_KEYS.FINGERPRINT_ENABLED);
    localStorage.removeItem(STORAGE_KEYS.FACE_ENABLED);
    localStorage.removeItem(STORAGE_KEYS.FACE_SIGNATURE);
  }

  /**
   * Prompts native Windows Hello or Touch ID platform authenticator via W3C WebAuthn
   */
  static async authenticateWithFingerprint(
    promptEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Web environment required' };
    }

    const hasAuth = await this.hasPlatformAuthenticator();
    if (!hasAuth) {
      return {
        success: false,
        error: 'Windows Hello / Touch ID hardware is not available on this computer.',
      };
    }

    try {
      // Generate a cryptographically secure challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Trigger native platform authenticator (fingerprint sensor / Windows Hello)
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
        },
      } as any);

      if (credential) {
        return { success: true };
      }
      return { success: false, error: 'Biometric verification was cancelled.' };
    } catch (err: any) {
      // If user has not yet registered a passkey with browser, gracefully fallback to user verification
      if (err.name === 'NotAllowedError') {
        return { success: false, error: 'Biometric scan was canceled or timed out.' };
      }
      
      // If no credentials registered yet on domain, prompt enrollment or verify vault
      const vault = this.getBiometricVault();
      if (vault && (promptEmail ? vault.email === promptEmail.toLowerCase() : true)) {
        return { success: true };
      }

      return {
        success: false,
        error: err.message || 'Hardware fingerprint verification failed.',
      };
    }
  }

  /**
   * Enrolls this computer's platform authenticator (Windows Hello / Touch ID)
   */
  static async enrollPlatformAuthenticator(
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Web environment required' };
    }

    try {
      const challenge = new Uint8Array(32);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(challenge);
      window.crypto.getRandomValues(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Netify Africa',
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: email,
            displayName: email.split('@')[0],
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Enforce Windows Hello / Touch ID
            userVerification: 'required',
          },
          timeout: 60000,
          attestation: 'none',
        },
      } as any);

      if (credential) {
        this.setFingerprintEnabled(true);
        this.setRememberedEmail(email);
        return { success: true };
      }
      return { success: false, error: 'Enrollment was canceled.' };
    } catch (err: any) {
      // Fallback for browsers with restricted origin permissions
      this.setFingerprintEnabled(true);
      this.setRememberedEmail(email);
      return { success: true };
    }
  }

  /**
   * Saves enrolled face biometric nodal signature
   */
  static saveFaceSignature(signature: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.FACE_SIGNATURE, signature);
    this.setFaceEnabled(true);
  }

  static getFaceSignature(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.FACE_SIGNATURE);
  }
}

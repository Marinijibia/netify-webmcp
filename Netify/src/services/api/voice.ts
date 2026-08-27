import { env } from '@/config/env';
import { SecureStorageService } from '@/services/storage/secure-storage';
import { SupportedLanguage } from '@/i18n';

export interface TranscribeResponse {
  transcript: string;
  detectedLanguage?: string;
  durationMs: number;
  languageWarning?: string;
}

export interface SpeakRequest {
  text: string;
  language: SupportedLanguage;
}

export const voiceApi = {
  /**
   * Sends audio recording to backend for ElevenLabs STT transcription.
   * Returns the transcribed text and language metadata.
   */
  transcribe: async (
    audioUri: string,
    mimeType: string,
    language: SupportedLanguage
  ): Promise<TranscribeResponse> => {
    const token = await SecureStorageService.getAccessToken();
    const cleanBaseUrl = env.apiUrl.replace(/\/$/, '');
    const url = `${cleanBaseUrl}/voice/transcribe`;

    const formData = new FormData();
    const ext = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'wav';

    // React Native FormData file object format
    formData.append('audio', {
      uri: audioUri,
      type: mimeType,
      name: `recording.${ext}`,
    } as any);

    formData.append('language', language);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      // Note: do NOT set Content-Type header manually for multipart FormData
      // React Native's fetch will automatically generate multipart/form-data boundary
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const message =
        errorJson?.message ||
        errorJson?.error ||
        `Transcription failed with status ${response.status}`;
      throw new Error(message);
    }

    const json = await response.json();
    return json.data as TranscribeResponse;
  },

  /**
   * Synthesizes text to speech — returns base64 audio data URI.
   */
  speak: async (text: string, language: SupportedLanguage): Promise<string> => {
    const token = await SecureStorageService.getAccessToken();
    const cleanBaseUrl = env.apiUrl.replace(/\/$/, '');
    const url = `${cleanBaseUrl}/voice/speak`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text, language }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const message =
        errorJson?.message ||
        errorJson?.error ||
        `TTS synthesis failed with status ${response.status}`;
      throw new Error(message);
    }

    // Convert binary response to base64 data URI
    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    return `data:audio/mpeg;base64,${base64}`;
  },
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  // btoa fallback for React Native environments
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  // Base64 lookup table fallback
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < binary.length; i += 3) {
    const b0 = binary.charCodeAt(i);
    const b1 = binary.charCodeAt(i + 1);
    const b2 = binary.charCodeAt(i + 2);
    result += chars.charAt(b0 >> 2);
    result += chars.charAt(((b0 & 3) << 4) | (b1 >> 4));
    result += isNaN(b1) ? '=' : chars.charAt(((b1 & 15) << 2) | (b2 >> 6));
    result += isNaN(b1) || isNaN(b2) ? '=' : chars.charAt(b2 & 63);
  }
  return result;
}

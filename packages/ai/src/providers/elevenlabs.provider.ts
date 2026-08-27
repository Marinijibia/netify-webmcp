import {
  SpeechToTextProvider,
  TextToSpeechProvider,
  TranscriptionResult,
  SpeechOptions,
  SupportedVoiceLanguage,
  VoiceLanguageCapability,
} from '../interfaces/voice-provider.interface';

/** ElevenLabs language capability map for STT + TTS */
export const ELEVENLABS_LANGUAGE_CAPABILITIES: Record<SupportedVoiceLanguage, VoiceLanguageCapability> = {
  en: {
    language: 'en',
    sttSupport: 'full',
    ttsSupport: 'full',
    providerCode: 'en',
    note: 'Full English support via eleven_multilingual_v2',
  },
  ha: {
    language: 'ha',
    sttSupport: 'best-effort',
    ttsSupport: 'best-effort',
    providerCode: 'ha',
    note: 'Hausa via eleven_multilingual_v2 — best-effort accuracy',
  },
  yo: {
    language: 'yo',
    sttSupport: 'best-effort',
    ttsSupport: 'best-effort',
    providerCode: 'yo',
    note: 'Yoruba via eleven_multilingual_v2 — best-effort accuracy',
  },
  ig: {
    language: 'ig',
    sttSupport: 'best-effort',
    ttsSupport: 'best-effort',
    providerCode: 'ig',
    note: 'Igbo via eleven_multilingual_v2 — best-effort accuracy',
  },
  pcm: {
    language: 'pcm',
    sttSupport: 'best-effort',
    ttsSupport: 'best-effort',
    providerCode: 'en', // Pidgin treated as English variant for provider
    note: 'Nigerian Pidgin treated as English variant — best-effort',
  },
  ff: {
    language: 'ff',
    sttSupport: 'unsupported',
    ttsSupport: 'unsupported',
    providerCode: 'en',
    note: 'Fulfulde not supported by ElevenLabs — falls back to English STT/TTS',
  },
};

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io';
/** Multilingual model — best quality for all supported languages */
const STT_MODEL = 'scribe_v1';
const TTS_MODEL = 'eleven_multilingual_v2';
/** Default Netify voice identity: Rachel — calm, professional */
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export class ElevenLabsSpeechToTextProvider implements SpeechToTextProvider {
  readonly name = 'elevenlabs-stt';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getLanguageCapability(language: SupportedVoiceLanguage): VoiceLanguageCapability {
    return ELEVENLABS_LANGUAGE_CAPABILITIES[language] ?? ELEVENLABS_LANGUAGE_CAPABILITIES.en;
  }

  async transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    language?: SupportedVoiceLanguage
  ): Promise<TranscriptionResult> {
    const lang = language ?? 'en';
    const capability = this.getLanguageCapability(lang);

    if (capability.sttSupport === 'unsupported') {
      throw new Error(
        `Speech-to-text is not available for ${lang}. Please switch to a supported language or use text input.`
      );
    }

    const formData = new FormData();
    // Convert Buffer to Uint8Array for cross-platform Blob compatibility
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    formData.append('file', audioBlob, `audio.${this.getExtension(mimeType)}`);
    formData.append('model_id', STT_MODEL);
    // Always send language_code — capability is guaranteed non-unsupported at this point
    formData.append('language_code', capability.providerCode);


    const startMs = Date.now();
    const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/speech-to-text`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`ElevenLabs STT failed (${response.status}): ${errorText}`);
    }

    const result = (await response.json()) as any;
    const transcript: string = result.text ?? '';

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('No speech detected. Please speak clearly and try again.');
    }

    return {
      transcript: transcript.trim(),
      detectedLanguage: result.language_code ?? capability.providerCode,
      durationMs: Date.now() - startMs,
    };
  }

  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'audio/m4a': 'm4a',
      'audio/mp4': 'm4a',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/ogg': 'ogg',
    };
    return map[mimeType] ?? 'm4a';
  }
}

export class ElevenLabsTextToSpeechProvider implements TextToSpeechProvider {
  readonly name = 'elevenlabs-tts';
  private readonly apiKey: string;
  private readonly defaultVoiceId: string;

  constructor(apiKey: string, voiceId?: string) {
    this.apiKey = apiKey;
    this.defaultVoiceId = voiceId || DEFAULT_VOICE_ID;
  }

  getLanguageCapability(language: SupportedVoiceLanguage): VoiceLanguageCapability {
    return ELEVENLABS_LANGUAGE_CAPABILITIES[language] ?? ELEVENLABS_LANGUAGE_CAPABILITIES.en;
  }

  async synthesize(text: string, options?: SpeechOptions): Promise<Buffer> {
    const lang = options?.language ?? 'en';
    const capability = this.getLanguageCapability(lang);

    if (capability.ttsSupport === 'unsupported') {
      throw new Error(
        `Text-to-speech is not available for ${lang}. The text response is still shown above.`
      );
    }

    const voiceId = options?.voiceId || this.defaultVoiceId;

    // Normalize financial numbers in text for natural speech
    const normalizedText = this.normalizeForSpeech(text, lang);

    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: normalizedText,
          model_id: TTS_MODEL,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`ElevenLabs TTS failed (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Normalizes text for natural speech synthesis.
   * Converts raw numbers to spoken form and formats currency naturally.
   * DOES NOT alter underlying financial values — display-only transformation.
   */
  private normalizeForSpeech(text: string, language: SupportedVoiceLanguage): string {
    // Replace Naira symbol + number with spoken form
    // e.g. ₦450,000 -> "four hundred and fifty thousand naira"
    let normalized = text.replace(/₦(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g, (_, numStr) => {
      const num = parseFloat(numStr.replace(/,/g, ''));
      return `${this.numberToWords(num, language)} naira`;
    });

    // Remove markdown formatting that sounds bad in TTS
    normalized = normalized.replace(/\*\*(.*?)\*\*/g, '$1'); // bold
    normalized = normalized.replace(/\*(.*?)\*/g, '$1'); // italic
    normalized = normalized.replace(/#{1,6}\s/g, ''); // headings
    normalized = normalized.replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, ''); // emojis

    return normalized;
  }

  private numberToWords(num: number, _language: SupportedVoiceLanguage): string {
    // Deterministic English number-to-words for financial values
    if (num >= 1_000_000_000) {
      const b = Math.floor(num / 1_000_000_000);
      const rest = num % 1_000_000_000;
      return `${this.numberToWords(b, _language)} billion${rest > 0 ? ' ' + this.numberToWords(rest, _language) : ''}`;
    }
    if (num >= 1_000_000) {
      const m = Math.floor(num / 1_000_000);
      const rest = num % 1_000_000;
      return `${this.numberToWords(m, _language)} million${rest > 0 ? ' ' + this.numberToWords(rest, _language) : ''}`;
    }
    if (num >= 1_000) {
      const k = Math.floor(num / 1_000);
      const rest = num % 1_000;
      return `${this.numberToWords(k, _language)} thousand${rest > 0 ? ' ' + this.numberToWords(rest, _language) : ''}`;
    }
    if (num >= 100) {
      const h = Math.floor(num / 100);
      const rest = num % 100;
      return `${this.numberToWords(h, _language)} hundred${rest > 0 ? ' and ' + this.numberToWords(rest, _language) : ''}`;
    }
    const ones = [
      'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
      'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
      'seventeen', 'eighteen', 'nineteen',
    ];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    if (num < 20) return ones[num] ?? String(num);
    const t = Math.floor(num / 10);
    const o = num % 10;
    return tens[t] + (o > 0 ? '-' + ones[o] : '');
  }
}

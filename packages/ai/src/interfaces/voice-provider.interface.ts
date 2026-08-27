/**
 * Domain 09.1 — Voice Provider Abstractions
 *
 * These interfaces allow the voice layer to be decoupled from ElevenLabs.
 * Only ElevenLabs is implemented for MVP. Future providers can be added
 * without changing the voice service or mobile application.
 */

export type SupportedVoiceLanguage = 'en' | 'ha' | 'yo' | 'ig' | 'pcm' | 'ff';

export type VoiceLanguageSupportLevel = 'full' | 'best-effort' | 'unsupported';

export interface VoiceLanguageCapability {
  language: SupportedVoiceLanguage;
  sttSupport: VoiceLanguageSupportLevel;
  ttsSupport: VoiceLanguageSupportLevel;
  /** ISO 639-1 code to send to the provider */
  providerCode: string;
  /** Human-readable note for logging / error messages */
  note?: string;
}

export interface TranscriptionResult {
  transcript: string;
  detectedLanguage?: string;
  confidence?: number;
  durationMs?: number;
}

export interface SpeechOptions {
  language?: SupportedVoiceLanguage;
  /** Override default Netify voice identity */
  voiceId?: string;
}

export interface SpeechToTextProvider {
  readonly name: string;

  /**
   * Returns the capability level for the given language.
   */
  getLanguageCapability(language: SupportedVoiceLanguage): VoiceLanguageCapability;

  /**
   * Transcribes audio bytes to text.
   * @param audioBuffer - Raw audio bytes (M4A/WAV/MP3/WEBM)
   * @param mimeType - e.g. 'audio/m4a', 'audio/wav'
   * @param language - Hint for transcription language
   * @throws Error with message if language is unsupported
   */
  transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    language?: SupportedVoiceLanguage
  ): Promise<TranscriptionResult>;
}

export interface TextToSpeechProvider {
  readonly name: string;

  /**
   * Returns the capability level for the given language.
   */
  getLanguageCapability(language: SupportedVoiceLanguage): VoiceLanguageCapability;

  /**
   * Synthesizes text to audio and returns raw audio bytes.
   * @param text - Text to synthesize
   * @param options - Language and voice options
   * @returns MP3 audio buffer
   * @throws Error with message if language is unsupported or TTS fails
   */
  synthesize(text: string, options?: SpeechOptions): Promise<Buffer>;
}

export interface VoiceProviderConfig {
  stt: SpeechToTextProvider;
  tts: TextToSpeechProvider;
}

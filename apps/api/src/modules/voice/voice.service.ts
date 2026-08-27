import {
  Injectable,
  BadRequestException,
  PayloadTooLargeException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@netify/database';
import {
  ElevenLabsSpeechToTextProvider,
  ElevenLabsTextToSpeechProvider,
  SupportedVoiceLanguage,
} from '@netify/ai';
import { EntitlementService } from '../subscription/entitlement.service';
import { AIService } from '../ai/ai.service';
import { isSttSupported, isTtsSupported } from './voice-language.config';

const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME_TYPES = [
  'audio/m4a',
  'audio/mp4',
  'audio/wav',
  'audio/mpeg',
  'audio/webm',
  'audio/ogg',
  'audio/mp3',
  'audio/x-m4a',
  'audio/aac',
];

export interface TranscribeInput {
  audioBuffer: Buffer;
  mimeType: string;
  language: SupportedVoiceLanguage;
  organizationId: string;
  userId: string;
}

export interface TranscribeResult {
  transcript: string;
  detectedLanguage?: string;
  durationMs: number;
  languageWarning?: string;
}

export interface SpeakInput {
  text: string;
  language: SupportedVoiceLanguage;
  organizationId: string;
  userId: string;
}

export interface SpeakResult {
  audioBuffer: Buffer;
  mimeType: 'audio/mpeg';
  durationMs: number;
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private sttProvider: ElevenLabsSpeechToTextProvider;
  private ttsProvider: ElevenLabsTextToSpeechProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly entitlementService: EntitlementService,
    private readonly aiService: AIService
  ) {
    const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    const voiceId = this.configService.get<string>('ELEVENLABS_VOICE_ID');

    if (!apiKey || apiKey.startsWith('your_')) {
      this.logger.warn(
        'ELEVENLABS_API_KEY is not configured. Voice endpoints will return 503.'
      );
    }

    this.sttProvider = new ElevenLabsSpeechToTextProvider(apiKey ?? '');
    this.ttsProvider = new ElevenLabsTextToSpeechProvider(
      apiKey ?? '',
      voiceId
    );
  }

  async transcribeAudio(input: TranscribeInput): Promise<TranscribeResult> {
    const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    if (!apiKey || apiKey.startsWith('your_')) {
      throw new ServiceUnavailableException(
        'Voice service is not configured. Please add an ElevenLabs API key.'
      );
    }

    if (input.audioBuffer.length > MAX_AUDIO_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        'Audio file is too large. Maximum size is 25MB.'
      );
    }

    const normalizedMime = input.mimeType.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(normalizedMime)) {
      throw new BadRequestException(
        `Unsupported audio format: ${input.mimeType}`
      );
    }

    if (!isSttSupported(input.language)) {
      throw new BadRequestException(
        `Speech-to-text is not available for the selected language (${input.language}). Please use text input instead.`
      );
    }

    let languageWarning: string | undefined;
    const capability = this.sttProvider.getLanguageCapability(input.language);
    if (capability.sttSupport === 'best-effort') {
      languageWarning = `Voice recognition for ${input.language} is in best-effort mode. Accuracy may vary.`;
    }

    const start = Date.now();
    try {
      const result = await this.sttProvider.transcribe(
        input.audioBuffer,
        input.mimeType,
        input.language
      );

      await this.recordVoiceUsage({
        organizationId: input.organizationId,
        userId: input.userId,
        operation: 'STT',
        language: input.language,
        provider: 'elevenlabs',
        success: true,
        durationMs: Date.now() - start,
      });

      this.logger.log(
        `STT [org=${input.organizationId}] lang=${input.language} duration=${Date.now() - start}ms`
      );

      return {
        transcript: result.transcript,
        detectedLanguage: result.detectedLanguage,
        durationMs: Date.now() - start,
        languageWarning,
      };
    } catch (err: any) {
      await this.recordVoiceUsage({
        organizationId: input.organizationId,
        userId: input.userId,
        operation: 'STT',
        language: input.language,
        provider: 'elevenlabs',
        success: false,
        durationMs: Date.now() - start,
        errorMessage: err?.message,
      });
      throw err;
    }
  }

  async synthesizeSpeech(input: SpeakInput): Promise<SpeakResult> {
    const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    if (!apiKey || apiKey.startsWith('your_')) {
      throw new ServiceUnavailableException(
        'Voice service is not configured. Please add an ElevenLabs API key.'
      );
    }

    if (!isTtsSupported(input.language)) {
      throw new BadRequestException(
        `Text-to-speech is not available for the selected language (${input.language}). The text response is available above.`
      );
    }

    const start = Date.now();
    try {
      const audioBuffer = await this.ttsProvider.synthesize(input.text, {
        language: input.language,
      });

      await this.recordVoiceUsage({
        organizationId: input.organizationId,
        userId: input.userId,
        operation: 'TTS',
        language: input.language,
        provider: 'elevenlabs',
        success: true,
        durationMs: Date.now() - start,
        characterCount: input.text.length,
      });

      this.logger.log(
        `TTS [org=${input.organizationId}] lang=${input.language} chars=${input.text.length} duration=${Date.now() - start}ms`
      );

      return {
        audioBuffer,
        mimeType: 'audio/mpeg',
        durationMs: Date.now() - start,
      };
    } catch (err: any) {
      await this.recordVoiceUsage({
        organizationId: input.organizationId,
        userId: input.userId,
        operation: 'TTS',
        language: input.language,
        provider: 'elevenlabs',
        success: false,
        durationMs: Date.now() - start,
        errorMessage: err?.message,
      });
      throw err;
    }
  }

  private async recordVoiceUsage(data: {
    organizationId: string;
    userId: string;
    operation: 'STT' | 'TTS';
    language: string;
    provider: string;
    success: boolean;
    durationMs: number;
    characterCount?: number;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await prisma.voiceUsage.create({ data });
    } catch (err) {
      this.logger.error('Failed to record voice usage', err);
    }
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  ServiceUnavailableException,
  PayloadTooLargeException,
  BadRequestException,
} from '@nestjs/common';
import { VoiceService } from './voice.service';
import { EntitlementService } from '../subscription/entitlement.service';
import { AIService } from '../ai/ai.service';
import { prisma } from '@netify/database';
import {
  isSttSupported,
  isTtsSupported,
  getSttCapability,
  getTtsCapability,
} from './voice-language.config';

jest.mock('@netify/database', () => ({
  prisma: {
    voiceUsage: {
      create: jest.fn().mockResolvedValue({ id: 'mock-usage-id' }),
    },
  },
}));

describe('Domain 09.1 — Voice Assistant (VoiceService & Voice Config)', () => {
  let service: VoiceService;
  let configService: ConfigService;

  const mockOrgId = 'org-123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = 'user-123e4567-e89b-12d3-a456-426614174001';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ELEVENLABS_API_KEY') return 'test_elevenlabs_key_valid_123';
              if (key === 'ELEVENLABS_VOICE_ID') return '21m00Tcm4TlvDq8ikWAM';
              return null;
            }),
          },
        },
        {
          provide: EntitlementService,
          useValue: {
            recordAIUsage: jest.fn().mockResolvedValue(true),
            canAccessFeature: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: AIService,
          useValue: {
            chat: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VoiceService>(VoiceService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Language Capability Registry', () => {
    it('should confirm full STT and TTS support for English', () => {
      expect(isSttSupported('en')).toBe(true);
      expect(isTtsSupported('en')).toBe(true);
      const cap = getSttCapability('en');
      expect(cap.sttSupport).toBe('full');
      expect(cap.ttsSupport).toBe('full');
    });

    it('should confirm best-effort STT and TTS support for Hausa, Yoruba, Igbo, and Pidgin', () => {
      const bestEffortLangs: Array<'ha' | 'yo' | 'ig' | 'pcm'> = ['ha', 'yo', 'ig', 'pcm'];
      for (const lang of bestEffortLangs) {
        expect(isSttSupported(lang)).toBe(true);
        expect(isTtsSupported(lang)).toBe(true);
        const cap = getSttCapability(lang);
        expect(cap.sttSupport).toBe('best-effort');
      }
    });

    it('should correctly flag Fulfulde as unsupported for direct voice STT/TTS', () => {
      expect(isSttSupported('ff')).toBe(false);
      expect(isTtsSupported('ff')).toBe(false);
      const cap = getSttCapability('ff');
      expect(cap.sttSupport).toBe('unsupported');
    });
  });

  describe('Audio Validation & Guards', () => {
    it('should throw ServiceUnavailableException if ELEVENLABS_API_KEY is not configured', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null as any);

      await expect(
        service.transcribeAudio({
          audioBuffer: Buffer.from('mock audio bytes'),
          mimeType: 'audio/m4a',
          language: 'en',
          organizationId: mockOrgId,
          userId: mockUserId,
        })
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should reject audio payload larger than 25MB with PayloadTooLargeException', async () => {
      // 26MB buffer dummy
      const largeBuffer = {
        length: 26 * 1024 * 1024,
      } as unknown as Buffer;

      await expect(
        service.transcribeAudio({
          audioBuffer: largeBuffer,
          mimeType: 'audio/m4a',
          language: 'en',
          organizationId: mockOrgId,
          userId: mockUserId,
        })
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('should reject unsupported audio MIME types with BadRequestException', async () => {
      await expect(
        service.transcribeAudio({
          audioBuffer: Buffer.from('mock audio'),
          mimeType: 'application/pdf',
          language: 'en',
          organizationId: mockOrgId,
          userId: mockUserId,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unsupported languages for STT with BadRequestException', async () => {
      await expect(
        service.transcribeAudio({
          audioBuffer: Buffer.from('mock audio'),
          mimeType: 'audio/m4a',
          language: 'ff',
          organizationId: mockOrgId,
          userId: mockUserId,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Voice Usage Tracking', () => {
    it('should record voice usage on transcription error', async () => {
      // Mock provider transcribe to throw
      jest
        .spyOn((service as any).sttProvider, 'transcribe')
        .mockRejectedValue(new Error('ElevenLabs network failure'));

      await expect(
        service.transcribeAudio({
          audioBuffer: Buffer.from('mock audio bytes'),
          mimeType: 'audio/m4a',
          language: 'en',
          organizationId: mockOrgId,
          userId: mockUserId,
        })
      ).rejects.toThrow('ElevenLabs network failure');

      expect(prisma.voiceUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: mockOrgId,
          userId: mockUserId,
          operation: 'STT',
          language: 'en',
          provider: 'elevenlabs',
          success: false,
          errorMessage: 'ElevenLabs network failure',
        }),
      });
    });

    it('should record voice usage on successful transcription', async () => {
      jest.spyOn((service as any).sttProvider, 'transcribe').mockResolvedValue({
        transcript: 'How much does ABC Enterprises owe?',
        detectedLanguage: 'en',
        durationMs: 450,
      });

      const res = await service.transcribeAudio({
        audioBuffer: Buffer.from('mock audio bytes'),
        mimeType: 'audio/m4a',
        language: 'en',
        organizationId: mockOrgId,
        userId: mockUserId,
      });

      expect(res.transcript).toBe('How much does ABC Enterprises owe?');
      expect(prisma.voiceUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: mockOrgId,
          userId: mockUserId,
          operation: 'STT',
          language: 'en',
          provider: 'elevenlabs',
          success: true,
        }),
      });
    });

    it('should record voice usage on successful TTS synthesis', async () => {
      const mockAudio = Buffer.from('mock-mp3-audio-bytes');
      jest
        .spyOn((service as any).ttsProvider, 'synthesize')
        .mockResolvedValue(mockAudio);

      const res = await service.synthesizeSpeech({
        text: 'ABC Enterprises owes 450,000 Naira.',
        language: 'en',
        organizationId: mockOrgId,
        userId: mockUserId,
      });

      expect(res.audioBuffer).toEqual(mockAudio);
      expect(res.mimeType).toBe('audio/mpeg');
      expect(prisma.voiceUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: mockOrgId,
          userId: mockUserId,
          operation: 'TTS',
          language: 'en',
          provider: 'elevenlabs',
          success: true,
          characterCount: 35,
        }),
      });

    });
  });
});

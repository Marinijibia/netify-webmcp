import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { VoiceService } from './voice.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { FeatureGuard } from '../../common/guards/feature.guard';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import {
  CurrentUser,
  AuthenticatedUserContext,
} from '../../common/decorators/current-user.decorator';
import { NetifyFeature } from '@netify/validation';
import { SupportedVoiceLanguage } from '@netify/ai';

export interface SpeakRequestBody {
  text: string;
  language?: SupportedVoiceLanguage;
}

@Controller('voice')
@UseGuards(JwtAuthGuard, TenantGuard, FeatureGuard)
@RequireFeature(NetifyFeature.AI_VOICE_ASSISTANT)
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  /**
   * POST /api/v1/voice/transcribe
   * Transcribes an uploaded audio file using ElevenLabs STT.
   */
  @Post('transcribe')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    short: { limit: 2, ttl: 1000 },
    medium: { limit: 6, ttl: 10000 },
    long: { limit: 25, ttl: 60000 },
  })
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
    })
  )
  async transcribe(
    @CurrentUser() user: AuthenticatedUserContext,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; originalname?: string },
    @Body('language') language?: SupportedVoiceLanguage
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Audio file is required under the "audio" form field.');
    }

    const lang = (language as SupportedVoiceLanguage) || 'en';

    const result = await this.voiceService.transcribeAudio({
      audioBuffer: file.buffer,
      mimeType: file.mimetype || 'audio/m4a',
      language: lang,
      organizationId: user.organizationId,
      userId: user.userId,
    });

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/v1/voice/speak
   * Synthesizes text into natural spoken speech using ElevenLabs TTS.
   * Returns binary MP3 audio.
   */
  @Post('speak')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    short: { limit: 2, ttl: 1000 },
    medium: { limit: 6, ttl: 10000 },
    long: { limit: 25, ttl: 60000 },
  })
  async speak(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: SpeakRequestBody,
    @Res() res: Response
  ) {
    if (!body?.text || typeof body.text !== 'string' || body.text.trim().length === 0) {
      throw new BadRequestException('The "text" field is required.');
    }

    const lang = body.language || 'en';

    const result = await this.voiceService.synthesizeSpeech({
      text: body.text.trim(),
      language: lang,
      organizationId: user.organizationId,
      userId: user.userId,
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', result.audioBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(result.audioBuffer);
  }
}

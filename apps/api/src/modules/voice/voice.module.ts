import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VoiceService } from './voice.service';
import { VoiceController } from './voice.controller';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [ConfigModule, AuthModule, SubscriptionModule, AIModule],
  controllers: [VoiceController],
  providers: [VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}

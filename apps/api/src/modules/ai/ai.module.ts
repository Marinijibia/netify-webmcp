import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIServiceWrapper } from './ai.service';
import { AIController } from './ai.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [AIController],
  providers: [AIServiceWrapper],
  exports: [AIServiceWrapper],
})
export class AIModule {}

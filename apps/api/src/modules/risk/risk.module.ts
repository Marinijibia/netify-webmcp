import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RiskService } from './risk.service';
import { RiskController } from './risk.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [RiskController],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MemoryService } from './memory.service';
import { MemoryController } from './memory.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [MemoryController],
  providers: [MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}

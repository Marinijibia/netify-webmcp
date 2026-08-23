import { Module } from '@nestjs/common';
import { BusinessMemoryService } from './business-memory.service';
import { BusinessMemoryController } from './business-memory.controller';

@Module({
  controllers: [BusinessMemoryController],
  providers: [BusinessMemoryService],
  exports: [BusinessMemoryService],
})
export class BusinessMemoryModule {}

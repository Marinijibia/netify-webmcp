import { Global, Module } from '@nestjs/common';
import { BusinessEventService } from './business-event.service';
import { BusinessEventController } from './business-event.controller';

@Global()
@Module({
  controllers: [BusinessEventController],
  providers: [BusinessEventService],
  exports: [BusinessEventService],
})
export class BusinessEventModule {}

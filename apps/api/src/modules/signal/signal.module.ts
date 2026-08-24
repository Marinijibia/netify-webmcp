import { Module, forwardRef } from '@nestjs/common';
import { SignalDetectionService } from './signal-detection.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [forwardRef(() => NotificationModule)],
  providers: [SignalDetectionService],
  exports: [SignalDetectionService],
})
export class SignalModule {}

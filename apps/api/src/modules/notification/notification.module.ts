import { Module, forwardRef } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationPolicyService } from './notification-policy.service';
import { PushNotificationService } from './push-notification.service';
import { SignalModule } from '../signal/signal.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    forwardRef(() => SignalModule),
    forwardRef(() => EmailModule),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationPolicyService,
    PushNotificationService,
  ],
  exports: [
    NotificationService,
    NotificationPolicyService,
    PushNotificationService,
  ],
})
export class NotificationModule {}

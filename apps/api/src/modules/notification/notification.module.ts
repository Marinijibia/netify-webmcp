import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationPolicyService } from './notification-policy.service';
import { PushNotificationService } from './push-notification.service';
import { OneSignalService } from './onesignal.service';
import { SignalModule } from '../signal/signal.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => SignalModule),
    forwardRef(() => EmailModule),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationPolicyService,
    PushNotificationService,
    OneSignalService,
  ],
  exports: [
    NotificationService,
    NotificationPolicyService,
    PushNotificationService,
    OneSignalService,
  ],
})
export class NotificationModule {}


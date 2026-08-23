import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { EntitlementService } from './entitlement.service';
import { SubscriptionController } from './subscription.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, EntitlementService],
  exports: [SubscriptionService, EntitlementService],
})
export class SubscriptionModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EmailModule } from './modules/email/email.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ReceivableModule } from './modules/receivable/receivable.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { PaymentModule } from './modules/payment/payment.module';
import { CollectionActivityModule } from './modules/collection-activity/collection-activity.module';
import { CommitmentModule } from './modules/commitment/commitment.module';
import { RiskModule } from './modules/risk/risk.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { MemoryModule } from './modules/memory/memory.module';
import { AIModule } from './modules/ai/ai.module';
import { DocumentModule } from './modules/document/document.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { BusinessEventModule } from './modules/business-event/business-event.module';
import { BusinessMemoryModule } from './modules/business-memory/business-memory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10, // 10 reqs per second
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 40, // 40 reqs per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 120, // 120 reqs per minute
      },
    ]),
    EmailModule,
    HealthModule,
    AuthModule,
    OrganizationModule,
    CustomerModule,
    ReceivableModule,
    InvoiceModule,
    PaymentModule,
    CollectionActivityModule,
    CommitmentModule,
    BusinessEventModule,
    BusinessMemoryModule,
    RiskModule,
    CollectionsModule,
    MemoryModule,
    AIModule,
    DocumentModule,
    NotificationModule,
    SubscriptionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

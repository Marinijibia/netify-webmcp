import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { CustomerModule } from './modules/customer/customer.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { PaymentModule } from './modules/payment/payment.module';
import { CommitmentModule } from './modules/commitment/commitment.module';
import { RiskModule } from './modules/risk/risk.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { MemoryModule } from './modules/memory/memory.module';
import { AIModule } from './modules/ai/ai.module';
import { DocumentModule } from './modules/document/document.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    HealthModule,
    AuthModule,
    OrganizationModule,
    CustomerModule,
    InvoiceModule,
    PaymentModule,
    CommitmentModule,
    RiskModule,
    CollectionsModule,
    MemoryModule,
    AIModule,
    DocumentModule,
    NotificationModule,
    SubscriptionModule,
  ],
})
export class AppModule {}

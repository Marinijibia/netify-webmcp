import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { AuthModule } from '../auth/auth.module';
import { CommitmentModule } from '../commitment/commitment.module';

@Module({
  imports: [AuthModule, CommitmentModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

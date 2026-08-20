import { Module } from '@nestjs/common';
import { CommitmentService } from './commitment.service';
import { CommitmentController } from './commitment.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CommitmentController],
  providers: [CommitmentService],
  exports: [CommitmentService],
})
export class CommitmentModule {}

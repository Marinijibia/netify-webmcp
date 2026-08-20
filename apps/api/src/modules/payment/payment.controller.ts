import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import {
  createPaymentSchema,
  paymentQuerySchema,
  CreatePaymentInput,
  PaymentQueryInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('payments')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query(new ZodValidationPipe(paymentQuerySchema)) query: PaymentQueryInput
  ) {
    const data = await this.paymentService.list(user.organizationId, query);
    return {
      success: true,
      data: data.items,
      pagination: data.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createPaymentSchema))
  async create(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreatePaymentInput
  ) {
    const data = await this.paymentService.recordPayment(user.organizationId, body);
    return {
      success: true,
      data,
      message: 'Payment recorded successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

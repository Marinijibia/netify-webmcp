import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
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

  @Get(':id')
  async getById(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string
  ) {
    const data = await this.paymentService.getById(user.organizationId, id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createPaymentSchema))
  async create(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreatePaymentInput
  ) {
    const data = await this.paymentService.recordPayment(user.organizationId, body, user.userId);
    return {
      success: true,
      data,
      message: 'Payment recorded successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/reverse')
  async reverse(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string
  ) {
    const data = await this.paymentService.reversePayment(user.organizationId, id, user.userId);
    return {
      success: true,
      data,
      message: 'Payment reversed successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

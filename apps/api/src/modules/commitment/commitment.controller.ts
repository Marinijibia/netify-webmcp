import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { CommitmentService } from './commitment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import {
  createCommitmentSchema,
  cancelCommitmentSchema,
  commitmentQuerySchema,
  CreateCommitmentInput,
  CancelCommitmentInput,
  CommitmentQueryInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller()
@UseGuards(JwtAuthGuard, TenantGuard)
export class CommitmentController {
  constructor(private readonly commitmentService: CommitmentService) {}

  @Post('receivables/:id/commitments')
  @UsePipes(new ZodValidationPipe(createCommitmentSchema))
  async createForReceivable(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') receivableId: string,
    @Body() body: CreateCommitmentInput
  ) {
    const data = await this.commitmentService.create(user.organizationId, user.userId, {
      ...body,
      receivableId,
    });
    return {
      success: true,
      data,
      message: 'Payment commitment recorded',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('receivables/:id/commitments')
  async listForReceivable(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') receivableId: string,
    @Query(new ZodValidationPipe(commitmentQuerySchema)) query: CommitmentQueryInput
  ) {
    const data = await this.commitmentService.list(user.organizationId, {
      ...query,
      receivableId,
    });
    return {
      success: true,
      data: data.items,
      pagination: data.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('customers/:id/commitments')
  async listForCustomer(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') customerId: string,
    @Query(new ZodValidationPipe(commitmentQuerySchema)) query: CommitmentQueryInput
  ) {
    const data = await this.commitmentService.list(user.organizationId, {
      ...query,
      customerId,
    });
    return {
      success: true,
      data: data.items,
      pagination: data.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('commitments/today')
  async listToday(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query(new ZodValidationPipe(commitmentQuerySchema)) query: CommitmentQueryInput
  ) {
    const data = await this.commitmentService.list(user.organizationId, {
      ...query,
      timeframe: 'TODAY',
    });
    return {
      success: true,
      data: data.items,
      pagination: data.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('commitments/missed')
  async listMissed(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query(new ZodValidationPipe(commitmentQuerySchema)) query: CommitmentQueryInput
  ) {
    const data = await this.commitmentService.list(user.organizationId, {
      ...query,
      timeframe: 'MISSED',
    });
    return {
      success: true,
      data: data.items,
      pagination: data.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('commitments')
  async list(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query(new ZodValidationPipe(commitmentQuerySchema)) query: CommitmentQueryInput
  ) {
    const data = await this.commitmentService.list(user.organizationId, query);
    return {
      success: true,
      data: data.items,
      pagination: data.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('commitments/:id')
  async getById(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string
  ) {
    const data = await this.commitmentService.getById(user.organizationId, id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('commitments')
  @UsePipes(new ZodValidationPipe(createCommitmentSchema))
  async create(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateCommitmentInput
  ) {
    const data = await this.commitmentService.create(user.organizationId, user.userId, body);
    return {
      success: true,
      data,
      message: 'Payment commitment recorded',
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('commitments/:id/cancel')
  @UsePipes(new ZodValidationPipe(cancelCommitmentSchema))
  async cancel(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string,
    @Body() body: CancelCommitmentInput
  ) {
    const data = await this.commitmentService.cancel(user.organizationId, id, body, user.userId);
    return {
      success: true,
      data,
      message: 'Payment commitment cancelled',
      timestamp: new Date().toISOString(),
    };
  }
}

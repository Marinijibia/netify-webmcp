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
  updateCommitmentStatusSchema,
  commitmentQuerySchema,
  CreateCommitmentInput,
  UpdateCommitmentStatusInput,
  CommitmentQueryInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('commitments')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CommitmentController {
  constructor(private readonly commitmentService: CommitmentService) {}

  @Get()
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

  @Get(':id')
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

  @Post()
  @UsePipes(new ZodValidationPipe(createCommitmentSchema))
  async create(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateCommitmentInput
  ) {
    const data = await this.commitmentService.create(user.organizationId, body);
    return {
      success: true,
      data,
      message: 'Payment commitment recorded',
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(updateCommitmentStatusSchema))
  async updateStatus(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string,
    @Body() body: UpdateCommitmentStatusInput
  ) {
    const data = await this.commitmentService.updateStatus(user.organizationId, id, body);
    return {
      success: true,
      data,
      message: 'Commitment status updated',
      timestamp: new Date().toISOString(),
    };
  }
}

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
import { ReceivableService } from './receivable.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import {
  createReceivableSchema,
  updateReceivableSchema,
  receivableQuerySchema,
  CreateReceivableInput,
  UpdateReceivableInput,
  ReceivableQueryInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('receivables')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ReceivableController {
  constructor(private readonly receivableService: ReceivableService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createReceivableSchema))
  async create(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateReceivableInput
  ) {
    const data = await this.receivableService.create(user.organizationId, body);
    return {
      success: true,
      data,
      message: 'Receivable created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query(new ZodValidationPipe(receivableQuerySchema)) query: ReceivableQueryInput
  ) {
    const data = await this.receivableService.list(user.organizationId, query);
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
    const data = await this.receivableService.getById(user.organizationId, id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateReceivableSchema))
  async update(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string,
    @Body() body: UpdateReceivableInput
  ) {
    const data = await this.receivableService.update(user.organizationId, id, body);
    return {
      success: true,
      data,
      message: 'Receivable updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/cancel')
  async cancel(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string
  ) {
    const data = await this.receivableService.cancel(user.organizationId, id);
    return {
      success: true,
      data,
      message: 'Receivable cancelled successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

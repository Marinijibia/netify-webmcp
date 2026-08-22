import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { CollectionActivityService } from './collection-activity.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createCollectionActivitySchema,
  activityQuerySchema,
  CreateCollectionActivityInput,
  ActivityQueryInput,
} from '@netify/validation';

@Controller()
@UseGuards(JwtAuthGuard, TenantGuard)
export class CollectionActivityController {
  constructor(private readonly activityService: CollectionActivityService) {}

  @Post('receivables/:id/activities')
  @UsePipes(new ZodValidationPipe(createCollectionActivitySchema))
  async createForReceivable(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') receivableId: string,
    @Body() body: CreateCollectionActivityInput
  ) {
    const data = await this.activityService.create(user.organizationId, user.userId, {
      ...body,
      receivableId,
    });
    return {
      success: true,
      data,
      message: 'Collection activity recorded',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('receivables/:id/activities')
  async listForReceivable(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') receivableId: string,
    @Query(new ZodValidationPipe(activityQuerySchema)) query: ActivityQueryInput
  ) {
    const data = await this.activityService.list(user.organizationId, {
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

  @Get('customers/:id/activities')
  async listForCustomer(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') customerId: string,
    @Query(new ZodValidationPipe(activityQuerySchema)) query: ActivityQueryInput
  ) {
    const data = await this.activityService.list(user.organizationId, {
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

  @Post('collection-activities')
  @UsePipes(new ZodValidationPipe(createCollectionActivitySchema))
  async create(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateCollectionActivityInput
  ) {
    const data = await this.activityService.create(user.organizationId, user.userId, body);
    return {
      success: true,
      data,
      message: 'Collection activity recorded',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('collection-activities')
  async list(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query(new ZodValidationPipe(activityQuerySchema)) query: ActivityQueryInput
  ) {
    const data = await this.activityService.list(user.organizationId, query);
    return {
      success: true,
      data: data.items,
      pagination: data.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('collection-activities/:id')
  async getById(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string
  ) {
    const data = await this.activityService.getById(user.organizationId, id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}

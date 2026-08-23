import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BusinessEventService } from './business-event.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import {
  BusinessEventQuerySchema,
  CustomerTimelineQuerySchema,
  ReceivableTimelineQuerySchema,
  BusinessEventQueryInput,
  CustomerTimelineQueryInput,
  ReceivableTimelineQueryInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('business-events')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BusinessEventController {
  constructor(private readonly businessEventService: BusinessEventService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query(new ZodValidationPipe(BusinessEventQuerySchema)) query: BusinessEventQueryInput
  ) {
    const data = await this.businessEventService.listOrganizationEvents(
      user.organizationId,
      query
    );
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
    const data = await this.businessEventService.getEventById(
      user.organizationId,
      id
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}

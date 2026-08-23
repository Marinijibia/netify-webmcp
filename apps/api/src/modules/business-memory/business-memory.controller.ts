import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import { BusinessMemoryService } from './business-memory.service';
import {
  CustomerMemoryQueryInput,
  MemoryEvidenceQueryInput,
} from '@netify/validation';

@Controller('customers/:customerId/memories')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BusinessMemoryController {
  constructor(private readonly memoryService: BusinessMemoryService) {}

  /**
   * Retrieves active business memories for a customer with evidence count.
   */
  @Get()
  async getCustomerMemories(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Query() query: CustomerMemoryQueryInput
  ) {
    return this.memoryService.getCustomerMemories(
      user.organizationId,
      customerId,
      query
    );
  }

  /**
   * Retrieves a single business memory by ID.
   */
  @Get(':memoryId')
  async getMemoryById(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Param('memoryId', new ParseUUIDPipe()) memoryId: string
  ) {
    return this.memoryService.getMemoryById(
      user.organizationId,
      customerId,
      memoryId
    );
  }

  /**
   * Retrieves the supporting Business Events evidence for a memory.
   */
  @Get(':memoryId/evidence')
  async getMemoryEvidence(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Param('memoryId', new ParseUUIDPipe()) memoryId: string,
    @Query() query: MemoryEvidenceQueryInput
  ) {
    return this.memoryService.getMemoryEvidence(
      user.organizationId,
      customerId,
      memoryId,
      query
    );
  }
}

import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';

@Controller('memory')
@UseGuards(JwtAuthGuard, TenantGuard)
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Get('search')
  async search(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query('q') query: string,
    @Query('customerId') customerId?: string
  ) {
    const data = await this.memoryService.searchMemory(user.organizationId, query || '', customerId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('index')
  async index(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: {
      customerId?: string;
      type: string;
      source: string;
      sourceReference?: string;
      content: string;
      metadata?: Record<string, any>;
    }
  ) {
    const data = await this.memoryService.indexMemory(user.organizationId, body);
    return {
      success: true,
      data,
      message: 'Memory item indexed successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

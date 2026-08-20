import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import { DocumentType } from '@netify/types';

@Controller('documents')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DocumentController {
  constructor(private readonly docService: DocumentService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query('customerId') customerId?: string
  ) {
    const data = await this.docService.list(user.organizationId, customerId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: {
      customerId?: string;
      name: string;
      type: DocumentType;
      fileUrl: string;
      fileKey: string;
      mimeType: string;
      fileSize: number;
    }
  ) {
    const data = await this.docService.create(user.organizationId, body);
    return {
      success: true,
      data,
      message: 'Document record created',
      timestamp: new Date().toISOString(),
    };
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceQuerySchema,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceQueryInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('invoices')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query(new ZodValidationPipe(invoiceQuerySchema)) query: InvoiceQueryInput
  ) {
    const data = await this.invoiceService.list(user.organizationId, query);
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
    const data = await this.invoiceService.getById(user.organizationId, id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createInvoiceSchema))
  async create(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateInvoiceInput
  ) {
    const data = await this.invoiceService.create(user.organizationId, body);
    return {
      success: true,
      data,
      message: 'Invoice created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  @UsePipes(new ZodValidationPipe(updateInvoiceSchema))
  async update(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string,
    @Body() body: UpdateInvoiceInput
  ) {
    const data = await this.invoiceService.update(user.organizationId, id, body);
    return {
      success: true,
      data,
      message: 'Invoice updated successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

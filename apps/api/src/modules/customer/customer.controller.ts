import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { BusinessEventService } from '../business-event/business-event.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import {
  createCustomerSchema,
  updateCustomerSchema,
  createCustomerContactSchema,
  updateCustomerContactSchema,
  customerQuerySchema,
  CustomerTimelineQuerySchema,
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateCustomerContactInput,
  UpdateCustomerContactInput,
  CustomerQueryInput,
  CustomerTimelineQueryInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly businessEventService: BusinessEventService
  ) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query(new ZodValidationPipe(customerQuerySchema)) query: CustomerQueryInput
  ) {
    const data = await this.customerService.list(user.organizationId, query);
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
    const data = await this.customerService.getById(user.organizationId, id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/timeline')
  async getTimeline(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(CustomerTimelineQuerySchema)) query: CustomerTimelineQueryInput
  ) {
    const data = await this.businessEventService.getCustomerTimeline(
      user.organizationId,
      id,
      query
    );
    return {
      success: true,
      data: data.items,
      customer: data.customer,
      pagination: data.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createCustomerSchema))
  async create(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateCustomerInput
  ) {
    const data = await this.customerService.create(user.organizationId, body, user.userId);
    return {
      success: true,
      data,
      message: 'Customer created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateCustomerSchema))
  async update(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string,
    @Body() body: UpdateCustomerInput
  ) {
    const data = await this.customerService.update(user.organizationId, id, body);
    return {
      success: true,
      data,
      message: 'Customer updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/archive')
  async archive(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string
  ) {
    const data = await this.customerService.archive(user.organizationId, id);
    return {
      success: true,
      data,
      message: 'Customer archived successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/contacts')
  async getContacts(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string
  ) {
    const data = await this.customerService.getContacts(user.organizationId, id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/contacts')
  @UsePipes(new ZodValidationPipe(createCustomerContactSchema))
  async addContact(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string,
    @Body() body: CreateCustomerContactInput
  ) {
    const data = await this.customerService.addContact(user.organizationId, id, body);
    return {
      success: true,
      data,
      message: 'Contact added successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/contacts/:contactId')
  @UsePipes(new ZodValidationPipe(updateCustomerContactSchema))
  async updateContact(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string,
    @Param('contactId') contactId: string,
    @Body() body: UpdateCustomerContactInput
  ) {
    const data = await this.customerService.updateContact(
      user.organizationId,
      id,
      contactId,
      body
    );
    return {
      success: true,
      data,
      message: 'Contact updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id/contacts/:contactId')
  async deleteContact(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string,
    @Param('contactId') contactId: string
  ) {
    const result = await this.customerService.deleteContact(
      user.organizationId,
      id,
      contactId
    );
    return {
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }
}

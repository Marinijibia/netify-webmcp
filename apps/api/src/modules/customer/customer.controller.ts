import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

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

  @Post()
  @UsePipes(new ZodValidationPipe(createCustomerSchema))
  async create(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateCustomerInput
  ) {
    const data = await this.customerService.create(user.organizationId, body);
    return {
      success: true,
      data,
      message: 'Customer created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
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

  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string
  ) {
    await this.customerService.delete(user.organizationId, id);
    return {
      success: true,
      message: 'Customer deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

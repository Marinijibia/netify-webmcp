import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateMemberRoleSchema,
  updateMemberStatusSchema,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  UpdateMemberRoleInput,
  UpdateMemberStatusInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UserRole, MembershipStatus } from '@netify/database';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createOrganizationSchema))
  async create(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateOrganizationInput
  ) {
    const data = await this.orgService.createOrganization(user.userId, body);
    return {
      success: true,
      data,
      message: 'Organization created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  async getMyOrganizations(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.orgService.getUserOrganizations(user.userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('current')
  @UseGuards(TenantGuard)
  async getCurrent(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.orgService.getOrganizationById(user.userId, user.organizationId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  async getById(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string
  ) {
    const data = await this.orgService.getOrganizationById(user.userId, id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateOrganizationSchema))
  async update(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string,
    @Body() body: UpdateOrganizationInput
  ) {
    const data = await this.orgService.updateOrganization(user.userId, id, body);
    return {
      success: true,
      data,
      message: 'Organization updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/members')
  async getMembers(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string
  ) {
    const data = await this.orgService.getMembers(user.userId, id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/members/:memberId/role')
  @UsePipes(new ZodValidationPipe(updateMemberRoleSchema))
  async updateMemberRole(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberRoleInput
  ) {
    const data = await this.orgService.updateMemberRole(
      user.userId,
      id,
      memberId,
      body.role as UserRole
    );
    return {
      success: true,
      data,
      message: 'Member role updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/members/:memberId/status')
  @UsePipes(new ZodValidationPipe(updateMemberStatusSchema))
  async updateMemberStatus(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberStatusInput
  ) {
    const data = await this.orgService.updateMemberStatus(
      user.userId,
      id,
      memberId,
      body.status as MembershipStatus
    );
    return {
      success: true,
      data,
      message: 'Member status updated successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

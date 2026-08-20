import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.organizationId) {
      throw new ForbiddenException('Tenant context missing. Access denied.');
    }

    // Optional override check: If organizationId query param/header is supplied, ensure it matches user organizationId
    const requestedOrgId = request.headers['x-organization-id'] || request.params.organizationId;
    if (requestedOrgId && requestedOrgId !== user.organizationId) {
      throw new ForbiddenException('Cross-tenant access forbidden.');
    }

    return true;
  }
}

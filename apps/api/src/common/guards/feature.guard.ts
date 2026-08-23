import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NetifyFeature } from '@netify/validation';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { EntitlementService } from '../../modules/subscription/entitlement.service';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementService: EntitlementService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<NetifyFeature>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.organizationId) {
      throw new ForbiddenException('Tenant context missing. Feature access denied.');
    }

    const isEntitled = await this.entitlementService.canAccessFeature(
      user.organizationId,
      requiredFeature
    );

    if (!isEntitled) {
      throw new ForbiddenException({
        code: 'FEATURE_NOT_ENTITLED',
        feature: requiredFeature,
        message: `Feature '${requiredFeature}' is not available on your current plan. Upgrade to Netify Pro or Business to unlock.`,
        upgradeRequired: true,
      });
    }

    return true;
  }
}

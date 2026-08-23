import { SetMetadata } from '@nestjs/common';
import { NetifyFeature } from '@netify/validation';

export const REQUIRE_FEATURE_KEY = 'require_feature';
export const RequireFeature = (feature: NetifyFeature) =>
  SetMetadata(REQUIRE_FEATURE_KEY, feature);

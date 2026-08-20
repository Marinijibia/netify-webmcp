import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUserContext {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUserContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUserContext;
    return data ? user?.[data] : user;
  }
);

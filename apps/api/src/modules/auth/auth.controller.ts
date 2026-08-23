import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  Ip,
  Headers,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
  switchOrganizationSchema,
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  RefreshTokenInput,
  SwitchOrganizationInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(
    @Body() body: RegisterInput,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ) {
    const data = await this.authService.register(body, { userAgent, ipAddress });
    return {
      success: true,
      data,
      message: data.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(verifyEmailSchema))
  async verifyEmail(
    @Body() body: VerifyEmailInput,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ) {
    const data = await this.authService.verifyEmail(body, { userAgent, ipAddress });
    return {
      success: true,
      data,
      message: 'Email successfully verified',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 120000 } })
  @UsePipes(new ZodValidationPipe(resendVerificationSchema))
  async resendVerification(@Body() body: ResendVerificationInput) {
    const data = await this.authService.resendVerification(body);
    return {
      success: true,
      data,
      message: data.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() body: LoginInput,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ) {
    const data = await this.authService.login(body, { userAgent, ipAddress });
    return {
      success: true,
      data,
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  async refresh(
    @Body() body: RefreshTokenInput,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ) {
    const data = await this.authService.refresh(body, { userAgent, ipAddress });
    return {
      success: true,
      data,
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('logout')
  @SkipThrottle()
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  async logout(
    @Body() body: RefreshTokenInput,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ) {
    await this.authService.logout(body.refreshToken, { userAgent, ipAddress });
    return {
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('logout-all')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @CurrentUser() user: AuthenticatedUserContext,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ) {
    const data = await this.authService.logoutAll(user.userId, { userAgent, ipAddress });
    return {
      success: true,
      message: data.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async listSessions(
    @CurrentUser() user: AuthenticatedUserContext,
    @Headers('x-refresh-token') currentRefreshToken?: string
  ) {
    const data = await this.authService.listSessions(user.userId, currentRefreshToken);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param('sessionId') sessionId: string,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ) {
    const data = await this.authService.revokeSession(user.userId, sessionId, {
      userAgent,
      ipAddress,
    });
    return {
      success: true,
      message: data.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('change-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(changePasswordSchema))
  async changePassword(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: ChangePasswordInput,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ) {
    const data = await this.authService.changePassword(user.userId, body, {
      userAgent,
      ipAddress,
    });
    return {
      success: true,
      message: data.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 120000 } })
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(
    @Body() body: ForgotPasswordInput,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ) {
    const data = await this.authService.forgotPassword(body, { userAgent, ipAddress });
    return {
      success: true,
      data,
      message: data.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(
    @Body() body: ResetPasswordInput,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ) {
    const data = await this.authService.resetPassword(body, { userAgent, ipAddress });
    return {
      success: true,
      data,
      message: data.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.authService.getMe(user.userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('switch-organization')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(switchOrganizationSchema))
  async switchOrganization(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: SwitchOrganizationInput,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string
  ) {
    const data = await this.authService.switchOrganization(
      user.userId,
      body.organizationId,
      { userAgent, ipAddress }
    );
    return {
      success: true,
      data,
      message: 'Switched organization successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

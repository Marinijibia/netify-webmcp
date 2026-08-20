import { Controller, Post, Get, Body, UseGuards, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
} from '@netify/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUserContext } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() body: RegisterInput) {
    const data = await this.authService.register(body);
    return {
      success: true,
      data,
      message: 'Organization and user successfully registered',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginInput) {
    const data = await this.authService.login(body);
    return {
      success: true,
      data,
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('refresh')
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  async refresh(@Body() body: RefreshTokenInput) {
    const data = await this.authService.refresh(body);
    return {
      success: true,
      data,
      message: 'Token refreshed successfully',
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
}

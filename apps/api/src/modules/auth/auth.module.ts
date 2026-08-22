import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OnboardingController } from './onboarding.controller';
import { EmailModule } from '../email/email.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Global()
@Module({
  imports: [
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev_jwt_secret_netify_change_in_production',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, OnboardingController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}

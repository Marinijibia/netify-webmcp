import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  prisma,
  UserRole,
  UserStatus,
  OrganizationStatus,
  MembershipStatus,
  SecurityEventType,
} from '@netify/database';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  VerifyEmailInput,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from '@netify/validation';
import { AuthResponse, UserProfile, SessionDto, SecurityEventDto } from '@netify/types';
import { EmailService } from '../email/email.service';

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
  appVersion?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Cryptographically secure 6-digit random number generator (CSPRNG)
   */
  private generate6DigitCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Constant-time comparison to prevent side-channel timing attacks
   */
  private verifyCodeConstantTime(a: string, b: string): boolean {
    if (!a || !b || a.length !== b.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8'));
    } catch {
      return false;
    }
  }

  /**
   * Records a structured security audit event
   */
  async recordSecurityEvent(
    eventType: SecurityEventType,
    userId?: string | null,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          userId: userId || null,
          eventType,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          metadata: metadata || {},
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to record security event ${eventType}: ${err.message}`);
    }
  }

  async register(
    input: RegisterInput,
    metadata: RequestMetadata = {}
  ): Promise<{
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      status: string;
      isEmailVerified: boolean;
      onboardingCompleted: boolean;
    };
    requiresEmailVerification: boolean;
    message: string;
  }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new BadRequestException('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const verificationCode = this.generate6DigitCode();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          phone: input.phone?.trim() || null,
          status: UserStatus.ACTIVE,
          isEmailVerified: false,
          onboardingCompleted: false,
          onboardingStep: 'ORGANIZATION',
          onboardingData: {},
        },
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          code: verificationCode,
          expiresAt,
        },
      });

      // If organization name was provided upfront, create it
      if (input.organizationName) {
        const slug =
          input.organizationName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '') +
          '-' +
          Math.floor(1000 + Math.random() * 9000);

        const org = await tx.organization.create({
          data: {
            name: input.organizationName.trim(),
            slug,
            businessType: 'OTHER',
            currency: (input.currency || 'NGN').toUpperCase(),
            country: (input.country || 'NG').toUpperCase(),
            timezone: 'Africa/Lagos',
            status: OrganizationStatus.ACTIVE,
          },
        });

        await tx.membership.create({
          data: {
            organizationId: org.id,
            userId: user.id,
            role: UserRole.OWNER,
            status: MembershipStatus.ACTIVE,
          },
        });

        await tx.subscription.create({
          data: {
            organizationId: org.id,
            plan: 'FREE',
            status: 'ACTIVE',
          },
        });
      }

      return user;
    });

    // Record security audit event
    await this.recordSecurityEvent(
      SecurityEventType.ACCOUNT_REGISTERED,
      result.id,
      metadata.ipAddress,
      metadata.userAgent,
      { email: normalizedEmail }
    );

    // Send verification email via Resend
    await this.emailService.sendVerificationEmail(
      result.email,
      result.firstName,
      verificationCode,
      verificationToken
    );

    return {
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        status: result.status,
        isEmailVerified: false,
        onboardingCompleted: false,
      },
      requiresEmailVerification: true,
      message: 'Verification code sent to your email. Please verify your account.',
    };
  }

  async verifyEmail(
    input: VerifyEmailInput,
    metadata: RequestMetadata = {}
  ): Promise<AuthResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid email or verification code');
    }

    if (user.isEmailVerified) {
      return this.generateAuthResponse(user, metadata);
    }

    const tokenRecord = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const isValidCode = this.verifyCodeConstantTime(tokenRecord.code, input.code.trim());
    if (!isValidCode) {
      const userSecurity = ((user.onboardingData as Record<string, any>)?._security) || {};
      const failedOtpAttempts = (userSecurity.failedOtpAttempts || 0) + 1;

      if (failedOtpAttempts >= 5) {
        // Invalidate token immediately to prevent further brute-forcing
        await prisma.emailVerificationToken.update({
          where: { id: tokenRecord.id },
          data: { usedAt: new Date() },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            onboardingData: {
              ...((user.onboardingData as Record<string, any>) || {}),
              _security: {
                ...userSecurity,
                failedOtpAttempts: 0,
              },
            },
          },
        });

        await this.recordSecurityEvent(
          SecurityEventType.SUSPICIOUS_LOGIN_DETECTED,
          user.id,
          metadata.ipAddress,
          metadata.userAgent,
          { reason: 'OTP_BRUTE_FORCE_EXCEEDED', action: 'EMAIL_VERIFICATION_TOKEN_INVALIDATED' }
        );

        throw new BadRequestException(
          'Too many invalid verification attempts. For your security, this code has been expired. Please request a new code.'
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingData: {
            ...((user.onboardingData as Record<string, any>) || {}),
            _security: {
              ...userSecurity,
              failedOtpAttempts,
            },
          },
        },
      });

      await this.recordSecurityEvent(
        SecurityEventType.SUSPICIOUS_LOGIN_DETECTED,
        user.id,
        metadata.ipAddress,
        metadata.userAgent,
        { reason: 'INVALID_EMAIL_VERIFICATION_CODE_ATTEMPT', attempts: failedOtpAttempts }
      );

      const remaining = 5 - failedOtpAttempts;
      throw new BadRequestException(
        `Invalid verification code. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`
      );
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: now },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: now,
        },
      });
    });

    await this.recordSecurityEvent(
      SecurityEventType.EMAIL_VERIFIED,
      user.id,
      metadata.ipAddress,
      metadata.userAgent
    );

    const updatedUser = {
      ...user,
      isEmailVerified: true,
      emailVerifiedAt: now,
    };

    return this.generateAuthResponse(updatedUser, metadata);
  }

  async resendVerification(input: ResendVerificationInput): Promise<{ message: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // To prevent email enumeration, return uniform message
    if (!user || user.isEmailVerified) {
      return {
        message: 'If an unverified account exists for this email, a new verification code has been sent.',
      };
    }

    // Invalidate prior codes
    await prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const verificationCode = this.generate6DigitCode();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        code: verificationCode,
        expiresAt,
      },
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      verificationCode,
      verificationToken
    );

    return {
      message: 'If an unverified account exists for this email, a new verification code has been sent.',
    };
  }

  async login(
    input: LoginInput,
    metadata: RequestMetadata = {}
  ): Promise<AuthResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      await this.recordSecurityEvent(
        SecurityEventType.LOGIN_FAILED,
        null,
        metadata.ipAddress,
        metadata.userAgent,
        { email: normalizedEmail, reason: 'USER_NOT_FOUND' }
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check account lockout protection
    const onboardingData = (user.onboardingData as Record<string, any>) || {};
    const security = onboardingData._security || { failedAttempts: 0, lockoutUntil: null };

    if (security.lockoutUntil && new Date(security.lockoutUntil) > new Date()) {
      const minutesLeft = Math.ceil((new Date(security.lockoutUntil).getTime() - Date.now()) / 60000);
      throw new ForbiddenException(
        `Account temporarily locked due to consecutive failed attempts. Please try again in ${minutesLeft} minute(s).`
      );
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      const newFailedAttempts = (security.failedAttempts || 0) + 1;
      let lockoutUntil: string | null = null;

      if (newFailedAttempts >= 5) {
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes lockout
        await this.recordSecurityEvent(
          SecurityEventType.SUSPICIOUS_LOGIN_DETECTED,
          user.id,
          metadata.ipAddress,
          metadata.userAgent,
          { reason: 'BRUTE_FORCE_LOCKOUT_TRIGGERED', attempts: newFailedAttempts }
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingData: {
            ...onboardingData,
            _security: {
              failedAttempts: newFailedAttempts,
              lockoutUntil,
              lastFailedAt: new Date().toISOString(),
            },
          },
        },
      });

      await this.recordSecurityEvent(
        SecurityEventType.LOGIN_FAILED,
        user.id,
        metadata.ipAddress,
        metadata.userAgent,
        { reason: 'INVALID_PASSWORD', attempts: newFailedAttempts }
      );

      if (lockoutUntil) {
        throw new ForbiddenException(
          'Account temporarily locked due to consecutive failed attempts. Please try again in 15 minutes.'
        );
      }

      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account has been suspended. Please contact support.');
    }

    if (user.status === UserStatus.DEACTIVATED || !user.isActive) {
      throw new ForbiddenException('Your account has been deactivated.');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'EMAIL_NOT_VERIFIED: Please verify your email before logging in.'
      );
    }

    // Merge request metadata with device info in login input
    const sessionMetadata: RequestMetadata = {
      ...metadata,
      deviceId: input.deviceId || metadata.deviceId,
      deviceName: input.deviceName || metadata.deviceName,
      platform: input.platform || metadata.platform,
      appVersion: input.appVersion || metadata.appVersion,
    };

    // Update lastLoginAt and reset failed login attempts counter
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        onboardingData: {
          ...onboardingData,
          _security: {
            failedAttempts: 0,
            lockoutUntil: null,
            lastLoginAt: new Date().toISOString(),
          },
        },
      },
    });

    // Record trusted device if deviceId provided
    if (sessionMetadata.deviceId) {
      await prisma.trustedDevice.upsert({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId: sessionMetadata.deviceId,
          },
        },
        update: {
          deviceName: sessionMetadata.deviceName || null,
          platform: sessionMetadata.platform || null,
          lastSeenAt: new Date(),
          revokedAt: null,
        },
        create: {
          userId: user.id,
          deviceId: sessionMetadata.deviceId,
          deviceName: sessionMetadata.deviceName || null,
          platform: sessionMetadata.platform || null,
        },
      });
    }

    await this.recordSecurityEvent(
      SecurityEventType.LOGIN_SUCCESS,
      user.id,
      sessionMetadata.ipAddress,
      sessionMetadata.userAgent,
      {
        deviceId: sessionMetadata.deviceId,
        platform: sessionMetadata.platform,
      }
    );

    return this.generateAuthResponse(user, sessionMetadata);
  }

  async refresh(
    input: RefreshTokenInput,
    metadata: RequestMetadata = {}
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const refreshSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
      'dev_refresh_token_secret_netify';

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(input.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(input.refreshToken);

    const session = await prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      // Possible token reuse attack detected: log suspicious event
      if (session && session.isRevoked) {
        await this.recordSecurityEvent(
          SecurityEventType.SUSPICIOUS_LOGIN_DETECTED,
          session.userId,
          metadata.ipAddress,
          metadata.userAgent,
          { reason: 'REFRESH_TOKEN_REUSE_ATTEMPT', sessionId: session.id }
        );
      }
      throw new UnauthorizedException('Session expired or revoked. Please sign in again.');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE || !user.isActive) {
      throw new UnauthorizedException('User account no longer active');
    }

    // Token Rotation: Revoke old session and issue a new one
    const membership = user.memberships[0];
    const newTokens = await this.generateAndStoreTokens(
      {
        userId: user.id,
        email: user.email,
        organizationId: membership?.organizationId || '',
        role: membership?.role || UserRole.STAFF,
      },
      {
        ...metadata,
        deviceId: session.deviceId || undefined,
        deviceName: session.deviceName || undefined,
        platform: session.platform || undefined,
        appVersion: session.appVersion || undefined,
      }
    );

    const now = new Date();
    await prisma.session.update({
      where: { id: session.id },
      data: {
        isRevoked: true,
        revokedAt: now,
        lastUsedAt: now,
      },
    });

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresIn: newTokens.expiresIn,
    };
  }

  async logout(refreshToken: string, metadata: RequestMetadata = {}): Promise<void> {
    try {
      const tokenHash = this.hashToken(refreshToken);
      const session = await prisma.session.findUnique({
        where: { refreshTokenHash: tokenHash },
      });

      if (session) {
        await prisma.session.update({
          where: { id: session.id },
          data: { isRevoked: true, revokedAt: new Date() },
        });

        await this.recordSecurityEvent(
          SecurityEventType.LOGOUT,
          session.userId,
          metadata.ipAddress,
          metadata.userAgent,
          { sessionId: session.id }
        );
      }
    } catch (err: any) {
      this.logger.warn(`Logout session revocation error: ${err.message}`);
    }
  }

  async logoutAll(userId: string, metadata: RequestMetadata = {}): Promise<{ message: string }> {
    const now = new Date();
    await prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: now },
    });

    await this.recordSecurityEvent(
      SecurityEventType.SESSION_REVOKED,
      userId,
      metadata.ipAddress,
      metadata.userAgent,
      { action: 'LOGOUT_ALL_DEVICES' }
    );

    return { message: 'All active sessions have been revoked.' };
  }

  async listSessions(userId: string, currentRefreshToken?: string): Promise<SessionDto[]> {
    const currentHash = currentRefreshToken ? this.hashToken(currentRefreshToken) : null;

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: 'desc' },
      take: 20,
    });

    return sessions.map((s) => ({
      id: s.id,
      deviceId: s.deviceId,
      deviceName: s.deviceName,
      platform: s.platform,
      appVersion: s.appVersion,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      lastUsedAt: s.lastUsedAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      isCurrent: currentHash ? s.refreshTokenHash === currentHash : false,
    }));
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    metadata: RequestMetadata = {}
  ): Promise<{ message: string }> {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found or already revoked');
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    await this.recordSecurityEvent(
      SecurityEventType.SESSION_REVOKED,
      userId,
      metadata.ipAddress,
      metadata.userAgent,
      { revokedSessionId: sessionId }
    );

    return { message: 'Session revoked successfully.' };
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
    metadata: RequestMetadata = {}
  ): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password does not match.');
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, 12);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      if (input.revokeOtherSessions !== false) {
        await tx.session.updateMany({
          where: { userId, isRevoked: false },
          data: { isRevoked: true, revokedAt: now },
        });
      }
    });

    await this.recordSecurityEvent(
      SecurityEventType.PASSWORD_CHANGED,
      userId,
      metadata.ipAddress,
      metadata.userAgent
    );

    // Send security notification email
    await this.emailService.sendPasswordChangedNotification(
      user.email,
      user.firstName,
      metadata.ipAddress
    );

    return { message: 'Password changed successfully.' };
  }

  async forgotPassword(
    input: ForgotPasswordInput,
    metadata: RequestMetadata = {}
  ): Promise<{ message: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && user.isActive && user.status === UserStatus.ACTIVE) {
      // Invalidate existing reset tokens
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const resetCode = this.generate6DigitCode();
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          code: resetCode,
          expiresAt,
        },
      });

      await this.recordSecurityEvent(
        SecurityEventType.PASSWORD_RESET_REQUESTED,
        user.id,
        metadata.ipAddress,
        metadata.userAgent
      );

      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.firstName,
        resetCode,
        resetToken
      );
    }

    return {
      message: 'If an account exists with this email address, password reset instructions have been sent.',
    };
  }

  async resetPassword(
    input: ResetPasswordInput,
    metadata: RequestMetadata = {}
  ): Promise<{ message: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException('Invalid email or reset code');
    }

    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired password reset code');
    }

    const isValidCode = this.verifyCodeConstantTime(resetRecord.code, input.code.trim());
    if (!isValidCode) {
      const userSecurity = ((user.onboardingData as Record<string, any>)?._security) || {};
      const failedResetAttempts = (userSecurity.failedResetAttempts || 0) + 1;

      if (failedResetAttempts >= 5) {
        // Invalidate reset token immediately
        await prisma.passwordResetToken.update({
          where: { id: resetRecord.id },
          data: { usedAt: new Date() },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            onboardingData: {
              ...((user.onboardingData as Record<string, any>) || {}),
              _security: {
                ...userSecurity,
                failedResetAttempts: 0,
              },
            },
          },
        });

        await this.recordSecurityEvent(
          SecurityEventType.SUSPICIOUS_LOGIN_DETECTED,
          user.id,
          metadata.ipAddress,
          metadata.userAgent,
          { reason: 'PASSWORD_RESET_BRUTE_FORCE_EXCEEDED', action: 'RESET_TOKEN_INVALIDATED' }
        );

        throw new BadRequestException(
          'Too many invalid attempts. For your security, this password reset code has been expired. Please request a new reset code.'
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingData: {
            ...((user.onboardingData as Record<string, any>) || {}),
            _security: {
              ...userSecurity,
              failedResetAttempts,
            },
          },
        },
      });

      await this.recordSecurityEvent(
        SecurityEventType.SUSPICIOUS_LOGIN_DETECTED,
        user.id,
        metadata.ipAddress,
        metadata.userAgent,
        { reason: 'INVALID_PASSWORD_RESET_CODE_ATTEMPT', attempts: failedResetAttempts }
      );

      const remaining = 5 - failedResetAttempts;
      throw new BadRequestException(
        `Invalid password reset code. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`
      );
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, 12);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: now },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      });

      // Revoke all existing sessions for security
      await tx.session.updateMany({
        where: { userId: user.id, isRevoked: false },
        data: { isRevoked: true, revokedAt: now },
      });
    });

    await this.recordSecurityEvent(
      SecurityEventType.PASSWORD_RESET_COMPLETED,
      user.id,
      metadata.ipAddress,
      metadata.userAgent
    );

    // Send security notification
    await this.emailService.sendPasswordChangedNotification(
      user.email,
      user.firstName,
      metadata.ipAddress
    );

    return {
      message: 'Your password has been successfully reset. Please log in with your new credentials.',
    };
  }

  async getMe(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        status: true,
        isEmailVerified: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        onboardingCompleted: true,
        onboardingStep: true,
        onboardingData: true,
        memberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                currency: true,
                country: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      ...user,
      emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    } as unknown as UserProfile;
  }

  private async generateAuthResponse(
    user: any,
    metadata: RequestMetadata = {}
  ): Promise<AuthResponse> {
    const membership = user.memberships?.[0] || null;

    const tokens = await this.generateAndStoreTokens(
      {
        userId: user.id,
        email: user.email,
        organizationId: membership?.organizationId || '',
        role: membership?.role || UserRole.STAFF,
      },
      metadata
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status || 'ACTIVE',
        isEmailVerified: user.isEmailVerified,
        onboardingCompleted: user.onboardingCompleted,
        onboardingStep: user.onboardingStep,
      },
      organization: membership
        ? {
            id: membership.organization.id,
            name: membership.organization.name,
            slug: membership.organization.slug,
            currency: membership.organization.currency,
          }
        : null,
      role: membership?.role || null,
      tokens,
    };
  }

  private async generateAndStoreTokens(
    payload: {
      userId: string;
      email: string;
      organizationId: string;
      role: string;
    },
    metadata: RequestMetadata = {}
  ) {
    const jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'dev_jwt_secret_netify_change_in_production';
    const refreshSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
      'dev_refresh_token_secret_netify';

    const tokenPayload = {
      sub: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(tokenPayload, {
        secret: jwtSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(tokenPayload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        userId: payload.userId,
        refreshTokenHash: tokenHash,
        expiresAt,
        deviceId: metadata.deviceId || null,
        deviceName: metadata.deviceName || null,
        platform: metadata.platform || null,
        appVersion: metadata.appVersion || null,
        userAgent: metadata.userAgent || null,
        ipAddress: metadata.ipAddress || null,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }
}

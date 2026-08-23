import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';
import { prisma, UserRole, UserStatus, SecurityEventType } from '@netify/database';
import * as bcrypt from 'bcrypt';

jest.mock('@netify/database', () => {
  const mPrisma: any = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    membership: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    trustedDevice: {
      upsert: jest.fn(),
    },
    securityEvent: {
      create: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mPrisma)),
  };
  return {
    prisma: mPrisma,
    UserRole: {
      OWNER: 'OWNER',
      ADMIN: 'ADMIN',
      MANAGER: 'MANAGER',
      STAFF: 'STAFF',
    },
    UserStatus: {
      ACTIVE: 'ACTIVE',
      SUSPENDED: 'SUSPENDED',
      DEACTIVATED: 'DEACTIVATED',
    },
    SecurityEventType: {
      ACCOUNT_REGISTERED: 'ACCOUNT_REGISTERED',
      EMAIL_VERIFIED: 'EMAIL_VERIFIED',
      LOGIN_SUCCESS: 'LOGIN_SUCCESS',
      LOGIN_FAILED: 'LOGIN_FAILED',
      LOGOUT: 'LOGOUT',
      SESSION_REVOKED: 'SESSION_REVOKED',
      PASSWORD_CHANGED: 'PASSWORD_CHANGED',
      PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
      PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
      BIOMETRIC_ENABLED: 'BIOMETRIC_ENABLED',
      BIOMETRIC_DISABLED: 'BIOMETRIC_DISABLED',
      DEVICE_ADDED: 'DEVICE_ADDED',
      DEVICE_REVOKED: 'DEVICE_REVOKED',
      ORGANIZATION_CREATED: 'ORGANIZATION_CREATED',
      SUSPICIOUS_LOGIN_DETECTED: 'SUSPICIOUS_LOGIN_DETECTED',
    },
  };
});

describe('AuthService (Security & Penetration Testing Suite)', () => {
  jest.setTimeout(30000);
  let service: AuthService;
  let jwtService: JwtService;
  let emailService: EmailService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock_jwt_token'),
            verifyAsync: jest.fn().mockResolvedValue({
              sub: 'user-123',
              email: 'test@example.com',
              organizationId: 'org-123',
              role: 'OWNER',
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test_jwt_secret';
              if (key === 'REFRESH_TOKEN_SECRET') return 'test_refresh_secret';
              return null;
            }),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
            sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
            sendPasswordChangedNotification: jest.fn().mockResolvedValue({ success: true }),
            sendNewSignInNotification: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
  });

  describe('register', () => {
    it('should successfully register a new user and dispatch verification email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'ceo@apexhaulage.ng',
        firstName: 'Adewale',
        lastName: 'Okonkwo',
        status: 'ACTIVE',
        isEmailVerified: false,
        onboardingCompleted: false,
      });

      const result = await service.register({
        email: 'CEO@ApexHaulage.ng',
        password: 'Password123',
        firstName: 'Adewale',
        lastName: 'Okonkwo',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ceo@apexhaulage.ng' },
      });
      expect(result.requiresEmailVerification).toBe(true);
      expect(result.user.email).toBe('ceo@apexhaulage.ng');
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should reject registration if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid 6-digit code', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: false,
        onboardingCompleted: false,
        onboardingStep: 'ORGANIZATION',
        memberships: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.emailVerificationToken.findFirst as jest.Mock).mockResolvedValue({
        id: 'token-id-123',
        code: '123456',
        expiresAt: new Date(Date.now() + 10000),
      });

      const result = await service.verifyEmail({
        email: 'test@example.com',
        code: '123456',
      });

      expect(result.user.isEmailVerified).toBe(true);
      expect(result.tokens).toBeDefined();
    });

    it('should reject invalid or expired verification code', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        isEmailVerified: false,
      });
      (prisma.emailVerificationToken.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.verifyEmail({
          email: 'test@example.com',
          code: '000000',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Brute-Force & Attack Simulation', () => {
    it('should trigger temporary account lockout on 5 consecutive failed login attempts', async () => {
      const hashed = await bcrypt.hash('RealPassword123', 12);
      const mockUser = {
        id: 'user-123',
        email: 'target@example.com',
        passwordHash: hashed,
        status: 'ACTIVE',
        isActive: true,
        isEmailVerified: true,
        onboardingData: {
          _security: { failedAttempts: 4, lockoutUntil: null },
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      // 5th failed attempt should lock account
      await expect(
        service.login({
          email: 'target@example.com',
          password: 'AttackerGuess123',
        })
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.securityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'SUSPICIOUS_LOGIN_DETECTED',
            metadata: expect.objectContaining({ reason: 'BRUTE_FORCE_LOCKOUT_TRIGGERED' }),
          }),
        })
      );
    });

    it('should prevent login attempts when account is in active lockout period', async () => {
      const hashed = await bcrypt.hash('RealPassword123', 12);
      const lockoutUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins remaining
      const mockUser = {
        id: 'user-123',
        email: 'target@example.com',
        passwordHash: hashed,
        status: 'ACTIVE',
        isActive: true,
        isEmailVerified: true,
        onboardingData: {
          _security: { failedAttempts: 5, lockoutUntil },
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.login({
          email: 'target@example.com',
          password: 'RealPassword123', // even with correct password, blocked until lockout expires
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reset failed login attempts counter after a successful login', async () => {
      const hashed = await bcrypt.hash('RealPassword123', 12);
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: hashed,
        firstName: 'John',
        lastName: 'Doe',
        status: 'ACTIVE',
        isActive: true,
        isEmailVerified: true,
        onboardingCompleted: true,
        onboardingStep: 'COMPLETED',
        onboardingData: {
          _security: { failedAttempts: 3, lockoutUntil: null },
        },
        memberships: [
          {
            organizationId: 'org-1',
            role: 'OWNER',
            organization: { id: 'org-1', name: 'Apex Ltd', slug: 'apex-ltd', currency: 'NGN' },
          },
        ],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      await service.login({
        email: 'test@example.com',
        password: 'RealPassword123',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          onboardingData: expect.objectContaining({
            _security: expect.objectContaining({ failedAttempts: 0, lockoutUntil: null }),
          }),
        }),
      });
    });

    it('should detect and reject revoked refresh token reuse attempts', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'user-123' });
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 'sess-123',
        userId: 'user-123',
        isRevoked: true, // Already revoked
        expiresAt: new Date(Date.now() + 100000),
      });

      await expect(
        service.refresh({ refreshToken: 'stolen_revoked_token' })
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.securityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'SUSPICIOUS_LOGIN_DETECTED',
            metadata: expect.objectContaining({ reason: 'REFRESH_TOKEN_REUSE_ATTEMPT' }),
          }),
        })
      );
    });
  });

  describe('changePassword', () => {
    it('should successfully change password, revoke other sessions, and send notification', async () => {
      const oldHash = await bcrypt.hash('OldPassword1', 12);
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        passwordHash: oldHash,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.changePassword('user-123', {
        currentPassword: 'OldPassword1',
        newPassword: 'NewPassword99',
        revokeOtherSessions: true,
      });

      expect(result.message).toContain('Password changed successfully');
      expect(emailService.sendPasswordChangedNotification).toHaveBeenCalled();
    });
  });

  describe('session management', () => {
    it('should list active sessions', async () => {
      (prisma.session.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'sess-1',
          deviceId: 'dev-1',
          deviceName: 'Pixel 8',
          platform: 'Android',
          ipAddress: '127.0.0.1',
          lastUsedAt: new Date(),
          createdAt: new Date(),
          refreshTokenHash: 'hash-1',
        },
      ]);

      const sessions = await service.listSessions('user-123');
      expect(sessions.length).toBe(1);
      expect(sessions[0].deviceName).toBe('Pixel 8');
    });

    it('should revoke all active sessions on logoutAll', async () => {
      const result = await service.logoutAll('user-123');
      expect(result.message).toContain('All active sessions have been revoked');
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRevoked: false },
        data: expect.objectContaining({ isRevoked: true }),
      });
    });
  });
});

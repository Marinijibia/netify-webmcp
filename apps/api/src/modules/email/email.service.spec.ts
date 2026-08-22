import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

// Mock Resend SDK
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({
          data: { id: 'mock-resend-msg-123' },
          error: null,
        }),
      },
    })),
  };
});

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'RESEND_API_KEY') return 're_test_key_123456';
              if (key === 'RESEND_FROM_EMAIL') return 'notifications@netify.africa';
              if (key === 'RESEND_FROM_NAME') return 'Netify';
              if (key === 'AUTH_VERIFICATION_URL')
                return 'netify://verify-email?token={token}&email={email}';
              if (key === 'AUTH_RESET_URL')
                return 'netify://reset-password?token={token}&email={email}';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should dispatch verification email with 6-digit code and deep link', async () => {
      const result = await service.sendVerificationEmail(
        'ceo@apexhaulage.ng',
        'Adewale',
        '839201',
        'secure-random-token-xyz'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-resend-msg-123');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should dispatch password reset email with 6-digit code', async () => {
      const result = await service.sendPasswordResetEmail(
        'ceo@apexhaulage.ng',
        'Adewale',
        '654321',
        'secure-reset-token-abc'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-resend-msg-123');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should dispatch welcome email with organization name', async () => {
      const result = await service.sendWelcomeEmail(
        'ceo@apexhaulage.ng',
        'Adewale',
        'Apex Haulage Logistics'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-resend-msg-123');
    });
  });

  describe('Development Mode Fallback', () => {
    let devService: EmailService;

    beforeEach(async () => {
      const devModule: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'RESEND_API_KEY') return null; // No key
                return null;
              }),
            },
          },
        ],
      }).compile();

      devService = devModule.get<EmailService>(EmailService);
    });

    it('should fall back to local dev logging without crashing when API key is missing', async () => {
      const result = await devService.sendVerificationEmail(
        'developer@test.com',
        'Dev User',
        '112233'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toContain('dev-mock-');
    });
  });
});

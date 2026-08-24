import { Test, TestingModule } from '@nestjs/testing';
import { NotificationPolicyService } from './notification-policy.service';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './push-notification.service';
import { EmailService } from '../email/email.service';
import { BusinessSignal } from '../signal/signal-detection.service';
import { NotificationChannel, NotificationPriority, prisma } from '@netify/database';

jest.mock('@netify/database', () => {
  return {
    prisma: {
      user: {
        findUnique: jest.fn(),
      },
      organization: {
        findUnique: jest.fn(),
      },
    },
    NotificationChannel: {
      IN_APP: 'IN_APP',
      PUSH: 'PUSH',
      EMAIL: 'EMAIL',
    },
    NotificationPriority: {
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW',
    },
  };
});

describe('Domain 10: NotificationPolicyService', () => {
  let policyService: NotificationPolicyService;
  let notifService: NotificationService;
  let pushService: PushNotificationService;
  let emailService: EmailService;

  const mockNotifService = {
    createDeduplicated: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  const mockPushService = {
    sendPushNotification: jest.fn().mockResolvedValue({ sentCount: 1 }),
  };

  const mockEmailService = {
    sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-resend-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPolicyService,
        {
          provide: NotificationService,
          useValue: mockNotifService,
        },
        {
          provide: PushNotificationService,
          useValue: mockPushService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    policyService = module.get<NotificationPolicyService>(NotificationPolicyService);
    notifService = module.get<NotificationService>(NotificationService);
    pushService = module.get<PushNotificationService>(PushNotificationService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('routes HIGH priority signal to IN_APP, PUSH, and EMAIL (Resend)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'founder@business.com',
      fullName: 'Amina Bello',
    });

    const signal: BusinessSignal = {
      organizationId: 'org-1',
      userId: 'user-1',
      signalType: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      body: '₦200,000 recorded from Alhaji Musa.',
      priority: NotificationPriority.HIGH,
      data: { amount: '200000', currency: 'NGN' },
      idempotencyKey: 'sig_pay_1',
    };

    const result = await policyService.handleSignal(signal);

    expect(result.inAppCreated).toBe(true);
    expect(result.pushSent).toBe(true);
    expect(result.emailSent).toBe(true);

    expect(mockNotifService.createDeduplicated).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        signalType: 'PAYMENT_RECEIVED',
        channel: NotificationChannel.IN_APP,
      })
    );

    expect(mockPushService.sendPushNotification).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      expect.objectContaining({
        title: 'Payment Received',
      })
    );

    expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'founder@business.com',
        subject: '[Netify Alert] Payment Received',
      })
    );
  });

  it('routes LOW priority signal only to IN_APP (no push or email spam)', async () => {
    const signal: BusinessSignal = {
      organizationId: 'org-1',
      userId: 'user-1',
      signalType: 'IMPORTANT_BUSINESS_CHANGE',
      title: 'New Receivable Added',
      body: 'Invoice created.',
      priority: NotificationPriority.LOW,
      idempotencyKey: 'sig_rec_1',
    };

    const result = await policyService.handleSignal(signal);

    expect(result.inAppCreated).toBe(true);
    expect(result.pushSent).toBe(false);
    expect(result.emailSent).toBe(false);
    expect(mockPushService.sendPushNotification).not.toHaveBeenCalled();
    expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SignalDetectionService, BusinessSignal } from './signal-detection.service';
import { NotificationPolicyService } from '../notification/notification-policy.service';
import { BusinessEventType, NotificationPriority, prisma } from '@netify/database';

jest.mock('@netify/database', () => {
  return {
    prisma: {
      paymentCommitment: {
        findMany: jest.fn(),
      },
      receivable: {
        findMany: jest.fn(),
      },
    },
    BusinessEventType: {
      PAYMENT_RECORDED: 'PAYMENT_RECORDED',
      PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
      COMMITMENT_CREATED: 'COMMITMENT_CREATED',
      COMMITMENT_MISSED: 'COMMITMENT_MISSED',
      RECEIVABLE_CREATED: 'RECEIVABLE_CREATED',
    },
    NotificationPriority: {
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW',
    },
  };
});

describe('Domain 10: SignalDetectionService', () => {
  let signalService: SignalDetectionService;
  let policyService: NotificationPolicyService;

  const mockPolicyService = {
    handleSignal: jest.fn().mockResolvedValue({
      inAppCreated: true,
      pushSent: true,
      emailSent: true,
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignalDetectionService,
        {
          provide: NotificationPolicyService,
          useValue: mockPolicyService,
        },
      ],
    }).compile();

    signalService = module.get<SignalDetectionService>(SignalDetectionService);
    policyService = module.get<NotificationPolicyService>(NotificationPolicyService);
  });

  describe('processEvent', () => {
    it('detects PAYMENT_RECEIVED signal on PAYMENT_CONFIRMED event', async () => {
      const event = {
        id: 'evt-100',
        organizationId: 'org-1',
        type: BusinessEventType.PAYMENT_CONFIRMED,
        paymentId: 'pay-1',
        customerId: 'cust-1',
        receivableId: 'rec-1',
        data: {
          amount: '150000',
          currency: 'NGN',
          customerName: 'Alhaji Musa Enterprise',
        },
        actorUserId: 'user-1',
      };

      const signal = await signalService.processEvent(event);

      expect(signal).not.toBeNull();
      expect(signal?.signalType).toBe('PAYMENT_RECEIVED');
      expect(signal?.priority).toBe(NotificationPriority.HIGH);
      expect(signal?.idempotencyKey).toBe('sig_pay_pay-1');
      expect(mockPolicyService.handleSignal).toHaveBeenCalledWith(signal);
    });

    it('detects PROMISE_MISSED signal on COMMITMENT_MISSED event', async () => {
      const event = {
        id: 'evt-101',
        organizationId: 'org-1',
        type: BusinessEventType.COMMITMENT_MISSED,
        paymentCommitmentId: 'comm-1',
        customerId: 'cust-1',
        data: {
          customerName: 'Kemi Trading Ltd',
        },
        actorUserId: 'user-1',
      };

      const signal = await signalService.processEvent(event);

      expect(signal).not.toBeNull();
      expect(signal?.signalType).toBe('PROMISE_MISSED');
      expect(signal?.priority).toBe(NotificationPriority.HIGH);
      expect(signal?.idempotencyKey).toBe('sig_comm_missed_comm-1');
      expect(mockPolicyService.handleSignal).toHaveBeenCalledWith(signal);
    });

    it('returns null for unrelated event types', async () => {
      const event = {
        id: 'evt-102',
        organizationId: 'org-1',
        type: 'CUSTOMER_VIEWED' as any,
      };

      const signal = await signalService.processEvent(event);
      expect(signal).toBeNull();
      expect(mockPolicyService.handleSignal).not.toHaveBeenCalled();
    });
  });

  describe('scanOrganizationSignals', () => {
    it('scans and generates PROMISE_DUE signals for commitments due today', async () => {
      (prisma.paymentCommitment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'comm-due-1',
          organizationId: 'org-1',
          customerId: 'cust-1',
          amount: '75000',
          currency: 'NGN',
          customer: { id: 'cust-1', name: 'Emeka Logistics' },
        },
      ]);
      (prisma.receivable.findMany as jest.Mock).mockResolvedValue([]);

      const signals = await signalService.scanOrganizationSignals('org-1');

      expect(signals.length).toBe(1);
      expect(signals[0].signalType).toBe('PROMISE_DUE');
      expect(signals[0].priority).toBe(NotificationPriority.HIGH);
      expect(mockPolicyService.handleSignal).toHaveBeenCalledTimes(1);
    });
  });
});

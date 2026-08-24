import { Test, TestingModule } from '@nestjs/testing';
import { CommandCenterService } from './command-center.service';
import { CollectionPriorityService } from '../ai/collection-priority.service';
import { prisma, ReceivableStatus, CommitmentStatus } from '@netify/database';

jest.mock('@netify/database', () => ({
  prisma: {
    organization: {
      findUnique: jest.fn(),
    },
    receivable: {
      findMany: jest.fn(),
    },
    paymentCommitment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    customer: {
      count: jest.fn(),
    },
  },
  ReceivableStatus: {
    OPEN: 'OPEN',
    PARTIALLY_PAID: 'PARTIALLY_PAID',
    PAID: 'PAID',
    OVERDUE: 'OVERDUE',
  },
  CommitmentStatus: {
    PENDING: 'PENDING',
    FULFILLED: 'FULFILLED',
    MISSED: 'MISSED',
  },
}));

describe('CommandCenterService (Domain 09)', () => {
  let service: CommandCenterService;
  let priorityService: CollectionPriorityService;

  const mockPriorityService = {
    getPrioritizedCustomers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommandCenterService,
        {
          provide: CollectionPriorityService,
          useValue: mockPriorityService,
        },
      ],
    }).compile();

    service = module.get<CommandCenterService>(CommandCenterService);
    priorityService = module.get<CollectionPriorityService>(CollectionPriorityService);
    jest.clearAllMocks();
  });

  describe('getAttentionOverview', () => {
    it('should compute deterministic attention facts and localized briefings in English', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: 'org-1',
        name: 'Lagos Traders Ltd',
        currency: 'NGN',
      });

      const pastDue = new Date(Date.now() - 5 * 86400000);
      (prisma.receivable.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'rec-1',
          customerId: 'cust-1',
          originalAmount: 150000,
          dueDate: pastDue,
          status: 'OPEN',
          payments: [{ amount: 50000 }],
        },
      ]);

      (prisma.paymentCommitment.findMany as jest.Mock).mockResolvedValue([
        { id: 'comm-1', amount: 50000, customerId: 'cust-1' },
      ]);
      (prisma.paymentCommitment.count as jest.Mock).mockResolvedValue(1);
      (prisma.customer.count as jest.Mock).mockResolvedValue(5);

      mockPriorityService.getPrioritizedCustomers.mockResolvedValue({
        items: [
          {
            customerId: 'cust-1',
            customerName: 'Alhaji Musa',
            urgency: 'HIGH',
            reasons: ['Overdue debt of ₦100,000 with 1 missed commitment.'],
          },
        ],
        totalCount: 1,
        highUrgencyCount: 1,
      });

      const overview = await service.getAttentionOverview('org-1', 'en');

      expect(overview.currency).toBe('NGN');
      expect(overview.facts.totalOutstanding).toBe(100000);
      expect(overview.facts.totalOverdue).toBe(100000);
      expect(overview.facts.promisesDueTodayCount).toBe(1);
      expect(overview.facts.promisesDueTodayAmount).toBe(50000);
      expect(overview.facts.missedPromisesCount).toBe(1);
      expect(overview.facts.highRiskCasesCount).toBe(1);

      // Verify inferences separation
      expect(overview.inferences.length).toBeGreaterThanOrEqual(2);
      expect(overview.inferences.some((i) => i.type === 'PROMISES_DUE')).toBe(true);
      expect(overview.inferences.some((i) => i.type === 'MISSED_PROMISES')).toBe(true);

      // Verify executive briefing contains authoritative financial values
      expect(overview.executiveBriefing).toContain('100,000');
    });

    it('should generate multilingual briefings for Hausa (ha), Yoruba (yo), Igbo (ig), and Pidgin (pcm)', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: 'org-1',
        name: 'Kano Textiles',
        currency: 'NGN',
      });

      (prisma.receivable.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'rec-1',
          customerId: 'cust-1',
          originalAmount: 200000,
          dueDate: new Date(Date.now() - 86400000),
          status: 'OPEN',
          payments: [],
        },
      ]);
      (prisma.paymentCommitment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.paymentCommitment.count as jest.Mock).mockResolvedValue(0);
      (prisma.customer.count as jest.Mock).mockResolvedValue(2);
      mockPriorityService.getPrioritizedCustomers.mockResolvedValue({
        items: [],
        totalCount: 0,
        highUrgencyCount: 1,
      });

      // Test Hausa
      const hausaResult = await service.getAttentionOverview('org-1', 'ha');
      expect(hausaResult.executiveBriefing).toContain('kuna da jimillar bashin');

      // Test Yoruba
      const yorubaResult = await service.getAttentionOverview('org-1', 'yo');
      expect(yorubaResult.executiveBriefing).toContain('gbogbo gbese ti a n reti jẹ');

      // Test Igbo
      const igboResult = await service.getAttentionOverview('org-1', 'ig');
      expect(igboResult.executiveBriefing).toContain('ngụkọta ụgwọ a na-echere bụ');

      // Test Pidgin
      const pidginResult = await service.getAttentionOverview('org-1', 'pcm');
      expect(pidginResult.executiveBriefing).toContain('total money wey outside na');
    });
  });
});

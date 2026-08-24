import { Test, TestingModule } from '@nestjs/testing';
import { ActionExecutionService } from './action-execution.service';
import { prisma, CommitmentStatus, ActivityType, CollectionChannel, ActivityOutcome } from '@netify/database';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('@netify/database', () => ({
  prisma: {
    aIActionProposal: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    receivable: {
      findFirst: jest.fn(),
    },
    paymentCommitment: {
      create: jest.fn(),
    },
    collectionActivity: {
      create: jest.fn(),
    },
  },
  CommitmentStatus: {
    PENDING: 'PENDING',
    FULFILLED: 'FULFILLED',
    MISSED: 'MISSED',
  },
  ActivityType: {
    PAYMENT_REMINDER: 'PAYMENT_REMINDER',
  },
  CollectionChannel: {
    WHATSAPP: 'WHATSAPP',
  },
  ActivityOutcome: {
    CONTACTED: 'CONTACTED',
  },
}));

describe('ActionExecutionService (Domain 09)', () => {
  let service: ActionExecutionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActionExecutionService],
    }).compile();

    service = module.get<ActionExecutionService>(ActionExecutionService);
    jest.clearAllMocks();
  });

  describe('proposeAction', () => {
    it('should stage a suggested action with status SUGGESTED and require explicit confirmation', async () => {
      (prisma.aIActionProposal.create as jest.Mock).mockResolvedValue({
        id: 'prop-1',
        organizationId: 'org-1',
        userId: 'user-1',
        actionType: 'CREATE_FOLLOW_UP',
        title: 'Follow up with Alhaji Musa tomorrow',
        status: 'SUGGESTED',
        isConsequential: true,
      });

      const proposal = await service.proposeAction({
        organizationId: 'org-1',
        userId: 'user-1',
        actionType: 'CREATE_FOLLOW_UP',
        title: 'Follow up with Alhaji Musa tomorrow',
        description: 'Set a payment commitment for ₦50,000 on tomorrow',
        payload: {
          customerId: 'cust-1',
          amount: 50000,
          dueDate: new Date().toISOString(),
        },
      });

      expect(proposal.id).toBe('prop-1');
      expect(proposal.status).toBe('SUGGESTED');
      expect(proposal.isConsequential).toBe(true);
    });
  });

  describe('confirmAction', () => {
    it('should reject execution when user declines (confirm = false)', async () => {
      (prisma.aIActionProposal.findUnique as jest.Mock).mockResolvedValue({
        id: 'prop-1',
        organizationId: 'org-1',
        userId: 'user-1',
        status: 'SUGGESTED',
        payload: {},
      });

      (prisma.aIActionProposal.update as jest.Mock).mockResolvedValue({
        id: 'prop-1',
        status: 'REJECTED',
      });

      const result = await service.confirmAction('org-1', 'user-1', 'prop-1', false);
      expect(result.executed).toBe(false);
      expect(result.proposal.status).toBe('REJECTED');
      expect(prisma.paymentCommitment.create).not.toHaveBeenCalled();
    });

    it('should execute follow-up commitment creation only when explicitly confirmed', async () => {
      (prisma.aIActionProposal.findUnique as jest.Mock).mockResolvedValue({
        id: 'prop-1',
        organizationId: 'org-1',
        userId: 'user-1',
        actionType: 'CREATE_FOLLOW_UP',
        title: 'Follow up with Alhaji Musa',
        description: 'Payment promised tomorrow',
        status: 'SUGGESTED',
        payload: {
          customerId: 'cust-1',
          receivableId: 'rec-1',
          amount: 75000,
          dueDate: new Date().toISOString(),
        },
      });

      (prisma.paymentCommitment.create as jest.Mock).mockResolvedValue({
        id: 'comm-1',
        amount: 75000,
        status: 'PENDING',
      });

      (prisma.aIActionProposal.update as jest.Mock).mockResolvedValue({
        id: 'prop-1',
        status: 'EXECUTED',
      });

      const result = await service.confirmAction('org-1', 'user-1', 'prop-1', true);
      expect(result.executed).toBe(true);
      expect(result.proposal.status).toBe('EXECUTED');
      expect(prisma.paymentCommitment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-1',
            customerId: 'cust-1',
            receivableId: 'rec-1',
            amount: 75000,
            status: 'PENDING',
          }),
        })
      );
    });
  });
});

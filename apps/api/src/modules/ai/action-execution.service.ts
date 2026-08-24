import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { prisma, CommitmentStatus, ActivityType, CollectionChannel, ActivityOutcome } from '@netify/database';

export interface ProposeActionParams {
  organizationId: string;
  userId: string;
  conversationId?: string;
  actionType: string;
  title: string;
  description: string;
  payload: Record<string, any>;
  isConsequential?: boolean;
}

@Injectable()
export class ActionExecutionService {
  private readonly logger = new Logger(ActionExecutionService.name);

  /**
   * Creates an action proposal requiring explicit user confirmation.
   */
  async proposeAction(params: ProposeActionParams) {
    const proposal = await prisma.aIActionProposal.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        conversationId: params.conversationId,
        actionType: params.actionType,
        title: params.title,
        description: params.description,
        payload: params.payload,
        isConsequential: params.isConsequential ?? true,
        status: 'SUGGESTED',
      },
    });

    return proposal;
  }

  /**
   * Confirms or rejects an action proposal with safe execution.
   */
  async confirmAction(
    organizationId: string,
    userId: string,
    proposalId: string,
    confirm: boolean,
    notes?: string
  ) {
    const proposal = await prisma.aIActionProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new NotFoundException(`Action proposal ${proposalId} not found`);
    }

    if (proposal.organizationId !== organizationId) {
      throw new NotFoundException(`Action proposal ${proposalId} not found`);
    }

    if (proposal.status !== 'SUGGESTED') {
      throw new BadRequestException(`Action proposal is already ${proposal.status}`);
    }

    const now = new Date();

    if (!confirm) {
      const rejected = await prisma.aIActionProposal.update({
        where: { id: proposalId },
        data: {
          status: 'REJECTED',
          updatedAt: now,
        },
      });
      return {
        proposal: rejected,
        executed: false,
        message: 'Action proposal was declined by user.',
      };
    }

    // Explicit confirmation: Execute safe action
    const payload = (proposal.payload as any) || {};
    let executionResult: any = null;

    try {
      if (proposal.actionType === 'CREATE_FOLLOW_UP') {
        const customerId = payload.customerId;
        const dueDate = payload.dueDate ? new Date(payload.dueDate) : new Date(Date.now() + 86400000);
        const amount = payload.amount ? Number(payload.amount) : 0;
        const note = payload.note || proposal.description;

        if (customerId) {
          let receivableId = payload.receivableId;
          if (!receivableId) {
            const openRec = await prisma.receivable.findFirst({
              where: {
                organizationId,
                customerId,
                status: { in: ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'] },
              },
              select: { id: true },
            });
            receivableId = openRec?.id;
          }

          if (receivableId) {
            executionResult = await prisma.paymentCommitment.create({
              data: {
                organizationId,
                customerId,
                receivableId,
                createdByUserId: userId,
                amount,
                promisedFor: dueDate,
                status: CommitmentStatus.PENDING,
                notes: note,
              },
            });
          }
        }
      } else if (proposal.actionType === 'LOG_ACTIVITY') {
        const customerId = payload.customerId;
        if (customerId) {
          let receivableId = payload.receivableId;
          if (!receivableId) {
            const openRec = await prisma.receivable.findFirst({
              where: {
                organizationId,
                customerId,
                status: { in: ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'] },
              },
              select: { id: true },
            });
            receivableId = openRec?.id;
          }

          if (receivableId) {
            executionResult = await prisma.collectionActivity.create({
              data: {
                organizationId,
                customerId,
                receivableId,
                performedByUserId: userId,
                type: (payload.type as ActivityType) || ActivityType.PAYMENT_REMINDER,
                channel: (payload.channel as CollectionChannel) || CollectionChannel.WHATSAPP,
                notes: payload.notes || proposal.description,
                outcome: (payload.outcome as ActivityOutcome) || ActivityOutcome.CONTACTED,
              },
            });
          }
        }
      }

      const updated = await prisma.aIActionProposal.update({
        where: { id: proposalId },
        data: {
          status: 'EXECUTED',
          confirmedAt: now,
          executedAt: now,
          updatedAt: now,
        },
      });

      return {
        proposal: updated,
        executed: true,
        result: executionResult,
        message: 'Action successfully confirmed and executed.',
      };
    } catch (err: any) {
      this.logger.error(`Failed to execute action proposal ${proposalId}: ${err.message}`);
      throw new BadRequestException(`Failed to execute action: ${err.message}`);
    }
  }

  /**
   * Lists pending action proposals for the organization.
   */
  async listProposals(organizationId: string, userId: string) {
    return prisma.aIActionProposal.findMany({
      where: {
        organizationId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}

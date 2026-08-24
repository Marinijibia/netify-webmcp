import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import {
  prisma,
  BusinessEventType,
  NotificationPriority,
} from '@netify/database';
import { BusinessSignalType } from '@netify/validation';
import { NotificationPolicyService } from '../notification/notification-policy.service';

export interface BusinessSignal {
  organizationId: string;
  userId?: string | null;
  signalType: BusinessSignalType;
  title: string;
  body: string;
  priority: NotificationPriority;
  data?: Record<string, any>;
  idempotencyKey: string;
}

@Injectable()
export class SignalDetectionService {
  private readonly logger = new Logger(SignalDetectionService.name);

  constructor(
    @Inject(forwardRef(() => NotificationPolicyService))
    private readonly policyService: NotificationPolicyService
  ) {}

  /**
   * Evaluates a recorded business event and emits corresponding business signals.
   */
  async processEvent(event: {
    id: string;
    organizationId: string;
    type: BusinessEventType;
    customerId?: string | null;
    receivableId?: string | null;
    paymentId?: string | null;
    paymentCommitmentId?: string | null;
    data?: any;
    actorUserId?: string | null;
  }): Promise<BusinessSignal | null> {
    try {
      let signal: BusinessSignal | null = null;

      switch (event.type) {
        case BusinessEventType.PAYMENT_CONFIRMED: {
          const amount = event.data?.amount || '0';
          const currency = event.data?.currency || 'NGN';
          const customerName = event.data?.customerName || 'Customer';
          signal = {
            organizationId: event.organizationId,
            userId: event.actorUserId,
            signalType: 'PAYMENT_RECEIVED',
            title: 'Payment Received',
            body: `Payment of ${currency} ${Number(amount).toLocaleString()} recorded for ${customerName}.`,
            priority: NotificationPriority.HIGH,
            data: {
              paymentId: event.paymentId,
              receivableId: event.receivableId,
              customerId: event.customerId,
              amount,
              currency,
            },
            idempotencyKey: `sig_pay_${event.paymentId || event.id}`,
          };
          break;
        }

        case BusinessEventType.COMMITMENT_CREATED: {
          const promisedFor = event.data?.promisedFor
            ? new Date(event.data.promisedFor).toLocaleDateString()
            : 'soon';
          const amount = event.data?.amount || '0';
          const currency = event.data?.currency || 'NGN';
          signal = {
            organizationId: event.organizationId,
            userId: event.actorUserId,
            signalType: 'PROMISE_DUE',
            title: 'Payment Promise Logged',
            body: `Promise of ${currency} ${Number(amount).toLocaleString()} due on ${promisedFor}.`,
            priority: NotificationPriority.MEDIUM,
            data: {
              commitmentId: event.paymentCommitmentId,
              customerId: event.customerId,
              amount,
              currency,
            },
            idempotencyKey: `sig_comm_created_${event.paymentCommitmentId || event.id}`,
          };
          break;
        }

        case BusinessEventType.COMMITMENT_MISSED: {
          const customerName = event.data?.customerName || 'A customer';
          signal = {
            organizationId: event.organizationId,
            userId: event.actorUserId,
            signalType: 'PROMISE_MISSED',
            title: 'Payment Promise Missed',
            body: `${customerName} missed their scheduled payment promise. Follow-up recommended.`,
            priority: NotificationPriority.HIGH,
            data: {
              commitmentId: event.paymentCommitmentId,
              customerId: event.customerId,
            },
            idempotencyKey: `sig_comm_missed_${event.paymentCommitmentId || event.id}`,
          };
          break;
        }

        case BusinessEventType.RECEIVABLE_CREATED: {
          const totalAmount = event.data?.totalAmount || '0';
          const currency = event.data?.currency || 'NGN';
          signal = {
            organizationId: event.organizationId,
            userId: event.actorUserId,
            signalType: 'IMPORTANT_BUSINESS_CHANGE',
            title: 'New Receivable Added',
            body: `New invoice/receivable of ${currency} ${Number(totalAmount).toLocaleString()} added to books.`,
            priority: NotificationPriority.LOW,
            data: {
              receivableId: event.receivableId,
              customerId: event.customerId,
              amount: totalAmount,
              currency,
            },
            idempotencyKey: `sig_rec_created_${event.receivableId || event.id}`,
          };
          break;
        }

        default:
          break;
      }

      if (signal) {
        await this.policyService.handleSignal(signal);
        return signal;
      }

      return null;
    } catch (err: any) {
      this.logger.error(`Error processing business event for signal detection: ${err.message}`, err.stack);
      return null;
    }
  }

  /**
   * Deterministically scans an organization for overdue receivables and due promises.
   */
  async scanOrganizationSignals(organizationId: string): Promise<BusinessSignal[]> {
    const signals: BusinessSignal[] = [];
    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];

    try {
      // 1. Scan for commitments due today
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const dueCommitments = await prisma.paymentCommitment.findMany({
        where: {
          organizationId,
          status: 'PENDING',
          promisedFor: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          customer: { select: { id: true, name: true } },
        },
        take: 10,
      });

      for (const commitment of dueCommitments) {
        const signal: BusinessSignal = {
          organizationId,
          signalType: 'PROMISE_DUE',
          title: 'Payment Promise Due Today',
          body: `${commitment.customer?.name || 'Customer'} has a payment promise of ${commitment.currency} ${Number(commitment.amount).toLocaleString()} due today.`,
          priority: NotificationPriority.HIGH,
          data: {
            commitmentId: commitment.id,
            customerId: commitment.customerId,
            amount: commitment.amount.toString(),
            currency: commitment.currency,
          },
          idempotencyKey: `sig_due_today_${commitment.id}_${todayDateStr}`,
        };
        signals.push(signal);
        await this.policyService.handleSignal(signal);
      }

      // 2. Scan for overdue receivables
      const overdueReceivables = await prisma.receivable.findMany({
        where: {
          organizationId,
          status: { in: ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'] },
          dueDate: { lt: now },
        },
        include: {
          customer: { select: { id: true, name: true } },
        },
        orderBy: { originalAmount: 'desc' },
        take: 5,
      });

      for (const rec of overdueReceivables) {
        const signal: BusinessSignal = {
          organizationId,
          signalType: 'RECEIVABLE_OVERDUE',
          title: 'Overdue Receivable Alert',
          body: `${rec.customer?.name || 'Customer'} has an overdue balance of ${rec.currency} ${Number(rec.originalAmount).toLocaleString()}.`,
          priority: NotificationPriority.MEDIUM,
          data: {
            receivableId: rec.id,
            customerId: rec.customerId,
            amount: rec.originalAmount.toString(),
            currency: rec.currency,
          },
          idempotencyKey: `sig_overdue_${rec.id}_${todayDateStr}`,
        };
        signals.push(signal);
        await this.policyService.handleSignal(signal);
      }
    } catch (err: any) {
      this.logger.error(`Failed to scan organization signals: ${err.message}`);
    }

    return signals;
  }
}

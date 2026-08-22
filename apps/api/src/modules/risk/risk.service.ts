import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@netify/database';
import { DeterministicRiskEngine } from './deterministic-risk.service';
import { DeterministicInvoiceService } from '../invoice/deterministic-invoice.service';
import {
  DeterministicRiskSignals,
  RiskEvidenceItem,
  CustomerRiskDetail,
} from '@netify/types';
import { AIService } from '@netify/ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RiskService {
  private aiService: AIService;

  constructor(private readonly configService: ConfigService) {
    const provider = (this.configService.get<string>('AI_PROVIDER') as any) || 'gemini';
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');

    this.aiService = new AIService({
      provider,
      geminiApiKey,
      openaiApiKey,
    });
  }

  async evaluateCustomerRisk(organizationId: string, customerId: string): Promise<CustomerRiskDetail> {
    const customer: any = await prisma.customer.findFirst({
      where: { id: customerId, organizationId },
      include: {
        invoices: {
          orderBy: { dueDate: 'asc' },
          include: { items: true },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
        commitments: {
          orderBy: { promisedDate: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // 1. Gather Deterministic Signals
    const totalOutstanding = (customer.invoices || []).reduce((sum: number, inv: any) => sum + inv.balance, 0);
    const totalPaidHistorical = (customer.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const overdueInvoices = (customer.invoices || []).filter((inv: any) => {
      const days = DeterministicInvoiceService.calculateDaysOverdue(inv.dueDate);
      return days > 0 && inv.balance > 0;
    });

    const oldestOverdueDays = overdueInvoices.reduce((max: number, inv: any) => {
      const days = DeterministicInvoiceService.calculateDaysOverdue(inv.dueDate);
      return Math.max(max, days);
    }, 0);

    const pendingCommitments = (customer.commitments || []).filter((c: any) => c.status === 'PENDING');
    const missedCommitments = (customer.commitments || []).filter((c: any) => c.status === 'MISSED');
    const fulfilledCommitments = (customer.commitments || []).filter((c: any) => c.status === 'FULFILLED');
    const totalResolvedCommitments = missedCommitments.length + fulfilledCommitments.length;
    const commitmentFulfillmentRate =
      totalResolvedCommitments > 0
        ? Math.round((fulfilledCommitments.length / totalResolvedCommitments) * 100)
        : 100;

    const daysSinceLastPayment =
      (customer.payments || []).length > 0
        ? Math.floor((Date.now() - new Date(customer.payments[0].paidAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const signals: DeterministicRiskSignals = {
      customerId: customer.id,
      customerName: customer.name,
      currency: customer.currency || 'NGN',
      totalOutstanding,
      totalPaidHistorical,
      oldestOverdueDays,
      overdueInvoicesCount: overdueInvoices.length,
      totalInvoicesCount: (customer.invoices || []).length,
      pendingCommitmentsCount: pendingCommitments.length,
      missedCommitmentsCount: missedCommitments.length,
      fulfilledCommitmentsCount: fulfilledCommitments.length,
      commitmentFulfillmentRate,
      averagePaymentDelayDays: oldestOverdueDays > 0 ? Math.round(oldestOverdueDays / 1.5) : 0,
      daysSinceLastPayment,
      outstandingToHistoryRatio:
        totalOutstanding + totalPaidHistorical > 0
          ? Number((totalOutstanding / (totalOutstanding + totalPaidHistorical)).toFixed(2))
          : 0,
    };

    // 2. Deterministic Score Calculation
    const { score, level } = DeterministicRiskEngine.calculateScore(signals);

    // 3. Assemble Concrete Verifiable Evidence
    const evidence: RiskEvidenceItem[] = [];

    overdueInvoices.forEach((inv: any) => {
      const days = DeterministicInvoiceService.calculateDaysOverdue(inv.dueDate);
      evidence.push({
        id: inv.id,
        type: 'INVOICE',
        title: `Invoice ${inv.invoiceNumber} (${days} days overdue)`,
        description: `Balance: ${inv.currency} ${inv.balance.toLocaleString()} / Total: ${inv.currency} ${inv.total.toLocaleString()}`,
        amount: inv.balance,
        currency: inv.currency,
        date: new Date(inv.dueDate).toISOString().split('T')[0],
        status: inv.status,
      });
    });

    missedCommitments.forEach((comm: any) => {
      evidence.push({
        id: comm.id,
        type: 'COMMITMENT',
        title: `Missed Commitment of ${comm.currency} ${comm.amount.toLocaleString()}`,
        description: comm.description || 'Promised payment not fulfilled',
        amount: comm.amount,
        currency: comm.currency,
        date: new Date(comm.promisedDate).toISOString().split('T')[0],
        status: 'MISSED',
        sourceReference: comm.sourceReference || undefined,
      });
    });

    if ((customer.payments || []).length > 0) {
      const p = customer.payments[0];
      evidence.push({
        id: p.id,
        type: 'PAYMENT',
        title: `Last Payment Received (${daysSinceLastPayment} days ago)`,
        description: `${p.currency} ${Number(p.amount).toLocaleString()} via ${p.method || p.paymentMethod}`,
        amount: Number(p.amount),
        currency: p.currency,
        date: new Date(p.paidAt).toISOString().split('T')[0],
      });
    }

    // 4. Generate AI Explanation of Deterministic Signals
    const aiReasoning = await this.aiService.explainRisk(signals);

    // 5. Store / Update Risk Assessment in DB
    await prisma.riskAssessment.create({
      data: {
        organizationId,
        customerId: customer.id,
        riskLevel: level as any,
        riskScore: score,
        signals: signals as any,
        aiExplanation: aiReasoning.explanation,
        evaluatedAt: new Date(),
      },
    });

    return {
      customerId: customer.id,
      customerName: customer.name,
      riskLevel: level,
      riskScore: score,
      signals,
      aiExplanation: aiReasoning.explanation,
      evidence,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

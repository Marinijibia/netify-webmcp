import { Injectable, Logger } from '@nestjs/common';
import { prisma, ReceivableStatus, CommitmentStatus } from '@netify/database';
import { CollectionPriorityService } from '../ai/collection-priority.service';
import { AppLanguage } from '@netify/validation';

export interface AttentionFact {
  type: string;
  metric: string;
  value: string | number;
  description: string;
  evidenceRef?: string;
}

export interface AttentionInference {
  type: string;
  title: string;
  insight: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction?: string;
  evidenceRefs: string[];
}

export interface CommandCenterAttentionData {
  currency: string;
  language: AppLanguage;
  facts: {
    totalOutstanding: number;
    totalOverdue: number;
    overdueCustomersCount: number;
    promisesDueTodayCount: number;
    promisesDueTodayAmount: number;
    missedPromisesCount: number;
    highRiskCasesCount: number;
    activeCustomersCount: number;
  };
  inferences: AttentionInference[];
  executiveBriefing: string;
  calculatedAt: string;
}

@Injectable()
export class CommandCenterService {
  private readonly logger = new Logger(CommandCenterService.name);

  constructor(
    private readonly priorityService: CollectionPriorityService
  ) {}

  /**
   * Computes the deterministic Command Center attention overview.
   * Disaggregates authoritative financial numbers from AI inferences.
   */
  async getAttentionOverview(
    organizationId: string,
    language: AppLanguage = 'en',
    currencyOverride?: string
  ): Promise<CommandCenterAttentionData> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { currency: true, name: true },
    });

    const currency = currencyOverride || org?.currency || 'NGN';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Authoritative Receivables Query
    const openReceivables = await prisma.receivable.findMany({
      where: {
        organizationId,
        currency,
        status: { in: [ReceivableStatus.OPEN, ReceivableStatus.PARTIALLY_PAID] },
      },
      select: {
        id: true,
        customerId: true,
        originalAmount: true,
        dueDate: true,
        status: true,
        payments: {
          where: { status: 'CONFIRMED' },
          select: { amount: true },
        },
      },
    });

    let totalOutstanding = 0;
    let totalOverdue = 0;
    const overdueCustomerIds = new Set<string>();

    for (const rec of openReceivables) {
      const paid = rec.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Math.max(0, Number(rec.originalAmount) - paid);
      totalOutstanding += remaining;

      const isOverdue = rec.dueDate && rec.dueDate < now;
      if (isOverdue && remaining > 0) {
        totalOverdue += remaining;
        if (rec.customerId) {
          overdueCustomerIds.add(rec.customerId);
        }
      }
    }

    // 2. Authoritative Payment Commitments Query
    const [todayCommitments, missedCommitments, activeCustomersCount] = await Promise.all([
      prisma.paymentCommitment.findMany({
        where: {
          organizationId,
          currency,
          status: CommitmentStatus.PENDING,
          promisedFor: { gte: startOfToday, lte: endOfToday },
        },
        select: { id: true, amount: true, customerId: true },
      }),
      prisma.paymentCommitment.count({
        where: {
          organizationId,
          status: CommitmentStatus.MISSED,
        },
      }),
      prisma.customer.count({
        where: {
          organizationId,
          status: 'ACTIVE',
        },
      }),
    ]);

    const promisesDueTodayCount = todayCommitments.length;
    const promisesDueTodayAmount = todayCommitments.reduce(
      (sum, c) => sum + Number(c.amount || 0),
      0
    );

    // 3. High Risk & Priority Query
    const priorityResult = await this.priorityService.getPrioritizedCustomers(organizationId, {
      limit: 10,
      currency,
    });

    const highRiskCasesCount = priorityResult.highUrgencyCount;

    // 4. Inferences & Recommendations Assembly
    const inferences: AttentionInference[] = [];

    if (promisesDueTodayCount > 0) {
      inferences.push({
        type: 'PROMISES_DUE',
        title: this.translate(
          language,
          `${promisesDueTodayCount} payment promise(s) due today`,
          `${promisesDueTodayCount} alƙawarin biya na yau`,
          `${promisesDueTodayCount} adehun sisanwo loni`,
          `${promisesDueTodayCount} nkwa ịkwụ ụgwọ taa`,
          `${promisesDueTodayCount} payment promise dey due today`
        ),
        insight: this.translate(
          language,
          `Follow up with customers whose payment promises mature today to ensure timely collection.`,
          `Tuntubi kwastomomin da alƙawarinsu ya cika a yau don tabbatar da an karɓi kuɗi.`,
          `Kan si awọn alabara ti adehun wọn pe loni lati gba owo ni kiakia.`,
          `Kpọtụrụ ndị ahịa nkwa ha ruru taa iji hụ na a kwụrụ ụgwọ ahụ.`,
          `Follow up with customers wey promise to pay today make money enter quick.`
        ),
        urgency: 'HIGH',
        recommendedAction: 'FOLLOW_UP_PROMISES',
        evidenceRefs: todayCommitments.map((c) => `commitment:${c.id}`),
      });
    }

    if (missedCommitments > 0) {
      inferences.push({
        type: 'MISSED_PROMISES',
        title: this.translate(
          language,
          `${missedCommitments} missed payment commitment(s)`,
          `${missedCommitments} alƙawarin da aka saba`,
          `${missedCommitments} adehun ti a ko mu ṣẹ`,
          `${missedCommitments} nkwa a kwụghị ụgwọ`,
          `${missedCommitments} missed payment promises`
        ),
        insight: this.translate(
          language,
          `Customers who recently missed promises require direct, polite re-engagement.`,
          `Kwastomomin da suka saba alƙawari kwanan nan suna buƙatar sake tuntuɓa cikin ladabi.`,
          `Awọn alabara ti ko mu adehun ṣẹ nilo ifọrọwanilẹnuwo pẹlu ọwọ.`,
          `Ndị ahịa na-akwụghị ụgwọ chọrọ ka a kpọtụrụ ha ọzọ n'ụzọ nkwanye ùgwù.`,
          `Customers wey miss promise need respectful reminder sharp-sharp.`
        ),
        urgency: 'HIGH',
        recommendedAction: 'REVIEW_MISSED_COMMITMENTS',
        evidenceRefs: [],
      });
    }

    if (priorityResult.items.length > 0 && priorityResult.items[0].urgency === 'HIGH') {
      const top = priorityResult.items[0];
      inferences.push({
        type: 'TOP_COLLECTION_PRIORITY',
        title: `${this.translate(
          language,
          'Top Priority',
          'Babban Fifiko',
          'Pataki Julọ',
          'Isi Ihe Mkpa',
          'Main Priority'
        )}: ${top.customerName}`,
        insight: top.reasons.join('. '),
        urgency: 'HIGH',
        recommendedAction: 'FOLLOW_UP_NOW',
        evidenceRefs: [`customer:${top.customerId}`],
      });
    }

    // 5. Build Localized Executive Briefing
    const executiveBriefing = this.generateExecutiveBriefing({
      language,
      totalOutstanding,
      totalOverdue,
      promisesDueTodayCount,
      missedCommitments,
      highRiskCasesCount,
      currency,
    });

    return {
      currency,
      language,
      facts: {
        totalOutstanding,
        totalOverdue,
        overdueCustomersCount: overdueCustomerIds.size,
        promisesDueTodayCount,
        promisesDueTodayAmount,
        missedPromisesCount: missedCommitments,
        highRiskCasesCount,
        activeCustomersCount,
      },
      inferences,
      executiveBriefing,
      calculatedAt: now.toISOString(),
    };
  }

  private translate(
    language: AppLanguage,
    en: string,
    ha: string,
    yo: string,
    ig: string,
    pcm: string
  ): string {
    switch (language) {
      case 'ha':
        return ha;
      case 'yo':
        return yo;
      case 'ig':
        return ig;
      case 'pcm':
        return pcm;
      case 'en':
      default:
        return en;
    }
  }

  private generateExecutiveBriefing(params: {
    language: AppLanguage;
    totalOutstanding: number;
    totalOverdue: number;
    promisesDueTodayCount: number;
    missedCommitments: number;
    highRiskCasesCount: number;
    currency: string;
  }): string {
    const {
      language,
      totalOutstanding,
      totalOverdue,
      promisesDueTodayCount,
      missedCommitments,
      highRiskCasesCount,
      currency,
    } = params;

    const formattedOutstanding = `${currency} ${totalOutstanding.toLocaleString()}`;

    if (totalOutstanding === 0) {
      return this.translate(
        language,
        'Your business is fully paid up with zero outstanding receivables today.',
        'Kasuwancinku ba shi da wani bashi a halin yanzu.',
        'Ko si gbese kankan lori ile-iṣẹ rẹ loni.',
        'Azụmahịa gị enweghị ụgwọ ọ bụla a na-echere taa.',
        'Your business clean today! Nobody dey owe you any money.'
      );
    }

    if (language === 'ha') {
      return `A yau, kuna da jimillar bashin ${formattedOutstanding}. Kwastomomi ${highRiskCasesCount} suna buƙatar kulawa ta gaggawa, kuma akwai alƙawura ${promisesDueTodayCount} na yau.`;
    }

    if (language === 'yo') {
      return `Loni, gbogbo gbese ti a n reti jẹ ${formattedOutstanding}. Awọn alabara ${highRiskCasesCount} nilo akiyesi pataki, pẹlu adehun sisanwo ${promisesDueTodayCount} loni.`;
    }

    if (language === 'ig') {
      return `Taa, ngụkọta ụgwọ a na-echere bụ ${formattedOutstanding}. Ndị ahịa ${highRiskCasesCount} chọrọ nlebara anya ngwa ngwa, ebe nkwa ịkwụ ụgwọ ${promisesDueTodayCount} dị taa.`;
    }

    if (language === 'pcm') {
      return `Today, total money wey outside na ${formattedOutstanding}. You get ${highRiskCasesCount} high priority case(s) and ${promisesDueTodayCount} payment promise(s) wey dey due today.`;
    }

    // Default English
    return `Today, your business has ${formattedOutstanding} in outstanding receivables. There are ${highRiskCasesCount} high priority collection case(s) and ${promisesDueTodayCount} payment promise(s) due today.`;
  }
}

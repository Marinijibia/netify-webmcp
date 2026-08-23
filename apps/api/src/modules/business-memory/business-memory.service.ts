import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  prisma,
  Prisma,
  BusinessEvent,
  BusinessMemory,
  MemoryCategory,
  MemoryType,
  MemoryTimeWindow,
  MemoryStatus,
} from '@netify/database';
import {
  CustomerMemoryQueryInput,
  MemoryEvidenceQueryInput,
} from '@netify/validation';
import {
  CalculatedMemoryCandidate,
  calculateCommitmentFulfillmentRate,
  calculateMissedCommitmentRate,
  calculatePaymentTimeliness,
  calculatePartialPaymentPattern,
  calculateCollectionResponsePattern,
  calculateReceivableOverduePattern,
  calculateCustomerActivityPattern,
} from './business-memory-calculator';

@Injectable()
export class BusinessMemoryService {
  private readonly logger = new Logger(BusinessMemoryService.name);

  /**
   * Authoritative deterministic derivation and reconciliation engine.
   * Rebuilds or refreshes all active Business Memories for a given customer.
   */
  async rebuildCustomerMemory(
    organizationId: string,
    customerId: string,
    txClient?: Prisma.TransactionClient
  ): Promise<{ created: number; updated: number; superseded: number }> {
    const db = txClient || prisma;

    // Verify customer belongs to organization
    const customer = await db.customer.findFirst({
      where: { id: customerId, organizationId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    // 1. Fetch all raw BusinessEvents for this customer in chronological order
    const events = await db.businessEvent.findMany({
      where: {
        organizationId,
        customerId,
      },
      orderBy: [
        { occurredAt: 'asc' },
        { recordedAt: 'asc' },
        { id: 'asc' },
      ],
    });

    // 2. Evaluate all deterministic calculators across standard time windows
    const candidates: CalculatedMemoryCandidate[] = [];
    const standardWindows: MemoryTimeWindow[] = [
      MemoryTimeWindow.LAST_90_DAYS,
      MemoryTimeWindow.LAST_180_DAYS,
      MemoryTimeWindow.ALL_TIME,
    ];

    for (const win of standardWindows) {
      candidates.push(...calculateCommitmentFulfillmentRate(events, win));
      candidates.push(...calculateMissedCommitmentRate(events, win));
      candidates.push(...calculatePaymentTimeliness(events, win));
      candidates.push(...calculatePartialPaymentPattern(events, win));
      candidates.push(...calculateCollectionResponsePattern(events, win));
      candidates.push(...calculateReceivableOverduePattern(events, win));
      if (win === MemoryTimeWindow.LAST_90_DAYS) {
        candidates.push(...calculateCustomerActivityPattern(events, win));
      }
    }

    // 3. Fetch currently ACTIVE memories for reconciliation
    const activeMemories = await db.businessMemory.findMany({
      where: {
        organizationId,
        customerId,
        status: MemoryStatus.ACTIVE,
      },
      include: {
        evidence: true,
      },
    });

    let createdCount = 0;
    let updatedCount = 0;
    let supersededCount = 0;

    // Map active memories by unique semantic identity
    const getIdentityKey = (
      type: MemoryType,
      window: MemoryTimeWindow,
      currency: string | null | undefined,
      extraKey?: string
    ) => `${type}_${window}_${currency || 'NONE'}_${extraKey || ''}`;

    const activeMemoryMap = new Map<string, BusinessMemory & { evidence: { businessEventId: string }[] }>();
    for (const mem of activeMemories) {
      const extraKey = (mem.value as any)?.channel || '';
      const key = getIdentityKey(mem.type, mem.timeWindow, mem.currency, extraKey);
      activeMemoryMap.set(key, mem);
    }

    const processedActiveKeys = new Set<string>();

    // 4. Reconcile candidates against active memories
    for (const candidate of candidates) {
      const extraKey = candidate.value?.channel || '';
      const key = getIdentityKey(candidate.type, candidate.timeWindow, candidate.currency, extraKey);
      processedActiveKeys.add(key);

      const existing = activeMemoryMap.get(key);

      if (existing) {
        // Update existing active memory
        const existingEventIds = new Set(existing.evidence.map((e) => e.businessEventId));
        const newEventIds = new Set(candidate.evidenceEventIds);

        const areEvidenceSame =
          existingEventIds.size === newEventIds.size &&
          [...newEventIds].every((id) => existingEventIds.has(id));

        const isStatementSame = existing.statement === candidate.statement;
        const isValueSame = JSON.stringify(existing.value) === JSON.stringify(candidate.value);

        if (!areEvidenceSame || !isStatementSame || !isValueSame) {
          // Reconcile values and evidence
          await db.businessMemory.update({
            where: { id: existing.id },
            data: {
              statement: candidate.statement,
              value: candidate.value,
              firstObservedAt: candidate.firstObservedAt,
              lastObservedAt: candidate.lastObservedAt,
              updatedAt: new Date(),
            },
          });

          // Sync evidence: delete old and recreate
          await db.businessMemoryEvidence.deleteMany({
            where: { memoryId: existing.id },
          });

          if (candidate.evidenceEventIds.length > 0) {
            await db.businessMemoryEvidence.createMany({
              data: candidate.evidenceEventIds.map((eventId) => ({
                memoryId: existing.id,
                businessEventId: eventId,
              })),
              skipDuplicates: true,
            });
          }

          updatedCount++;
        }
      } else {
        // Create new active memory
        const newMemory = await db.businessMemory.create({
          data: {
            organizationId,
            customerId,
            category: candidate.category,
            type: candidate.type,
            timeWindow: candidate.timeWindow,
            statement: candidate.statement,
            value: candidate.value,
            currency: candidate.currency || null,
            confidence: new Prisma.Decimal('1.00'),
            status: MemoryStatus.ACTIVE,
            version: 1,
            firstObservedAt: candidate.firstObservedAt,
            lastObservedAt: candidate.lastObservedAt,
          },
        });

        if (candidate.evidenceEventIds.length > 0) {
          await db.businessMemoryEvidence.createMany({
            data: candidate.evidenceEventIds.map((eventId) => ({
              memoryId: newMemory.id,
              businessEventId: eventId,
            })),
            skipDuplicates: true,
          });
        }

        createdCount++;
      }
    }

    // 5. Supersede active memories that no longer have enough evidence
    for (const [key, mem] of activeMemoryMap.entries()) {
      if (!processedActiveKeys.has(key)) {
        await db.businessMemory.update({
          where: { id: mem.id },
          data: {
            status: MemoryStatus.SUPERSEDED,
            updatedAt: new Date(),
          },
        });
        supersededCount++;
      }
    }

    this.logger.log(
      `Rebuilt memories for customer ${customerId}: created=${createdCount}, updated=${updatedCount}, superseded=${supersededCount}`
    );

    return { created: createdCount, updated: updatedCount, superseded: supersededCount };
  }

  /**
   * Retrieves active business memories for a customer with evidence count.
   */
  async getCustomerMemories(
    organizationId: string,
    customerId: string,
    query: CustomerMemoryQueryInput
  ): Promise<{ items: any[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    // IDOR Protection: Verify customer belongs to organization
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, organizationId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.BusinessMemoryWhereInput = {
      organizationId,
      customerId,
      status: (query.status as MemoryStatus) || MemoryStatus.ACTIVE,
      ...(query.category ? { category: query.category as MemoryCategory } : {}),
      ...(query.type ? { type: query.type as MemoryType } : {}),
      ...(query.timeWindow ? { timeWindow: query.timeWindow as MemoryTimeWindow } : {}),
    };

    const [totalCount, items] = await Promise.all([
      prisma.businessMemory.count({ where }),
      prisma.businessMemory.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { lastObservedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          _count: {
            select: { evidence: true },
          },
        },
      }),
    ]);

    const formattedItems = items.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      customerId: item.customerId,
      receivableId: item.receivableId,
      category: item.category,
      type: item.type,
      timeWindow: item.timeWindow,
      statement: item.statement,
      value: item.value,
      currency: item.currency,
      confidence: Number(item.confidence),
      status: item.status,
      version: item.version,
      firstObservedAt: item.firstObservedAt,
      lastObservedAt: item.lastObservedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      evidenceCount: item._count.evidence,
    }));

    return {
      items: formattedItems,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  /**
   * Retrieves a single business memory by ID with IDOR protection.
   */
  async getMemoryById(
    organizationId: string,
    customerId: string,
    memoryId: string
  ): Promise<any> {
    const memory = await prisma.businessMemory.findFirst({
      where: {
        id: memoryId,
        organizationId,
        customerId,
      },
      include: {
        _count: {
          select: { evidence: true },
        },
      },
    });

    if (!memory) {
      throw new NotFoundException('Business memory not found');
    }

    return {
      id: memory.id,
      organizationId: memory.organizationId,
      customerId: memory.customerId,
      receivableId: memory.receivableId,
      category: memory.category,
      type: memory.type,
      timeWindow: memory.timeWindow,
      statement: memory.statement,
      value: memory.value,
      currency: memory.currency,
      confidence: Number(memory.confidence),
      status: memory.status,
      version: memory.version,
      firstObservedAt: memory.firstObservedAt,
      lastObservedAt: memory.lastObservedAt,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
      evidenceCount: memory._count.evidence,
    };
  }

  /**
   * Retrieves the underlying BusinessEvent evidence supporting a specific memory.
   */
  async getMemoryEvidence(
    organizationId: string,
    customerId: string,
    memoryId: string,
    query: MemoryEvidenceQueryInput
  ): Promise<{ items: any[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    // Verify memory exists and belongs to the specified organization and customer
    const memory = await prisma.businessMemory.findFirst({
      where: {
        id: memoryId,
        organizationId,
        customerId,
      },
    });

    if (!memory) {
      throw new NotFoundException('Business memory not found');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.BusinessMemoryEvidenceWhereInput = {
      memoryId,
    };

    const [totalCount, evidenceRecords] = await Promise.all([
      prisma.businessMemoryEvidence.count({ where }),
      prisma.businessMemoryEvidence.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          businessEvent: {
            select: {
              id: true,
              organizationId: true,
              customerId: true,
              receivableId: true,
              paymentId: true,
              collectionActivityId: true,
              paymentCommitmentId: true,
              type: true,
              occurredAt: true,
              recordedAt: true,
              actorType: true,
              actorUserId: true,
              source: true,
              data: true,
              correlationId: true,
              causationId: true,
            },
          },
        },
      }),
    ]);

    return {
      items: evidenceRecords.map((r) => ({
        id: r.id,
        memoryId: r.memoryId,
        businessEventId: r.businessEventId,
        metadata: r.metadata,
        createdAt: r.createdAt,
        businessEvent: r.businessEvent,
      })),
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }
}

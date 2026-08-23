import {
  BusinessEvent,
  BusinessEventType,
  MemoryCategory,
  MemoryType,
  MemoryTimeWindow,
} from '@netify/database';

export interface CalculatedMemoryCandidate {
  category: MemoryCategory;
  type: MemoryType;
  timeWindow: MemoryTimeWindow;
  statement: string;
  value: Record<string, any>;
  currency?: string | null;
  firstObservedAt: Date;
  lastObservedAt: Date;
  evidenceEventIds: string[];
}

/**
 * Calculates start date for standard memory time windows.
 */
export function getWindowStartDate(timeWindow: MemoryTimeWindow, referenceDate: Date = new Date()): Date | null {
  const d = new Date(referenceDate);
  switch (timeWindow) {
    case MemoryTimeWindow.LAST_30_DAYS:
      d.setDate(d.getDate() - 30);
      return d;
    case MemoryTimeWindow.LAST_90_DAYS:
      d.setDate(d.getDate() - 90);
      return d;
    case MemoryTimeWindow.LAST_180_DAYS:
      d.setDate(d.getDate() - 180);
      return d;
    case MemoryTimeWindow.ALL_TIME:
      return null;
    default:
      return null;
  }
}

export function formatWindowLabel(timeWindow: MemoryTimeWindow): string {
  switch (timeWindow) {
    case MemoryTimeWindow.LAST_30_DAYS:
      return 'in the last 30 days';
    case MemoryTimeWindow.LAST_90_DAYS:
      return 'in the last 90 days';
    case MemoryTimeWindow.LAST_180_DAYS:
      return 'in the last 180 days';
    case MemoryTimeWindow.ALL_TIME:
      return 'across all time';
  }
}

/**
 * Filter events within a given time window based on occurredAt.
 */
export function filterEventsInWindow(events: BusinessEvent[], timeWindow: MemoryTimeWindow, referenceDate: Date = new Date()): BusinessEvent[] {
  const startDate = getWindowStartDate(timeWindow, referenceDate);
  if (!startDate) return events;
  return events.filter((e) => new Date(e.occurredAt) >= startDate);
}

/**
 * 1. PAYMENT_COMMITMENT_FULFILLMENT_RATE
 * Threshold: At least 2 completed commitments (FULFILLED, PARTIALLY_FULFILLED, or MISSED).
 */
export function calculateCommitmentFulfillmentRate(
  allEvents: BusinessEvent[],
  timeWindow: MemoryTimeWindow,
  referenceDate: Date = new Date()
): CalculatedMemoryCandidate[] {
  const events = filterEventsInWindow(allEvents, timeWindow, referenceDate);
  const terminalEvents = events.filter((e) =>
    [
      BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
      BusinessEventType.PAYMENT_COMMITMENT_PARTIALLY_FULFILLED,
      BusinessEventType.PAYMENT_COMMITMENT_MISSED,
    ].includes(e.type as any)
  );

  if (terminalEvents.length < 2) {
    return [];
  }

  // Separate by currency if present
  const currencyGroups = new Map<string, BusinessEvent[]>();
  for (const e of terminalEvents) {
    const data = (e.data as any) || {};
    const curr = data.currency || 'DEFAULT';
    if (!currencyGroups.has(curr)) currencyGroups.set(curr, []);
    currencyGroups.get(curr)!.push(e);
  }

  const results: CalculatedMemoryCandidate[] = [];

  for (const [currencyKey, groupEvents] of currencyGroups.entries()) {
    if (groupEvents.length < 2) continue;

    const fulfilledCount = groupEvents.filter(
      (e) => e.type === BusinessEventType.PAYMENT_COMMITMENT_FULFILLED
    ).length;
    const partiallyFulfilledCount = groupEvents.filter(
      (e) => e.type === BusinessEventType.PAYMENT_COMMITMENT_PARTIALLY_FULFILLED
    ).length;
    const missedCount = groupEvents.filter(
      (e) => e.type === BusinessEventType.PAYMENT_COMMITMENT_MISSED
    ).length;
    const total = groupEvents.length;
    const rate = Math.round((fulfilledCount / total) * 100) / 100;

    const sorted = [...groupEvents].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    );
    const firstObservedAt = new Date(sorted[0].occurredAt);
    const lastObservedAt = new Date(sorted[sorted.length - 1].occurredAt);
    const windowLabel = formatWindowLabel(timeWindow);

    const statement = `Customer fulfilled ${fulfilledCount} of ${total} payment commitments ${windowLabel}.`;

    results.push({
      category: MemoryCategory.COMMITMENT_BEHAVIOR,
      type: MemoryType.PAYMENT_COMMITMENT_FULFILLMENT_RATE,
      timeWindow,
      statement,
      value: {
        fulfilled: fulfilledCount,
        partiallyFulfilled: partiallyFulfilledCount,
        missed: missedCount,
        total,
        rate,
        currency: currencyKey === 'DEFAULT' ? null : currencyKey,
      },
      currency: currencyKey === 'DEFAULT' ? null : currencyKey,
      firstObservedAt,
      lastObservedAt,
      evidenceEventIds: sorted.map((e) => e.id),
    });
  }

  return results;
}

/**
 * 2. PAYMENT_COMMITMENT_MISSED_RATE
 * Threshold: At least 2 completed commitments and missed count > 0.
 */
export function calculateMissedCommitmentRate(
  allEvents: BusinessEvent[],
  timeWindow: MemoryTimeWindow,
  referenceDate: Date = new Date()
): CalculatedMemoryCandidate[] {
  const events = filterEventsInWindow(allEvents, timeWindow, referenceDate);
  const terminalEvents = events.filter((e) =>
    [
      BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
      BusinessEventType.PAYMENT_COMMITMENT_PARTIALLY_FULFILLED,
      BusinessEventType.PAYMENT_COMMITMENT_MISSED,
    ].includes(e.type as any)
  );

  if (terminalEvents.length < 2) {
    return [];
  }

  const missedEvents = terminalEvents.filter(
    (e) => e.type === BusinessEventType.PAYMENT_COMMITMENT_MISSED
  );

  if (missedEvents.length === 0) {
    return [];
  }

  const sorted = [...terminalEvents].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );
  const total = terminalEvents.length;
  const missedCount = missedEvents.length;
  const rate = Math.round((missedCount / total) * 100) / 100;
  const firstObservedAt = new Date(sorted[0].occurredAt);
  const lastObservedAt = new Date(sorted[sorted.length - 1].occurredAt);
  const windowLabel = formatWindowLabel(timeWindow);

  const statement = `Customer missed ${missedCount} of ${total} payment commitments ${windowLabel}.`;

  return [
    {
      category: MemoryCategory.COMMITMENT_BEHAVIOR,
      type: MemoryType.PAYMENT_COMMITMENT_MISSED_RATE,
      timeWindow,
      statement,
      value: {
        missed: missedCount,
        total,
        rate,
      },
      currency: null,
      firstObservedAt,
      lastObservedAt,
      evidenceEventIds: missedEvents.map((e) => e.id),
    },
  ];
}

/**
 * 3. PAYMENT_TIMELINESS
 * Measures average delay or lead time between commitment promisedFor and actual payment date.
 * Threshold: At least 2 fulfilled commitments with explicit promisedFor and paidAt / occurredAt.
 */
export function calculatePaymentTimeliness(
  allEvents: BusinessEvent[],
  timeWindow: MemoryTimeWindow,
  referenceDate: Date = new Date()
): CalculatedMemoryCandidate[] {
  const events = filterEventsInWindow(allEvents, timeWindow, referenceDate);
  const fulfilledEvents = events.filter(
    (e) => e.type === BusinessEventType.PAYMENT_COMMITMENT_FULFILLED
  );

  const timelinessSamples: { event: BusinessEvent; diffDays: number }[] = [];

  for (const e of fulfilledEvents) {
    const data = (e.data as any) || {};
    if (data.promisedFor) {
      const promisedDate = new Date(data.promisedFor);
      const paidDate = data.paidAt ? new Date(data.paidAt) : new Date(e.occurredAt);

      // Compare calendar date difference in days
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffDays = Math.round(
        (paidDate.setHours(0, 0, 0, 0) - promisedDate.setHours(0, 0, 0, 0)) / msPerDay
      );

      timelinessSamples.push({ event: e, diffDays });
    }
  }

  if (timelinessSamples.length < 2) {
    return [];
  }

  const sumDays = timelinessSamples.reduce((acc, s) => acc + s.diffDays, 0);
  const avgDays = Math.round((sumDays / timelinessSamples.length) * 10) / 10;
  const sampleSize = timelinessSamples.length;

  let statement: string;
  const windowLabel = formatWindowLabel(timeWindow);

  if (avgDays === 0) {
    statement = `Customer historically pays on the exact promised commitment date (${sampleSize} observations ${windowLabel}).`;
  } else if (avgDays > 0) {
    const daysWord = avgDays === 1 ? 'day' : 'days';
    statement = `Customer historically pays ${avgDays} ${daysWord} after the promised commitment date (${sampleSize} observations ${windowLabel}).`;
  } else {
    const absDays = Math.abs(avgDays);
    const daysWord = absDays === 1 ? 'day' : 'days';
    statement = `Customer historically pays ${absDays} ${daysWord} before the promised commitment date (${sampleSize} observations ${windowLabel}).`;
  }

  const sortedEvents = timelinessSamples
    .map((s) => s.event)
    .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  return [
    {
      category: MemoryCategory.PAYMENT_BEHAVIOR,
      type: MemoryType.PAYMENT_TIMELINESS,
      timeWindow,
      statement,
      value: {
        averageDaysDifference: avgDays,
        sampleSize,
      },
      currency: null,
      firstObservedAt: new Date(sortedEvents[0].occurredAt),
      lastObservedAt: new Date(sortedEvents[sortedEvents.length - 1].occurredAt),
      evidenceEventIds: sortedEvents.map((e) => e.id),
    },
  ];
}

/**
 * 4. PARTIAL_PAYMENT_PATTERN
 * Threshold: At least 2 payment-related events, and at least 1 partial payment.
 */
export function calculatePartialPaymentPattern(
  allEvents: BusinessEvent[],
  timeWindow: MemoryTimeWindow,
  referenceDate: Date = new Date()
): CalculatedMemoryCandidate[] {
  const events = filterEventsInWindow(allEvents, timeWindow, referenceDate);
  const paymentEvents = events.filter((e) =>
    [
      BusinessEventType.PAYMENT_CONFIRMED,
      BusinessEventType.RECEIVABLE_PAID,
      BusinessEventType.RECEIVABLE_PARTIALLY_PAID,
      BusinessEventType.PAYMENT_COMMITMENT_FULFILLED,
      BusinessEventType.PAYMENT_COMMITMENT_PARTIALLY_FULFILLED,
    ].includes(e.type as any)
  );

  if (paymentEvents.length < 2) {
    return [];
  }

  const partialEvents = paymentEvents.filter((e) =>
    [
      BusinessEventType.RECEIVABLE_PARTIALLY_PAID,
      BusinessEventType.PAYMENT_COMMITMENT_PARTIALLY_FULFILLED,
    ].includes(e.type as any)
  );

  if (partialEvents.length === 0) {
    return [];
  }

  const total = paymentEvents.length;
  const partialCount = partialEvents.length;
  const rate = Math.round((partialCount / total) * 100) / 100;
  const windowLabel = formatWindowLabel(timeWindow);

  const sorted = [...partialEvents].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );

  const statement = `Customer made partial payments on ${partialCount} of ${total} payment events ${windowLabel}.`;

  return [
    {
      category: MemoryCategory.PAYMENT_BEHAVIOR,
      type: MemoryType.PARTIAL_PAYMENT_PATTERN,
      timeWindow,
      statement,
      value: {
        partialCount,
        total,
        rate,
      },
      currency: null,
      firstObservedAt: new Date(sorted[0].occurredAt),
      lastObservedAt: new Date(sorted[sorted.length - 1].occurredAt),
      evidenceEventIds: sorted.map((e) => e.id),
    },
  ];
}

/**
 * 5. COLLECTION_RESPONSE_PATTERN
 * Threshold: At least 2 collection activities on a channel.
 */
export function calculateCollectionResponsePattern(
  allEvents: BusinessEvent[],
  timeWindow: MemoryTimeWindow,
  referenceDate: Date = new Date()
): CalculatedMemoryCandidate[] {
  const events = filterEventsInWindow(allEvents, timeWindow, referenceDate);
  const activityEvents = events.filter(
    (e) => e.type === BusinessEventType.COLLECTION_ACTIVITY_RECORDED
  );

  if (activityEvents.length < 2) {
    return [];
  }

  // Group by channel
  const channelGroups = new Map<string, BusinessEvent[]>();
  for (const e of activityEvents) {
    const data = (e.data as any) || {};
    const channel = data.channel || 'OTHER';
    if (!channelGroups.has(channel)) channelGroups.set(channel, []);
    channelGroups.get(channel)!.push(e);
  }

  const results: CalculatedMemoryCandidate[] = [];
  const responsiveOutcomes = ['CONTACTED', 'PROMISED_PAYMENT', 'DISPUTED'];

  for (const [channel, channelEvents] of channelGroups.entries()) {
    if (channelEvents.length < 2) continue;

    const respondedEvents = channelEvents.filter((e) => {
      const outcome = (e.data as any)?.outcome;
      return responsiveOutcomes.includes(outcome);
    });

    const respondedCount = respondedEvents.length;
    const total = channelEvents.length;
    const responseRate = Math.round((respondedCount / total) * 100) / 100;

    const sorted = [...channelEvents].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    );
    const windowLabel = formatWindowLabel(timeWindow);
    const formattedChannel = channel.replace(/_/g, ' ').toLowerCase();

    const statement = `Customer responded to ${respondedCount} of ${total} recent ${formattedChannel} collection interactions ${windowLabel}.`;

    results.push({
      category: MemoryCategory.COLLECTION_BEHAVIOR,
      type: MemoryType.COLLECTION_RESPONSE_PATTERN,
      timeWindow,
      statement,
      value: {
        channel,
        respondedCount,
        total,
        responseRate,
      },
      currency: null,
      firstObservedAt: new Date(sorted[0].occurredAt),
      lastObservedAt: new Date(sorted[sorted.length - 1].occurredAt),
      evidenceEventIds: sorted.map((e) => e.id),
    });
  }

  return results;
}

/**
 * 6. RECEIVABLE_OVERDUE_PATTERN
 * Threshold: At least 2 receivables created, and overdue count > 0.
 */
export function calculateReceivableOverduePattern(
  allEvents: BusinessEvent[],
  timeWindow: MemoryTimeWindow,
  referenceDate: Date = new Date()
): CalculatedMemoryCandidate[] {
  const events = filterEventsInWindow(allEvents, timeWindow, referenceDate);
  const receivableCreatedEvents = events.filter(
    (e) => e.type === BusinessEventType.RECEIVABLE_CREATED
  );
  const receivableOverdueEvents = events.filter(
    (e) => e.type === BusinessEventType.RECEIVABLE_OVERDUE
  );

  if (receivableCreatedEvents.length < 2 || receivableOverdueEvents.length === 0) {
    return [];
  }

  const totalReceivables = receivableCreatedEvents.length;
  const overdueCount = receivableOverdueEvents.length;
  const rate = Math.round((overdueCount / totalReceivables) * 100) / 100;
  const windowLabel = formatWindowLabel(timeWindow);

  const sorted = [...receivableOverdueEvents].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );

  const statement = `${overdueCount} of ${totalReceivables} receivables became overdue ${windowLabel}.`;

  return [
    {
      category: MemoryCategory.RECEIVABLE_HISTORY,
      type: MemoryType.RECEIVABLE_OVERDUE_PATTERN,
      timeWindow,
      statement,
      value: {
        overdueCount,
        totalReceivables,
        rate,
      },
      currency: null,
      firstObservedAt: new Date(sorted[0].occurredAt),
      lastObservedAt: new Date(sorted[sorted.length - 1].occurredAt),
      evidenceEventIds: sorted.map((e) => e.id),
    },
  ];
}

/**
 * 7. CUSTOMER_ACTIVITY_PATTERN
 * Threshold: At least 3 collection activities.
 */
export function calculateCustomerActivityPattern(
  allEvents: BusinessEvent[],
  timeWindow: MemoryTimeWindow,
  referenceDate: Date = new Date()
): CalculatedMemoryCandidate[] {
  const events = filterEventsInWindow(allEvents, timeWindow, referenceDate);
  const activityEvents = events.filter(
    (e) => e.type === BusinessEventType.COLLECTION_ACTIVITY_RECORDED
  );

  if (activityEvents.length < 3) {
    return [];
  }

  const total = activityEvents.length;
  const sorted = [...activityEvents].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );
  const windowLabel = formatWindowLabel(timeWindow);

  const statement = `Customer had ${total} collection interactions ${windowLabel}.`;

  return [
    {
      category: MemoryCategory.CUSTOMER_ACTIVITY,
      type: MemoryType.CUSTOMER_ACTIVITY_PATTERN,
      timeWindow,
      statement,
      value: {
        totalInteractions: total,
      },
      currency: null,
      firstObservedAt: new Date(sorted[0].occurredAt),
      lastObservedAt: new Date(sorted[sorted.length - 1].occurredAt),
      evidenceEventIds: sorted.map((e) => e.id),
    },
  ];
}

export const APP_CONFIG = {
  appName: 'Netify',
  tagline: 'AI Collections + Business Memory for African SMEs',
  corePromise: 'Know who owes you. Remember what they promised. Know who needs attention. Get paid.',
  version: '1.0.0',
  apiPrefix: '/api/v1',
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

export const RISK_THRESHOLDS = {
  LOW: { minScore: 0, maxScore: 25, label: 'Low Risk', color: '#10B981' },
  MEDIUM: { minScore: 26, maxScore: 50, label: 'Medium Risk', color: '#F59E0B' },
  HIGH: { minScore: 51, maxScore: 75, label: 'High Risk', color: '#EF4444' },
  CRITICAL: { minScore: 76, maxScore: 100, label: 'Critical Risk', color: '#991B1B' },
} as const;

export const AGING_BUCKETS = {
  CURRENT: { label: 'Current (0-30 days)', minDays: 0, maxDays: 30 },
  OVERDUE_30: { label: '31-60 days', minDays: 31, maxDays: 60 },
  OVERDUE_60: { label: '61-90 days', minDays: 61, maxDays: 90 },
  OVERDUE_90_PLUS: { label: '90+ days', minDays: 91, maxDays: Infinity },
} as const;

export const COLLECTION_PRIORITY_WEIGHTS = {
  amountWeight: 0.35,
  overdueDaysWeight: 0.30,
  riskWeight: 0.20,
  missedCommitmentsWeight: 0.15,
} as const;

import { z } from 'zod';

export const NotificationChannelEnum = z.enum(['IN_APP', 'PUSH', 'EMAIL']);
export type NotificationChannel = z.infer<typeof NotificationChannelEnum>;

export const NotificationStatusEnum = z.enum([
  'PENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'READ',
]);
export type NotificationStatus = z.infer<typeof NotificationStatusEnum>;

export const NotificationPriorityEnum = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export type NotificationPriority = z.infer<typeof NotificationPriorityEnum>;

export const BusinessSignalTypeEnum = z.enum([
  'RECEIVABLE_OVERDUE',
  'PAYMENT_RECEIVED',
  'PROMISE_DUE',
  'PROMISE_MISSED',
  'COLLECTION_FOLLOWUP_DUE',
  'HIGH_PRIORITY_COLLECTION',
  'IMPORTANT_BUSINESS_CHANGE',
  'SYSTEM_ALERT',
]);
export type BusinessSignalType = z.infer<typeof BusinessSignalTypeEnum>;

export const NotificationCategoryEnum = z.enum([
  'ALL',
  'RISK',
  'PAYMENT',
  'COMMITMENT',
  'AI',
  'SYSTEM',
]);
export type NotificationCategory = z.infer<typeof NotificationCategoryEnum>;

export const notificationQuerySchema = z.object({
  status: NotificationStatusEnum.optional(),
  channel: NotificationChannelEnum.optional(),
  signalType: BusinessSignalTypeEnum.optional(),
  priority: NotificationPriorityEnum.optional(),
  category: NotificationCategoryEnum.optional(),
  search: z.string().optional(),
  unreadOnly: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;

export const registerPushTokenSchema = z.object({
  token: z.string().min(5, 'Push token must not be empty'),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
  deviceInfo: z.record(z.any()).optional(),
});
export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;

export const markNotificationReadSchema = z.object({
  id: z.string().uuid('Notification ID must be a valid UUID'),
});
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;

export const bulkNotificationActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one notification ID is required'),
  action: z.enum(['READ', 'DELETE']),
});
export type BulkNotificationActionInput = z.infer<typeof bulkNotificationActionSchema>;

export const notificationPreferencesSchema = z.object({
  soundEnabled: z.boolean().optional(),
  emailAlertsEnabled: z.boolean().optional(),
  pushAlertsEnabled: z.boolean().optional(),
  urgentRiskAlerts: z.boolean().optional(),
  paymentConfirmations: z.boolean().optional(),
  commitmentReminders: z.boolean().optional(),
  aiCopilotBriefings: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
});
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

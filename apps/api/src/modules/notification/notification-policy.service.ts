import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { prisma, NotificationChannel, NotificationPriority } from '@netify/database';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './push-notification.service';
import { OneSignalService } from './onesignal.service';
import { EmailService } from '../email/email.service';
import { BusinessSignal } from '../signal/signal-detection.service';
import { renderNotificationEmail } from '../email/templates/notification.template';

@Injectable()
export class NotificationPolicyService {
  private readonly logger = new Logger(NotificationPolicyService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushService: PushNotificationService,
    private readonly oneSignalService: OneSignalService,
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService
  ) {}

  /**
   * Check if current time falls inside the user's configured quiet hours.
   */
  private async isInQuietHours(organizationId: string, userId?: string | null): Promise<boolean> {
    if (!userId) return false;
    try {
      const prefs = await this.notificationService.getPreferences(organizationId, userId);
      if (!prefs.quietHoursEnabled) return false;

      const now = new Date();
      const hour = now.getHours();
      const start = parseInt((prefs.quietHoursStart || '22').split(':')[0], 10);
      const end = parseInt((prefs.quietHoursEnd || '08').split(':')[0], 10);

      // Handle midnight wrap-around (e.g. 22:00 → 08:00)
      if (start > end) return hour >= start || hour < end;
      return hour >= start && hour < end;
    } catch {
      return false;
    }
  }

  /**
   * Resolve user details for email / SMS.
   */
  private async resolveUser(
    organizationId: string,
    userId?: string | null
  ): Promise<{ email?: string; firstName?: string; phoneNumber?: string } | null> {
    if (userId) {
      return prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, phoneNumber: true } as any,
      }) as any;
    }

    // Fall back to org owner
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          where: { role: 'OWNER' },
          include: {
            user: { select: { email: true, firstName: true, phoneNumber: true } as any },
          },
          take: 1,
        },
      },
    });
    return (org as any)?.memberships?.[0]?.user || null;
  }

  /**
   * Routes a business signal across all notification channels with deduplication, quiet hours,
   * and granular user notification preferences.
   */
  async handleSignal(signal: BusinessSignal): Promise<{
    inAppCreated: boolean;
    pushSent: boolean;
    emailSent: boolean;
    smsSent: boolean;
  }> {
    const result = {
      inAppCreated: false,
      pushSent: false,
      emailSent: false,
      smsSent: false,
    };

    try {
      // ── 1. IN-APP (always created, real-time SSE stream) ──
      const inAppNotif = await this.notificationService.createDeduplicated({
        organizationId: signal.organizationId,
        userId: signal.userId || null,
        type: 'BUSINESS_SIGNAL',
        signalType: signal.signalType,
        title: signal.title,
        body: signal.body,
        priority: signal.priority,
        channel: NotificationChannel.IN_APP,
        data: signal.data || {},
        idempotencyKey: signal.idempotencyKey,
      });

      if (inAppNotif) result.inAppCreated = true;

      // Fetch user preferences
      const prefs = signal.userId
        ? await this.notificationService.getPreferences(signal.organizationId, signal.userId)
        : null;

      // Check Category-level preferences
      if (prefs) {
        if (
          (signal.signalType === 'PROMISE_MISSED' ||
            signal.signalType === 'RECEIVABLE_OVERDUE' ||
            signal.signalType === 'HIGH_PRIORITY_COLLECTION' ||
            signal.signalType === 'COLLECTION_FOLLOWUP_DUE') &&
          prefs.urgentRiskAlerts === false
        ) {
          return result;
        }

        if (signal.signalType === 'PAYMENT_RECEIVED' && prefs.paymentConfirmations === false) {
          return result;
        }

        if (signal.signalType === 'PROMISE_DUE' && prefs.commitmentReminders === false) {
          return result;
        }

        if (signal.signalType === 'IMPORTANT_BUSINESS_CHANGE' && prefs.aiCopilotBriefings === false) {
          return result;
        }
      }

      // Check quiet hours before external channels (Push, Email, SMS)
      const inQuietHours = await this.isInQuietHours(signal.organizationId, signal.userId);
      if (inQuietHours) {
        this.logger.log(`Quiet hours active — skipping push/email/SMS for signal ${signal.signalType}`);
        return result;
      }

      // Resolve user for email + SMS
      const user = await this.resolveUser(signal.organizationId, signal.userId);

      // ── 2. WEB PUSH via OneSignal (HIGH + MEDIUM) ──
      const pushEnabled = !prefs || prefs.pushAlertsEnabled !== false;
      if (
        pushEnabled &&
        (signal.priority === NotificationPriority.HIGH ||
          signal.priority === NotificationPriority.MEDIUM)
      ) {
        if (signal.userId) {
          const pushResult = await this.oneSignalService.sendWebPush({
            externalUserId: signal.userId,
            title: signal.title,
            body: signal.body,
            data: { ...signal.data, signalType: signal.signalType },
          });
          result.pushSent = pushResult.success;
        }

        // Also dispatch via legacy Expo push (for any registered mobile tokens)
        const expoResult = await this.pushService.sendPushNotification(
          signal.organizationId,
          signal.userId,
          { title: signal.title, body: signal.body, data: { ...signal.data, signalType: signal.signalType } }
        );
        if (expoResult.sentCount > 0) result.pushSent = true;
      }

      // ── 3. EMAIL via Resend (HIGH + MEDIUM) — rich branded template ──
      const emailEnabled = !prefs || prefs.emailAlertsEnabled !== false;
      if (
        emailEnabled &&
        (signal.priority === NotificationPriority.HIGH ||
          signal.priority === NotificationPriority.MEDIUM) &&
        user?.email
      ) {
        const emailTemplate = renderNotificationEmail({
          firstName: user.firstName || 'there',
          title: signal.title,
          body: signal.body,
          signalType: signal.signalType,
          priority: signal.priority as 'HIGH' | 'MEDIUM' | 'LOW',
          data: signal.data,
        });

        const emailResult = await this.emailService.sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
        result.emailSent = emailResult.success;
      }

      // ── 4. SMS via OneSignal (HIGH priority only, if phone on file) ──
      const smsEnabled = !prefs || (prefs as any).smsEnabled !== false;
      if (smsEnabled && signal.priority === NotificationPriority.HIGH && (user as any)?.phoneNumber) {
        const smsBody = `Netify Alert: ${signal.title}. ${signal.body.slice(0, 120)} — app.netify.africa`;
        const smsResult = await this.oneSignalService.sendSms({
          phoneNumber: (user as any).phoneNumber,
          body: smsBody,
        });
        result.smsSent = smsResult.success;
      }
    } catch (err: any) {
      this.logger.error(`Error in notification policy handling signal: ${err.message}`, err.stack);
    }

    return result;
  }
}




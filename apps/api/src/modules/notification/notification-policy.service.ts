import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { prisma, NotificationChannel, NotificationPriority } from '@netify/database';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './push-notification.service';
import { EmailService } from '../email/email.service';
import { BusinessSignal } from '../signal/signal-detection.service';

@Injectable()
export class NotificationPolicyService {
  private readonly logger = new Logger(NotificationPolicyService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushService: PushNotificationService,
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService
  ) {}

  /**
   * Routes a business signal across appropriate notification channels with deduplication.
   */
  async handleSignal(signal: BusinessSignal): Promise<{
    inAppCreated: boolean;
    pushSent: boolean;
    emailSent: boolean;
  }> {
    const result = {
      inAppCreated: false,
      pushSent: false,
      emailSent: false,
    };

    try {
      // 1. Channel: IN_APP (Always created with idempotency)
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

      if (inAppNotif) {
        result.inAppCreated = true;
      }

      // 2. Channel: PUSH (Dispatched if priority is HIGH or MEDIUM)
      if (signal.priority === NotificationPriority.HIGH || signal.priority === NotificationPriority.MEDIUM) {
        const pushResult = await this.pushService.sendPushNotification(
          signal.organizationId,
          signal.userId,
          {
            title: signal.title,
            body: signal.body,
            data: {
              ...signal.data,
              signalType: signal.signalType,
            },
          }
        );
        result.pushSent = pushResult.sentCount > 0;
      }

      // 3. Channel: EMAIL via Resend (Dispatched for HIGH priority signals)
      if (signal.priority === NotificationPriority.HIGH) {
        // Resolve recipient email from user or organization owners
        const user = signal.userId
          ? await prisma.user.findUnique({
              where: { id: signal.userId },
              select: { email: true, firstName: true, lastName: true },
            })
          : await prisma.organization
              .findUnique({
                where: { id: signal.organizationId },
                include: {
                  memberships: {
                    where: { role: 'OWNER' },
                    include: {
                      user: {
                        select: { email: true, firstName: true, lastName: true },
                      },
                    },
                    take: 1,
                  },
                },
              })
              .then((org: any) => org?.memberships?.[0]?.user);

        if (user?.email) {
          const emailDelivery = await this.emailService.sendEmail({
            to: user.email,
            subject: `[Netify Alert] ${signal.title}`,
            text: `${signal.body}\n\nView details in Netify: https://netify.africa/app`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #001D31; color: #ffffff; border-radius: 8px;">
                <h2 style="color: #00E5FF; margin-top: 0;">Netify Business Alert</h2>
                <div style="background-color: #002B49; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #00E5FF;">
                  <h3 style="margin-top: 0; color: #ffffff;">${signal.title}</h3>
                  <p style="color: #E2E8F0; font-size: 15px; line-height: 1.5;">${signal.body}</p>
                </div>
                <p style="color: #94A3B8; font-size: 12px; margin-top: 30px;">
                  This is an automated notification from your Netify Business Command Center.
                </p>
              </div>
            `,
          });
          result.emailSent = emailDelivery.success;
        }
      }
    } catch (err: any) {
      this.logger.error(`Error in notification policy handling signal: ${err.message}`, err.stack);
    }

    return result;
  }
}

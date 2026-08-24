import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@netify/database';

export interface PushNotificationPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

  /**
   * Registers or updates an active push token for a user and organization.
   */
  async registerToken(
    organizationId: string,
    userId: string,
    token: string,
    platform: string = 'android',
    deviceInfo?: Record<string, any>
  ) {
    if (!token || !token.trim()) {
      return null;
    }

    return prisma.devicePushToken.upsert({
      where: {
        userId_token: {
          userId,
          token: token.trim(),
        },
      },
      update: {
        organizationId,
        platform,
        deviceInfo: deviceInfo || {},
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        organizationId,
        userId,
        token: token.trim(),
        platform,
        deviceInfo: deviceInfo || {},
        isActive: true,
      },
    });
  }

  /**
   * Deactivates a push token (e.g. upon user logout).
   */
  async deactivateToken(userId: string, token: string) {
    return prisma.devicePushToken.updateMany({
      where: { userId, token },
      data: { isActive: false },
    });
  }

  /**
   * Dispatches push notifications to all active device tokens for the user/organization.
   */
  async sendPushNotification(
    organizationId: string,
    userId: string | null | undefined,
    payload: { title: string; body: string; data?: Record<string, any> }
  ): Promise<{ sentCount: number }> {
    try {
      const tokenRecords = await prisma.devicePushToken.findMany({
        where: {
          organizationId,
          ...(userId ? { userId } : {}),
          isActive: true,
        },
        select: { id: true, token: true },
      });

      if (!tokenRecords.length) {
        return { sentCount: 0 };
      }

      const tokens = tokenRecords.map((t) => t.token).filter((t) => t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'));

      if (!tokens.length) {
        return { sentCount: 0 };
      }

      const messages = tokens.map((token) => ({
        to: token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        priority: 'high',
      }));

      const response = await fetch(this.expoPushUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`Expo push gateway returned HTTP ${response.status}: ${errorText}`);
        return { sentCount: 0 };
      }

      const result: any = await response.json();
      this.logger.log(`Dispatched ${tokens.length} push notification(s) successfully.`);
      return { sentCount: tokens.length };
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch push notification: ${err.message}`);
      return { sentCount: 0 };
    }
  }
}

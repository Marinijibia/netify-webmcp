import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OneSignalPushPayload {
  externalUserId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  url?: string;
}

export interface OneSignalSmsPayload {
  phoneNumber: string;
  body: string;
}

@Injectable()
export class OneSignalService {
  private readonly logger = new Logger(OneSignalService.name);
  private readonly appId: string | null;
  private readonly restApiKey: string | null;
  private readonly baseUrl = 'https://api.onesignal.com/notifications';
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('ONESIGNAL_APP_ID') || null;
    this.restApiKey = this.configService.get<string>('ONESIGNAL_REST_API_KEY') || null;
    this.appUrl =
      this.configService.get<string>('APP_URL') || 'https://app.netify.africa';

    if (this.appId && this.restApiKey) {
      this.logger.log('OneSignal initialized — Web Push + SMS ready.');
    } else {
      this.logger.warn(
        'ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY not configured. Push notifications disabled.'
      );
    }
  }

  private get isConfigured(): boolean {
    return !!(this.appId && this.restApiKey);
  }

  /**
   * Helper to build contextual action buttons for OS push notifications.
   */
  private getWebButtons(data?: Record<string, any>): Array<{ id: string; text: string; url: string }> {
    if (!data) return [];
    const signalType = data.signalType;
    const buttons: Array<{ id: string; text: string; url: string }> = [];

    if (signalType === 'PROMISE_MISSED') {
      buttons.push({
        id: 'draft-followup',
        text: '💬 Draft Reminder',
        url: `${this.appUrl}/messages/draft`,
      });
      if (data.customerId) {
        buttons.push({
          id: 'view-customer',
          text: '👁️ View Customer',
          url: `${this.appUrl}/customers/${data.customerId}`,
        });
      }
    } else if (signalType === 'RECEIVABLE_OVERDUE' || signalType === 'HIGH_PRIORITY_COLLECTION') {
      if (data.receivableId) {
        buttons.push({
          id: 'view-invoice',
          text: '📄 View Invoice',
          url: `${this.appUrl}/receivables/${data.receivableId}`,
        });
      }
      if (data.customerId) {
        buttons.push({
          id: 'customer-ledger',
          text: '📊 Customer Ledger',
          url: `${this.appUrl}/customers/${data.customerId}`,
        });
      }
    } else if (signalType === 'PAYMENT_RECEIVED') {
      buttons.push({
        id: 'view-receivables',
        text: '💰 View Receivables',
        url: `${this.appUrl}/receivables`,
      });
      if (data.customerId) {
        buttons.push({
          id: 'customer-ledger',
          text: '📊 Open Ledger',
          url: `${this.appUrl}/customers/${data.customerId}`,
        });
      }
    } else if (signalType === 'PROMISE_DUE') {
      if (data.customerId) {
        buttons.push({
          id: 'view-customer',
          text: '📞 View Debtor',
          url: `${this.appUrl}/customers/${data.customerId}`,
        });
      }
      buttons.push({
        id: 'open-notifications',
        text: '🔔 Open Center',
        url: `${this.appUrl}/notifications`,
      });
    }

    return buttons.slice(0, 2);
  }

  /**
   * Send a web push notification to a specific user by their external ID (Netify user UUID).
   * Includes OS-level Action Buttons and high-DPI Netify brand icons.
   */
  async sendWebPush(payload: OneSignalPushPayload): Promise<{ success: boolean; id?: string }> {
    if (!this.isConfigured) return { success: false };

    try {
      const buttons = this.getWebButtons(payload.data);

      const body: any = {
        app_id: this.appId,
        target_channel: 'push',
        include_aliases: {
          external_id: [payload.externalUserId],
        },
        headings: { en: payload.title },
        contents: { en: payload.body },
        data: payload.data || {},
        url: payload.url || `${this.appUrl}/notifications`,
        chrome_web_icon: `${this.appUrl}/icon.png`,
        chrome_web_badge: `${this.appUrl}/favicon.png`,
        firefox_icon: `${this.appUrl}/icon.png`,
        web_push_topic: 'netify-alert',
        ttl: 86400,
      };

      if (buttons.length > 0) {
        body.web_buttons = buttons;
      }

      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${this.restApiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.warn(`OneSignal push failed: HTTP ${res.status}: ${errorText}`);
        return { success: false };
      }

      const result: any = await res.json();
      this.logger.log(`OneSignal push sent to user ${payload.externalUserId}: id=${result.id}`);
      return { success: true, id: result.id };
    } catch (err: any) {
      this.logger.error(`OneSignal push error: ${err.message}`);
      return { success: false };
    }
  }

  /**
   * Send an SMS notification to a phone number via OneSignal's SMS channel.
   * Requires SMS channel to be configured in the OneSignal dashboard.
   */
  async sendSms(payload: OneSignalSmsPayload): Promise<{ success: boolean }> {
    if (!this.isConfigured) return { success: false };

    const phone = payload.phoneNumber.replace(/\s+/g, '').trim();
    if (!phone) return { success: false };

    // Normalize to E.164 format — add +234 if Nigerian number without country code
    const normalizedPhone = phone.startsWith('+') ? phone : `+234${phone.replace(/^0/, '')}`;

    try {
      const body = {
        app_id: this.appId,
        target_channel: 'sms',
        include_phone_numbers: [normalizedPhone],
        contents: { en: payload.body },
        name: 'Netify Business Alert',
      };

      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${this.restApiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.warn(`OneSignal SMS failed: HTTP ${res.status}: ${errorText}`);
        return { success: false };
      }

      this.logger.log(`OneSignal SMS sent to ${normalizedPhone}`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`OneSignal SMS error: ${err.message}`);
      return { success: false };
    }
  }

  /**
   * Broadcast a push notification to all members of an organization segment.
   */
  async sendToOrganization(
    organizationId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ success: boolean }> {
    if (!this.isConfigured) return { success: false };

    try {
      const payload = {
        app_id: this.appId,
        target_channel: 'push',
        // Use data filter to target users tagged with this organizationId
        filters: [{ field: 'tag', key: 'organizationId', relation: '=', value: organizationId }],
        headings: { en: title },
        contents: { en: body },
        data: { ...data, organizationId },
        url: `${this.appUrl}/notifications`,
      };

      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${this.restApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.warn(`OneSignal org broadcast failed: HTTP ${res.status}: ${errorText}`);
        return { success: false };
      }

      return { success: true };
    } catch (err: any) {
      this.logger.error(`OneSignal org broadcast error: ${err.message}`);
      return { success: false };
    }
  }
}

'use client';

// OneSignal Web SDK wrapper for Netify
// Docs: https://documentation.onesignal.com/docs/web-push-quickstart

const PKG = '@onesignal/onesignal-web-v16';
let isInitialized = false;

async function getSDK(): Promise<any> {
  if (typeof window === 'undefined') return null;
  try {
    const mod = await import(/* webpackChunkName: "onesignal" */ PKG);
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

/**
 * Initialize OneSignal and link this browser session to the Netify user.
 * Called once after successful login (non-blocking).
 */
export async function initOneSignal(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] NEXT_PUBLIC_ONESIGNAL_APP_ID not set — push disabled.');
    return;
  }

  try {
    const OneSignal = await getSDK();
    if (!OneSignal) return;

    if (!isInitialized) {
      await OneSignal.init({
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        notifyButton: { enable: false },
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: 'push',
                autoPrompt: false,
                text: {
                  actionMessage:
                    'Get instant alerts when customers miss payment promises or invoices become overdue.',
                  acceptButton: 'Allow Alerts',
                  cancelButton: 'Not Now',
                },
              },
            ],
          },
        },
      } as any);
      isInitialized = true;
    }

    // Link this browser to the logged-in Netify user ID
    await OneSignal.login(userId);
  } catch (err: any) {
    console.warn('[OneSignal] Init failed:', err?.message);
  }
}

/**
 * Prompt the user with the push permission slidedown.
 * Call this from the Settings page or a "Turn on alerts" button.
 */
export async function promptForPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const OneSignal = await getSDK();
    if (!OneSignal) return false;
    const already = await OneSignal.Notifications.permission;
    if (already) return true;
    await OneSignal.Slidedown.promptPush();
    return OneSignal.Notifications.permission;
  } catch {
    return false;
  }
}

/**
 * Get current push permission state.
 */
export async function getPushPermissionState(): Promise<'granted' | 'denied' | 'default'> {
  if (typeof window === 'undefined') return 'default';
  try {
    const OneSignal = await getSDK();
    if (!OneSignal) return 'default';
    const granted = await OneSignal.Notifications.permission;
    if (granted) return 'granted';
    return (Notification.permission as 'granted' | 'denied' | 'default') || 'default';
  } catch {
    return 'default';
  }
}

/**
 * Unlink this browser from the Netify user on logout.
 */
export async function logoutOneSignal(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const OneSignal = await getSDK();
    if (!OneSignal) return;
    await OneSignal.logout();
    isInitialized = false;
  } catch {
    // silently fail — not critical
  }
}

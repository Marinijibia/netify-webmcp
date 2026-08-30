import { Linking, Platform } from 'react-native';

/**
 * Standardizes a phone number for direct tel: or WhatsApp links.
 * Converts local Nigerian formats (e.g. 08031234567) into international E.164 (2348031234567)
 * without the leading plus for WhatsApp, while stripping all non-digits.
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return '234' + digits.slice(1);
  }
  if (digits.startsWith('234') && digits.length === 13) {
    return digits;
  }
  return digits;
}

/**
 * Clean phone number for visual UI display.
 */
export function formatDisplayPhone(phone?: string | null): string {
  if (!phone) return 'No phone recorded';
  const clean = sanitizePhoneNumber(phone);
  if (clean.startsWith('234') && clean.length === 13) {
    return `+234 ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
  }
  return phone;
}

/**
 * Launches WhatsApp on Android / iOS with pre-filled message text.
 * Tries the native app URL scheme (whatsapp://send) first, then falls back to wa.me.
 */
export async function openWhatsApp(phone?: string | null, text: string = ''): Promise<boolean> {
  const encodedText = encodeURIComponent(text);
  const cleanPhone = phone ? sanitizePhoneNumber(phone) : '';

  const nativeUrl = cleanPhone
    ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
    : `whatsapp://send?text=${encodedText}`;

  const webFallbackUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  try {
    const canOpen = await Linking.canOpenURL(nativeUrl);
    if (canOpen) {
      await Linking.openURL(nativeUrl);
      return true;
    } else {
      await Linking.openURL(webFallbackUrl);
      return true;
    }
  } catch (err) {
    // Fallback to web link
    try {
      await Linking.openURL(webFallbackUrl);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Launches native SMS app on device with recipient and body pre-filled.
 */
export async function openSms(phone?: string | null, text: string = ''): Promise<boolean> {
  const cleanPhone = phone ? sanitizePhoneNumber(phone) : '';
  const encodedText = encodeURIComponent(text);
  // iOS uses &body= whereas Android uses ?body=
  const separator = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${cleanPhone}${separator}body=${encodedText}`;

  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Launches the phone app dialer directly with the customer phone number.
 */
export async function openDialer(phone?: string | null): Promise<boolean> {
  if (!phone) return false;
  const cleanPhone = sanitizePhoneNumber(phone);
  const url = `tel:+${cleanPhone}`;

  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Launches native email client with recipient, subject, and body pre-filled.
 */
export async function openEmail(email?: string | null, subject: string = '', body: string = ''): Promise<boolean> {
  if (!email) return false;
  const url = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

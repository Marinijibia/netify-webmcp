/**
 * Deep-linking and Desktop Phone Bridge utilities for zero-cost omnichannel dispatch
 * (WhatsApp Web, Native SMS, Direct Phone Call via QR Bridge, Webmail Composers)
 */

export function sanitizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Handle Nigerian local format (e.g. 080..., 070..., 090..., 081...)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '234' + cleaned.substring(1);
  }

  return cleaned;
}

export function formatDisplayPhone(phone: string | null | undefined): string {
  if (!phone) return 'No phone registered';
  const clean = sanitizePhoneNumber(phone);
  if (clean.startsWith('234') && clean.length === 13) {
    return `+234 ${clean.substring(3, 6)} ${clean.substring(6, 9)} ${clean.substring(9)}`;
  }
  return phone;
}

/**
 * Detects whether the current client is a smartphone/tablet or a desktop/laptop browser.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isTouchMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isSmallScreen = window.innerWidth < 768 && 'ontouchstart' in window;
  return isTouchMobile || isSmallScreen;
}

/**
 * WhatsApp Mobile Deep Link (triggers app or wa.me)
 */
export function getWhatsAppUrl(phone: string | null | undefined, text: string): string {
  const clean = sanitizePhoneNumber(phone);
  if (!clean) return '';
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

/**
 * WhatsApp Web Link for desktop browsers (opens directly in web.whatsapp.com tab)
 */
export function getWhatsAppWebUrl(phone: string | null | undefined, text: string): string {
  const clean = sanitizePhoneNumber(phone);
  if (!clean) return '';
  return `https://web.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(text)}`;
}

/**
 * Native SMS link for mobile devices
 */
export function getSmsUrl(phone: string | null | undefined, text: string): string {
  const clean = sanitizePhoneNumber(phone);
  if (!clean) return '';
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';
  return `sms:${clean}${separator}body=${encodeURIComponent(text)}`;
}

/**
 * Universal QR code payload for phone dialing.
 * When scanned by iOS Camera or Android Google Lens / Samsung Camera, it prompts "Call +234...".
 */
export function getPhoneQrPayload(phone: string | null | undefined): string {
  const clean = sanitizePhoneNumber(phone);
  if (!clean) return '';
  return `tel:+${clean}`;
}

/**
 * Universal QR code payload for native SMS.
 * Standard SMSTO format recognized by all smartphone cameras.
 * When scanned, prompts "Send Message to +234..." with pre-filled text.
 */
export function getSmsQrPayload(phone: string | null | undefined, text: string): string {
  const clean = sanitizePhoneNumber(phone);
  if (!clean) return '';
  return `SMSTO:+${clean}:${text}`;
}

export function getTelUrl(phone: string | null | undefined): string {
  const clean = sanitizePhoneNumber(phone);
  if (!clean) return '';
  return `tel:+${clean}`;
}

/**
 * Direct web composer link for Gmail.
 * Eliminates empty about:blank browser tabs on desktop.
 */
export function getGmailWebUrl(email: string | null | undefined, subject: string, body: string): string {
  if (!email) return '';
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Direct web composer link for Outlook / Office 365 Web.
 */
export function getOutlookWebUrl(email: string | null | undefined, subject: string, body: string): string {
  if (!email) return '';
  return `https://outlook.live.com/default.aspx?rru=compose&to=${encodeURIComponent(email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Standard desktop mailto: link for users with native mail clients (Outlook, Thunderbird, Apple Mail).
 */
export function getMailtoUrl(email: string | null | undefined, subject: string, body: string): string {
  if (!email) return '';
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Calculates SMS segment count and character breakdown for GSM-7 vs Unicode encoding.
 */
export function calculateSmsSegments(text: string): {
  charCount: number;
  segments: number;
  charsRemaining: number;
  isUnicode: boolean;
  maxPerSegment: number;
} {
  const charCount = text.length;
  // Check for non-GSM 7-bit characters (e.g. emojis or extended unicode)
  const gsmRegex = /^[\u000A\u000D\u0020-\u007E\u00A1\u00A3\u00A4\u00A5\u00A7\u00BF\u00C4\u00C5\u00C6\u00C7\u00C9\u00D1\u00D6\u00D8\u00DC\u00DF\u00E0\u00E4\u00E5\u00E6\u00E7\u00E8\u00E9\u00EC\u00F1\u00F2\u00F6\u00F8\u00F9\u00FC]*$/;
  const isUnicode = !gsmRegex.test(text);

  const singleLimit = isUnicode ? 70 : 160;
  const multiLimit = isUnicode ? 67 : 153;

  if (charCount <= singleLimit) {
    return {
      charCount,
      segments: charCount === 0 ? 0 : 1,
      charsRemaining: singleLimit - charCount,
      isUnicode,
      maxPerSegment: singleLimit,
    };
  }

  const segments = Math.ceil(charCount / multiLimit);
  const charsRemaining = segments * multiLimit - charCount;

  return {
    charCount,
    segments,
    charsRemaining,
    isUnicode,
    maxPerSegment: multiLimit,
  };
}

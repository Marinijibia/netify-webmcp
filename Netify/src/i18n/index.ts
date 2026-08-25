import { en } from './translations/en';
import { ha } from './translations/ha';
import { yo } from './translations/yo';
import { ig } from './translations/ig';
import { pcm } from './translations/pcm';
import { ff } from './translations/ff';
import { SupportedLanguage } from './language-registry';

export * from './language-registry';

const translations: Record<SupportedLanguage, typeof en> = {
  en,
  ha,
  yo,
  ig,
  pcm,
  ff,
};

export type TranslationKey =
  | `common.${keyof typeof en.common}`
  | `commandCenter.${keyof typeof en.commandCenter}`
  | `copilot.${keyof typeof en.copilot}`
  | `nav.${keyof typeof en.nav}`;

/**
 * Translates a dot-notation key for the given language with fallback to English.
 */
export function translate(
  lang: SupportedLanguage,
  key: string,
  params?: Record<string, string | number>
): string {
  const currentDict = translations[lang] || translations.en;
  const parts = key.split('.');

  let value: any = currentDict;
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      // Fallback to English
      value = undefined;
      break;
    }
  }

  if (typeof value !== 'string') {
    let fallback: any = translations.en;
    for (const part of parts) {
      if (fallback && typeof fallback === 'object' && part in fallback) {
        fallback = fallback[part];
      } else {
        return key;
      }
    }
    value = typeof fallback === 'string' ? fallback : key;
  }

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
  }

  return value;
}

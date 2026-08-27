import {
  SupportedVoiceLanguage,
  VoiceLanguageCapability,
  ELEVENLABS_LANGUAGE_CAPABILITIES,
} from '@netify/ai';

export const VOICE_LANGUAGE_CAPABILITIES: Record<
  SupportedVoiceLanguage,
  VoiceLanguageCapability
> = ELEVENLABS_LANGUAGE_CAPABILITIES;

export function getSttCapability(
  lang: SupportedVoiceLanguage
): VoiceLanguageCapability {
  return (
    VOICE_LANGUAGE_CAPABILITIES[lang] ?? VOICE_LANGUAGE_CAPABILITIES.en
  );
}

export function getTtsCapability(
  lang: SupportedVoiceLanguage
): VoiceLanguageCapability {
  return (
    VOICE_LANGUAGE_CAPABILITIES[lang] ?? VOICE_LANGUAGE_CAPABILITIES.en
  );
}

/** Returns true if the language has at least best-effort STT support */
export function isSttSupported(lang: SupportedVoiceLanguage): boolean {
  const cap = getSttCapability(lang);
  return cap.sttSupport === 'full' || cap.sttSupport === 'best-effort';
}

/** Returns true if the language has at least best-effort TTS support */
export function isTtsSupported(lang: SupportedVoiceLanguage): boolean {
  const cap = getTtsCapability(lang);
  return cap.ttsSupport === 'full' || cap.ttsSupport === 'best-effort';
}

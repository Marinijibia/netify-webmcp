export type SupportedLanguage = 'en' | 'ha' | 'yo' | 'ig' | 'pcm';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  greeting: string;
  samplePrompt: string;
}

export const LANGUAGE_REGISTRY: Record<SupportedLanguage, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    greeting: 'Good morning',
    samplePrompt: 'Who owes me the most today?',
  },
  ha: {
    code: 'ha',
    name: 'Hausa',
    nativeName: 'Harshen Hausa',
    flag: '🇳🇬',
    greeting: 'Ina kwana',
    samplePrompt: 'Waɗanne customers ne suka fi bin mu bashi?',
  },
  yo: {
    code: 'yo',
    name: 'Yoruba',
    nativeName: 'Èdè Yorùbá',
    flag: '🇳🇬',
    greeting: 'E kaaro',
    samplePrompt: 'Awọn alabara wo ni o jẹ mi ni gbese julọ?',
  },
  ig: {
    code: 'ig',
    name: 'Igbo',
    nativeName: 'Asụsụ Igbo',
    flag: '🇳🇬',
    greeting: 'Ụtụtụ ọma',
    samplePrompt: 'Kedu ndị ahịa ji m ụgwọ kacha taa?',
  },
  pcm: {
    code: 'pcm',
    name: 'Nigerian Pidgin',
    nativeName: 'Naija Pidgin',
    flag: '🇳🇬',
    greeting: 'How far',
    samplePrompt: 'Who dey owe me pass today?',
  },
};

export const SUPPORTED_LANGUAGES: LanguageInfo[] = Object.values(LANGUAGE_REGISTRY);

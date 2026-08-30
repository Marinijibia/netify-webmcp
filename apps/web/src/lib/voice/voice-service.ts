/**
 * Netify World-Grade Voice Assistant Audio Service
 * Enterprise dual-engine speech synthesis (ElevenLabs + Web Speech fallback),
 * Web Audio API reactive frequency analysis, audio chime synthesized cues,
 * and multi-dialect Nigerian language support with zero-failure fallback.
 */

import { WebStorageService } from '../api/storage';

export type VoiceLanguage = 'en' | 'pcm' | 'ha' | 'yo' | 'ig';

export interface VisualizerData {
  frequencies: number[]; // 16 frequency bands (0 - 255)
  volume: number;        // Average volume level (0 - 1)
}

let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let resumeInterval: any = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

// Initialize voices cache
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Strips markdown symbols, code fences, and JSON brackets so speech is human-smooth.
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';

  let text = raw.trim();

  // If text is JSON or starts with { ... }, extract content
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      text = parsed.content || parsed.message || parsed.reply || parsed.summary || '';
    } catch {}
  }

  // Remove code blocks and inline code
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');

  // Convert currencies to natural spoken words
  text = text.replace(/₦\s*([\d,]+)/g, '$1 Naira');
  text = text.replace(/\$\s*([\d,]+)/g, '$1 Dollars');
  text = text.replace(/KSh\s*([\d,]+)/g, '$1 Kenyan Shillings');
  text = text.replace(/GH₵\s*([\d,]+)/g, '$1 Ghana Cedis');

  // Remove markdown headers, bullets, bold, italics, links
  text = text.replace(/^#+\s+/gm, '');
  text = text.replace(/^[-*]\s+/gm, '');
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Strip excessive whitespace
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Generates pleasant synthesized audio chime cues using the Web Audio API.
 * Zero external audio files required.
 */
export function playChime(type: 'start' | 'stop' | 'success' | 'alert'): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'start') {
      // Soft modern chime up (440Hz -> 880Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'stop') {
      // Soft chime down (880Hz -> 440Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(390, now + 0.14);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'success') {
      // Harmonic major chord chime (523Hz -> 659Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 400);
  } catch {}
}

/**
 * World-grade voice synthesizer.
 * 1. First attempts server-side neural ElevenLabs audio via POST /voice/speak.
 * 2. If ElevenLabs is unavailable, gracefully falls back to browser SpeechSynthesis with optimal voice selection.
 */
export async function speakText(
  text: string,
  language: VoiceLanguage = 'en',
  options: {
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  } = {}
): Promise<void> {
  stopSpeech();

  const sanitized = cleanTextForSpeech(text);
  if (!sanitized) return;

  const { rate = 1.0, onStart, onEnd, onError } = options;

  // 1. Try server-side ElevenLabs neural synthesis first
  try {
    const token = WebStorageService.getAccessToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const res = await fetch(`${apiUrl}/voice/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text: sanitized, language }),
    });

    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 100) {
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        activeAudio = audio;

        audio.playbackRate = rate;

        audio.onplay = () => {
          if (onStart) onStart();
        };

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          activeAudio = null;
          if (onEnd) onEnd();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          activeAudio = null;
          // Fall back to browser speech on audio error
          playWithBrowserSpeech(sanitized, language, rate, onStart, onEnd, onError);
        };

        await audio.play();
        return;
      }
    }
  } catch (err: any) {
    // ElevenLabs failed or not configured (503/404/403) - Fall back to browser Web Speech API
  }

  // 2. Client-side SpeechSynthesis fallback with voice compatibility
  playWithBrowserSpeech(sanitized, language, rate, onStart, onEnd, onError);
}

function playWithBrowserSpeech(
  text: string,
  language: VoiceLanguage,
  rate: number,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError(new Error('SpeechSynthesis not supported'));
    return;
  }

  window.speechSynthesis.cancel();
  if (resumeInterval) clearInterval(resumeInterval);

  const utterance = new SpeechSynthesisUtterance(text);
  activeUtterance = utterance;

  const langMap: Record<VoiceLanguage, string> = {
    en: 'en-US',
    pcm: 'en-NG',
    ha: 'ha-NG',
    yo: 'yo-NG',
    ig: 'ig-NG',
  };

  const targetLangCode = langMap[language] || 'en-US';
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();

  // Find exact language match first
  let matchedVoice = voices.find((v) => v.lang === targetLangCode || v.lang.startsWith(targetLangCode));

  // If no voice for African dialect exists on OS (very common), fallback to Nigerian English, UK English, or US Natural voice
  if (!matchedVoice) {
    matchedVoice =
      voices.find((v) => v.lang === 'en-NG' || v.lang.startsWith('en-NG')) ||
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Neural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('Siri'))
      ) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    // Important: set utterance.lang to English so browser doesn't drop the speech
    utterance.lang = matchedVoice ? matchedVoice.lang : 'en-US';
  } else {
    utterance.lang = targetLangCode;
  }

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.rate = rate;
  utterance.pitch = 1.0;

  // Chromium keep-alive interval for long utterances
  resumeInterval = setInterval(() => {
    if (!window.speechSynthesis.speaking) {
      clearInterval(resumeInterval);
      resumeInterval = null;
    } else {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 9000);

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (resumeInterval) clearInterval(resumeInterval);
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    if (resumeInterval) clearInterval(resumeInterval);
    activeUtterance = null;
    if (onError) onError(e);
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Stops any active speech (audio element or browser TTS).
 */
export function stopSpeech(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {}
    activeAudio = null;
  }

  if (resumeInterval) {
    clearInterval(resumeInterval);
    resumeInterval = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    activeUtterance = null;
  }
}

/**
 * Starts microphone recording with real-time Web Audio API frequency analysis
 * for dynamic audio waveform visualization.
 */
export async function startAudioVisualizer(
  onData: (data: VisualizerData) => void
): Promise<{ stream: MediaStream; stop: () => void }> {
  if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
    throw new Error('Microphone access is not supported in this browser environment.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();

  analyser.fftSize = 64; // Gives 32 frequency bins
  analyser.smoothingTimeConstant = 0.8;
  source.connect(analyser);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  let animationId: number;

  const update = () => {
    analyser.getByteFrequencyData(dataArray);

    // Pick 16 bands
    const bands: number[] = [];
    let sum = 0;
    for (let i = 0; i < 16; i++) {
      const val = dataArray[i] || 0;
      bands.push(val);
      sum += val;
    }
    const volume = Math.min(1, sum / 16 / 128);

    onData({
      frequencies: bands,
      volume,
    });

    animationId = requestAnimationFrame(update);
  };

  animationId = requestAnimationFrame(update);

  const stop = () => {
    cancelAnimationFrame(animationId);
    try {
      source.disconnect();
      analyser.disconnect();
      audioContext.close();
    } catch {}
    stream.getTracks().forEach((t) => t.stop());
  };

  return { stream, stop };
}

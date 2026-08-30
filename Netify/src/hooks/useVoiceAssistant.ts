import { useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { voiceApi } from '@/services/api/voice';
import { SupportedLanguage } from '@/i18n';

export type VoiceState =
  | 'IDLE'
  | 'REQUESTING_PERMISSION'
  | 'LISTENING'
  | 'STOPPING'
  | 'TRANSCRIBING'
  | 'PROCESSING'
  | 'GENERATING_AUDIO'
  | 'PLAYING'
  | 'ERROR'
  | 'CANCELLED'
  | 'COMPLETED';

export interface VoiceAssistantOptions {
  language: SupportedLanguage;
  /** Called with the transcribed text so the caller can send it through the AI Copilot pipeline */
  onTranscript: (transcript: string) => Promise<void>;
  /** Optional callback when AI response starts/finishes */
  onSpeechEnd?: () => void;
}

export interface VoiceAssistantHook {
  voiceState: VoiceState;
  transcript: string | null;
  errorMessage: string | null;
  recordingDurationMs: number;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  cancelRecording: () => void;
  speakText: (text: string) => Promise<void>;
  stopPlayback: () => void;
  reset: () => void;
}

export function useVoiceAssistant(options: VoiceAssistantOptions): VoiceAssistantHook {
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingDurationMs, setRecordingDurationMs] = useState(0);

  const recordingRef = useRef<any>(null);
  const soundRef = useRef<any>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartRef = useRef<number>(0);
  const cancelledRef = useRef(false);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopDurationTimer();
    setVoiceState('IDLE');
    setTranscript(null);
    setErrorMessage(null);
    setRecordingDurationMs(0);
    cancelledRef.current = false;
  }, [stopDurationTimer]);

  const stopPlayback = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.stopAsync?.().catch(() => {});
      soundRef.current.unloadAsync?.().catch(() => {});
      soundRef.current = null;
    }
    setVoiceState('IDLE');
  }, []);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    stopDurationTimer();
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync?.().catch(() => {});
      recordingRef.current = null;
    }
    stopPlayback();
    setVoiceState('CANCELLED');
    setTimeout(() => {
      setVoiceState('IDLE');
      setRecordingDurationMs(0);
    }, 1200);
  }, [stopDurationTimer, stopPlayback]);

  const startListening = useCallback(async () => {
    if (
      voiceState !== 'IDLE' &&
      voiceState !== 'COMPLETED' &&
      voiceState !== 'ERROR' &&
      voiceState !== 'CANCELLED'
    ) {
      return;
    }

    stopPlayback();
    cancelledRef.current = false;
    setErrorMessage(null);
    setTranscript(null);
    setRecordingDurationMs(0);

    try {
      setVoiceState('REQUESTING_PERMISSION');

      // Safely load Audio module (expo-av / expo-audio)
      // @ts-ignore - expo-av types resolved at app runtime
      const expoAv = await import('expo-av').catch(() => null);
      const Audio = expoAv?.Audio;

      if (!Audio) {
        throw new Error('Audio recording module not available on this device.');
      }

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage(
          'Microphone permission is required for voice input. Please enable it in Settings.'
        );
        setVoiceState('ERROR');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const recordingOptions = Audio.RecordingOptionsPresets?.HIGH_QUALITY ?? {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat?.MPEG_4 ?? 2,
          audioEncoder: Audio.AndroidAudioEncoder?.AAC ?? 3,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality?.HIGH ?? 0x60,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);

      recordingRef.current = recording;
      recordingStartRef.current = Date.now();

      durationIntervalRef.current = setInterval(() => {
        setRecordingDurationMs(Date.now() - recordingStartRef.current);
      }, 100);

      setVoiceState('LISTENING');
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? '';
      if (msg.includes('permission')) {
        setErrorMessage(
          'Microphone permission was denied. Please enable microphone access in your device settings.'
        );
      } else if (msg.includes('network') || msg.includes('offline')) {
        setErrorMessage('Voice input requires an active internet connection.');
      } else if (msg.includes('not available')) {
        setErrorMessage('Microphone hardware is not ready or not permitted on this device.');
      } else {
        setErrorMessage(err?.message || 'Could not start microphone. Please try again.');
      }
      setVoiceState('ERROR');
    }

  }, [voiceState, stopPlayback]);

  const stopListening = useCallback(async () => {
    if (voiceState !== 'LISTENING') return;
    if (cancelledRef.current) return;

    setVoiceState('STOPPING');
    stopDurationTimer();

    try {
      const recording = recordingRef.current;
      if (!recording) {
        throw new Error('No active audio recording found.');
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('Recorded audio file is empty.');
      }

      if (cancelledRef.current) return;

      setVoiceState('TRANSCRIBING');

      const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4';
      const result = await voiceApi.transcribe(uri, mimeType, options.language);

      if (cancelledRef.current) return;

      const cleanTranscript = result.transcript?.trim();
      if (!cleanTranscript) {
        throw new Error('No speech detected. Please speak clearly and try again.');
      }

      setTranscript(cleanTranscript);
      setVoiceState('PROCESSING');

      // Forward transcribed text to AI Copilot pipeline
      await options.onTranscript(cleanTranscript);

      if (cancelledRef.current) return;
      setVoiceState('COMPLETED');
      setTimeout(() => {
        setVoiceState((current) => (current === 'COMPLETED' ? 'IDLE' : current));
      }, 1800);
    } catch (err: any) {
      if (cancelledRef.current) return;
      const msg = err?.message ?? 'Transcription failed';
      if (msg.includes('No speech') || msg.includes('empty')) {
        setErrorMessage('No speech detected. Please speak clearly and try again.');
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setErrorMessage('Network connection lost. Please check your internet connection.');
      } else if (msg.includes('not available') || msg.includes('unsupported')) {
        setErrorMessage(msg);
      } else {
        setErrorMessage(msg || 'Voice transcription failed. Please try again.');
      }
      setVoiceState('ERROR');
    }
  }, [voiceState, stopDurationTimer, options]);

  const speakText = useCallback(
    async (text: string) => {
      if (!text || text.trim().length === 0) return;

      try {
        setVoiceState('GENERATING_AUDIO');

        const audioDataUri = await voiceApi.speak(text, options.language);

        if (cancelledRef.current) return;
        setVoiceState('PLAYING');

        // Safely load Audio module for playback
        // @ts-ignore - expo-av types resolved at app runtime
        const expoAv = await import('expo-av').catch(() => null);
        const Audio = expoAv?.Audio;

        if (!Audio) {
          setVoiceState('IDLE');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioDataUri },
          { shouldPlay: true }
        );


        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            soundRef.current = null;
            setVoiceState('IDLE');
            options.onSpeechEnd?.();
          }
        });
      } catch {
        // TTS playback failure is non-blocking — text response is already presented in UI
        setVoiceState('IDLE');
      }
    },
    [options]
  );

  return {
    voiceState,
    transcript,
    errorMessage,
    recordingDurationMs,
    startListening,
    stopListening,
    cancelRecording,
    speakText,
    stopPlayback,
    reset,
  };
}

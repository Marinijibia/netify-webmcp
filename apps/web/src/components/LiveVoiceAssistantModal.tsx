'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';
import { aiChatApi, AIChatResponse, customersApi, CustomerItem } from '@/lib/api';
import {
  speakText,
  stopSpeech,
  cleanTextForSpeech,
  startAudioVisualizer,
  playChime,
  VisualizerData,
  VoiceLanguage,
} from '@/lib/voice/voice-service';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Sparkles,
  Radio,
  Globe,
  Building,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Settings,
  ChevronDown,
  ChevronUp,
  Sliders,
  Send,
  Zap,
} from 'lucide-react';

interface LiveVoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomerId?: string;
}

type AssistantState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

export default function LiveVoiceAssistantModal({
  isOpen,
  onClose,
  initialCustomerId,
}: LiveVoiceAssistantModalProps) {
  const { user, organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t, currentLanguage } = useLanguage();

  // Assistant Lifecycle
  const [assistantState, setAssistantState] = useState<AssistantState>('IDLE');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [copilotSubtitle, setCopilotSubtitle] = useState<string>('');
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguage>(
    (currentLanguage === 'ff' ? 'en' : currentLanguage as VoiceLanguage) || 'en'
  );
  const [continuousMode, setContinuousMode] = useState(true);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Customer Context
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');

  // Audio Visualizer
  const [visualizerData, setVisualizerData] = useState<VisualizerData>({
    frequencies: new Array(16).fill(10),
    volume: 0,
  });

  // Transcript History
  const [history, setHistory] = useState<
    Array<{ sender: 'user' | 'copilot'; text: string; timestamp: string }>
  >([]);
  const [showHistory, setShowHistory] = useState(false);

  // References
  const recognitionRef = useRef<any>(null);
  const visualizerStopRef = useRef<(() => void) | null>(null);
  const silenceTimerRef = useRef<any>(null);
  const conversationIdRef = useRef<string | undefined>(undefined);

  // Load customer directory for context
  useEffect(() => {
    if (isOpen) {
      customersApi
        .list({ pageSize: 50 })
        .then((data) => setCustomers(data))
        .catch(() => {});
    }
  }, [isOpen]);

  // Clean up speech and mic when modal closes
  const cleanup = useCallback(() => {
    stopSpeech();
    if (visualizerStopRef.current) {
      visualizerStopRef.current();
      visualizerStopRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setAssistantState('IDLE');
    setLiveTranscript('');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen, cleanup]);

  // Handle sending query to AI
  const submitVoiceQuery = useCallback(
    async (queryText: string) => {
      if (!queryText.trim()) {
        setAssistantState('IDLE');
        return;
      }

      cleanup();
      playChime('stop');
      setAssistantState('THINKING');
      setErrorMsg(null);

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setHistory((prev) => [...prev, { sender: 'user', text: queryText, timestamp }]);

      try {
        const res: AIChatResponse = await aiChatApi.sendMessage({
          content: queryText,
          conversationId: conversationIdRef.current,
          customerId: selectedCustomerId || undefined,
        });

        if (res.conversationId) {
          conversationIdRef.current = res.conversationId;
        }

        const replyText = cleanTextForSpeech(res.content);
        setCopilotSubtitle(replyText);
        setHistory((prev) => [
          ...prev,
          { sender: 'copilot', text: replyText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ]);

        if (isMuted) {
          setAssistantState('IDLE');
          return;
        }

        playChime('success');
        setAssistantState('SPEAKING');
        await speakText(replyText, selectedLanguage, {
          rate: speechRate,
          onEnd: () => {
            setAssistantState('IDLE');
            // If continuous hands-free mode is enabled, start listening for the user's next question!
            if (continuousMode && isOpen) {
              setTimeout(() => {
                startListening();
              }, 600);
            }
          },
          onError: () => {
            setAssistantState('IDLE');
          },
        });
      } catch (err: any) {
        console.error('Voice AI Query Error:', err);
        setErrorMsg(err?.message || 'Voice assistant could not retrieve data.');
        setAssistantState('IDLE');
      }
    },
    [cleanup, selectedCustomerId, isMuted, selectedLanguage, speechRate, continuousMode, isOpen]
  );

  // Start Speech Recognition & Visualizer
  const startListening = useCallback(async () => {
    cleanup();
    playChime('start');
    setErrorMsg(null);
    setLiveTranscript('');
    setAssistantState('LISTENING');

    // 1. Start Web Audio API Visualizer for live sound wave response
    try {
      const { stop } = await startAudioVisualizer((data) => {
        setVisualizerData(data);
      });
      visualizerStopRef.current = stop;
    } catch (e) {
      console.warn('Could not initialize audio visualizer:', e);
    }

    // 2. Start Web Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg('Browser speech recognition is not supported. Please use Chrome, Edge, or Brave.');
      setAssistantState('IDLE');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;

      const langMap: Record<VoiceLanguage, string> = {
        en: 'en-US',
        pcm: 'en-NG',
        ha: 'ha-NG',
        yo: 'yo-NG',
        ig: 'ig-NG',
      };
      recognition.lang = langMap[selectedLanguage] || 'en-US';

      let lastFinalTranscript = '';

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            lastFinalTranscript += trans + ' ';
          } else {
            interim += trans;
          }
        }

        const currentCombined = (lastFinalTranscript + interim).trim();
        setLiveTranscript(currentCombined);

        // VAD: Reset silence timer on every new speech token
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Auto-submit after 1.8 seconds of silence when user stops talking
        if (currentCombined.length > 3) {
          silenceTimerRef.current = setTimeout(() => {
            submitVoiceQuery(currentCombined);
          }, 1800);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error);
          setErrorMsg(`Voice dictation error: ${event.error}`);
          setAssistantState('IDLE');
        }
      };

      recognition.onend = () => {
        if (assistantState === 'LISTENING' && liveTranscript) {
          submitVoiceQuery(liveTranscript);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      setErrorMsg('Could not access microphone.');
      setAssistantState('IDLE');
    }
  }, [cleanup, selectedLanguage, assistantState, liveTranscript, submitVoiceQuery]);

  // Initial welcome greeting on open
  useEffect(() => {
    if (isOpen && history.length === 0) {
      const welcome = `Hello ${user?.firstName || 'there'}! I am your live collections voice assistant. What would you like to investigate?`;
      setCopilotSubtitle(welcome);
      setHistory([{ sender: 'copilot', text: welcome, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }
  }, [isOpen, history.length, user?.firstName]);

  if (!isOpen) return null;

  // Selected customer
  const targetCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 14, 26, 0.88)',
        backdropFilter: 'blur(16px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: isLight ? '#FFFFFF' : '#001D31',
          border: `1px solid ${isLight ? '#E2E8F0' : 'rgba(0, 165, 129, 0.4)'}`,
          borderRadius: '28px',
          boxShadow: isLight
            ? '0 25px 50px -12px rgba(0, 48, 81, 0.25)'
            : '0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 165, 129, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isLight ? '#F8FAFC' : '#00253E',
          }}
        >
          {/* Brand & Live Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: assistantState === 'LISTENING' ? '#EF4444' : '#00A581',
                boxShadow: `0 0 12px ${assistantState === 'LISTENING' ? '#EF4444' : '#00A581'}`,
                animation: assistantState === 'LISTENING' ? 'pulse 1.2s infinite' : 'none',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '14px', color: tokens.textPrimary }}>
                  {t('copilot.title')}
                </strong>
                <span
                  style={{
                    backgroundColor: tokens.accentSoft,
                    color: '#00A581',
                    border: `1px solid ${tokens.accentBorder}`,
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}
                >
                  Neural VAD
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: tokens.textMuted }}>
                {organization?.name || 'Workspace'} • Hands-Free Conversational Voice
              </p>
            </div>
          </div>

          {/* Controls: Customer Context & Language */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Customer Picker */}
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={{
                backgroundColor: isLight ? '#FFFFFF' : '#001424',
                border: `1px solid ${tokens.surfaceBorder}`,
                color: tokens.textPrimary,
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '11.5px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                maxWidth: '160px',
              }}
            >
              <option value="">🌐 Entire Business</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  👤 {c.name}
                </option>
              ))}
            </select>

            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as VoiceLanguage)}
              style={{
                backgroundColor: isLight ? '#FFFFFF' : '#001424',
                border: `1px solid ${tokens.surfaceBorder}`,
                color: tokens.textPrimary,
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '11.5px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="en">English (US/UK)</option>
              <option value="pcm">Pidgin (Nigeria)</option>
              <option value="ha">Hausa (Kano/Arewa)</option>
              <option value="yo">Yorùbá (Lagos/Ibadan)</option>
              <option value="ig">Igbo (Onitsha/Enugu)</option>
            </select>

            {/* Close / Hang up button */}
            <button
              type="button"
              onClick={onClose}
              title="End Voice Call"
              style={{
                backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11.5px',
                fontWeight: 'bold',
              }}
            >
              <PhoneOff size={13} />
              <span>End</span>
            </button>
          </div>
        </div>

        {/* Center: Glowing Visualizer Orb & Frequency Waves */}
        <div
          style={{
            padding: '48px 32px 36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            background: isLight
              ? 'radial-gradient(circle at 50% 50%, rgba(0, 165, 129, 0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle at 50% 50%, rgba(0, 165, 129, 0.16) 0%, transparent 70%)',
          }}
        >
          {/* Multi-layered Pulsing Audio Orb */}
          <div
            style={{
              position: 'relative',
              width: '140px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={() => {
              if (assistantState === 'LISTENING') {
                if (liveTranscript) submitVoiceQuery(liveTranscript);
                else cleanup();
              } else if (assistantState === 'SPEAKING') {
                stopSpeech();
                setAssistantState('IDLE');
              } else {
                startListening();
              }
            }}
          >
            {/* Ambient Animated Ripple Ring 1 */}
            <div
              style={{
                position: 'absolute',
                inset: '-20px',
                borderRadius: '50%',
                background:
                  assistantState === 'LISTENING'
                    ? 'radial-gradient(circle, rgba(239, 68, 68, 0.25), transparent 70%)'
                    : assistantState === 'SPEAKING'
                    ? 'radial-gradient(circle, rgba(0, 165, 129, 0.3), transparent 70%)'
                    : 'radial-gradient(circle, rgba(0, 165, 129, 0.15), transparent 70%)',
                transform: `scale(${1 + visualizerData.volume * 0.4})`,
                transition: 'transform 0.08s ease-out',
                pointerEvents: 'none',
              }}
            />

            {/* Ambient Animated Ripple Ring 2 */}
            <div
              style={{
                position: 'absolute',
                inset: '-8px',
                borderRadius: '50%',
                border: `2px dashed ${
                  assistantState === 'LISTENING'
                    ? 'rgba(239, 68, 68, 0.5)'
                    : assistantState === 'THINKING'
                    ? 'rgba(245, 158, 11, 0.6)'
                    : 'rgba(0, 165, 129, 0.4)'
                }`,
                transform: `rotate(${Date.now() / 80}deg)`,
                pointerEvents: 'none',
              }}
            />

            {/* Core Neural Orb Sphere */}
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background:
                  assistantState === 'LISTENING'
                    ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
                    : assistantState === 'THINKING'
                    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                    : 'linear-gradient(135deg, #00A581 0%, #007D62 100%)',
                boxShadow:
                  assistantState === 'LISTENING'
                    ? '0 0 35px rgba(239, 68, 68, 0.6)'
                    : assistantState === 'THINKING'
                    ? '0 0 35px rgba(245, 158, 11, 0.6)'
                    : '0 0 35px rgba(0, 165, 129, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                zIndex: 2,
                transform: `scale(${1 + visualizerData.volume * 0.2})`,
                transition: 'transform 0.08s ease-out, background 0.3s ease',
              }}
            >
              {assistantState === 'LISTENING' ? (
                <Mic size={36} />
              ) : assistantState === 'SPEAKING' ? (
                <Volume2 size={36} />
              ) : assistantState === 'THINKING' ? (
                <Sparkles size={36} className="animate-spin" />
              ) : (
                <Radio size={36} />
              )}
            </div>
          </div>

          {/* Real-time 16-Band Audio Frequency Waveform */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              height: '40px',
              marginTop: '28px',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            {visualizerData.frequencies.map((freq, idx) => {
              // Normalize frequency (0 to 255) to height percentage (8px to 38px)
              const height =
                assistantState === 'LISTENING'
                  ? Math.max(6, (freq / 255) * 38)
                  : assistantState === 'SPEAKING'
                  ? Math.max(6, Math.sin(idx + Date.now() / 150) * 16 + 18)
                  : assistantState === 'THINKING'
                  ? Math.max(6, Math.sin(idx * 0.8 + Date.now() / 200) * 12 + 14)
                  : 6;

              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: `${height}px`,
                    borderRadius: '4px',
                    backgroundColor:
                      assistantState === 'LISTENING'
                        ? '#EF4444'
                        : assistantState === 'THINKING'
                        ? '#F59E0B'
                        : '#00A581',
                    opacity: 0.85,
                    transition: 'height 0.08s ease',
                  }}
                />
              );
            })}
          </div>

          {/* Current State Status Tag */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color:
                  assistantState === 'LISTENING'
                    ? '#EF4444'
                    : assistantState === 'THINKING'
                    ? '#F59E0B'
                    : '#00A581',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {assistantState === 'LISTENING'
                ? t('copilot.listening')
                : assistantState === 'THINKING'
                ? t('copilot.thinking')
                : assistantState === 'SPEAKING'
                ? t('copilot.speaking')
                : t('copilot.tapToSpeak')}
            </span>
          </div>

          {/* Live Dynamic Speech Subtitles */}
          <div
            style={{
              marginTop: '16px',
              width: '100%',
              maxWidth: '560px',
              minHeight: '48px',
              backgroundColor: isLight ? '#F1F5F9' : '#001424',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '12px',
              padding: '12px 18px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '13.5px',
                color: tokens.textPrimary,
                fontStyle: assistantState === 'LISTENING' ? 'italic' : 'normal',
                lineHeight: '1.5',
              }}
            >
              {assistantState === 'LISTENING'
                ? liveTranscript || 'Speak your question (e.g. "Who owes over ₦100,000?")'
                : copilotSubtitle || 'Live voice captioning will display here.'}
            </p>
          </div>

          {/* Target Customer indicator if scoped */}
          {targetCustomer && (
            <div
              style={{
                marginTop: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: tokens.textSecondary,
              }}
            >
              <Building size={12} color="#00A581" />
              <span>
                Target Scoped: <strong>{targetCustomer.name}</strong> (₦
                {(targetCustomer.totalOutstanding || 0).toLocaleString()})
              </span>
            </div>
          )}

          {/* Quick Voice Text Prompt Input (Speak or Type) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (textPrompt.trim()) {
                submitVoiceQuery(textPrompt);
                setTextPrompt('');
              }
            }}
            style={{
              marginTop: '16px',
              width: '100%',
              maxWidth: '560px',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="Or type a question here and press Enter to hear AI speak..."
              style={{
                flex: 1,
                padding: '10px 14px',
                backgroundColor: isLight ? '#FFFFFF' : '#001424',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '10px',
                color: tokens.textPrimary,
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!textPrompt.trim() || assistantState === 'THINKING'}
              style={{
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '0 16px',
                cursor: !textPrompt.trim() || assistantState === 'THINKING' ? 'not-allowed' : 'pointer',
                opacity: !textPrompt.trim() || assistantState === 'THINKING' ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                gap: '6px',
                fontSize: '12px',
              }}
            >
              <span>Ask</span>
              <Send size={13} />
            </button>
          </form>

          {/* Error Message */}
          {errorMsg && (
            <div
              style={{
                marginTop: '12px',
                backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                color: isLight ? '#DC2626' : '#F87171',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Quick Voice Inquiry Pills */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: isLight ? '#F8FAFC' : '#00253E',
            borderTop: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase' }}>
            Quick Prompts:
          </span>
          {[
            'Who owes the most past 30 days?',
            'Who broke a payment promise this week?',
            'What is our total outstanding exposure?',
            'Draft a polite WhatsApp payment reminder',
          ].map((prompt, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => submitVoiceQuery(prompt)}
              disabled={assistantState === 'THINKING'}
              style={{
                backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                border: `1px solid ${tokens.surfaceBorder}`,
                color: tokens.textPrimary,
                borderRadius: '16px',
                padding: '4px 12px',
                fontSize: '11.5px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              💡 {prompt}
            </button>
          ))}
        </div>

        {/* Bottom Bar: Continuous Mode Toggle, Speed, and Mute Controls */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isLight ? '#FFFFFF' : '#001D31',
          }}
        >
          {/* Hands-Free Loop Toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: tokens.textSecondary,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={(e) => setContinuousMode(e.target.checked)}
              style={{ accentColor: '#00A581', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: '600', color: continuousMode ? '#00A581' : tokens.textSecondary }}>
              Continuous Hands-Free Conversation
            </span>
          </label>

          {/* Voice Output Speed & Mute */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Speed Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: tokens.textMuted }}>
              <span>Speed:</span>
              <select
                value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                style={{
                  backgroundColor: isLight ? '#F1F5F9' : '#001424',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  color: tokens.textPrimary,
                  borderRadius: '6px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={0.85}>0.85x</option>
                <option value={1.0}>1.0x (Normal)</option>
                <option value={1.15}>1.15x (Fast)</option>
                <option value={1.3}>1.3x</option>
              </select>
            </div>

            {/* Speaker Audio Mute */}
            <button
              type="button"
              onClick={() => {
                if (!isMuted) stopSpeech();
                setIsMuted(!isMuted);
              }}
              title={isMuted ? 'Unmute voice playback' : 'Mute voice playback'}
              style={{
                backgroundColor: isMuted ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.2)') : tokens.accentSoft,
                border: `1px solid ${isMuted ? '#EF4444' : tokens.accentBorder}`,
                color: isMuted ? '#EF4444' : '#00A581',
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isMuted ? 'Muted' : 'Audio On'}</span>
            </button>

            {/* Mic Trigger */}
            <button
              type="button"
              onClick={assistantState === 'LISTENING' ? cleanup : startListening}
              style={{
                backgroundColor: assistantState === 'LISTENING' ? '#EF4444' : '#00A581',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(0, 165, 129, 0.3)',
              }}
            >
              {assistantState === 'LISTENING' ? <MicOff size={14} /> : <Mic size={14} />}
              <span>{assistantState === 'LISTENING' ? 'Stop Listening' : 'Speak Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

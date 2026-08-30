'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { aiChatApi, AIChatResponse, customersApi, CustomerItem } from '@/lib/api';
import { 
  BrainCircuit, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  FileText, 
  Clock, 
  HelpCircle,
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  ArrowRight, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  Globe,
  Code,
  Copy,
  Check,
  RotateCcw,
  Building,
  CheckCircle2,
  Filter,
  MessageSquareQuote,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { useLanguage } from '@/lib/i18n';
import LiveVoiceAssistantModal from '@/components/LiveVoiceAssistantModal';
import { speakText, stopSpeech, playChime } from '@/lib/voice/voice-service';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  cleanText: string;
  rawJson?: string;
  hasStructuredData: boolean;
  timestamp: string;
  facts?: Array<{ title: string; detail: string; metric?: string | number }>;
  inferences?: Array<{ title: string; reason: string; urgency?: string }>;
  evidence?: {
    memoryIds: string[];
    eventIds: string[];
    customerIds: string[];
    receivableIds: string[];
  };
  suggestedActions?: Array<{
    id?: string;
    actionType: string;
    title: string;
    description: string;
    payload: Record<string, any>;
    isConsequential: boolean;
  }>;
  suggestedFollowUps?: string[];
}

export type VoiceLanguage = 'en' | 'pcm' | 'ha' | 'yo' | 'ig';

// Helper to extract conversational text and structured data from JSON or markdown
function parseCopilotPayload(
  rawContent: string,
  rawFacts?: any[],
  rawInferences?: any[],
  rawActions?: any[],
  rawFollowUps?: any[]
) {
  let cleanText = rawContent || '';
  let facts = Array.isArray(rawFacts) ? [...rawFacts] : [];
  let inferences = Array.isArray(rawInferences) ? [...rawInferences] : [];
  let actions = Array.isArray(rawActions) ? [...rawActions] : [];
  let followUps = Array.isArray(rawFollowUps) ? [...rawFollowUps] : [];
  let rawJsonString: string | undefined = undefined;

  let candidate = (rawContent || '').trim();
  if (candidate.startsWith('```json')) {
    candidate = candidate.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  } else if (candidate.startsWith('```')) {
    candidate = candidate.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  }

  // Attempt JSON parse if it looks like an object
  if (candidate.startsWith('{') && candidate.endsWith('}')) {
    try {
      const parsed = JSON.parse(candidate);
      rawJsonString = JSON.stringify(parsed, null, 2);

      if (parsed.content || parsed.message || parsed.reply || parsed.summary || parsed.response || parsed.text) {
        cleanText = parsed.content || parsed.message || parsed.reply || parsed.summary || parsed.response || parsed.text;
      }
      if (Array.isArray(parsed.facts) && parsed.facts.length > 0) {
        facts = [...facts, ...parsed.facts];
      }
      if (Array.isArray(parsed.inferences) && parsed.inferences.length > 0) {
        inferences = [...inferences, ...parsed.inferences];
      }
      if (Array.isArray(parsed.suggestedActions) && parsed.suggestedActions.length > 0) {
        actions = [...actions, ...parsed.suggestedActions];
      }
      if (Array.isArray(parsed.suggestedFollowUps) && parsed.suggestedFollowUps.length > 0) {
        followUps = [...followUps, ...parsed.suggestedFollowUps];
      }
    } catch {
      // Not strict JSON, treat as raw text
    }
  }

  // If structured elements exist from API or parse, generate pretty JSON for the Inspector
  if (!rawJsonString && (facts.length > 0 || inferences.length > 0 || actions.length > 0 || followUps.length > 0)) {
    rawJsonString = JSON.stringify(
      {
        content: cleanText,
        facts,
        inferences,
        suggestedActions: actions,
        suggestedFollowUps: followUps,
      },
      null,
      2
    );
  }

  const hasStructuredData = Boolean(rawJsonString || facts.length > 0 || inferences.length > 0 || actions.length > 0);

  return {
    cleanText,
    rawJsonString,
    hasStructuredData,
    facts,
    inferences,
    actions,
    followUps,
  };
}

// Markdown and currency high-contrast renderer
function FormattedMessageView({
  text,
  tokens,
  isLight,
}: {
  text: string;
  tokens: any;
  isLight: boolean;
}) {
  const paragraphs = useMemo(() => {
    return text.split('\n\n').filter(Boolean);
  }, [text]);

  const renderFormattedLine = (line: string) => {
    // Currency highlighting regex (e.g. ₦450,000, $1,200, KSh 5,000, GH₵ 300)
    const currencyRegex = /(\b(?:₦|\$|KSh|GH₵)\s*[\d,]+(?:\.\d{2})?\b)/g;

    // Simple markdown tokens: **bold**, `code`
    const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong key={index} style={{ color: tokens.textPrimary, fontWeight: '700' }}>
            {inner}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        const inner = part.slice(1, -1);
        return (
          <code
            key={index}
            style={{
              backgroundColor: isLight ? '#F1F5F9' : '#001D31',
              color: '#00A581',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              border: `1px solid ${tokens.surfaceBorder}`,
            }}
          >
            {inner}
          </code>
        );
      }

      // Check currency in remaining plain text
      const currencyParts = part.split(currencyRegex);
      return currencyParts.map((subPart, subIdx) => {
        if (currencyRegex.test(subPart)) {
          return (
            <span
              key={`${index}-${subIdx}`}
              style={{
                display: 'inline-block',
                fontWeight: '700',
                color: '#00A581',
                backgroundColor: isLight ? '#ECFDF8' : 'rgba(0, 165, 129, 0.18)',
                padding: '0 5px',
                borderRadius: '4px',
                border: `1px solid ${tokens.accentBorder}`,
              }}
            >
              {subPart}
            </span>
          );
        }
        return <span key={`${index}-${subIdx}`}>{subPart}</span>;
      });
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {paragraphs.map((p, pIdx) => {
        const lines = p.split('\n');

        // Check if paragraph is an unnumbered or numbered list
        const isList = lines.every(
          (l) => l.trim().startsWith('- ') || l.trim().startsWith('* ') || /^\d+\.\s/.test(l.trim())
        );

        if (isList) {
          return (
            <ul
              key={pIdx}
              style={{
                margin: 0,
                paddingLeft: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {lines.map((item, iIdx) => {
                const cleanedItem = item.replace(/^[-*]\s+|\d+\.\s+/, '');
                return (
                  <li key={iIdx} style={{ fontSize: '13.5px', lineHeight: '1.6', color: tokens.textPrimary }}>
                    {renderFormattedLine(cleanedItem)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Header detection (e.g. ### Header)
        if (p.startsWith('### ')) {
          return (
            <h4
              key={pIdx}
              style={{
                margin: '6px 0 2px',
                fontSize: '14.5px',
                fontWeight: '700',
                color: tokens.textPrimary,
              }}
            >
              {p.replace('### ', '')}
            </h4>
          );
        }

        return (
          <p
            key={pIdx}
            style={{
              margin: 0,
              fontSize: '13.5px',
              lineHeight: '1.65',
              color: tokens.textPrimary,
            }}
          >
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderFormattedLine(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export default function CopilotChatPage() {
  const { user, organization } = useAuth();
  const { tokens, isLight } = useTheme();
  const { t, currentLanguage } = useLanguage();

  // Core chat states
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-message view mode state: 'formatted' | 'json'
  const [viewModes, setViewModes] = useState<Record<string, 'formatted' | 'json'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Debtor context filtering
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // Voice dictation & TTS states
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguage>('en');
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load customer directory for context dropdown
  useEffect(() => {
    setIsLoadingCustomers(true);
    customersApi
      .list({ pageSize: 50 })
      .then((data) => setCustomers(data))
      .catch(() => {})
      .finally(() => setIsLoadingCustomers(false));
  }, []);

  // Check browser SpeechRecognition & SpeechSynthesis support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      const hasSynthesis = 'speechSynthesis' in window;
      setSpeechSupported(hasRecognition || hasSynthesis);
    }
  }, []);

  // Initial welcome message
  useEffect(() => {
    const initialRawText = `Good day ${user?.firstName || 'Business Owner'}! I am your Netify Business Memory Copilot for ${organization?.name || 'your workspace'}.

I have real-time relational intelligence over your customer accounts, receivables ledgers, verbal commitments, and collection priority queues.

You can ask me questions about specific accounts, identify broken promises, or ask me to draft respectful WhatsApp notices with verified figures.`;

    const parsed = parseCopilotPayload(initialRawText, [
      { title: 'Ledger Status', detail: 'Real-time synchronization active', metric: 'Live' },
      { title: 'Safe AI Guarantee', detail: 'Human verification required for outbound messages', metric: '100% Grounded' },
    ]);

    const welcome: ChatMessage = {
      id: 'welcome',
      sender: 'copilot',
      text: initialRawText,
      cleanText: parsed.cleanText,
      rawJson: parsed.rawJsonString,
      hasStructuredData: parsed.hasStructuredData,
      facts: parsed.facts,
      inferences: parsed.inferences,
      suggestedFollowUps: [
        t('copilot.q1'),
        t('copilot.q2'),
        t('copilot.q3'),
        t('copilot.q4'),
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([welcome]);
  }, [user?.firstName, organization?.name, currentLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, viewModes]);

  // Voice speech synthesis (TTS) - Speaks cleanText using neural/browser voice service
  const handleSpeakMessage = async (msgId: string, cleanText: string) => {
    if (activeSpeechId === msgId) {
      stopSpeech();
      setActiveSpeechId(null);
      return;
    }

    stopSpeech();
    setActiveSpeechId(msgId);

    await speakText(cleanText, selectedLanguage, {
      rate: 1.0,
      onEnd: () => setActiveSpeechId(null),
      onError: () => setActiveSpeechId(null),
    });
  };

  // Voice SpeechRecognition (STT) with audio chime cues
  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is not supported by your browser. Please try Google Chrome, Brave, or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      playChime('stop');
      return;
    }

    try {
      playChime('start');
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;

      const langMap: Record<VoiceLanguage, string> = {
        en: 'en-US',
        pcm: 'en-NG',
        ha: 'ha-NG',
        yo: 'yo-NG',
        ig: 'ig-NG',
      };
      recognition.lang = langMap[selectedLanguage] || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          setError(`Voice error: ${event.error}. Please check your microphone.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start voice recognition:', err);
      setIsListening(false);
    }
  };

  // Toggle View Mode between 'formatted' and 'json'
  const toggleViewMode = (msgId: string) => {
    setViewModes((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === 'json' ? 'formatted' : 'json',
    }));
  };

  // Copy JSON or text to clipboard
  const handleCopy = (id: string, content: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Reset Conversation
  const handleNewConversation = () => {
    setConversationId(undefined);
    const resetParsed = parseCopilotPayload(
      `Fresh session initiated. Ask me anything about your debtors, promises, or collections queue.`
    );
    setMessages([
      {
        id: 'new-session',
        sender: 'copilot',
        text: resetParsed.cleanText,
        cleanText: resetParsed.cleanText,
        hasStructuredData: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          'Show top 5 debtors by risk score',
          'Who owes over ₦100,000?',
          'What payment commitments are due today?',
        ],
      },
    ]);
  };

  // Send message handler
  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
      cleanText: textToSend.trim(),
      hasStructuredData: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput('');
    setIsSending(true);
    setError(null);

    try {
      const res: AIChatResponse = await aiChatApi.sendMessage({
        content: textToSend.trim(),
        conversationId,
        customerId: selectedCustomerId || undefined,
      });

      if (res.conversationId) {
        setConversationId(res.conversationId);
      }

      // Parse JSON from response
      const parsed = parseCopilotPayload(
        res.content,
        res.facts,
        res.inferences,
        res.suggestedActions,
        res.suggestedFollowUps
      );

      const copilotMsg: ChatMessage = {
        id: res.messageId || (Date.now() + 1).toString(),
        sender: 'copilot',
        text: res.content,
        cleanText: parsed.cleanText,
        rawJson: parsed.rawJsonString,
        hasStructuredData: parsed.hasStructuredData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        facts: parsed.facts,
        inferences: parsed.inferences,
        evidence: res.evidence,
        suggestedActions: parsed.actions,
        suggestedFollowUps: parsed.followUps,
      };

      setMessages((prev) => [...prev, copilotMsg]);
      playChime('success');
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to send message to Copilot.');
    } finally {
      setIsSending(false);
    }
  };

  // Selected customer details
  const currentSelectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        height: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Top Header with Context Selector, Voice Lang, and Reset */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: tokens.surface,
          padding: '14px 20px',
          borderRadius: '16px',
          border: `1px solid ${tokens.surfaceBorder}`,
          boxShadow: isLight ? tokens.shadowCard : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00A581 0%, #007D62 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(0, 165, 129, 0.3)',
            }}
          >
            <BrainCircuit size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '17px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
                {t('copilot.title')}
              </h1>
              <span
                style={{
                  backgroundColor: tokens.accentSoft,
                  color: '#00A581',
                  border: `1px solid ${tokens.accentBorder}`,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={11} />
                JSON & Business Memory
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: tokens.textSecondary }}>
              Grounded in live ledger balances and verbal WhatsApp promises
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Debtor Context Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={13} color={tokens.textMuted} />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={{
                backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                border: `1px solid ${tokens.surfaceBorder}`,
                color: tokens.textPrimary,
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                maxWidth: '220px',
              }}
            >
              <option value="">🌐 Entire Workspace (All Debtors)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  👤 {c.name} {c.totalOutstanding ? `(₦${c.totalOutstanding.toLocaleString()})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Language Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isLight ? '#F1F5F9' : '#001D31',
              border: `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '8px',
              padding: '4px 8px',
            }}
          >
            <Globe size={13} color="#00A581" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as VoiceLanguage)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: tokens.textPrimary,
                fontSize: '12px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="en" style={{ backgroundColor: isLight ? '#FFFFFF' : '#001D31' }}>
                English
              </option>
              <option value="pcm" style={{ backgroundColor: isLight ? '#FFFFFF' : '#001D31' }}>
                Pidgin
              </option>
              <option value="ha" style={{ backgroundColor: isLight ? '#FFFFFF' : '#001D31' }}>
                Hausa
              </option>
              <option value="yo" style={{ backgroundColor: isLight ? '#FFFFFF' : '#001D31' }}>
                Yorùbá
              </option>
              <option value="ig" style={{ backgroundColor: isLight ? '#FFFFFF' : '#001D31' }}>
                Igbo
              </option>
            </select>
          </div>

          {/* Live Voice Call Button */}
          <button
            type="button"
            onClick={() => setIsLiveVoiceOpen(true)}
            title="Launch Fullscreen Live Voice Call"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: tokens.accentSoft,
              border: `1px solid ${tokens.accentBorder}`,
              color: '#00A581',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Radio size={13} color="#00A581" className="animate-pulse" />
            <span>Live Voice Call</span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleNewConversation}
            title="Reset and start new session"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isLight ? '#FFFFFF' : '#001D31',
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textSecondary,
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={13} />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Target Debtor Context Banner if selected */}
      {currentSelectedCustomer && (
        <div
          style={{
            backgroundColor: tokens.accentSoft,
            border: `1px solid ${tokens.accentBorder}`,
            borderRadius: '10px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12.5px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={14} color="#00A581" />
            <span style={{ color: tokens.textPrimary, fontWeight: '700' }}>
              Active Context: {currentSelectedCustomer.name}
            </span>
            <span style={{ color: tokens.textSecondary }}>•</span>
            <span style={{ color: '#00A581', fontWeight: '600' }}>
              Outstanding: ₦{(currentSelectedCustomer.totalOutstanding || 0).toLocaleString()}
            </span>
            {currentSelectedCustomer.oldestOverdueDays ? (
              <>
                <span style={{ color: tokens.textSecondary }}>•</span>
                <span style={{ color: '#DC2626', fontWeight: '600' }}>
                  {currentSelectedCustomer.oldestOverdueDays} days overdue
                </span>
              </>
            ) : null}
          </div>
          <button
            onClick={() => setSelectedCustomerId('')}
            style={{
              color: tokens.textSecondary,
              fontSize: '11.5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              textDecoration: 'underline',
            }}
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Main Chat Scroll Container */}
      <div
        style={{
          flex: 1,
          backgroundColor: tokens.surface,
          borderRadius: '16px',
          border: `1px solid ${tokens.surfaceBorder}`,
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: isLight ? tokens.shadowCard : 'none',
        }}
      >
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          const isSpeaking = activeSpeechId === m.id;
          const currentMode = viewModes[m.id] || 'formatted';
          const isCopilot = !isUser;

          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '75%' : '88%',
                width: isUser ? 'auto' : '100%',
              }}
            >
              {isCopilot && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#00A581',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0,
                    boxShadow: '0 2px 10px rgba(0, 165, 129, 0.3)',
                    marginTop: '2px',
                  }}
                >
                  <Bot size={20} />
                </div>
              )}

              <div
                style={{
                  backgroundColor: isUser ? '#00A581' : (isLight ? '#F8FAFC' : '#001D31'),
                  border: `1px solid ${isUser ? '#008B6E' : tokens.surfaceBorder}`,
                  borderRadius: '16px',
                  padding: '18px 22px',
                  color: isUser ? '#FFFFFF' : tokens.textPrimary,
                  boxShadow: isLight && !isUser ? '0 2px 8px rgba(0, 0, 0, 0.04)' : 'none',
                  flex: 1,
                }}
              >
                {/* Bubble Header: Sender, Timestamp, Dual View Toggle & TTS */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: isUser ? '#D3F8ED' : tokens.textMuted,
                    borderBottom: isCopilot ? `1px solid ${tokens.surfaceBorder}` : 'none',
                    paddingBottom: isCopilot ? '8px' : '0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', color: isUser ? '#FFFFFF' : tokens.textPrimary }}>
                      {isUser ? 'You' : 'Netify Copilot'}
                    </span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                  </div>

                  {isCopilot && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Dual-Mode Toggle: Formatted vs Raw JSON */}
                      {m.hasStructuredData && (
                        <div
                          style={{
                            display: 'flex',
                            backgroundColor: isLight ? '#FFFFFF' : '#001424',
                            border: `1px solid ${tokens.surfaceBorder}`,
                            borderRadius: '8px',
                            padding: '2px',
                            gap: '2px',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleViewMode(m.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: currentMode === 'formatted' ? '700' : '500',
                              backgroundColor: currentMode === 'formatted' ? tokens.accentSoft : 'transparent',
                              color: currentMode === 'formatted' ? '#00A581' : tokens.textSecondary,
                              cursor: 'pointer',
                              border: 'none',
                            }}
                          >
                            <Sparkles size={11} />
                            <span>Visual</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleViewMode(m.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: currentMode === 'json' ? '700' : '500',
                              backgroundColor: currentMode === 'json' ? (isLight ? '#003051' : '#0F5470') : 'transparent',
                              color: currentMode === 'json' ? '#FFFFFF' : tokens.textSecondary,
                              cursor: 'pointer',
                              border: 'none',
                            }}
                          >
                            <Code size={11} />
                            <span>JSON</span>
                          </button>
                        </div>
                      )}

                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, currentMode === 'json' ? (m.rawJson || m.text) : m.cleanText)}
                        title="Copy message text"
                        style={{
                          backgroundColor: 'transparent',
                          border: `1px solid ${tokens.surfaceBorder}`,
                          color: copiedId === m.id ? '#00A581' : tokens.textSecondary,
                          borderRadius: '6px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                        }}
                      >
                        {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {/* Speech Synthesis Audio Button */}
                      <button
                        type="button"
                        onClick={() => handleSpeakMessage(m.id, m.cleanText)}
                        title={isSpeaking ? 'Stop reading' : 'Read aloud with AI voice'}
                        style={{
                          backgroundColor: isSpeaking
                            ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.2)')
                            : tokens.accentSoft,
                          border: `1px solid ${isSpeaking ? '#EF4444' : tokens.accentBorder}`,
                          color: isSpeaking ? '#EF4444' : '#00A581',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX size={12} />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={12} />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Bubble Body: Formatted View vs Raw JSON View */}
                {isCopilot && currentMode === 'json' ? (
                  <div
                    style={{
                      backgroundColor: isLight ? '#001424' : '#000E19',
                      border: '1px solid #0F5470',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '12px',
                      lineHeight: '1.5',
                      color: '#3AD0A9',
                      overflowX: 'auto',
                      maxHeight: '380px',
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {m.rawJson || JSON.stringify({ content: m.cleanText }, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <>
                    {/* Natural Language Rich Content */}
                    <FormattedMessageView
                      text={isCopilot ? m.cleanText : m.text}
                      tokens={tokens}
                      isLight={isLight}
                    />

                    {/* Verified Data Facts Bento Grid */}
                    {m.facts && m.facts.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11.5px',
                            fontWeight: 'bold',
                            color: tokens.textMuted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px',
                          }}
                        >
                          <CheckCircle2 size={13} color="#00A581" />
                          <span>Authoritative Business Facts</span>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '8px',
                          }}
                        >
                          {m.facts.map((f, idx) => (
                            <div
                              key={idx}
                              style={{
                                backgroundColor: isLight ? '#FFFFFF' : '#00253E',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: `1px solid ${tokens.surfaceBorder}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '700', fontSize: '12.5px', color: tokens.textPrimary }}>
                                  {f.title}
                                </span>
                                {f.metric && (
                                  <span
                                    style={{
                                      backgroundColor: tokens.accentSoft,
                                      color: '#00A581',
                                      border: `1px solid ${tokens.accentBorder}`,
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    {f.metric}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '12px', color: tokens.textSecondary, lineHeight: '1.4' }}>
                                {f.detail}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Behavioral Inferences & Risks */}
                    {m.inferences && m.inferences.length > 0 && (
                      <div style={{ marginTop: '14px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11.5px',
                            fontWeight: 'bold',
                            color: tokens.textMuted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px',
                          }}
                        >
                          <AlertCircle size={13} color="#D97706" />
                          <span>Behavioral Inferences & Intelligence</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {m.inferences.map((inf, idx) => {
                            const isHigh = inf.urgency === 'HIGH' || inf.urgency === 'CRITICAL';
                            const isMedium = inf.urgency === 'MEDIUM';

                            return (
                              <div
                                key={idx}
                                style={{
                                  backgroundColor: isHigh
                                    ? (isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)')
                                    : isMedium
                                    ? (isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)')
                                    : (isLight ? '#F0FDF4' : 'rgba(34, 197, 94, 0.12)'),
                                  border: `1px solid ${
                                    isHigh
                                      ? (isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.4)')
                                      : isMedium
                                      ? (isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.4)')
                                      : (isLight ? '#BBF7D0' : 'rgba(34, 197, 94, 0.4)')
                                  }`,
                                  borderRadius: '10px',
                                  padding: '10px 14px',
                                  fontSize: '12.5px',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  gap: '12px',
                                }}
                              >
                                <div>
                                  <strong
                                    style={{
                                      color: isHigh
                                        ? (isLight ? '#DC2626' : '#F87171')
                                        : isMedium
                                        ? (isLight ? '#D97706' : '#FCD34D')
                                        : (isLight ? '#16A34A' : '#4ADE80'),
                                      display: 'block',
                                      marginBottom: '2px',
                                    }}
                                  >
                                    {inf.title}
                                  </strong>
                                  <span style={{ color: tokens.textSecondary, lineHeight: '1.4' }}>
                                    {inf.reason}
                                  </span>
                                </div>

                                {inf.urgency && (
                                  <span
                                    style={{
                                      backgroundColor: isHigh
                                        ? '#DC2626'
                                        : isMedium
                                        ? '#D97706'
                                        : '#16A34A',
                                      color: '#FFFFFF',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {inf.urgency}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Suggested Grounded Action Proposals */}
                    {m.suggestedActions && m.suggestedActions.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11.5px',
                            fontWeight: 'bold',
                            color: tokens.textMuted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px',
                          }}
                        >
                          <Sparkles size={13} color="#00A581" />
                          <span>Recommended Actions (Human-Authorized)</span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {m.suggestedActions.map((act, idx) => {
                            const isDraft = act.actionType === 'DRAFT_MESSAGE' || act.title.toLowerCase().includes('draft') || act.title.toLowerCase().includes('message');
                            const targetHref = isDraft
                              ? (act.payload?.customerId ? `/messages/draft?customerId=${act.payload.customerId}` : '/messages/draft')
                              : (act.payload?.customerId ? `/customers/${act.payload.customerId}` : '/receivables');

                            return (
                              <Link
                                key={idx}
                                href={targetHref}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  backgroundColor: isLight ? '#FFFFFF' : '#00253E',
                                  border: '1px solid #00A581',
                                  color: '#00A581',
                                  padding: '8px 14px',
                                  borderRadius: '10px',
                                  fontSize: '12.5px',
                                  fontWeight: '700',
                                  textDecoration: 'none',
                                  boxShadow: isLight ? '0 1px 3px rgba(0, 165, 129, 0.12)' : 'none',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {isDraft ? <MessageSquareQuote size={14} /> : <Layers size={14} />}
                                <span>{act.title}</span>
                                <ArrowRight size={13} />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Interactive Suggested Follow-Up Chips */}
                    {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 'bold',
                            color: tokens.textMuted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '6px',
                          }}
                        >
                          Suggested Inquiries:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {m.suggestedFollowUps.map((prompt, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => handleSend(prompt)}
                              disabled={isSending}
                              style={{
                                backgroundColor: isLight ? '#F1F5F9' : '#00253E',
                                border: `1px solid ${tokens.surfaceBorder}`,
                                color: tokens.textSecondary,
                                padding: '5px 12px',
                                borderRadius: '16px',
                                fontSize: '11.5px',
                                fontWeight: '600',
                                cursor: isSending ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              💡 {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {isUser && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: isLight ? '#E2E8F0' : '#00253E',
                    border: `1px solid ${tokens.surfaceBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isLight ? '#003051' : '#FFFFFF',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}

        {/* Sending / Processing Indicator */}
        {isSending && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start', width: '100%' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#00A581',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 2px 10px rgba(0, 165, 129, 0.3)',
              }}
            >
              <Bot size={20} />
            </div>

            <div
              style={{
                backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                border: `1px solid ${tokens.surfaceBorder}`,
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: tokens.textSecondary,
                fontSize: '13px',
              }}
            >
              <Loader2 size={16} className="animate-spin" color="#00A581" />
              <span>Querying relational business memory & verifying debtor ledgers...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div
          style={{
            backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: '10px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: isLight ? '#B91C1C' : '#FCA5A5',
            fontSize: '12.5px',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form Bar with Dictation & Send */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          display: 'flex',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? `Listening in ${selectedLanguage.toUpperCase()}... Speak now`
                : selectedCustomerId
                ? `Ask about ${currentSelectedCustomer?.name || 'this customer'} or draft a reminder...`
                : t('copilot.placeholder')
            }
            style={{
              width: '100%',
              padding: '15px 44px 15px 18px',
              backgroundColor: isLight ? '#FFFFFF' : '#001D31',
              border: isListening ? '1px solid #EF4444' : `1px solid ${tokens.surfaceBorder}`,
              borderRadius: '12px',
              color: tokens.textPrimary,
              fontSize: '14px',
              outline: 'none',
              boxShadow: isListening
                ? '0 0 14px rgba(239, 68, 68, 0.25)'
                : isLight
                ? tokens.shadowCard
                : 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
          />

          {input.length > 0 && (
            <span
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '11px',
                color: tokens.textMuted,
              }}
            >
              {input.length}
            </span>
          )}
        </div>

        {/* Microphone Dictation Button */}
        <button
          type="button"
          onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Start voice dictation'}
          style={{
            backgroundColor: isListening ? '#EF4444' : (isLight ? '#FFFFFF' : '#001D31'),
            border: isListening ? '1px solid #DC2626' : `1px solid ${tokens.surfaceBorder}`,
            color: isListening ? '#FFFFFF' : '#00A581',
            padding: '0 18px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.4)' : (isLight ? tokens.shadowCard : 'none'),
          }}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          style={{
            background: 'linear-gradient(135deg, #00A581 0%, #007D62 100%)',
            color: '#FFFFFF',
            padding: '0 24px',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: !input.trim() || isSending ? 0.6 : 1,
            cursor: !input.trim() || isSending ? 'not-allowed' : 'pointer',
            border: 'none',
            boxShadow: '0 4px 14px rgba(0, 165, 129, 0.35)',
            transition: 'all 0.15s ease',
          }}
        >
          <span>Send</span>
          <Send size={16} />
        </button>
      </form>

      {/* Live AI Voice Assistant Modal */}
      <LiveVoiceAssistantModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        initialCustomerId={selectedCustomerId}
      />
    </div>
  );
}

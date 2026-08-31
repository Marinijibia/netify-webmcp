'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  commandCenterApi, 
  customersApi, 
  receivablesApi, 
  commitmentsApi, 
  collectionActivitiesApi,
  aiApi, 
  aiChatApi 
} from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { 
  getWhatsAppWebUrl, 
  getWhatsAppUrl, 
  getSmsUrl, 
  getTelUrl, 
  getMailtoUrl, 
  getGmailWebUrl, 
  isMobileDevice 
} from '@/lib/deeplink';
import { speakText, stopSpeech } from '@/lib/voice/voice-service';
import { useTheme } from '@/lib/theme/theme-context';
import { 
  Bot, 
  Sparkles, 
  X, 
  Play, 
  ArrowRight, 
  Send, 
  MessageSquare, 
  PhoneCall,
  Mail,
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  FileText,
  ShieldCheck,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

interface ToolTrace {
  toolName: string;
  category: string;
  input: Record<string, any>;
  output: any;
  durationMs: number;
}

interface CoPilotActionMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  toolTrace?: ToolTrace;
  cardType?: 'PRIORITY_LIST' | 'CUSTOMER_EVIDENCE' | 'DRAFT_PROPOSAL' | 'COMMITMENT_SAVED';
  cardData?: any;
  timestamp: string;
}

export function AgentCoPilotDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { tokens, isLight } = useTheme();
  const [messages, setMessages] = useState<CoPilotActionMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Quick Action 1: Query Live Priorities via get_collection_priority
  const handleQueryPriorities = async () => {
    setIsRunning(true);
    const userMsg: CoPilotActionMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: 'Who should we follow up with first across our receivables?',
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const start = performance.now();
    try {
      // Call real live backend API
      const priorities = await commandCenterApi.getPriorities({ limit: 3 });
      const durationMs = Math.round(performance.now() - start);

      const top = priorities[0];
      const trace: ToolTrace = {
        toolName: 'get_collection_priority',
        category: 'READ_ONLY',
        input: { limit: 3 },
        output: priorities,
        durationMs,
      };

      const agentMsg: CoPilotActionMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: top 
          ? `Based on live aging and broken commitments in Cloud SQL, ${top.customerName} is your highest priority follow-up. They owe ${formatCurrency(top.totalOverdue, top.currency || 'NGN')} (${top.oldestOverdueDays} days overdue) with a priority risk score of ${top.priorityScore}/100.`
          : 'All debtor accounts are currently up to date.',
        toolTrace: trace,
        cardType: 'PRIORITY_LIST',
        cardData: priorities,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `Failed to query priority queue: ${err?.message || 'Database error'}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  // Quick Action 2: Inspect Evidence for top debtor via get_customer_evidence
  const handleInspectEvidence = async (customerId?: string) => {
    setIsRunning(true);
    const userMsg: CoPilotActionMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: 'Retrieve detailed ledger evidence and broken promises for this customer.',
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const start = performance.now();
    try {
      // If customerId not supplied, pick the top priority customer from live API
      let targetId = customerId;
      if (!targetId) {
        const priorities = await commandCenterApi.getPriorities({ limit: 1 });
        targetId = priorities[0]?.customerId;
      }
      if (!targetId) {
        const custs = await customersApi.list();
        targetId = custs[0]?.id;
      }
      if (!targetId) throw new Error('No customer accounts found.');

      const [customer, receivables, commitments] = await Promise.all([
        customersApi.getById(targetId),
        receivablesApi.list({ customerId: targetId }),
        commitmentsApi.getCommitments({ customerId: targetId }),
      ]);
      const durationMs = Math.round(performance.now() - start);

      const trace: ToolTrace = {
        toolName: 'get_customer_evidence',
        category: 'READ_ONLY',
        input: { customerId: targetId },
        output: { customer, receivablesCount: receivables.length, commitmentsCount: commitments.length },
        durationMs,
      };

      const agentMsg: CoPilotActionMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: `Retrieved live ledger evidence for ${customer.name}: ${receivables.length} invoices on record, ${commitments.length} logged commitments, and verified phone ${customer.phone}.`,
        toolTrace: trace,
        cardType: 'CUSTOMER_EVIDENCE',
        cardData: { customer, receivables, commitments },
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `Evidence lookup failed: ${err?.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  // Quick Action 3: Draft Culturally Nuanced WhatsApp Reminder via draft_follow_up_message
  const handleDraftMessage = async (tone: 'RESPECTFUL_REMINDER' | 'DIRECT_FOLLOWUP' | 'URGENT_ESCALATION' = 'RESPECTFUL_REMINDER') => {
    setIsRunning(true);
    const toneLabel = tone === 'RESPECTFUL_REMINDER' ? 'Respectful Reminder' : tone === 'DIRECT_FOLLOWUP' ? 'Direct Follow-up' : 'Urgent Escalation';
    const userMsg: CoPilotActionMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: `Draft a ${toneLabel} WhatsApp reminder for our top overdue account.`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const start = performance.now();
    try {
      const priorities = await commandCenterApi.getPriorities({ limit: 1 });
      const top = priorities[0];
      if (!top) throw new Error('No overdue accounts in live ledger.');

      const customer = await customersApi.getById(top.customerId);

      // Generate draft through real backend AI service
      const draft = await aiApi.draftMessage(top.customerId, {
        channel: 'WHATSAPP',
        tone,
      });
      const durationMs = Math.round(performance.now() - start);

      const messageBody = draft.messageBody || (draft as any).messageText || '';

      const trace: ToolTrace = {
        toolName: 'draft_follow_up_message',
        category: 'PROPOSAL',
        input: { customerId: top.customerId, channel: 'WHATSAPP', tone },
        output: { recipientName: draft.recipientName, channel: 'WHATSAPP', verifiedAmount: draft.verifiedOutstandingAmount },
        durationMs,
      };

      const agentMsg: CoPilotActionMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: `Here is the proposed ${toneLabel} tailored for ${customer.name}. You can review it, listen to the voice preview, or dispatch it directly to WhatsApp with 1 click:`,
        toolTrace: trace,
        cardType: 'DRAFT_PROPOSAL',
        cardData: {
          customerId: customer.id,
          customerName: customer.name,
          phone: customer.phone,
          email: customer.email,
          messageBody,
          currency: customer.currency || 'NGN',
        },
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `Draft proposal failed: ${err?.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  // Free-form chat / prompt handler
  const handleSendCustom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isRunning) return;

    const query = inputText.trim();
    setInputText('');
    setIsRunning(true);

    const userMsg: CoPilotActionMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      if (query.toLowerCase().includes('priority') || query.toLowerCase().includes('who owes') || query.toLowerCase().includes('who to follow')) {
        await handleQueryPriorities();
      } else if (query.toLowerCase().includes('draft') || query.toLowerCase().includes('message') || query.toLowerCase().includes('whatsapp')) {
        await handleDraftMessage('DIRECT_FOLLOWUP');
      } else if (query.toLowerCase().includes('evidence') || query.toLowerCase().includes('history')) {
        await handleInspectEvidence();
      } else {
        // Send to backend AI chat session
        const aiRes = await aiChatApi.sendMessage({ content: query });
        const agentMsg: CoPilotActionMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: aiRes.content || 'Response received from co-pilot.',
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, agentMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `Co-pilot execution error: ${err?.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleToggleVoice = (msgId: string, text: string) => {
    if (playingAudioId === msgId) {
      stopSpeech();
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(msgId);
      speakText(text, 'en', {
        onEnd: () => setPlayingAudioId(null),
        onError: () => setPlayingAudioId(null),
      });
    }
  };

  const handleOmnichannelDispatch = async (
    channel: 'WHATSAPP' | 'SMS' | 'PHONE' | 'EMAIL',
    cardData: any
  ) => {
    // 1. Write verified activity log to PostgreSQL database
    try {
      await collectionActivitiesApi.createActivity({
        customerId: cardData.customerId,
        type: 'PAYMENT_REMINDER',
        channel,
        outcome: 'CONTACTED',
        notes: `WebMCP Agent 1-click dispatch via ${channel} (${channel === 'EMAIL' ? cardData.email || 'N/A' : cardData.phone || 'N/A'}).\nDraft content:\n"${cardData.messageBody}"`,
      });
    } catch (e) {
      console.warn('Failed to log audit activity:', e);
    }

    // 2. Open client protocol
    if (channel === 'WHATSAPP') {
      const url = isMobileDevice()
        ? getWhatsAppUrl(cardData.phone, cardData.messageBody)
        : getWhatsAppWebUrl(cardData.phone, cardData.messageBody);
      if (url) window.open(url, '_blank');
    } else if (channel === 'SMS') {
      const url = getSmsUrl(cardData.phone, cardData.messageBody);
      if (url) window.location.href = url;
    } else if (channel === 'PHONE') {
      const url = getTelUrl(cardData.phone);
      if (url) window.location.href = url;
    } else if (channel === 'EMAIL') {
      const subject = `Payment Arrangement Follow-up - ${cardData.customerName}`;
      const url = cardData.email 
        ? getGmailWebUrl(cardData.email, subject, cardData.messageBody)
        : getMailtoUrl(cardData.email, subject, cardData.messageBody);
      if (url) window.open(url, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '460px',
      maxWidth: '90vw',
      backgroundColor: tokens.surface,
      borderLeft: `1px solid ${tokens.surfaceBorder}`,
      boxShadow: isLight ? '-10px 0 25px rgba(0,0,0,0.08)' : '-10px 0 35px rgba(0,0,0,0.6)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
    }}
    className="animate-spring-slide"
    >
      {/* Drawer Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${tokens.surfaceBorder}`,
        backgroundColor: isLight ? '#F8FAFC' : '#002640',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00A581 0%, #007C61 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
          }}>
            <Bot size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>
              WebMCP Agent Co-Pilot
            </h3>
            <p style={{ fontSize: '11px', color: '#00A581', fontWeight: '600', margin: '2px 0 0' }}>
              Connected to Cloud SQL & Browser Runtime
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: tokens.textMuted,
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Suggested 1-Click Action Chips */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: isLight ? '#FFFFFF' : '#001D31',
        borderBottom: `1px solid ${tokens.surfaceBorder}`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
      }}>
        <button
          disabled={isRunning}
          onClick={handleQueryPriorities}
          className="hover-lift tap-press"
          style={{
            fontSize: '11px',
            fontWeight: '600',
            padding: '5px 10px',
            borderRadius: '16px',
            backgroundColor: tokens.accentSoft,
            color: '#00A581',
            border: `1px solid ${tokens.accentBorder}`,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Sparkles size={11} />
          <span>Who to follow first?</span>
        </button>

        <button
          disabled={isRunning}
          onClick={() => handleInspectEvidence()}
          className="hover-lift tap-press"
          style={{
            fontSize: '11px',
            fontWeight: '600',
            padding: '5px 10px',
            borderRadius: '16px',
            backgroundColor: isLight ? '#F1F5F9' : '#002B48',
            color: tokens.textSecondary,
            border: `1px solid ${tokens.surfaceBorder}`,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <FileText size={11} />
          <span>Inspect debtor evidence</span>
        </button>

        <button
          disabled={isRunning}
          onClick={() => handleDraftMessage('RESPECTFUL_REMINDER')}
          className="hover-lift tap-press"
          style={{
            fontSize: '11px',
            fontWeight: '600',
            padding: '5px 10px',
            borderRadius: '16px',
            backgroundColor: isLight ? '#F1F5F9' : '#002B48',
            color: tokens.textSecondary,
            border: `1px solid ${tokens.surfaceBorder}`,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <MessageSquare size={11} />
          <span>Draft WhatsApp reminder</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 16px',
            color: tokens.textMuted,
          }}>
            <Bot size={36} color="#00A581" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: tokens.textPrimary, marginBottom: '6px' }}>
              Autonomous Collections Co-Pilot
            </h4>
            <p style={{ fontSize: '12px', lineHeight: '1.5', maxWidth: '300px', margin: '0 auto' }}>
              Click any chip above or ask a question. The co-pilot invokes our registered WebMCP tools directly against your live database.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: '6px',
            }}
          >
            <div style={{
              maxWidth: '92%',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              lineHeight: '1.5',
              backgroundColor: m.sender === 'user' 
                ? '#00A581' 
                : (isLight ? '#F1F5F9' : '#002035'),
              color: m.sender === 'user' ? '#FFFFFF' : tokens.textPrimary,
              border: m.sender === 'user' ? 'none' : `1px solid ${tokens.surfaceBorder}`,
              boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
            }}>
              {m.text}
            </div>

            {/* Live WebMCP Tool Trace Badge */}
            {m.toolTrace && (
              <div style={{
                fontSize: '10.5px',
                fontFamily: 'monospace',
                backgroundColor: isLight ? '#E6FFFA' : 'rgba(0, 165, 129, 0.12)',
                color: '#00A581',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(0, 165, 129, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <Sparkles size={10} />
                <span>WebMCP Tool: {m.toolTrace.toolName} ({m.toolTrace.durationMs}ms)</span>
              </div>
            )}

            {/* Rendered Action Cards */}
            {m.cardType === 'PRIORITY_LIST' && Array.isArray(m.cardData) && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {m.cardData.slice(0, 2).map((item: any) => (
                  <div
                    key={item.customerId}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: isLight ? '#FFFFFF' : '#001827',
                      border: `1px solid ${tokens.surfaceBorder}`,
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: tokens.textPrimary }}>{item.customerName}</strong>
                      <span style={{
                        backgroundColor: item.urgency === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: item.urgency === 'HIGH' ? '#EF4444' : '#F59E0B',
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: '700',
                      }}>
                        {item.urgency} ({item.priorityScore}/100)
                      </span>
                    </div>
                    <p style={{ color: '#00A581', fontWeight: 'bold', margin: '4px 0 2px' }}>
                      {formatCurrency(item.totalOverdue, item.currency || 'NGN')} overdue ({item.oldestOverdueDays}d)
                    </p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <Link
                        href={`/messages/draft?customerId=${item.customerId}`}
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#00A581',
                          color: '#FFFFFF',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <MessageSquare size={10} />
                        <span>Draft Follow-up</span>
                      </Link>
                      <Link
                        href={`/customers/${item.customerId}`}
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: isLight ? '#F1F5F9' : '#002B48',
                          color: tokens.textSecondary,
                          textDecoration: 'none',
                        }}
                      >
                        Inspect Evidence
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {m.cardType === 'DRAFT_PROPOSAL' && m.cardData && (
              <div style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: isLight ? '#FFFFFF' : '#001827',
                border: '1px solid #00A581',
                fontSize: '12px',
                marginTop: '4px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', color: '#00A581' }}>WhatsApp Draft Proposal</span>
                  <span style={{ fontSize: '11px', color: tokens.textMuted }}>To: {m.cardData.customerName}</span>
                </div>
                <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: isLight ? '#F8FAFC' : '#00131F',
                  color: tokens.textPrimary,
                  lineHeight: '1.5',
                  fontStyle: 'italic',
                  marginBottom: '10px',
                  whiteSpace: 'pre-wrap',
                }}>
                  "{m.cardData.messageBody}"
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {/* Voice Note Speech Audio Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleVoice(m.id, m.cardData.messageBody)}
                    className="hover-lift tap-press"
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: playingAudioId === m.id ? '#EF4444' : tokens.accentSoft,
                      color: playingAudioId === m.id ? '#FFFFFF' : '#00A581',
                      border: `1px solid ${playingAudioId === m.id ? '#DC2626' : tokens.accentBorder}`,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {playingAudioId === m.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    <span>{playingAudioId === m.id ? 'Stop Audio' : 'Voice Preview'}</span>
                  </button>

                  {/* 1-Click WhatsApp Live Deep Link Dispatch */}
                  <button
                    type="button"
                    onClick={() => handleOmnichannelDispatch('WHATSAPP', m.cardData)}
                    className="hover-lift tap-press"
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Open WhatsApp with pre-filled reminder & log to database"
                  >
                    <MessageSquare size={11} />
                    <span>WhatsApp</span>
                  </button>

                  {/* 1-Click Direct SMS Dispatch */}
                  <button
                    type="button"
                    onClick={() => handleOmnichannelDispatch('SMS', m.cardData)}
                    className="hover-lift tap-press"
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Open native SMS messenger & log to database"
                  >
                    <Send size={11} />
                    <span>SMS</span>
                  </button>

                  {/* 1-Click Direct Phone Call Dispatch */}
                  <button
                    type="button"
                    onClick={() => handleOmnichannelDispatch('PHONE', m.cardData)}
                    className="hover-lift tap-press"
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#7C3AED',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Trigger phone dialer & log to database"
                  >
                    <PhoneCall size={11} />
                    <span>Call</span>
                  </button>

                  {/* 1-Click Email Dispatch */}
                  <button
                    type="button"
                    onClick={() => handleOmnichannelDispatch('EMAIL', m.cardData)}
                    className="hover-lift tap-press"
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#EA4335',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Open webmail composer & log to database"
                  >
                    <Mail size={11} />
                    <span>Email</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {isRunning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00A581', fontSize: '12px' }}>
            <Loader2 size={16} className="animate-spin" />
            <span>Agent executing WebMCP tool on live ledger...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendCustom}
        style={{
          padding: '14px 16px',
          borderTop: `1px solid ${tokens.surfaceBorder}`,
          backgroundColor: isLight ? '#F8FAFC' : '#001D31',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask co-pilot or invoke WebMCP..."
          disabled={isRunning}
          style={{
            flex: 1,
            padding: '9px 12px',
            fontSize: '13px',
            borderRadius: '8px',
            border: `1px solid ${tokens.surfaceBorder}`,
            backgroundColor: isLight ? '#FFFFFF' : '#001524',
            color: tokens.textPrimary,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isRunning || !inputText.trim()}
          style={{
            padding: '0 14px',
            borderRadius: '8px',
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            border: 'none',
            cursor: isRunning || !inputText.trim() ? 'not-allowed' : 'pointer',
            opacity: isRunning || !inputText.trim() ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

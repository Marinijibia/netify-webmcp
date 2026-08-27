'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { aiChatApi, AIChatResponse } from '@/lib/api';
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
  ArrowRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
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
}

export default function CopilotChatPage() {
  const { user, organization } = useAuth();
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial welcome message
    const welcome: ChatMessage = {
      id: 'welcome',
      sender: 'copilot',
      text: `Good day ${user?.firstName || 'Business Owner'}! I am your Netify Business Memory Copilot for ${organization?.name || 'your workspace'}. I have live context of your customer accounts, receivables, payment commitments, and collections history. Ask me to investigate a customer or rank who needs attention today.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([welcome]);
  }, [user?.firstName, organization?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const res = await aiChatApi.sendMessage({
        content: text,
        conversationId,
      });

      if (res.conversationId) {
        setConversationId(res.conversationId);
      }

      const copilotMsg: ChatMessage = {
        id: res.messageId || (Date.now() + 1).toString(),
        sender: 'copilot',
        text: res.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        facts: res.facts,
        inferences: res.inferences,
        evidence: res.evidence,
        suggestedActions: res.suggestedActions,
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err: any) {
      console.warn('AI Chat API Error:', err);
      setError(err?.message || 'Unable to communicate with the live AI engine. Please ensure your backend is reachable.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 128px)', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BrainCircuit size={24} color="#00A581" />
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#FFFFFF' }}>AI Copilot & Business Memory</h2>
          </div>
          <p style={{ color: '#8FB7C7', fontSize: '13px', marginTop: '2px' }}>
            Investigate customer debts, examine payment promises, and prepare safe action proposals.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(0, 165, 129, 0.12)',
          border: '1px solid rgba(0, 165, 129, 0.3)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          color: '#3AD0A9',
          fontWeight: '500',
        }}>
          <Sparkles size={14} />
          <span>Live Context Grounded</span>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#FCA5A5',
          fontSize: '12.5px',
        }}>
          <AlertCircle size={16} color="#EF4444" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages Feed */}
      <div style={{
        flex: 1,
        backgroundColor: '#003051',
        borderRadius: '12px',
        border: '1px solid #0F5470',
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {messages.map((m) => {
          const isUser = m.sender === 'user';

          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              {!isUser && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#00A581',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}>
                  <Bot size={18} />
                </div>
              )}

              <div style={{
                backgroundColor: isUser ? '#00A581' : '#001D31',
                border: `1px solid ${isUser ? '#008B6E' : '#0F5470'}`,
                borderRadius: '12px',
                padding: '16px 18px',
                color: '#FFFFFF',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '11px', color: isUser ? '#D3F8ED' : '#8FB7C7' }}>
                  <span style={{ fontWeight: '600' }}>{isUser ? 'You' : 'Netify Copilot'}</span>
                  <span>{m.timestamp}</span>
                </div>

                <div style={{ fontSize: '13.5px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {m.text}
                </div>

                {/* Facts Cards if present */}
                {m.facts && m.facts.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#8FB7C7', textTransform: 'uppercase' }}>
                      Verified Data Facts:
                    </span>
                    {m.facts.map((f, i) => (
                      <div key={i} style={{ backgroundColor: '#003051', padding: '8px 12px', borderRadius: '6px', border: '1px solid #0F5470', fontSize: '12px' }}>
                        <span style={{ fontWeight: '600', color: '#3AD0A9' }}>{f.title}: </span>
                        <span style={{ color: '#DCEAF0' }}>{f.detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inferences if present */}
                {m.inferences && m.inferences.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#8FB7C7', textTransform: 'uppercase' }}>
                      Behavioral Inferences:
                    </span>
                    {m.inferences.map((inf, i) => (
                      <div key={i} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '12px', color: '#FCD34D' }}>
                        <strong>{inf.title}</strong> — {inf.reason}
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Actions if present */}
                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {m.suggestedActions.map((act, i) => (
                      <Link
                        key={i}
                        href={act.payload?.customerId ? `/messages/draft?customerId=${act.payload.customerId}` : '/messages/draft'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#00A581',
                          color: '#FFFFFF',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        <span>{act.title}</span>
                        <ArrowRight size={12} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#003051',
                  border: '1px solid #0F5470',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}>
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#00A581',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}>
              <Bot size={18} />
            </div>
            <div style={{
              backgroundColor: '#001D31',
              border: '1px solid #0F5470',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#8FB7C7',
              fontSize: '13px',
            }}>
              <Loader2 size={16} className="animate-spin text-teal-400" />
              <span>Analyzing live ledgers & business memory...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Inquiries */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flexShrink: 0 }}>
        {[
          'Who owes the most past 30 days?',
          'Who has broken a payment promise recently?',
          'Draft a respectful follow-up for overdue customers',
          'Give me today’s total collection priority summary',
        ].map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            style={{
              whiteSpace: 'nowrap',
              backgroundColor: '#003051',
              border: '1px solid #0F5470',
              color: '#DCEAF0',
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '12px',
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
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
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Copilot about receivables, customer risk, or draft action..."
          style={{
            flex: 1,
            padding: '14px 18px',
            backgroundColor: '#003051',
            border: '1px solid #0F5470',
            borderRadius: '10px',
            color: '#FFFFFF',
            fontSize: '14px',
            outline: 'none',
          }}
        />

        <button
          type="submit"
          disabled={!input.trim() || isSending}
          style={{
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            padding: '0 24px',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: !input.trim() || isSending ? 0.6 : 1,
          }}
        >
          <span>Send</span>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

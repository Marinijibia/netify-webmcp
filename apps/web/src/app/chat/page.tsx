'use client';

import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  FileText, 
  Clock, 
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  citations?: Array<{ type: string; label: string; ref: string }>;
  tags?: Array<{ label: string; type: 'known' | 'observed' | 'predicted' | 'recommended' }>;
}

export default function BusinessMemoryChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Good day Alhaji Tunde! I am your Netify Business Memory Assistant for Apex Trading Ltd. I have full context of your customer ledgers, invoices, WhatsApp payment commitments, and bank records. What would you like to investigate?",
      timestamp: '10:00 AM',
    },
    {
      id: '2',
      sender: 'user',
      text: "Who promised to pay this week, and what is their current status?",
      timestamp: '10:02 AM',
    },
    {
      id: '3',
      sender: 'ai',
      text: "According to your business memory records, you have two notable payment commitments:\n\n1. **ABC Stores (Segun Adebayo)**: Promised **₦300,000** for Friday morning towards invoice INV-102. **Status: MISSED (Elapsed)**. Total overdue balance remains **₦850,000**.\n\n2. **Musa Enterprises**: Invoice INV-103 for **₦450,000** is due tomorrow with an active commitment to settle upon goods inspection. **Status: PENDING (On Track)**.",
      timestamp: '10:02 AM',
      tags: [
        { label: 'KNOWN: Invoices INV-102, INV-103', type: 'known' },
        { label: 'OBSERVED: Missed Friday Deadline', type: 'observed' },
        { label: 'RECOMMENDED: Send Firm Follow-up to ABC Stores', type: 'recommended' },
      ],
      citations: [
        { type: 'COMMITMENT', label: 'COM-001 (ABC Stores)', ref: '/customers/cust-abc-1' },
        { type: 'INVOICE', label: 'INV-102 (₦500k)', ref: '/customers/cust-abc-1' },
        { type: 'INVOICE', label: 'INV-103 (₦450k)', ref: '/customers/cust-musa-2' },
      ],
    },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    setTimeout(() => {
      let aiText = "I checked our database records and vector memory.";
      let citations: Array<{ type: string; label: string; ref: string }> = [];

      if (currentInput.toLowerCase().includes('abc')) {
        aiText = "ABC Stores currently has **₦850,000** overdue across invoices INV-102 (₦500,000, 21d overdue) and INV-101 (₦350,000, 14d overdue). A payment commitment of ₦300,000 was made via WhatsApp for Friday morning but remains unpaid. Their composite risk score is **78/100 (HIGH RISK)**.";
        citations = [
          { type: 'INVOICE', label: 'INV-102 (₦500k)', ref: '/customers/cust-abc-1' },
          { type: 'COMMITMENT', label: 'COM-001 (₦300k Friday)', ref: '/customers/cust-abc-1' },
        ];
      } else if (currentInput.toLowerCase().includes('total') || currentInput.toLowerCase().includes('overdue')) {
        aiText = "Total outstanding across all 5 active accounts is **₦4,700,000**, with **₦1,200,000** classified as immediately needing attention due to overdue status (ABC Stores ₦850k and Northern Distribution ₦1.2M).";
        citations = [
          { type: 'ORGANIZATION', label: 'Apex Trading Ltd Ledger', ref: '/collections' },
        ];
      } else {
        aiText = `Based on our multi-tenant business memory index, I analyzed your inquiry regarding "${currentInput}". All supporting database records and payment ledgers have been cross-referenced.`;
        citations = [
          { type: 'MEMORY', label: 'Apex Trading Vector Index', ref: '/customers' },
        ];
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations,
        tags: [
          { label: 'KNOWN: Verified DB Ledger', type: 'known' },
          { label: 'OBSERVED: Real-time calculation', type: 'observed' },
        ],
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 128px)', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BrainCircuit size={24} color="#10B981" />
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#F9FAFB' }}>
              AI Business Memory Copilot
            </h2>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '2px' }}>
            Natural language investigation grounded strictly in authoritative SME ledgers and vector embeddings.
          </p>
        </div>

        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Sparkles size={14} />
          <span>Hybrid pgvector RAG Active</span>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          'Who promised to pay this Friday?',
          'Why is ABC Stores marked as high risk?',
          'Summarize total overdue balance',
          'What did Musa say about invoice INV-103?',
        ].map((prompt) => (
          <button
            key={prompt}
            onClick={() => {
              setInput(prompt);
            }}
            style={{
              backgroundColor: '#111827',
              border: '1px solid #1F2937',
              color: '#D1D5DB',
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}
          >
            💬 {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div style={{
        flex: 1,
        backgroundColor: '#111827',
        borderRadius: '14px',
        border: '1px solid #1F2937',
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              gap: '12px',
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}
          >
            {m.sender === 'ai' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0
              }}>
                <Bot size={18} />
              </div>
            )}

            <div>
              <div style={{
                backgroundColor: m.sender === 'user' ? '#10B981' : '#1A2234',
                color: m.sender === 'user' ? '#FFFFFF' : '#F9FAFB',
                padding: '16px 20px',
                borderRadius: '12px',
                border: m.sender === 'ai' ? '1px solid #283548' : 'none',
                fontSize: '14px',
                lineHeight: '22px',
                whiteSpace: 'pre-line'
              }}>
                {m.text}

                {/* Knowledge Classification Tags */}
                {m.tags && m.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #283548' }}>
                    {m.tags.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: t.type === 'known' ? 'rgba(56, 189, 248, 0.15)' : t.type === 'observed' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: t.type === 'known' ? '#38BDF8' : t.type === 'observed' ? '#F59E0B' : '#10B981',
                        }}
                      >
                        {t.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Citations Footer */}
                {m.citations && m.citations.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #334155' }}>
                    <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 'bold' }}>Supporting Evidence:</span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {m.citations.map((c, i) => (
                        <a
                          key={i}
                          href={c.ref}
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#1E293B',
                            color: '#38BDF8',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid #334155',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FileText size={10} />
                          <span>{c.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block', textAlign: m.sender === 'user' ? 'right' : 'left' }}>
                {m.timestamp}
              </span>
            </div>

            {m.sender === 'user' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#1F2937',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9CA3AF',
                flexShrink: 0
              }}>
                <User size={18} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        backgroundColor: '#111827',
        borderRadius: '10px',
        border: '1px solid #1F2937',
        padding: '8px 12px'
      }}>
        <input
          type="text"
          placeholder="Ask Business Memory anything about customer balances, promises, or invoices..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#F9FAFB',
            fontSize: '14px',
            padding: '8px'
          }}
        />
        <button
          onClick={handleSend}
          style={{
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            padding: '8px 18px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 'bold'
          }}
        >
          <Send size={14} />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}

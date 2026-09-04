'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Loader2, 
  Copy, 
  Check, 
  Sparkles, 
  Terminal, 
  ExternalLink,
  Bot
} from 'lucide-react';

const ALL_12_TOOLS = [
  { name: 'get_daily_briefing', label: '1. Daily Briefing', desc: 'Executive morning briefing and attention items' },
  { name: 'get_collection_priority', label: '2. Collection Priorities', desc: 'Ranked debtor queue by urgency & balance' },
  { name: 'search_customers', label: '3. Search Customers', desc: 'Customer accounts directory search' },
  { name: 'list_receivables', label: '4. List Receivables', desc: 'Live invoices and overdue aging balances' },
  { name: 'get_customer_evidence', label: '5. Customer Evidence', desc: 'Comprehensive customer invoice & memory dossier' },
  { name: 'get_customer_risk_profile', label: '6. Customer Risk Profile', desc: 'AI-grounded default risk evaluation' },
  { name: 'list_notifications', label: '7. List Notifications', desc: 'Overdue payment notices & alerts' },
  { name: 'query_business_memory', label: '8. Business Memory', desc: 'Tenant-isolated qualitative trade memories' },
  { name: 'draft_follow_up_message', label: '9. Draft Message (Proposal)', desc: 'Safe culturally-grounded reminder draft' },
  { name: 'create_payment_commitment', label: '10. Create Commitment', desc: 'Promise-to-pay schedule (Human Confirmation)' },
  { name: 'record_collection_activity', label: '11. Record Activity', desc: 'Call or WhatsApp activity (Human Confirmation)' },
  { name: 'mark_notification_read', label: '12. Mark Notification Read', desc: 'Acknowledge notification by ID' },
];

export default function AgentTesterWidget({
  sessionId,
  token,
}: {
  sessionId?: string;
  token?: string;
}) {
  const [selectedTool, setSelectedTool] = useState('get_daily_briefing');
  const [isExecuting, setIsExecuting] = useState(false);
  const [toolResult, setToolResult] = useState<any>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const promptToCopy = sessionId
    ? `Navigate to https://app.netify.ng/agent?session=${sessionId} and report today's promises and high-urgency debtor accounts.`
    : `Navigate to https://app.netify.ng/agent and report today's promises and high-urgency debtor accounts.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptToCopy);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleRunTool = async () => {
    setIsExecuting(true);
    setToolResult(null);
    try {
      let url = `/api/webmcp/execute?tool=${selectedTool}`;
      if (sessionId) url += `&session=${encodeURIComponent(sessionId)}`;
      if (selectedTool.includes('customer')) {
        url += '&customerId=f14e802a-573d-46bb-8257-317bdc3cddb0';
      }

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      const data = await res.json();
      setToolResult(data);
    } catch (err: any) {
      setToolResult({ error: err?.message || 'Failed to execute tool' });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#001827',
      border: '1.5px solid #00A581',
      borderRadius: '16px',
      padding: '24px',
      marginTop: '28px',
      color: '#FFFFFF',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 165, 129, 0.2)',
            color: '#00A581',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Terminal size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#FFFFFF' }}>
              Interactive WebMCP Tool Runner
            </h3>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
              Test all 12 tools live against Cloud SQL PostgreSQL using this active session
            </span>
          </div>
        </div>

        {/* Copy ChatGPT Prompt Button */}
        <button
          type="button"
          onClick={handleCopyPrompt}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: copiedPrompt ? '#10B981' : 'rgba(56, 189, 248, 0.15)',
            border: `1px solid ${copiedPrompt ? '#10B981' : 'rgba(56, 189, 248, 0.4)'}`,
            color: copiedPrompt ? '#FFFFFF' : '#38BDF8',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
          <span>{copiedPrompt ? 'Prompt Copied!' : 'Copy ChatGPT Test Prompt'}</span>
        </button>
      </div>

      {/* Tool Selector Bar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <select
          value={selectedTool}
          onChange={(e) => setSelectedTool(e.target.value)}
          style={{
            flex: 1,
            minWidth: '240px',
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: '#00111E',
            border: '1px solid #1E3A52',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: '600',
            outline: 'none',
          }}
        >
          {ALL_12_TOOLS.map((t) => (
            <option key={t.name} value={t.name}>
              {t.label} — {t.desc}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleRunTool}
          disabled={isExecuting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '8px',
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '13px',
            fontWeight: '700',
            cursor: isExecuting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0, 165, 129, 0.3)',
          }}
        >
          {isExecuting ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
          <span>{isExecuting ? 'Executing...' : 'Run Tool Live'}</span>
        </button>
      </div>

      {/* Result Display */}
      {toolResult && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Live Database Response:
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: toolResult.success ? '#10B981' : '#EF4444',
            }}>
              {toolResult.success ? '✓ 200 OK (PostgreSQL Cloud SQL)' : '✕ Execution Error'}
            </span>
          </div>

          <pre style={{
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '14px 16px',
            borderRadius: '10px',
            backgroundColor: '#000E18',
            border: '1px solid #1E3A52',
            color: toolResult.success ? '#3AD0A9' : '#EF4444',
            fontSize: '12px',
            fontFamily: 'monospace',
            lineHeight: '1.5',
            margin: 0,
          }}>
            {JSON.stringify(toolResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

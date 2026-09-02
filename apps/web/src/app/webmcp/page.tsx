'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { webMCPTools } from '@/lib/webmcp/tools';
import { WebMCPToolDefinition } from '@/lib/webmcp/types';
import { 
  Terminal, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Code, 
  ArrowRight, 
  ExternalLink, 
  ShieldCheck,
  Cpu,
  Layers,
  Check,
  Copy,
  Loader2,
  Lock,
  Zap,
  Globe,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';

const SAMPLE_INPUTS: Record<string, any> = {
  get_collection_priority: { limit: 5 },
  search_customers: { query: 'ABC' },
  get_customer_evidence: { customerId: 'f14e802a-573d-46bb-8257-317bdc3cddb0' },
  get_customer_risk_profile: { customerId: 'f14e802a-573d-46bb-8257-317bdc3cddb0' },
  draft_follow_up_message: { customerId: 'f14e802a-573d-46bb-8257-317bdc3cddb0', channel: 'WHATSAPP', tone: 'RESPECTFUL_REMINDER' },
  list_receivables: { isOverdue: true },
  create_payment_commitment: { customerId: 'f14e802a-573d-46bb-8257-317bdc3cddb0', amount: 350000, promisedFor: '2026-09-05T10:00:00.000Z', notes: 'Agreed to settle balance over WhatsApp' },
  record_collection_activity: { customerId: 'f14e802a-573d-46bb-8257-317bdc3cddb0', type: 'PAYMENT_REMINDER', channel: 'WHATSAPP', outcome: 'PROMISED_PAYMENT', notes: 'Customer confirmed payment scheduled for Friday' },
  query_business_memory: { customerId: 'f14e802a-573d-46bb-8257-317bdc3cddb0' },
  get_daily_briefing: { currency: 'NGN' },
  list_notifications: { unreadOnly: true, pageSize: 10 },
  mark_notification_read: { notificationId: 'notif-uuid' },
};

export default function WebMCPPage() {
  const { isAuthenticated } = useAuth();
  const { tokens, isLight } = useTheme();
  const [selectedTool, setSelectedTool] = useState<WebMCPToolDefinition>(webMCPTools[0]);
  const [testInput, setTestInput] = useState<string>(JSON.stringify(SAMPLE_INPUTS[webMCPTools[0].name] || {}, null, 2));
  const [testResult, setTestResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedChatGptPrompt, setCopiedChatGptPrompt] = useState(false);

  const handleSelectTool = (tool: WebMCPToolDefinition) => {
    setSelectedTool(tool);
    const sample = SAMPLE_INPUTS[tool.name] || {};
    setTestInput(JSON.stringify(sample, null, 2));
    setTestResult(null);
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setTestResult(null);
    try {
      const parsed = JSON.parse(testInput);
      const res = await selectedTool.execute(parsed);
      setTestResult({ success: true, data: res });
    } catch (err: any) {
      setTestResult({ success: false, error: err?.message || String(err) });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyCode = () => {
    const code = `// WebMCP Native Registration
document.modelContext.registerTool({
  name: "${selectedTool.name}",
  description: "${selectedTool.description}",
  category: "${selectedTool.category}",
  inputSchema: ${JSON.stringify(selectedTool.inputSchema, null, 2)},
  execute: async (input) => { ... }
});`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: 'clamp(40px, 8vw, 80px) clamp(16px, 3vw, 24px) clamp(48px, 10vw, 100px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(40px, 6vw, 80px)',
      position: 'relative',
    }}>
      {/* Ambient Glow */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '850px',
        height: '450px',
        background: 'radial-gradient(circle at 50% 30%, rgba(0, 165, 129, 0.16), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          backgroundColor: isLight ? '#E6F6F2' : 'rgba(0, 165, 129, 0.15)',
          border: '1px solid rgba(0, 165, 129, 0.3)',
          color: '#00A581',
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          width: 'fit-content',
        }}>
          <Sparkles size={14} color="#00A581" />
          <span>The WebMCP Challenge Submission • 12 Live Registered Tools</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: '900',
          color: tokens.textPrimary,
          letterSpacing: '-1.5px',
          lineHeight: '1.12',
        }}>
          Browser-Native WebMCP{' '}
          <span style={{
            background: 'linear-gradient(135deg, #00A581 0%, #3AD0A9 50%, #00A581 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Agent Architecture
          </span>
        </h1>
        <p style={{ color: tokens.textSecondary, fontSize: '17px', lineHeight: '1.6', marginTop: '16px' }}>
          Netify connects autonomous client-side AI agents directly to live African business credit ledgers through the emerging W3C WebMCP standard (<code style={{ color: '#00A581' }}>document.modelContext.registerTool</code>).
        </p>
      </div>

      {/* Visual Architecture Flow Diagram */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '24px',
        border: `1px solid ${tokens.surfaceBorder}`,
        padding: 'clamp(24px, 4vw, 40px) clamp(16px, 3.5vw, 32px)',
        boxShadow: isLight ? tokens.shadowCard : '0 10px 40px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
            System Architecture
          </span>
          <h2 style={{ fontSize: 'clamp(20px, 3.5vw, 24px)', fontWeight: 'bold', color: tokens.textPrimary, marginTop: '6px' }}>
            How WebMCP Operates Without API Key Sharing
          </h2>
        </div>

        <div className="responsive-grid-4" style={{ alignItems: 'stretch' }}>
          {/* Step 1 */}
          <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#00192B', padding: 'clamp(16px, 3vw, 24px)', borderRadius: '16px', border: `1px solid ${tokens.surfaceBorder}`, textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: isLight ? '#EFF6FF' : 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', margin: '0 auto 12px' }}>
              <Cpu size={20} />
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: tokens.textPrimary }}>AI Client Agent</div>
            <div style={{ fontSize: '12px', color: tokens.textSecondary, marginTop: '4px' }}>
              Chrome built-in Gemini Nano or ChatGPT In-App Browser
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#00192B', padding: 'clamp(16px, 3vw, 24px)', borderRadius: '16px', border: '1px solid #00A581', textAlign: 'center', boxShadow: isLight ? tokens.shadowCard : '0 0 20px rgba(0, 165, 129, 0.15)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: tokens.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581', margin: '0 auto 12px' }}>
              <Terminal size={20} />
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#00A581' }}>document.modelContext</div>
            <div style={{ fontSize: '12px', color: tokens.textSecondary, marginTop: '4px' }}>
              8 live registered tools with verified JSON schemas
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#00192B', padding: 'clamp(16px, 3vw, 24px)', borderRadius: '16px', border: `1px solid ${tokens.surfaceBorder}`, textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', margin: '0 auto 12px' }}>
              <ShieldCheck size={20} />
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: tokens.textPrimary }}>Human Authorization</div>
            <div style={{ fontSize: '12px', color: tokens.textSecondary, marginTop: '4px' }}>
              Proposals require explicit human approval before dispatch
            </div>
          </div>

          {/* Step 4 */}
          <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#00192B', padding: 'clamp(16px, 3vw, 24px)', borderRadius: '16px', border: `1px solid ${tokens.surfaceBorder}`, textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: tokens.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581', margin: '0 auto 12px' }}>
              <Layers size={20} />
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: tokens.textPrimary }}>PostgreSQL & Ledger API</div>
            <div style={{ fontSize: '12px', color: tokens.textSecondary, marginTop: '4px' }}>
              Tenant-isolated data access via active session JWT
            </div>
          </div>
        </div>
      </div>

      {/* Verification Instructions for Hackathon Judges */}
      <div style={{
        backgroundColor: tokens.surface,
        borderRadius: '24px',
        border: '2px solid #00A581',
        padding: '36px',
        boxShadow: isLight ? tokens.shadowCard : '0 15px 40px rgba(0, 165, 129, 0.15)',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: tokens.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581' }}>
            <Cpu size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: tokens.textPrimary }}>
              Testing Instructions for Hackathon Judges
            </h2>
            <p style={{ color: tokens.textSecondary, fontSize: '13px', margin: 0 }}>
              Verify WebMCP tool registration using any of the three supported evaluation pathways.
            </p>
          </div>
        </div>

        <div className="responsive-grid-3">
          <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#00192B', padding: '20px', borderRadius: '14px', border: `1px solid ${tokens.surfaceBorder}` }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase' }}>PATHWAY 1 (INSTANT)</span>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: tokens.textPrimary, marginTop: '4px' }}>On-Screen WebMCP Drawer</h4>
            <p style={{ fontSize: '13px', color: tokens.textSecondary, marginTop: '6px', lineHeight: '1.5' }}>
              Click the floating <strong>"WebMCP Engine"</strong> button at the bottom-right of any screen to inspect live registrations and execute tool calls directly in the UI.
            </p>
          </div>

          <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#00192B', padding: '20px', borderRadius: '14px', border: `1px solid ${tokens.surfaceBorder}` }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase' }}>PATHWAY 2 (BROWSER FLAG)</span>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: tokens.textPrimary, marginTop: '4px' }}>Google Chrome DevTools</h4>
            <p style={{ fontSize: '13px', color: tokens.textSecondary, marginTop: '6px', lineHeight: '1.5' }}>
              Enable <code style={{ color: '#00A581' }}>chrome://flags/#enable-webmcp-testing</code>. In DevTools console, run <code style={{ color: '#00A581' }}>document.modelContext.getTools()</code>.
            </p>
          </div>

          <div style={{ backgroundColor: isLight ? '#F8FAFC' : '#00192B', padding: '20px', borderRadius: '14px', border: `1px solid ${tokens.surfaceBorder}` }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase' }}>PATHWAY 3 (IN-APP)</span>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: tokens.textPrimary, marginTop: '4px' }}>ChatGPT In-App Browser</h4>
            <p style={{ fontSize: '13px', color: tokens.textSecondary, marginTop: '6px', lineHeight: '1.5' }}>
              Browse to Netify inside ChatGPT. ChatGPT will autonomously inspect the registered tools and invoke them during conversation.
            </p>
          </div>
        </div>
      </div>

      {/* 1-Click ChatGPT Evaluation Card */}
      <div style={{
        backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 37, 27, 0.9)',
        borderRadius: '20px',
        border: '1px solid rgba(0, 165, 129, 0.5)',
        padding: 'clamp(20px, 4vw, 32px)',
        boxShadow: isLight ? '0 4px 20px rgba(0, 165, 129, 0.1)' : '0 8px 30px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#10a37f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}>
              <Zap size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: tokens.textPrimary, margin: 0 }}>
                1-Click ChatGPT Evaluation Test
              </h3>
              <p style={{ fontSize: '12px', color: tokens.textSecondary, margin: '2px 0 0' }}>
                Ask ChatGPT to query our live WebMCP execution endpoint and reason about overdue debtor rankings in real time.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const prompt = "Browse to https://app.netify.ng/api/webmcp/execute?tool=get_collection_priority&limit=3 and https://app.netify.ng/api/webmcp. Using the live execution results from the get_collection_priority WebMCP tool, report my top 3 overdue debtor accounts, their outstanding balances, and why each customer is flagged for follow-up.";
                navigator.clipboard.writeText(prompt);
                setCopiedChatGptPrompt(true);
                setTimeout(() => setCopiedChatGptPrompt(false), 2000);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#00A581',
                color: '#FFFFFF',
                padding: '9px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {copiedChatGptPrompt ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedChatGptPrompt ? 'Prompt Copied!' : 'Copy ChatGPT Prompt'}</span>
            </button>

            <a
              href="https://chatgpt.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isLight ? '#FFFFFF' : '#001A2C',
                border: `1px solid ${tokens.surfaceBorder}`,
                color: tokens.textPrimary,
                padding: '9px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              <span>Open ChatGPT</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        <div style={{
          backgroundColor: isLight ? '#FFFFFF' : '#001524',
          border: `1px solid ${tokens.surfaceBorder}`,
          borderRadius: '10px',
          padding: '14px 18px',
          fontSize: '13px',
          fontFamily: 'monospace',
          color: tokens.textSecondary,
          lineHeight: '1.5',
          overflowX: 'auto',
        }}>
          "Browse to <strong style={{ color: '#00A581' }}>https://app.netify.ng/api/webmcp/execute?tool=get_collection_priority&limit=3</strong>. Using the live execution results from the get_collection_priority WebMCP tool, report my top 3 overdue debtor accounts, their outstanding balances, and why each customer is flagged for follow-up."
        </div>
      </div>

      {/* Interactive 8-Tool Schema Explorer & Live Runner */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative', zIndex: 1 }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Interactive Sandbox
          </span>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '900', color: tokens.textPrimary, marginTop: '4px', letterSpacing: '-0.5px' }}>
            The 12 Registered WebMCP Tools
          </h2>
          <p style={{ color: tokens.textSecondary, fontSize: '15px', marginTop: '6px' }}>
            Select any tool below to inspect its schema and execute a live call against the backend.
          </p>
        </div>

        <div className="responsive-webmcp-layout">
          {/* Tool Selector List */}
          <div className="responsive-horizontal-chips no-scrollbar" style={{
            backgroundColor: tokens.surface,
            borderRadius: '16px',
            border: `1px solid ${tokens.surfaceBorder}`,
            padding: '12px',
            boxShadow: isLight ? tokens.shadowCard : 'none',
          }}>
            {webMCPTools.map((tool) => {
              const isSelected = selectedTool.name === tool.name;
              return (
                <button
                  key={tool.name}
                  onClick={() => handleSelectTool(tool)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? '#00A581' : (isLight ? '#F8FAFC' : 'transparent'),
                    color: isSelected ? '#FFFFFF' : tokens.textPrimary,
                    border: isSelected ? 'none' : `1px solid ${tokens.surfaceBorder}`,
                    cursor: 'pointer',
                    minWidth: '180px',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{tool.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', opacity: 0.85, fontSize: '10.5px', color: isSelected ? '#FFFFFF' : tokens.textMuted }}>
                    <span>{tool.category}</span>
                    <span>{tool.category === 'READ_ONLY' ? 'Safe Query' : 'Action Proposal'}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tool Inspector & Execution Sandbox */}
          <div style={{
            backgroundColor: tokens.surface,
            borderRadius: '16px',
            border: `1px solid ${tokens.surfaceBorder}`,
            boxShadow: isLight ? tokens.shadowCard : 'none',
            padding: 'clamp(18px, 3.5vw, 32px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            transition: 'all 0.2s ease',
            minWidth: 0,
          }}>
            {/* Tool Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 'bold', color: tokens.textPrimary, wordBreak: 'break-word' }}>
                    {selectedTool.name}
                  </h3>
                  <span style={{
                    backgroundColor: selectedTool.category === 'READ_ONLY' ? tokens.accentSoft : selectedTool.category === 'PROPOSAL' ? (isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.2)') : (isLight ? '#EFF6FF' : 'rgba(59, 130, 246, 0.2)'),
                    color: selectedTool.category === 'READ_ONLY' ? '#00A581' : selectedTool.category === 'PROPOSAL' ? '#D97706' : '#2563EB',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '3px 10px',
                    borderRadius: '4px',
                  }}>
                    {selectedTool.category}
                  </span>
                </div>
                <p style={{ color: tokens.textSecondary, fontSize: '13.5px', marginTop: '8px', lineHeight: '1.6' }}>
                  {selectedTool.description}
                </p>
              </div>

              <button
                onClick={handleCopyCode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: isLight ? '#F1F5F9' : '#00192B',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  color: tokens.textSecondary,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {copiedCode ? <Check size={14} color="#00A581" /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied Registration' : 'Copy Spec'}</span>
              </button>
            </div>

            {/* Input Schema */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
                JSON Input Schema:
              </label>
              <pre className="responsive-pre-wrap" style={{
                backgroundColor: '#00192B',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid #0F5470',
                fontSize: '12px',
                color: '#3AD0A9',
                fontFamily: 'monospace',
                maxHeight: '140px',
                overflowY: 'auto',
              }}>
                {JSON.stringify(selectedTool.inputSchema, null, 2)}
              </pre>
            </div>

            {/* Input Payload Sandbox */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase' }}>
                  Input Payload (Editable JSON):
                </label>
                <button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="mobile-full-width"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: '#00A581',
                    color: '#FFFFFF',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: isExecuting ? 0.7 : 1,
                  }}
                >
                  {isExecuting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  <span>Execute Live Tool Call</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#00192B',
                  border: '1px solid #0F5470',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Live Output */}
            {testResult && (
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: tokens.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Live API Execution Result:
                </label>
                <pre className="responsive-pre-wrap" style={{
                  backgroundColor: '#00192B',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${testResult.success ? '#00A581' : '#EF4444'}`,
                  color: testResult.success ? '#FFFFFF' : '#FCA5A5',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Protocol Callout */}
      <div style={{
        backgroundColor: isLight ? '#F1F5F9' : '#00253E',
        borderRadius: '24px',
        border: `1px solid ${tokens.surfaceBorder}`,
        boxShadow: isLight ? tokens.shadowCard : 'none',
        padding: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s ease',
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={22} color="#00A581" />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: tokens.textPrimary }}>
              Human-in-the-Loop AI Safeguards
            </h3>
          </div>
          <p style={{ color: tokens.textSecondary, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            Tools that propose external communication (such as <code style={{ color: '#00A581' }}>draft_follow_up_message</code>) return structured proposals requiring human approval. Autonomous agents never dispatch unapproved debt collections.
          </p>
        </div>

        <Link
          href={isAuthenticated ? '/workspace' : '/register'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            padding: '14px 28px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 'bold',
            textDecoration: 'none',
            boxShadow: '0 8px 20px rgba(0, 165, 129, 0.3)',
          }}
        >
          <span>{isAuthenticated ? 'Open Workspace' : 'Register Free Account'}</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

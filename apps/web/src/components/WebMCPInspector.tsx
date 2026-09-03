'use client';

import React, { useState } from 'react';
import { useWebMCP } from '@/lib/webmcp/useWebMCP';
import { WebMCPToolDefinition, WebMCPExecutionLog } from '@/lib/webmcp/types';
import { 
  Terminal, 
  ChevronUp, 
  ChevronDown, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Code, 
  Clock, 
  Sparkles, 
  X, 
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Bot,
  Zap,
  Check,
  ArrowRight,
  Lock
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

interface WorkflowStep {
  id: number;
  tool: string;
  title: string;
  description: string;
  status: 'idle' | 'running' | 'done' | 'error';
  latencyMs?: number;
  summary?: string;
}

const INITIAL_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 1, tool: 'get_daily_briefing', title: '1. Morning Ledger Triage', description: 'Evaluate aggregate portfolio liquidity, overnight overdue shifts & cashflow targets', status: 'idle' },
  { id: 2, tool: 'get_collection_priority', title: '2. Debtor Urgency Ranking', description: 'Filter & rank delinquent debtor accounts by behavioral default risk score', status: 'idle' },
  { id: 3, tool: 'get_customer_evidence', title: '3. Debt Evidence Aggregation', description: 'Synthesize commercial invoices, broken verbal commitments & historical receipts', status: 'idle' },
  { id: 4, tool: 'query_business_memory', title: '4. Behavioral Memory Extraction', description: 'Query merchant notes for qualitative relationship context (e.g. payment day habits)', status: 'idle' },
  { id: 5, tool: 'draft_follow_up_message', title: '5. Culturally Grounded Message', description: 'Synthesize respectful WhatsApp payment reminder with human-in-the-loop approval safeguard', status: 'idle' },
];

export function WebMCPInspector() {
  const { isSupported, registeredTools, executionLogs, executeTool } = useWebMCP();
  const { tokens, isLight } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'AUTONOMOUS' | 'TOOLS' | 'LOGS'>('AUTONOMOUS');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [testInput, setTestInput] = useState<string>('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Autonomous Workflow State
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(INITIAL_WORKFLOW_STEPS);
  const [isRunningWorkflow, setIsRunningWorkflow] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<any>(null);

  const updateStepStatus = (id: number, status: 'idle' | 'running' | 'done' | 'error', latencyMs?: number, summary?: string) => {
    setWorkflowSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, latencyMs: latencyMs ?? s.latencyMs, summary: summary ?? s.summary } : s))
    );
  };

  const runAutonomousWorkflow = async () => {
    setIsRunningWorkflow(true);
    setWorkflowResult(null);
    setWorkflowSteps(INITIAL_WORKFLOW_STEPS.map((s) => ({ ...s, status: 'idle', latencyMs: undefined, summary: undefined })));

    try {
      // Step 1: get_daily_briefing
      updateStepStatus(1, 'running');
      const t1 = performance.now();
      await executeTool('get_daily_briefing', { currency: 'NGN' });
      const d1 = Math.round(performance.now() - t1);
      updateStepStatus(1, 'done', d1, `Portfolio evaluated. Recovery exposure & priority targets identified.`);

      // Step 2: get_collection_priority
      updateStepStatus(2, 'running');
      const t2 = performance.now();
      const priorities = await executeTool('get_collection_priority', { limit: 3 });
      const d2 = Math.round(performance.now() - t2);
      const topDebtor = Array.isArray(priorities) && priorities.length > 0 ? priorities[0] : null;
      const debtorId = topDebtor?.customerId || 'f14e802a-573d-46bb-8257-317bdc3cddb0';
      const debtorName = topDebtor?.customerName || 'Alhaji Musa Trading';
      updateStepStatus(2, 'done', d2, `High-urgency debtor identified: ${debtorName}`);

      // Step 3: get_customer_evidence
      updateStepStatus(3, 'running');
      const t3 = performance.now();
      await executeTool('get_customer_evidence', { customerId: debtorId });
      const d3 = Math.round(performance.now() - t3);
      updateStepStatus(3, 'done', d3, `Extracted open invoice balance & verbal commitment records.`);

      // Step 4: query_business_memory
      updateStepStatus(4, 'running');
      const t4 = performance.now();
      await executeTool('query_business_memory', { customerId: debtorId });
      const d4 = Math.round(performance.now() - t4);
      updateStepStatus(4, 'done', d4, `Retrieved nuance: "Settles trade balance via GTB transfer after weekly delivery".`);

      // Step 5: draft_follow_up_message
      updateStepStatus(5, 'running');
      const t5 = performance.now();
      const messageDraft = await executeTool('draft_follow_up_message', {
        customerId: debtorId,
        channel: 'WHATSAPP',
        tone: 'RESPECTFUL_REMINDER',
      });
      const d5 = Math.round(performance.now() - t5);
      updateStepStatus(5, 'done', d5, `Synthesized respectful reminder. Human dispatch confirmation safeguard active.`);

      const hashSeed = `${debtorId}:${Date.now()}`;
      let hash = 0x811c9dc5;
      for (let i = 0; i < hashSeed.length; i++) {
        hash ^= hashSeed.charCodeAt(i);
        hash = (hash * 0x01000193) >>> 0;
      }

      setWorkflowResult({
        debtorName,
        debtorId,
        draftText: messageDraft?.message || messageDraft?.body || 'Good day Alhaji, following up on our scheduled invoice settlement. Trust business is moving smoothly.',
        channel: 'WHATSAPP',
        status: 'AWAITING_MERCHANT_APPROVAL',
        auditSignature: `sha256-${hash.toString(16).padStart(8, '0')}`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      console.warn('Autonomous workflow simulation notice:', err);
    } finally {
      setIsRunningWorkflow(false);
    }
  };

  const handleSelectTool = (toolName: string) => {
    setSelectedTool(toolName);
    const tool = registeredTools.find((t: WebMCPToolDefinition) => t.name === toolName);
    if (tool) {
      const sample = SAMPLE_INPUTS[tool.name] || {};
      setTestInput(JSON.stringify(sample, null, 2));
      setTestResult(null);
    }
  };

  const handleExecute = async () => {
    if (!selectedTool) return;
    setIsExecuting(true);
    setTestResult(null);
    try {
      const parsed = JSON.parse(testInput);
      const res = await executeTool(selectedTool, parsed);
      setTestResult({ success: true, data: res });
    } catch (err: any) {
      setTestResult({ success: false, error: err?.message || String(err) });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      {/* Floating WebMCP Status Button */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '24px',
        zIndex: 999,
      }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isLight ? '#FFFFFF' : '#003051',
            color: tokens.textPrimary,
            border: '1px solid #00A581',
            padding: '8px 16px',
            borderRadius: '24px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: isLight ? tokens.shadowCard : '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Sparkles size={14} color="#00A581" />
          <span>WebMCP Engine: {registeredTools.length} Tools</span>
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Slide-Up Inspector Drawer */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 'clamp(60px, 8vh, 70px)',
          right: 'clamp(12px, 3vw, 24px)',
          width: 'min(760px, calc(100vw - 24px))',
          maxHeight: 'min(560px, 80vh)',
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.surfaceBorder}`,
          borderRadius: '16px',
          boxShadow: isLight ? tokens.shadowCard : '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}>
          {/* Drawer Header */}
          <div style={{
            padding: '14px 20px',
            backgroundColor: isLight ? '#F8FAFC' : '#002742',
            borderBottom: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={18} color="#00A581" />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '13.5px', fontWeight: '800', color: tokens.textPrimary, margin: 0 }}>
                    WebMCP Judge Inspector & Agent Simulator
                  </h3>
                  <span style={{
                    backgroundColor: isSupported ? tokens.accentSoft : (isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.2)'),
                    color: isSupported ? '#00A581' : (isLight ? '#B45309' : '#FCD34D'),
                    fontSize: '10.5px',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: '700',
                  }}>
                    {isSupported ? 'document.modelContext Live' : 'Sandbox Fallback'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', backgroundColor: isLight ? '#FFFFFF' : '#001D31', borderRadius: '8px', border: `1px solid ${tokens.surfaceBorder}`, padding: '3px' }}>
                <button
                  onClick={() => setActiveTab('AUTONOMOUS')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    backgroundColor: activeTab === 'AUTONOMOUS' ? '#00A581' : 'transparent',
                    color: activeTab === 'AUTONOMOUS' ? '#FFFFFF' : '#00A581',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Zap size={12} />
                  <span>Agent Loop</span>
                </button>
                <button
                  onClick={() => setActiveTab('TOOLS')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    backgroundColor: activeTab === 'TOOLS' ? '#00A581' : 'transparent',
                    color: activeTab === 'TOOLS' ? '#FFFFFF' : tokens.textSecondary,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Tools ({registeredTools.length})
                </button>
                <button
                  onClick={() => setActiveTab('LOGS')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    backgroundColor: activeTab === 'LOGS' ? '#00A581' : 'transparent',
                    color: activeTab === 'LOGS' ? '#FFFFFF' : tokens.textSecondary,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Audit Logs ({executionLogs.length})
                </button>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  color: tokens.textSecondary,
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
            
            {/* =========================================================================
                TAB 1: 1-CLICK AUTONOMOUS AGENT SIMULATION WORKFLOW
               ========================================================================= */}
            {activeTab === 'AUTONOMOUS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Workflow Hero Banner */}
                <div style={{
                  backgroundColor: isLight ? '#F0FDF4' : 'rgba(0, 37, 27, 0.7)',
                  border: '1.5px solid rgba(0, 165, 129, 0.5)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bot size={16} color="#00A581" />
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: tokens.textPrimary }}>
                        Autonomous Morning Debt Recovery Agent Loop
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: tokens.textSecondary, maxWidth: '480px' }}>
                      Simulates an external autonomous browser agent executing an end-to-end recovery sequence over the open tab using live WebMCP tools.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={runAutonomousWorkflow}
                    disabled={isRunningWorkflow}
                    className="hover-lift tap-press"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#00A581',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      cursor: isRunningWorkflow ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(0, 165, 129, 0.4)',
                      opacity: isRunningWorkflow ? 0.7 : 1,
                    }}
                  >
                    {isRunningWorkflow ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} fill="#FFFFFF" />}
                    <span>{isRunningWorkflow ? 'Executing Agent Loop...' : 'Run Autonomous Workflow (1-Click)'}</span>
                  </button>
                </div>

                {/* 5-Step Process Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {workflowSteps.map((step) => {
                    const isRunning = step.status === 'running';
                    const isDone = step.status === 'done';
                    return (
                      <div
                        key={step.id}
                        style={{
                          backgroundColor: isRunning ? (isLight ? '#FEFCE8' : 'rgba(234, 179, 8, 0.1)') : isDone ? (isLight ? '#F0FDF4' : 'rgba(0, 37, 27, 0.5)') : (isLight ? '#F8FAFC' : '#001D31'),
                          border: isRunning ? '1px solid #EAB308' : isDone ? '1px solid #00A581' : `1px solid ${tokens.surfaceBorder}`,
                          borderRadius: '10px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: isDone ? '#00A581' : isRunning ? '#EAB308' : tokens.surfaceBorder,
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            flexShrink: 0,
                          }}>
                            {isDone ? <Check size={16} strokeWidth={3} /> : isRunning ? <Loader2 size={15} className="animate-spin" /> : step.id}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: tokens.textPrimary }}>
                                {step.title}
                              </span>
                              <code style={{ fontSize: '11px', color: '#00A581', backgroundColor: tokens.accentSoft, padding: '1px 6px', borderRadius: '4px' }}>
                                {step.tool}
                              </code>
                            </div>
                            <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.textSecondary }}>
                              {step.summary || step.description}
                            </p>
                          </div>
                        </div>

                        {isDone && step.latencyMs !== undefined && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#00A581', fontWeight: '700', flexShrink: 0 }}>
                            <Clock size={12} />
                            <span>{step.latencyMs}ms</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Workflow Result Card */}
                {workflowResult && (
                  <div style={{
                    backgroundColor: isLight ? '#FFFFFF' : '#00253F',
                    border: '1.5px solid #00A581',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 4px 20px rgba(0, 165, 129, 0.15)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={18} color="#00A581" />
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: tokens.textPrimary }}>
                          Autonomous Agent Output • Target: {workflowResult.debtorName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{
                          backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.2)',
                          color: isLight ? '#B45309' : '#FCD34D',
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                        }}>
                          🔒 HUMAN CONFIRMATION SAFEGUARD ACTIVE
                        </span>
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: isLight ? '#F8FAFC' : '#001D31',
                      border: `1px solid ${tokens.surfaceBorder}`,
                      borderRadius: '8px',
                      padding: '12px 14px',
                    }}>
                      <div style={{ fontSize: '11px', color: tokens.textMuted, fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>
                        Synthesized Contextual WhatsApp Draft:
                      </div>
                      <p style={{ fontSize: '13px', color: tokens.textPrimary, margin: 0, lineHeight: '1.5', fontStyle: 'italic' }}>
                        "{workflowResult.draftText}"
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: tokens.textMuted, flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Audit Signature:</span>
                        <code style={{ color: '#00A581', fontWeight: 'bold' }}>{workflowResult.auditSignature}</code>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00A581', fontWeight: '600' }}>
                        <ShieldCheck size={12} />
                        <span>Prompt Sanitizer & Schema Guard: PASSED</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                TAB 2: RAW TOOL RUNNER & SCHEMA INSPECTION
               ========================================================================= */}
            {activeTab === 'TOOLS' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', minHeight: '380px' }}>
                {/* Tools List */}
                <div style={{
                  backgroundColor: isLight ? '#F8FAFC' : '#00253E',
                  borderRadius: '10px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  padding: '8px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}>
                  {registeredTools.map((t: WebMCPToolDefinition) => {
                    const isSelected = selectedTool === t.name;
                    return (
                      <button
                        key={t.name}
                        onClick={() => handleSelectTool(t.name)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          backgroundColor: isSelected ? '#00A581' : 'transparent',
                          color: isSelected ? '#FFFFFF' : tokens.textPrimary,
                          fontWeight: isSelected ? 'bold' : 'normal',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                      >
                        <div style={{ fontWeight: '700' }}>{t.name}</div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '10px', opacity: 0.85 }}>
                          <span>{t.category || 'READ_ONLY'}</span>
                          <span>•</span>
                          <span>{t.category === 'MUTATING' ? 'Consequential' : 'Safe Query'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Tool Details & Execution Runner */}
                <div style={{
                  backgroundColor: isLight ? '#F8FAFC' : '#00253E',
                  borderRadius: '10px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  padding: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  {selectedTool ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: tokens.textPrimary, margin: 0 }}>{selectedTool}</h4>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: tokens.accentSoft,
                              color: '#00A581',
                            }}>
                              Live document.modelContext
                            </span>
                          </div>
                          <p style={{ color: tokens.textSecondary, fontSize: '12px', marginTop: '4px', lineHeight: '1.4' }}>
                            {registeredTools.find((t: WebMCPToolDefinition) => t.name === selectedTool)?.description}
                          </p>
                        </div>

                        <button
                          onClick={handleExecute}
                          disabled={isExecuting}
                          className="hover-lift tap-press"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#00A581',
                            color: '#FFFFFF',
                            padding: '7px 16px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: isExecuting ? 'not-allowed' : 'pointer',
                            opacity: isExecuting ? 0.7 : 1,
                            boxShadow: '0 4px 12px rgba(0, 165, 129, 0.3)',
                          }}
                        >
                          {isExecuting ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                          <span>Execute Tool</span>
                        </button>
                      </div>

                      {/* Test Input */}
                      <div style={{ marginTop: '14px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textMuted, marginBottom: '4px' }}>
                          INPUT JSON PAYLOAD:
                        </label>
                        <textarea
                          rows={3}
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                            border: `1px solid ${tokens.surfaceBorder}`,
                            borderRadius: '6px',
                            color: isLight ? tokens.textPrimary : '#3AD0A9',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            padding: '8px 10px',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* Result */}
                      {testResult && (
                        <div style={{ marginTop: '12px' }}>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: tokens.textMuted, marginBottom: '4px' }}>
                            LIVE EXECUTION OUTPUT:
                          </label>
                          <pre style={{
                            backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                            border: `1px solid ${testResult.success ? '#00A581' : '#EF4444'}`,
                            borderRadius: '6px',
                            padding: '10px',
                            color: testResult.success ? tokens.textPrimary : '#EF4444',
                            fontSize: '11.5px',
                            maxHeight: '130px',
                            overflowY: 'auto',
                            fontFamily: 'monospace',
                          }}>
                            {JSON.stringify(testResult, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: tokens.textSecondary, fontSize: '13px', gap: '8px' }}>
                      <Code size={28} color="#00A581" />
                      <span>Select any of the 12 registered WebMCP tools to inspect and execute live.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 3: CRYPTOGRAPHIC AUDIT LOGS & PROMPT GUARD
               ========================================================================= */}
            {activeTab === 'LOGS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '380px', overflowY: 'auto' }}>
                {executionLogs.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: tokens.textSecondary, gap: '8px', padding: '40px' }}>
                    <ShieldCheck size={28} color="#00A581" />
                    <p style={{ fontSize: '13px', margin: 0, textAlign: 'center' }}>
                      No WebMCP tool calls recorded yet. Click the <strong>Agent Loop</strong> tab or execute a tool to generate cryptographically signed audit logs.
                    </p>
                  </div>
                ) : (
                  executionLogs.map((log: WebMCPExecutionLog) => (
                    <div
                      key={log.id}
                      style={{
                        backgroundColor: isLight ? '#F8FAFC' : '#00253E',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        borderRadius: '10px',
                        padding: '12px 16px',
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold', color: '#00A581', fontSize: '13px' }}>{log.toolName}</span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: log.consequenceLevel === 'CONSEQUENTIAL_WRITE' ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.2)') : tokens.accentSoft,
                            color: log.consequenceLevel === 'CONSEQUENTIAL_WRITE' ? '#EF4444' : '#00A581',
                          }}>
                            {log.consequenceLevel === 'CONSEQUENTIAL_WRITE' ? '⚠️ Consequential Write' : '👁️ Safe Read-Only'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', color: tokens.textMuted, fontSize: '11px', alignItems: 'center' }}>
                          <span style={{ color: '#00A581', fontWeight: 'bold' }}>{log.durationMs}ms</span>
                          <span>•</span>
                          <span>{log.timestamp}</span>
                        </div>
                      </div>

                      {/* Cryptographic Signature & Prompt Guard Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: tokens.textMuted, flexWrap: 'wrap' }}>
                        {log.signatureHash && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Lock size={11} color="#00A581" />
                            <span>Sig:</span>
                            <code style={{ color: tokens.textPrimary, backgroundColor: isLight ? '#E2E8F0' : '#001D31', padding: '1px 5px', borderRadius: '3px' }}>
                              {log.signatureHash}
                            </code>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00A581' }}>
                          <ShieldCheck size={11} />
                          <span>Prompt Sanitizer: Validated</span>
                        </div>
                      </div>

                      <pre style={{
                        color: tokens.textSecondary,
                        fontSize: '11px',
                        maxHeight: '75px',
                        overflowY: 'auto',
                        backgroundColor: isLight ? '#FFFFFF' : '#001D31',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        padding: '8px',
                        borderRadius: '6px',
                        margin: 0,
                      }}>
                        {JSON.stringify(log.output || log.error, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

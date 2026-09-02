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
  Loader2 
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

export function WebMCPInspector() {
  const { isSupported, registeredTools, executionLogs, executeTool } = useWebMCP();
  const { tokens, isLight } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'TOOLS' | 'LOGS'>('TOOLS');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [testInput, setTestInput] = useState<string>('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

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
          bottom: '70px',
          right: '24px',
          width: '760px',
          maxHeight: '560px',
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
            padding: '16px 20px',
            backgroundColor: isLight ? '#F8FAFC' : '#003051',
            borderBottom: `1px solid ${tokens.surfaceBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={18} color="#00A581" />
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: tokens.textPrimary }}>
                WebMCP Judge Inspector & Tool Simulator
              </h3>
              <span style={{
                backgroundColor: isSupported ? tokens.accentSoft : (isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.2)'),
                color: isSupported ? '#00A581' : (isLight ? '#B45309' : '#FCD34D'),
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: '600',
              }}>
                {isSupported ? 'document.modelContext Active' : 'Test Harness Active'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', backgroundColor: isLight ? '#FFFFFF' : '#001D31', borderRadius: '6px', border: `1px solid ${tokens.surfaceBorder}`, padding: '2px' }}>
                <button
                  onClick={() => setActiveTab('TOOLS')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: activeTab === 'TOOLS' ? '#00A581' : 'transparent',
                    color: activeTab === 'TOOLS' ? '#FFFFFF' : tokens.textSecondary,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Tools ({registeredTools.length})
                </button>
                <button
                  onClick={() => setActiveTab('LOGS')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: activeTab === 'LOGS' ? '#00A581' : 'transparent',
                    color: activeTab === 'LOGS' ? '#FFFFFF' : tokens.textSecondary,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Live Logs ({executionLogs.length})
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {activeTab === 'TOOLS' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', minHeight: '400px' }}>
                {/* Tools List */}
                <div style={{
                  backgroundColor: isLight ? '#F8FAFC' : '#003051',
                  borderRadius: '8px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  padding: '8px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}>
                  {registeredTools.map((t: WebMCPToolDefinition) => (
                    <button
                      key={t.name}
                      onClick={() => handleSelectTool(t.name)}
                      style={{
                        textAlign: 'left',
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        backgroundColor: selectedTool === t.name ? '#00A581' : 'transparent',
                        color: selectedTool === t.name ? '#FFFFFF' : tokens.textPrimary,
                        fontWeight: selectedTool === t.name ? 'bold' : 'normal',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>{t.name}</div>
                      <span style={{ fontSize: '10px', opacity: 0.8, color: selectedTool === t.name ? '#FFFFFF' : tokens.textMuted }}>{t.category}</span>
                    </button>
                  ))}
                </div>

                {/* Tool Details & Execution Runner */}
                <div style={{
                  backgroundColor: isLight ? '#F8FAFC' : '#003051',
                  borderRadius: '8px',
                  border: `1px solid ${tokens.surfaceBorder}`,
                  padding: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  {selectedTool ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: tokens.textPrimary }}>{selectedTool}</h4>
                          <p style={{ color: tokens.textSecondary, fontSize: '12px', marginTop: '2px' }}>
                            {registeredTools.find((t: WebMCPToolDefinition) => t.name === selectedTool)?.description}
                          </p>
                        </div>

                        <button
                          onClick={handleExecute}
                          disabled={isExecuting}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#00A581',
                            color: '#FFFFFF',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: isExecuting ? 'not-allowed' : 'pointer',
                            opacity: isExecuting ? 0.7 : 1,
                          }}
                        >
                          {isExecuting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                          <span>Execute</span>
                        </button>
                      </div>

                      {/* Test Input */}
                      <div style={{ marginTop: '12px' }}>
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
                            padding: '8px',
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
                            maxHeight: '140px',
                            overflowY: 'auto',
                            fontFamily: 'monospace',
                          }}>
                            {JSON.stringify(testResult, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: tokens.textSecondary, fontSize: '13px' }}>
                      Select a WebMCP tool on the left to inspect and test live.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'LOGS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '400px', overflowY: 'auto' }}>
                {executionLogs.length === 0 ? (
                  <p style={{ color: tokens.textSecondary, textAlign: 'center', padding: '40px', fontSize: '13px' }}>
                    No WebMCP tool calls recorded yet. Use the Tools tab or interact with Copilot to generate live logs.
                  </p>
                ) : (
                  executionLogs.map((log: WebMCPExecutionLog) => (
                    <div
                      key={log.id}
                      style={{
                        backgroundColor: isLight ? '#F8FAFC' : '#003051',
                        border: `1px solid ${tokens.surfaceBorder}`,
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', color: '#00A581' }}>{log.toolName}</span>
                        <div style={{ display: 'flex', gap: '8px', color: tokens.textMuted, fontSize: '11px' }}>
                          <span>{log.durationMs}ms</span>
                          <span>•</span>
                          <span>{log.timestamp}</span>
                        </div>
                      </div>
                      <pre style={{ color: tokens.textSecondary, fontSize: '11px', maxHeight: '80px', overflowY: 'auto', backgroundColor: isLight ? '#FFFFFF' : '#001D31', border: `1px solid ${tokens.surfaceBorder}`, padding: '6px', borderRadius: '4px' }}>
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

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

export function WebMCPInspector() {
  const { isSupported, registeredTools, executionLogs, executeTool } = useWebMCP();
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
      if (tool.name === 'search_customers') {
        setTestInput(JSON.stringify({ query: '' }, null, 2));
      } else if (tool.name === 'get_collection_priority') {
        setTestInput(JSON.stringify({ limit: 5 }, null, 2));
      } else {
        setTestInput(JSON.stringify({}, null, 2));
      }
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
            backgroundColor: '#003051',
            color: '#FFFFFF',
            border: '1px solid #00A581',
            padding: '8px 16px',
            borderRadius: '24px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
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
          backgroundColor: '#001D31',
          border: '1px solid #0F5470',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Drawer Header */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#003051',
            borderBottom: '1px solid #0F5470',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={18} color="#00A581" />
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>
                WebMCP Judge Inspector & Tool Simulator
              </h3>
              <span style={{
                backgroundColor: isSupported ? 'rgba(0, 165, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: isSupported ? '#3AD0A9' : '#FCD34D',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: '600',
              }}>
                {isSupported ? 'document.modelContext Active' : 'Test Harness Active'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', backgroundColor: '#001D31', borderRadius: '6px', border: '1px solid #0F5470', padding: '2px' }}>
                <button
                  onClick={() => setActiveTab('TOOLS')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: activeTab === 'TOOLS' ? '#00A581' : 'transparent',
                    color: activeTab === 'TOOLS' ? '#FFFFFF' : '#8FB7C7',
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
                    color: activeTab === 'LOGS' ? '#FFFFFF' : '#8FB7C7',
                  }}
                >
                  Live Logs ({executionLogs.length})
                </button>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  color: '#8FB7C7',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {activeTab === 'TOOLS' && (
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', height: '400px' }}>
                {/* Tools List */}
                <div style={{
                  backgroundColor: '#003051',
                  borderRadius: '8px',
                  border: '1px solid #0F5470',
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
                        color: selectedTool === t.name ? '#FFFFFF' : '#DCEAF0',
                        fontWeight: selectedTool === t.name ? 'bold' : 'normal',
                      }}
                    >
                      <div>{t.name}</div>
                      <span style={{ fontSize: '10px', opacity: 0.8 }}>{t.category}</span>
                    </button>
                  ))}
                </div>

                {/* Tool Details & Execution Runner */}
                <div style={{
                  backgroundColor: '#003051',
                  borderRadius: '8px',
                  border: '1px solid #0F5470',
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
                          <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>{selectedTool}</h4>
                          <p style={{ color: '#8FB7C7', fontSize: '12px', marginTop: '2px' }}>
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
                            opacity: isExecuting ? 0.7 : 1,
                          }}
                        >
                          {isExecuting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                          <span>Execute</span>
                        </button>
                      </div>

                      {/* Test Input */}
                      <div style={{ marginTop: '12px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#8FB7C7', marginBottom: '4px' }}>
                          INPUT JSON PAYLOAD:
                        </label>
                        <textarea
                          rows={3}
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: '#001D31',
                            border: '1px solid #0F5470',
                            borderRadius: '6px',
                            color: '#3AD0A9',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            padding: '8px',
                          }}
                        />
                      </div>

                      {/* Result */}
                      {testResult && (
                        <div style={{ marginTop: '12px' }}>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#8FB7C7', marginBottom: '4px' }}>
                            LIVE EXECUTION OUTPUT:
                          </label>
                          <pre style={{
                            backgroundColor: '#001D31',
                            border: '1px solid #0F5470',
                            borderRadius: '6px',
                            padding: '10px',
                            color: testResult.success ? '#FFFFFF' : '#EF4444',
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8FB7C7', fontSize: '13px' }}>
                      Select a WebMCP tool on the left to inspect and test live.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'LOGS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '400px', overflowY: 'auto' }}>
                {executionLogs.length === 0 ? (
                  <p style={{ color: '#8FB7C7', textAlign: 'center', padding: '40px', fontSize: '13px' }}>
                    No WebMCP tool calls recorded yet. Use the Tools tab or interact with Copilot to generate live logs.
                  </p>
                ) : (
                  executionLogs.map((log: WebMCPExecutionLog) => (
                    <div
                      key={log.id}
                      style={{
                        backgroundColor: '#003051',
                        border: '1px solid #0F5470',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', color: '#3AD0A9' }}>{log.toolName}</span>
                        <div style={{ display: 'flex', gap: '8px', color: '#8FB7C7', fontSize: '11px' }}>
                          <span>{log.durationMs}ms</span>
                          <span>•</span>
                          <span>{log.timestamp}</span>
                        </div>
                      </div>
                      <pre style={{ color: '#DCEAF0', fontSize: '11px', maxHeight: '80px', overflowY: 'auto', backgroundColor: '#001D31', padding: '6px', borderRadius: '4px' }}>
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

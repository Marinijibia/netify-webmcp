'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Loader2
} from 'lucide-react';

export default function WebMCPPage() {
  const [selectedTool, setSelectedTool] = useState<WebMCPToolDefinition>(webMCPTools[0]);
  const [testInput, setTestInput] = useState<string>('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSelectTool = (tool: WebMCPToolDefinition) => {
    setSelectedTool(tool);
    if (tool.name === 'search_customers') {
      setTestInput(JSON.stringify({ query: '' }, null, 2));
    } else if (tool.name === 'get_collection_priority') {
      setTestInput(JSON.stringify({ limit: 5 }, null, 2));
    } else {
      setTestInput(JSON.stringify({}, null, 2));
    }
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
  inputSchema: ${JSON.stringify(selectedTool.inputSchema, null, 2)},
  execute: async (input) => { ... }
});`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '60px 24px 80px', display: 'flex', flexDirection: 'column', gap: '64px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#003051',
          border: '1px solid #00A581',
          padding: '6px 16px',
          borderRadius: '30px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#3AD0A9',
          marginBottom: '16px',
        }}>
          <Sparkles size={14} color="#00A581" />
          <span>The WebMCP Challenge Submission • 8 Live Registered Tools</span>
        </div>

        <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-1px' }}>
          Browser-Native WebMCP Agent Architecture
        </h1>
        <p style={{ color: '#8FB7C7', fontSize: '16px', lineHeight: '1.6', marginTop: '12px' }}>
          Netify connects autonomous AI assistants directly to live business credit ledgers through the W3C WebMCP standard (<code style={{ color: '#3AD0A9' }}>document.modelContext.registerTool</code>).
        </p>
      </div>

      {/* Testing Guide for Hackathon Judges */}
      <div style={{
        backgroundColor: '#003051',
        borderRadius: '16px',
        border: '1px solid #00A581',
        padding: '32px',
        boxShadow: '0 10px 30px rgba(0, 165, 129, 0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Cpu size={22} color="#00A581" />
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>
            Quick Verification Instructions for Hackathon Judges
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: '#001D31', padding: '18px', borderRadius: '10px', border: '1px solid #0F5470' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00A581' }}>OPTION 1</span>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>On-Screen Inspector</h4>
            <p style={{ fontSize: '12.5px', color: '#8FB7C7', marginTop: '6px', lineHeight: '1.5' }}>
              Click the floating <strong>"WebMCP Engine"</strong> button at the bottom-right of any workspace screen to inspect live registrations and execute tool tests.
            </p>
          </div>

          <div style={{ backgroundColor: '#001D31', padding: '18px', borderRadius: '10px', border: '1px solid #0F5470' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00A581' }}>OPTION 2</span>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>Google Chrome Flag</h4>
            <p style={{ fontSize: '12.5px', color: '#8FB7C7', marginTop: '6px', lineHeight: '1.5' }}>
              Enable <code style={{ color: '#3AD0A9' }}>chrome://flags/#enable-webmcp-testing</code>. In DevTools console, run <code style={{ color: '#3AD0A9' }}>document.modelContext.getTools()</code>.
            </p>
          </div>

          <div style={{ backgroundColor: '#001D31', padding: '18px', borderRadius: '10px', border: '1px solid #0F5470' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00A581' }}>OPTION 3</span>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>ChatGPT In-App Browser</h4>
            <p style={{ fontSize: '12.5px', color: '#8FB7C7', marginTop: '6px', lineHeight: '1.5' }}>
              Navigate to Netify in ChatGPT's browser. ChatGPT will autonomously discover and invoke the tools during conversation.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Tool Explorer */}
      <div id="tools" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Interactive Directory
          </span>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>
            The 8 Registered WebMCP Tools
          </h2>
          <p style={{ color: '#8FB7C7', fontSize: '14px', marginTop: '4px' }}>
            Select any tool below to inspect its schema and run a live test execution against the backend.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
          {/* Tool Selector List */}
          <div style={{
            backgroundColor: '#003051',
            borderRadius: '12px',
            border: '1px solid #0F5470',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '620px',
            overflowY: 'auto',
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
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#00A581' : 'transparent',
                    color: isSelected ? '#FFFFFF' : '#DCEAF0',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '13.5px' }}>{tool.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', opacity: 0.8, fontSize: '11px' }}>
                    <span>{tool.category}</span>
                    <span>{tool.category === 'READ_ONLY' ? 'Safe Query' : 'Action'}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tool Inspector & Execution Sandbox */}
          <div style={{
            backgroundColor: '#003051',
            borderRadius: '12px',
            border: '1px solid #0F5470',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            {/* Tool Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>{selectedTool.name}</h3>
                  <span style={{
                    backgroundColor: selectedTool.category === 'READ_ONLY' ? 'rgba(0, 165, 129, 0.2)' : selectedTool.category === 'PROPOSAL' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: selectedTool.category === 'READ_ONLY' ? '#3AD0A9' : selectedTool.category === 'PROPOSAL' ? '#FCD34D' : '#93C5FD',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    {selectedTool.category}
                  </span>
                </div>
                <p style={{ color: '#8FB7C7', fontSize: '13.5px', marginTop: '6px', lineHeight: '1.5' }}>
                  {selectedTool.description}
                </p>
              </div>

              <button
                onClick={handleCopyCode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  color: '#8FB7C7',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                {copiedCode ? <Check size={14} color="#00A581" /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied' : 'Copy Spec'}</span>
              </button>
            </div>

            {/* Input Schema */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#8FB7C7', textTransform: 'uppercase', marginBottom: '6px' }}>
                JSON Input Schema:
              </label>
              <pre style={{
                backgroundColor: '#001D31',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #0F5470',
                fontSize: '11.5px',
                color: '#3AD0A9',
                fontFamily: 'monospace',
                maxHeight: '120px',
                overflowY: 'auto',
              }}>
                {JSON.stringify(selectedTool.inputSchema, null, 2)}
              </pre>
            </div>

            {/* Input Payload Sandbox */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#8FB7C7', textTransform: 'uppercase' }}>
                  Input Payload (Editable JSON):
                </label>
                <button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#00A581',
                    color: '#FFFFFF',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 'bold',
                    opacity: isExecuting ? 0.7 : 1,
                  }}
                >
                  {isExecuting ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                  <span>Execute Live Tool Call</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#001D31',
                  border: '1px solid #0F5470',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
            </div>

            {/* Live Output */}
            {testResult && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#8FB7C7', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Live Execution Result:
                </label>
                <pre style={{
                  backgroundColor: '#001D31',
                  padding: '14px',
                  borderRadius: '8px',
                  border: `1px solid ${testResult.success ? '#00A581' : '#EF4444'}`,
                  color: testResult.success ? '#FFFFFF' : '#FCA5A5',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  maxHeight: '180px',
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
        backgroundColor: '#001D31',
        borderRadius: '16px',
        border: '1px solid #0F5470',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={20} color="#00A581" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF' }}>
              Human-in-the-Loop AI Safeguards
            </h3>
          </div>
          <p style={{ color: '#8FB7C7', fontSize: '13.5px', lineHeight: '1.6' }}>
            Tools that propose external communication (such as <code style={{ color: '#3AD0A9' }}>draft_follow_up_message</code>) return structured proposals requiring human approval. Autonomous agents never dispatch unapproved debt collections.
          </p>
        </div>

        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#00A581',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 'bold',
            textDecoration: 'none',
          }}
        >
          <span>Launch Workspace</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

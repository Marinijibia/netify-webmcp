import React from 'react';
import { Cpu, Sparkles, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

export default function SystemPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '900px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={24} color="#3B82F6" />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F8FAFC' }}>AI Provider Telemetry & System Health</h2>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '4px' }}>
          Inspection of provider abstraction layer (Gemini development / OpenAI production failover), token latency, and pgvector embeddings health.
        </p>
      </div>

      {/* Model Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Gemini Provider */}
        <div style={{
          backgroundColor: '#0F172A',
          borderRadius: '12px',
          border: '1px solid #10B981',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 'bold', textTransform: 'uppercase' }}>Active Provider (Dev)</span>
            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>LIVE</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F8FAFC' }}>
            Google Gemini 1.5 Flash
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8' }}>
            Embedding Model: <code style={{ color: '#38BDF8' }}>text-embedding-004</code> (768 dims)
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#94A3B8' }}>
            <span>Avg Latency: <strong style={{ color: '#F8FAFC' }}>395ms</strong></span>
            <span>Success Rate: <strong style={{ color: '#10B981' }}>99.9%</strong></span>
          </div>
        </div>

        {/* OpenAI Provider */}
        <div style={{
          backgroundColor: '#0F172A',
          borderRadius: '12px',
          border: '1px solid #1E293B',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase' }}>Production Target</span>
            <span style={{ backgroundColor: '#1E293B', color: '#94A3B8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>CONFIGURABLE</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F8FAFC' }}>
            OpenAI GPT-4o-mini
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8' }}>
            Embedding Model: <code style={{ color: '#38BDF8' }}>text-embedding-3-small</code> (1536 dims)
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#94A3B8' }}>
            <span>Routing: <strong style={{ color: '#38BDF8' }}>AI_PROVIDER=openai</strong></span>
          </div>
        </div>
      </div>

      {/* Database & Infrastructure Mesh */}
      <div style={{
        backgroundColor: '#0F172A',
        borderRadius: '12px',
        border: '1px solid #1E293B',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F8FAFC' }}>Infrastructure Components</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#1E293B', borderRadius: '6px', fontSize: '13px' }}>
            <span style={{ color: '#F8FAFC', fontWeight: '500' }}>PostgreSQL 16 Multi-Tenant Engine</span>
            <span style={{ color: '#10B981', fontWeight: 'bold' }}>CONNECTED (Prisma ORM)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#1E293B', borderRadius: '6px', fontSize: '13px' }}>
            <span style={{ color: '#F8FAFC', fontWeight: '500' }}>pgvector Vector Memory Extension</span>
            <span style={{ color: '#10B981', fontWeight: 'bold' }}>ENABLED (HNSW Index)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#1E293B', borderRadius: '6px', fontSize: '13px' }}>
            <span style={{ color: '#F8FAFC', fontWeight: '500' }}>NestJS Modular Monolith API</span>
            <span style={{ color: '#10B981', fontWeight: 'bold' }}>PORT 3000 /api/docs</span>
          </div>
        </div>
      </div>
    </div>
  );
}

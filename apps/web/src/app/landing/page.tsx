'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Terminal, 
  ShieldCheck, 
  Globe, 
  Clock, 
  MessageSquareQuote, 
  Layers, 
  TrendingUp, 
  Users, 
  FileText,
  AlertTriangle,
  Play,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const [activeDemoTab, setActiveDemoTab] = useState<'COMMAND' | 'LEDGER' | 'DRAFT' | 'WEBMCP'>('COMMAND');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '80px' }}>
      {/* Hero Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 24px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Hackathon Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#003051',
          border: '1px solid #00A581',
          padding: '6px 16px',
          borderRadius: '30px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#3AD0A9',
          marginBottom: '24px',
          boxShadow: '0 0 20px rgba(0, 165, 129, 0.2)',
        }}>
          <Sparkles size={14} color="#00A581" />
          <span>Built for The WebMCP Challenge • Browser-Native AI Integration</span>
        </div>

        {/* Main Headline */}
        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 60px)',
          fontWeight: '900',
          lineHeight: '1.1',
          letterSpacing: '-1.5px',
          color: '#FFFFFF',
          maxWidth: '900px',
          marginBottom: '20px',
        }}>
          The Agent-Ready Collections Workspace for{' '}
          <span style={{
            background: 'linear-gradient(135deg, #00A581 0%, #3AD0A9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            African SMEs
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          lineHeight: '1.6',
          color: '#8FB7C7',
          maxWidth: '720px',
          marginBottom: '36px',
        }}>
          Know who owes you. Remember what they promised on WhatsApp. Know who needs attention today. Get paid without burning customer trust.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginBottom: '48px' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              padding: '14px 28px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 'bold',
              textDecoration: 'none',
              boxShadow: '0 10px 25px rgba(0, 165, 129, 0.4)',
            }}
          >
            <span>Launch Live Workspace</span>
            <ArrowRight size={18} />
          </Link>

          <Link
            href="/webmcp"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#003051',
              color: '#DCEAF0',
              border: '1px solid #0F5470',
              padding: '14px 24px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            <Terminal size={16} color="#00A581" />
            <span>Explore 8 WebMCP Tools</span>
          </Link>
        </div>

        {/* Metrics Ticker */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '24px',
          width: '100%',
          maxWidth: '880px',
          padding: '24px',
          backgroundColor: '#003051',
          borderRadius: '14px',
          border: '1px solid #0F5470',
          textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#00A581' }}>44M+</div>
            <div style={{ fontSize: '12px', color: '#8FB7C7', marginTop: '2px' }}>African SMEs</div>
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#FFFFFF' }}>$330B</div>
            <div style={{ fontSize: '12px', color: '#8FB7C7', marginTop: '2px' }}>Trade Credit Gap</div>
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#3AD0A9' }}>0%</div>
            <div style={{ fontSize: '12px', color: '#8FB7C7', marginTop: '2px' }}>Mock Data (100% Live)</div>
          </div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#FFFFFF' }}>8 Tools</div>
            <div style={{ fontSize: '12px', color: '#8FB7C7', marginTop: '2px' }}>Native WebMCP APIs</div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '1px' }}>
            The Reality of Informal Trade
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '8px' }}>
            Why Traditional Collection Tools Fail in Africa
          </h2>
          <p style={{ color: '#8FB7C7', fontSize: '15px', maxWidth: '640px', margin: '8px auto 0' }}>
            Over 80% of wholesale trade in Lagos, Nairobi, and Accra operates on supplier credit and verbal trust.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div style={{
            backgroundColor: '#003051',
            borderRadius: '12px',
            border: '1px solid #0F5470',
            padding: '28px',
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', marginBottom: '16px' }}>
              <Clock size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
              The WhatsApp Promise Black Hole
            </h3>
            <p style={{ color: '#8FB7C7', fontSize: '13.5px', lineHeight: '1.6' }}>
              Customers promise payment: <em>"I will transfer by Friday after offloading the truck."</em> These promises get lost in chat threads, leaving business owners blind to incoming cash flow.
            </p>
          </div>

          <div style={{
            backgroundColor: '#003051',
            borderRadius: '12px',
            border: '1px solid #0F5470',
            padding: '28px',
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', marginBottom: '16px' }}>
              <AlertTriangle size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
              Aggressive Follow-ups Burn Relationships
            </h3>
            <p style={{ color: '#8FB7C7', fontSize: '13.5px', lineHeight: '1.6' }}>
              Standard automated debt collection sends harsh, impersonal demands. In relationship-based trade, this damages reputation and pushes buyers into defensive non-payment.
            </p>
          </div>

          <div style={{
            backgroundColor: '#003051',
            borderRadius: '12px',
            border: '1px solid #0F5470',
            padding: '28px',
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(0, 165, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A581', marginBottom: '16px' }}>
              <FileText size={20} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
              Fragmented Business Memory
            </h3>
            <p style={{ color: '#8FB7C7', fontSize: '13.5px', lineHeight: '1.6' }}>
              Invoices are on paper, promises are on WhatsApp, and bank statements are on phones. There is no single source of truth when asking: <em>"Who owes what, and why?"</em>
            </p>
          </div>
        </div>
      </section>

      {/* The 4 Core Pillars */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 24px',
        backgroundColor: '#003051',
        borderRadius: '20px',
        border: '1px solid #0F5470',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
            The Netify Differentiator
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '8px' }}>
            Built for How African Commerce Actually Works
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div style={{ backgroundColor: '#001D31', padding: '24px', borderRadius: '12px', border: '1px solid #0F5470' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🧠</div>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
              1. Grounded Business Memory
            </h4>
            <p style={{ color: '#8FB7C7', fontSize: '13px', lineHeight: '1.6' }}>
              Every invoice, verbal promise, partial payment, and WhatsApp log is unified into an indisputable timeline evidence ledger.
            </p>
          </div>

          <div style={{ backgroundColor: '#001D31', padding: '24px', borderRadius: '12px', border: '1px solid #0F5470' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎯</div>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
              2. Deterministic Prioritization
            </h4>
            <p style={{ color: '#8FB7C7', fontSize: '13px', lineHeight: '1.6' }}>
              The collection queue is ranked by objective risk: aging days, broken promise frequency, and exposure size—not arbitrary guesses.
            </p>
          </div>

          <div style={{ backgroundColor: '#001D31', padding: '24px', borderRadius: '12px', border: '1px solid #0F5470' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🤝</div>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
              3. Culturally Grounded Follow-ups
            </h4>
            <p style={{ color: '#8FB7C7', fontSize: '13px', lineHeight: '1.6' }}>
              AI drafts respectful reminders referencing actual customer promises with tone controls (*Courteous*, *Direct*, *Partial Plan*).
            </p>
          </div>

          <div style={{ backgroundColor: '#001D31', padding: '24px', borderRadius: '12px', border: '1px solid #0F5470' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚡</div>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
              4. Browser-Native WebMCP
            </h4>
            <p style={{ color: '#8FB7C7', fontSize: '13px', lineHeight: '1.6' }}>
              AI agents operate directly inside the browser using W3C standard `document.modelContext`, querying real customer data safely.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Product Showcase */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF' }}>
            Explore the Workspace Experience
          </h2>
          <p style={{ color: '#8FB7C7', fontSize: '14px', marginTop: '6px' }}>
            Switch between modules to preview the live desktop experience.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { id: 'COMMAND', name: 'Command Center Dashboard' },
            { id: 'LEDGER', name: 'Receivables & Promises' },
            { id: 'DRAFT', name: 'AI Action Drafts' },
            { id: 'WEBMCP', name: 'WebMCP Agent View' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDemoTab(tab.id as any)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: activeDemoTab === tab.id ? '#00A581' : '#003051',
                color: activeDemoTab === tab.id ? '#FFFFFF' : '#8FB7C7',
                border: '1px solid #0F5470',
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Demo Frame */}
        <div style={{
          backgroundColor: '#001D31',
          borderRadius: '16px',
          border: '1px solid #0F5470',
          padding: '32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        }}>
          {activeDemoTab === 'COMMAND' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>Live Command Center Preview</span>
                <Link href="/" style={{ fontSize: '12px', color: '#00A581', fontWeight: 'bold', textDecoration: 'none' }}>
                  Open Full Dashboard →
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#003051', padding: '16px', borderRadius: '8px', border: '1px solid #0F5470' }}>
                  <div style={{ fontSize: '11px', color: '#8FB7C7', fontWeight: 'bold' }}>TOTAL OUTSTANDING</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>₦14,850,000</div>
                </div>
                <div style={{ backgroundColor: '#003051', padding: '16px', borderRadius: '8px', border: '1px solid #0F5470' }}>
                  <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 'bold' }}>NEEDS ATTENTION</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#EF4444', marginTop: '4px' }}>₦5,200,000</div>
                </div>
                <div style={{ backgroundColor: '#003051', padding: '16px', borderRadius: '8px', border: '1px solid #0F5470' }}>
                  <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 'bold' }}>BROKEN PROMISES</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F59E0B', marginTop: '4px' }}>4 Accounts</div>
                </div>
                <div style={{ backgroundColor: '#003051', padding: '16px', borderRadius: '8px', border: '1px solid #0F5470' }}>
                  <div style={{ fontSize: '11px', color: '#00A581', fontWeight: 'bold' }}>DUE TODAY</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00A581', marginTop: '4px' }}>₦1,100,000</div>
                </div>
              </div>
              <div style={{ backgroundColor: '#003051', padding: '16px', borderRadius: '8px', border: '1px solid #0F5470', fontSize: '13px', color: '#DCEAF0' }}>
                <strong style={{ color: '#3AD0A9' }}>Daily Executive AI Briefing:</strong> You have 4 accounts with broken promises requiring immediate follow-up. Alhaji Musa Provisions has ₦1,200,000 overdue by 18 days.
              </div>
            </div>
          )}

          {activeDemoTab === 'LEDGER' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>Receivables & Commitment Ledger</span>
                <Link href="/receivables" style={{ fontSize: '12px', color: '#00A581', fontWeight: 'bold', textDecoration: 'none' }}>
                  View All Receivables →
                </Link>
              </div>
              <div style={{ backgroundColor: '#003051', borderRadius: '8px', padding: '16px', border: '1px solid #0F5470', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #0F5470', paddingBottom: '8px', fontSize: '13px' }}>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Alhaji Musa Provisions</strong> (INV-2026-041)
                    <p style={{ fontSize: '11px', color: '#EF4444', margin: '2px 0 0' }}>18 days overdue • Promised for Aug 15 (Missed)</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#EF4444', fontWeight: 'bold' }}>₦1,200,000</div>
                    <span style={{ fontSize: '10px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', padding: '1px 6px', borderRadius: '4px' }}>OVERDUE</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>Grace Wanjiku Enterprises</strong> (INV-2026-089)
                    <p style={{ fontSize: '11px', color: '#00A581', margin: '2px 0 0' }}>Promised for Today at 3:00 PM via M-Pesa</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#FFFFFF', fontWeight: 'bold' }}>₦850,000</div>
                    <span style={{ fontSize: '10px', backgroundColor: 'rgba(0, 165, 129, 0.2)', color: '#3AD0A9', padding: '1px 6px', borderRadius: '4px' }}>DUE TODAY</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeDemoTab === 'DRAFT' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>Safe Human-Reviewed Action Draft</span>
                <Link href="/messages/draft" style={{ fontSize: '12px', color: '#00A581', fontWeight: 'bold', textDecoration: 'none' }}>
                  Draft Live Action →
                </Link>
              </div>
              <div style={{ backgroundColor: '#003051', borderRadius: '8px', padding: '18px', border: '1px solid #0F5470', fontSize: '13.5px', lineHeight: '1.6' }}>
                <p style={{ color: '#FFFFFF', margin: 0 }}>
                  <em>"Good afternoon Alhaji Musa. We hope business is going well. We are following up regarding the remaining balance of ₦1,200,000 for Invoice #INV-2026-041, which was scheduled for settlement on August 15th. Please let us know if the warehouse transfer can be confirmed today so we can update your ledger."</em>
                </p>
                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #0F5470', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#8FB7C7' }}>
                  <span>Channel: <strong>WhatsApp</strong> • Tone: <strong>Courteous Business Follow-up</strong></span>
                  <span style={{ color: '#3AD0A9', fontWeight: 'bold' }}>✓ Requires Explicit Human Approval Before Sending</span>
                </div>
              </div>
            </div>
          )}

          {activeDemoTab === 'WEBMCP' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF' }}>W3C Browser-Native WebMCP Standard</span>
                <Link href="/webmcp" style={{ fontSize: '12px', color: '#00A581', fontWeight: 'bold', textDecoration: 'none' }}>
                  WebMCP Documentation →
                </Link>
              </div>
              <pre style={{
                backgroundColor: '#001422',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #0F5470',
                color: '#3AD0A9',
                fontSize: '12px',
                fontFamily: 'monospace',
                overflowX: 'auto',
                margin: 0,
              }}>
{`// Registered on document.modelContext
await document.modelContext.registerTool({
  name: "get_collection_priority",
  description: "Retrieve prioritized debtor accounts ranked by urgency and aging",
  inputSchema: { type: "object", properties: { limit: { type: "number" } } },
  execute: async ({ limit }) => {
    return await commandCenterApi.getPriorities({ limit });
  }
});`}
              </pre>
            </div>
          )}
        </div>
      </section>

      {/* Target SME Personas */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A581', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Built for Real African Trade
          </span>
          <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '8px' }}>
            Trusted Across Commercial Hubs
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div style={{ backgroundColor: '#003051', borderRadius: '12px', border: '1px solid #0F5470', padding: '24px' }}>
            <p style={{ fontStyle: 'italic', color: '#DCEAF0', fontSize: '13.5px', lineHeight: '1.6' }}>
              "Before Netify, our shop was owed over ₦22M in Alaba Market with zero record of who promised to pay when. Now my assistant and I track every promise right on WhatsApp."
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#00A581', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 'bold', fontSize: '13px' }}>
                AM
              </div>
              <div>
                <strong style={{ color: '#FFFFFF', fontSize: '13px' }}>Alhaji Musa</strong>
                <p style={{ fontSize: '11px', color: '#8FB7C7', margin: 0 }}>FMCG Wholesale Distributor, Lagos</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#003051', borderRadius: '12px', border: '1px solid #0F5470', padding: '24px' }}>
            <p style={{ fontStyle: 'italic', color: '#DCEAF0', fontSize: '13.5px', lineHeight: '1.6' }}>
              "In Kenya, M-Pesa payments come in pieces. Netify keeps the exact balance updated so we never argue with our contractors about past payments."
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#00A581', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 'bold', fontSize: '13px' }}>
                GW
              </div>
              <div>
                <strong style={{ color: '#FFFFFF', fontSize: '13px' }}>Grace Wanjiku</strong>
                <p style={{ fontSize: '11px', color: '#8FB7C7', margin: 0 }}>Hardware & Building Supplies, Nairobi</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#003051', borderRadius: '12px', border: '1px solid #0F5470', padding: '24px' }}>
            <p style={{ fontStyle: 'italic', color: '#DCEAF0', fontSize: '13.5px', lineHeight: '1.6' }}>
              "The WebMCP tool support means our ChatGPT agent can look up debtor history while we are on the road without manual copy-pasting."
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#00A581', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 'bold', fontSize: '13px' }}>
                KM
              </div>
              <div>
                <strong style={{ color: '#FFFFFF', fontSize: '13px' }}>Kwame Mensah</strong>
                <p style={{ fontSize: '11px', color: '#8FB7C7', margin: 0 }}>Consumer Electronics Importer, Accra</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '50px 32px',
        backgroundColor: '#003051',
        borderRadius: '20px',
        border: '1px solid #00A581',
        textAlign: 'center',
        boxShadow: '0 0 40px rgba(0, 165, 129, 0.15)',
      }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '12px' }}>
          Take Control of Your Trade Receivables
        </h2>
        <p style={{ color: '#8FB7C7', fontSize: '15px', maxWidth: '600px', margin: '0 auto 28px' }}>
          Stop letting informal promises slip through the cracks. Experience the live collections workspace built for humans and AI agents.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              textDecoration: 'none',
            }}
          >
            <span>Launch Live Workspace</span>
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/register"
            style={{
              padding: '12px 22px',
              backgroundColor: '#001D31',
              border: '1px solid #0F5470',
              color: '#DCEAF0',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Register Organization
          </Link>
        </div>
      </section>
    </div>
  );
}

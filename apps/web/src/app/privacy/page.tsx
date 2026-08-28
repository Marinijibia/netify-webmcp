'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px 80px', color: '#DCEAF0', lineHeight: '1.7', fontSize: '14px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: '#8FB7C7', fontSize: '13px', marginBottom: '32px' }}>Last updated: August 2026</p>

      <div style={{ backgroundColor: '#003051', padding: '32px', borderRadius: '14px', border: '1px solid #0F5470', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>1. Introduction</h2>
        <p>
          Netify ("we", "our", or "us") is dedicated to safeguarding the privacy of our users, business owners, and their customer debtor ledgers. This Privacy Policy describes how we collect, process, and protect your information when you use the Netify Web Application.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>2. Information We Collect</h2>
        <p>
          We collect account details (name, email, organization name), trade receivables data (invoice amounts, due dates, customer phone numbers, payment records), and communication logs. We do not sell or monetize customer contact information or trade debt balances.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>3. How AI & WebMCP Uses Data</h2>
        <p>
          When you invoke AI Copilot or WebMCP agent tools, customer debt details are processed strictly to calculate risk levels, summarize commitments, and draft reminder text. We never use your proprietary debt ledgers to train public models.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>4. Data Security & Retention</h2>
        <p>
          All data is encrypted in transit using TLS 1.3 and at rest in tenant-isolated databases. You may request deletion or export of your organization data at any time by contacting privacy@netify.africa.
        </p>
      </div>
    </div>
  );
}

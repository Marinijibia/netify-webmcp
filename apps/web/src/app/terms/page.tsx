'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px 80px', color: '#DCEAF0', lineHeight: '1.7', fontSize: '14px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>Terms of Service</h1>
      <p style={{ color: '#8FB7C7', fontSize: '13px', marginBottom: '32px' }}>Last updated: August 2026</p>

      <div style={{ backgroundColor: '#003051', padding: '32px', borderRadius: '14px', border: '1px solid #0F5470', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>1. Agreement to Terms</h2>
        <p>
          By accessing or using Netify, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>2. Business Operations & Collections</h2>
        <p>
          Netify provides software tools for credit tracking, receivables management, and AI message drafting. You agree to use Netify solely for lawful commercial debt reconciliation and comply with all applicable debt collection laws and local regulations.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>3. Human Responsibility for Outbound Messages</h2>
        <p>
          While Netify AI drafts follow-up messages, you acknowledge that you are solely responsible for reviewing, approving, and dispatching any communications sent to your customers. Netify is not liable for customer disputes arising from messaging choices.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF' }}>4. Open-Source Licensing</h2>
        <p>
          The Netify web client code is open source and licensed under the MIT License.
        </p>
      </div>
    </div>
  );
}

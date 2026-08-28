'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      textAlign: 'center',
      gap: '16px',
    }}>
      <div style={{
        backgroundColor: '#003051',
        padding: '16px',
        borderRadius: '50%',
        color: '#00A581',
        border: '1px solid #0F5470',
      }}>
        <HelpCircle size={36} />
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>Page Not Found</h2>
      <p style={{ color: '#8FB7C7', fontSize: '14px', maxWidth: '400px' }}>
        The page or workspace view you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#00A581',
          color: '#FFFFFF',
          padding: '10px 18px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          marginTop: '8px',
        }}
      >
        <ArrowLeft size={16} />
        <span>Return to Command Center</span>
      </Link>
    </div>
  );
}

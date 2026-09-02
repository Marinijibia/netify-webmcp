'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root Global Crash Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#001424',
        color: '#FFFFFF',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          backgroundColor: '#001D31',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '36px',
          maxWidth: '440px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 12px', color: '#FFFFFF' }}>
            Application Error
          </h2>
          <p style={{ fontSize: '13.5px', color: '#94A3B8', margin: '0 0 24px', lineHeight: '1.5' }}>
            A critical application error occurred. Click below to reload and restore your workspace.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              backgroundColor: '#00A581',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}

'use client';

import React from 'react';
import { Sparkles, Bell, Globe } from 'lucide-react';

export function Navbar() {
  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid #1F2937',
      backgroundColor: '#0B0F19',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      {/* Search / Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          backgroundColor: '#1E293B',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#9CA3AF',
          border: '1px solid #374151'
        }}>
          Workspace: Apex Trading Ltd
        </span>
        <span style={{ fontSize: '12px', color: '#6B7280' }}>•</span>
        <span style={{ fontSize: '12px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
          pgvector Business Memory Active
        </span>
      </div>

      {/* Action Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* AI Provider Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          color: '#34D399',
          fontWeight: '500'
        }}>
          <Sparkles size={14} />
          <span>Gemini 1.5 Flash (Dev Mode)</span>
        </div>

        {/* Currency Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#1F2937',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#E5E7EB'
        }}>
          <Globe size={14} color="#9CA3AF" />
          <span>₦ NGN (Nigeria)</span>
        </div>

        {/* Notification Icon */}
        <button style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: '#1F2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9CA3AF'
        }}>
          <Bell size={16} />
        </button>

        {/* User Avatar */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#10B981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          AT
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  TrendingUp, 
  Cpu, 
  ShieldCheck, 
  Globe2, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export default function AdminOverviewPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#F8FAFC' }}>
          Platform Overview
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '14px', marginTop: '4px' }}>
          Real-time metrics, multi-tenant operations, and AI system health across African SME clusters.
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <div style={{ backgroundColor: '#0F172A', padding: '20px', borderRadius: '12px', border: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>Active SME Tenants</span>
            <Building2 size={18} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F8FAFC', marginTop: '10px' }}>24</div>
          <p style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>+4 this week (NGN, GHS, KES)</p>
        </div>

        <div style={{ backgroundColor: '#0F172A', padding: '20px', borderRadius: '12px', border: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>Total Invoiced GMV</span>
            <TrendingUp size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F8FAFC', marginTop: '10px' }}>₦184.5M</div>
          <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Tracked in PostgreSQL</p>
        </div>

        <div style={{ backgroundColor: '#0F172A', padding: '20px', borderRadius: '12px', border: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>Collections Recovered</span>
            <ShieldCheck size={18} color="#38BDF8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F8FAFC', marginTop: '10px' }}>₦42.8M</div>
          <p style={{ fontSize: '12px', color: '#38BDF8', marginTop: '4px' }}>23.2% recovery acceleration</p>
        </div>

        <div style={{ backgroundColor: '#0F172A', padding: '20px', borderRadius: '12px', border: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>Business Memories</span>
            <Cpu size={18} color="#A855F7" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F8FAFC', marginTop: '10px' }}>18,400</div>
          <p style={{ fontSize: '12px', color: '#A855F7', marginTop: '4px' }}>Vectorized in pgvector</p>
        </div>
      </div>

      {/* Tenants Table */}
      <div style={{
        backgroundColor: '#0F172A',
        borderRadius: '12px',
        border: '1px solid #1E293B',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#F8FAFC' }}>Top Organizations by Volume</h3>
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>Multi-tenant organizations isolated via schema tenant guards</p>
          </div>
          <Link href="/tenants" style={{ fontSize: '13px', color: '#3B82F6', fontWeight: '600' }}>
            View all 24 organizations →
          </Link>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E293B', color: '#94A3B8', fontSize: '12px' }}>
              <th style={{ padding: '12px 16px' }}>Organization</th>
              <th style={{ padding: '12px 16px' }}>Market</th>
              <th style={{ padding: '12px 16px' }}>Plan</th>
              <th style={{ padding: '12px 16px' }}>Customers</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Active Outstanding</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #1E293B', fontSize: '14px' }}>
              <td style={{ padding: '16px', fontWeight: 'bold', color: '#F8FAFC' }}>Apex Trading Ltd</td>
              <td style={{ padding: '16px', color: '#94A3B8' }}>Lagos, Nigeria (NGN)</td>
              <td style={{ padding: '16px' }}>
                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>PRO</span>
              </td>
              <td style={{ padding: '16px', color: '#F8FAFC' }}>5 accounts</td>
              <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#F8FAFC' }}>₦4,700,000</td>
              <td style={{ padding: '16px', textAlign: 'right', color: '#10B981', fontWeight: 'bold' }}>HEALTHY</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #1E293B', fontSize: '14px' }}>
              <td style={{ padding: '16px', fontWeight: 'bold', color: '#F8FAFC' }}>Accra Logistics Hub</td>
              <td style={{ padding: '16px', color: '#94A3B8' }}>Accra, Ghana (GHS)</td>
              <td style={{ padding: '16px' }}>
                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>PRO</span>
              </td>
              <td style={{ padding: '16px', color: '#F8FAFC' }}>12 accounts</td>
              <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#F8FAFC' }}>GH₵140,000</td>
              <td style={{ padding: '16px', textAlign: 'right', color: '#10B981', fontWeight: 'bold' }}>HEALTHY</td>
            </tr>
            <tr style={{ fontSize: '14px' }}>
              <td style={{ padding: '16px', fontWeight: 'bold', color: '#F8FAFC' }}>Nairobi Agro Supplies</td>
              <td style={{ padding: '16px', color: '#94A3B8' }}>Nairobi, Kenya (KES)</td>
              <td style={{ padding: '16px' }}>
                <span style={{ backgroundColor: '#1E293B', color: '#94A3B8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>STARTER</span>
              </td>
              <td style={{ padding: '16px', color: '#F8FAFC' }}>8 accounts</td>
              <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#F8FAFC' }}>KSh 820,000</td>
              <td style={{ padding: '16px', textAlign: 'right', color: '#10B981', fontWeight: 'bold' }}>HEALTHY</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

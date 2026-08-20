import React from 'react';
import { Building2, Plus, ShieldCheck, Search } from 'lucide-react';

const mockTenants = [
  { id: 'org-apex-1', name: 'Apex Trading Ltd', currency: 'NGN', plan: 'PRO', customers: 5, gmv: '₦14.2M', region: 'Nigeria', status: 'ACTIVE' },
  { id: 'org-accra-2', name: 'Accra Logistics Hub', currency: 'GHS', plan: 'PRO', customers: 12, gmv: 'GH₵3.4M', region: 'Ghana', status: 'ACTIVE' },
  { id: 'org-nairobi-3', name: 'Nairobi Agro Supplies', currency: 'KES', plan: 'FREE', customers: 8, gmv: 'KSh 8.2M', region: 'Kenya', status: 'ACTIVE' },
  { id: 'org-joburg-4', name: 'Cape Distribution Services', currency: 'ZAR', plan: 'PRO', customers: 19, gmv: 'R 2.8M', region: 'South Africa', status: 'ACTIVE' },
];

export default function TenantsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} color="#3B82F6" />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#F8FAFC' }}>Tenant Organizations</h2>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '4px' }}>
            Multi-tenant directory of all SME businesses onboarded to Netify across Africa.
          </p>
        </div>
      </div>

      <div style={{
        backgroundColor: '#0F172A',
        borderRadius: '12px',
        border: '1px solid #1E293B',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #1E293B', color: '#94A3B8', fontSize: '12px' }}>
              <th style={{ padding: '14px 18px' }}>Tenant Name</th>
              <th style={{ padding: '14px 18px' }}>Region & Currency</th>
              <th style={{ padding: '14px 18px' }}>Plan</th>
              <th style={{ padding: '14px 18px' }}>Customers</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Total Volume</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockTenants.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #1E293B', fontSize: '14px' }}>
                <td style={{ padding: '16px 18px', fontWeight: 'bold', color: '#F8FAFC' }}>{t.name}</td>
                <td style={{ padding: '16px 18px', color: '#94A3B8' }}>{t.region} ({t.currency})</td>
                <td style={{ padding: '16px 18px' }}>
                  <span style={{
                    backgroundColor: t.plan === 'PRO' ? 'rgba(16, 185, 129, 0.15)' : '#1E293B',
                    color: t.plan === 'PRO' ? '#10B981' : '#94A3B8',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {t.plan}
                  </span>
                </td>
                <td style={{ padding: '16px 18px', color: '#F8FAFC' }}>{t.customers} accounts</td>
                <td style={{ padding: '16px 18px', textAlign: 'right', fontWeight: 'bold', color: '#F8FAFC' }}>{t.gmv}</td>
                <td style={{ padding: '16px 18px', textAlign: 'right', color: '#10B981', fontWeight: 'bold' }}>{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

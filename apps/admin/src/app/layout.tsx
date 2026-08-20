import React from 'react';
import { AdminSidebar } from '../components/AdminSidebar';
import '../styles/globals.css';

export const metadata = {
  title: 'Netify Admin — Platform Operations & Multi-Tenant Management',
  description: 'Manage organizations, inspect AI telemetry, and monitor platform health across Africa.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#090D16' }}>
        <AdminSidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

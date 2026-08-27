import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { WebMCPInspector } from '../components/WebMCPInspector';
import { AuthProvider } from '../lib/auth-context';
import '../styles/globals.css';

export const metadata = {
  title: 'Netify — AI Collections & Business Memory for African SMEs',
  description: 'Know who owes you. Remember what they promised. Know who needs attention. Get paid.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#001D31', color: '#FFFFFF' }}>
        <AuthProvider>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', backgroundColor: '#001D31' }}>
              {children}
            </main>
          </div>
          <WebMCPInspector />
        </AuthProvider>
      </body>
    </html>
  );
}

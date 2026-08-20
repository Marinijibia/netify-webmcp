import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
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
      <body style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0B0F19' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Navbar />
          <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

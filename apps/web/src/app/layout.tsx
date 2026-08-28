import React from 'react';
import { AuthProvider } from '../lib/auth-context';
import { AppShell } from '../components/AppShell';
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
      <body style={{ backgroundColor: '#001D31', color: '#FFFFFF', margin: 0, padding: 0 }}>
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

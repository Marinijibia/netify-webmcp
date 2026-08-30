import React from 'react';
import { AuthProvider } from '../lib/auth-context';
import { LanguageProvider } from '../lib/i18n';
import { ThemeProvider } from '../lib/theme/theme-context';
import { AppShell } from '../components/AppShell';
import LanguageSelectorModal from '../components/LanguageSelectorModal';
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
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0 }}>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <AppShell>
                {children}
              </AppShell>
              <LanguageSelectorModal />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

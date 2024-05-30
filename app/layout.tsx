'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppMode, AppModeProvider } from '@/context/AppModeContext';
import { useState } from 'react';
import { MainNav, SettingsSheet } from './components';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [appMode, setAppMode] = useState<AppMode>('light');

  return (
    <html lang="en">
      <AppModeProvider changeModeCallback={(mode) => setAppMode(mode)}>
        <body
          className={cn(
            'min-h-screen bg-background font-sans antialiased',
            inter.variable,
            appMode
          )}
        >
          <div className="flex items-center p-6 border-b-2 justify-between">
            <h2 className="scroll-m-20 pr-10 text-3xl font-semibold tracking-tight first:mt-0">
              Keletron tennis
            </h2>
            <div className="flex items-center gap-4">
              <MainNav
                entries={[
                  { href: '/homepage', label: 'Homepage' },
                  { href: '/courts', label: 'Courts' },
                  { href: '/tournaments', label: 'Tournaments' },
                ]}
              />
              <SettingsSheet />
            </div>
          </div>
          {children}
        </body>
      </AppModeProvider>
    </html>
  );
}

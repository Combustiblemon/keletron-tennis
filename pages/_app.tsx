import '../styles/globals.css';

import { Inter } from 'next/font/google';
import { useEffect, useState } from 'react';

import { AppMode, AppModeProvider } from '@/context/AppModeContext';
import { cn } from '@/lib/utils';

import { MainNav, SettingsSheet } from '../components/components';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const App = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const [appMode, setAppMode] = useState<AppMode>('light');

  useEffect(() => {
    const classBody = cn(
      'bg-background font-sans antialiased',
      inter.variable,
      appMode
    );

    document.body.classList.value = classBody;
  }, [appMode]);

  return (
    <div id="root">
      <AppModeProvider changeModeCallback={(mode) => setAppMode(mode)}>
        <div className="flex items-center p-6 border-b-2 justify-between">
          {/* <h2 className="scroll-m-20 pr-10 text-3xl font-semibold tracking-tight first:mt-0">
              Keletron tennis
            </h2> */}
          <div className="flex items-center gap-4">
            <MainNav
              entries={[
                { href: '/', label: 'Homepage' },
                { href: '/courts', label: 'Courts' },
                { href: '/tournaments', label: 'Tournaments' },
              ]}
            />
            <SettingsSheet />
          </div>
        </div>
        {children}
      </AppModeProvider>
    </div>
  );
};

export default App;

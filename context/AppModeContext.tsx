'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppMode = 'light' | 'dark';

export type AppModeContextType = {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
};

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider = ({
  children,
  changeModeCallback,
}: {
  children: React.ReactNode;
  changeModeCallback: (mode: AppMode) => void;
}) => {
  const [mode, setMode] = useState<AppMode>('light');

  useEffect(() => {
    changeModeCallback(mode);
  }, [mode]);

  return (
    <AppModeContext.Provider value={{ mode, setMode }}>
      {children}
    </AppModeContext.Provider>
  );
};

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
}

export default AppModeContext;
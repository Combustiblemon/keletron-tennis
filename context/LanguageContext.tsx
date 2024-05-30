'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'el' | 'en';

export type LanguageModeContext = {
  mode: Language;
  setMode: (mode: Language) => void;
};

const LanguageContext = createContext<LanguageModeContext | undefined>(
  undefined
);

export const LanguageProvider = ({
  children,
  changeModeCallback,
}: {
  children: React.ReactNode;
  changeModeCallback: (mode: Language) => void;
}) => {
  const [mode, setMode] = useState<Language>('en');

  useEffect(() => {
    changeModeCallback(mode);
  }, [mode]);

  return (
    <LanguageContext.Provider value={{ mode, setMode }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within an LanguageProvider');
  }
  return context;
}

export default LanguageContext;

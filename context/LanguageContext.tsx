'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Language = 'el' | 'en';

export type LanguageModeContext = {
  language: Language;
  setLanguage: (mode: Language) => void;
};

const LanguageContext = createContext<LanguageModeContext | undefined>(
  undefined
);

export const LanguageProvider = ({
  children,
  changeLanguageCallback,
  defaultLanguage,
}: {
  defaultLanguage: Language;
  children: React.ReactNode;
  changeLanguageCallback?: (mode: Language) => void;
}) => {
  const [language, setLanguage] = useState<Language>(defaultLanguage);

  useEffect(() => {
    changeLanguageCallback?.(language);
  }, [language, changeLanguageCallback]);

  return (
    <LanguageContext.Provider
      value={useMemo(() => ({ language, setLanguage }), [language])}
    >
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

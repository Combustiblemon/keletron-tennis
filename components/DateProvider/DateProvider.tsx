import React from 'react';
import { DatesProvider } from '@mantine/dates';
import { useLanguage } from '@/context/LanguageContext';

const DateProvider = ({ children }: { children: React.ReactNode }) => {
  const { language } = useLanguage();

  return (
    <DatesProvider
      settings={{
        locale: language,
      }}
    >
      {children}
    </DatesProvider>
  );
};

export default DateProvider;

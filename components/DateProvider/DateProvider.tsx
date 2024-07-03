import React from 'react';
import { DatesProvider } from '@mantine/dates';
import { useLanguage } from '@/context/LanguageContext';
import 'dayjs/locale/el';
import 'dayjs/locale/en';

const DateProvider = ({ children }: { children: React.ReactNode }) => {
  const { language } = useLanguage();

  return (
    <DatesProvider
      settings={{
        locale: language,
        timezone: 'Europe/Athens',
      }}
    >
      {children}
    </DatesProvider>
  );
};

export default DateProvider;

import 'dayjs/locale/el';
import 'dayjs/locale/en';

import { DatesProvider } from '@mantine/dates';
import React from 'react';

import { useLanguage } from '@/context/LanguageContext';

const DateProvider = ({ children }: { children: React.ReactNode }) => {
  const [language] = useLanguage();

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

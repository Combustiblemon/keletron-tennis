/* eslint-disable no-lonely-if */
/* eslint-disable no-new */
import '../styles/globals.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/code-highlight/styles.css';
import '@mantine/tiptap/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/spotlight/styles.css';
import '@mantine/nprogress/styles.css';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

import DateProvider from '@/components/DateProvider/DateProvider';
import HeadInfo from '@/components/HeadInfo/HeadInfo';
import { Navbar } from '@/components/MobileNavbar/Navbar';
import { LanguageProvider } from '@/context/LanguageContext';
import { firebaseCloudMessaging } from '@/lib/webPush';
import { theme } from '@/styles/theme';

// Create a client
const queryClient = new QueryClient();

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  useEffect(() => {
    firebaseCloudMessaging.init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <LanguageProvider defaultLanguage="el">
          <DateProvider>
            <SessionProvider
              session={session}
              basePath="/api/auth"
              baseUrl="http://Localhost:2000"
            >
              <Notifications position="bottom-center" zIndex={1000} />
              <HeadInfo title="Keletron Tennis Academy" />
              <Navbar>
                <Component {...pageProps} />
              </Navbar>
            </SessionProvider>
          </DateProvider>
        </LanguageProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
};

export default App;

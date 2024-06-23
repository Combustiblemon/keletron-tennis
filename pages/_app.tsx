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
import type { AppProps } from 'next/app';
import { useEffect } from 'react';

import HeadInfo from '@/components/HeadInfo/HeadInfo';
import { Navbar } from '@/components/MobileNavbar/Navbar';
import { firebaseCloudMessaging } from '@/lib/webPush';
import { theme } from '@/styles/theme';

const App = ({ Component, pageProps }: AppProps) => {
  useEffect(() => {
    firebaseCloudMessaging.init();
  }, []);

  return (
    <MantineProvider theme={theme}>
      <HeadInfo title="Keletron Tennis Club" />
      <Navbar
        navItems={[
          { title: 'Home', href: '/' },
          { title: 'About', href: '/about' },
          { title: 'Contact', href: '/contact' },
          { title: 'Login', href: '/auth' },
        ]}
      >
        <Component {...pageProps} />
      </Navbar>
    </MantineProvider>
  );
};

export default App;

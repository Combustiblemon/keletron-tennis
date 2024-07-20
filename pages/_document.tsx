import { ColorSchemeScript } from '@mantine/core';
import { Head, Html, Main, NextScript } from 'next/document';

const Document = () => {
  return (
    <Html lang="en" className="h-screen w-screen overflow-hidden">
      <Head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="description" content="Keletron tennis club" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="mask-icon" href="/logo.webp" color="#FFFFFF" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" href="/logo.webp" />
        {/* <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/icons/touch-icon-ipad.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/touch-icon-iphone-retina.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href="/icons/touch-icon-ipad-retina.png"
        /> */}
        <link
          rel="manifest"
          crossOrigin="use-credentials"
          href="/manifest.json"
        />
        {/* <meta name="twitter:card" content="summary" /> */}
        {/* <meta name="twitter:url" content="https://yourdomain.com" /> */}
        {/* <meta name="twitter:title" content="Keletron tennis app" /> */}
        {/* <meta name="twitter:description" content="Best PWA app in the world!" /> */}
        {/* <meta name="twitter:image" content="/icons/twitter.png" /> */}
        {/* <meta name="twitter:creator" content="@DavidWShadow" /> */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Keletron tennis app" />
        {/* <meta property="og:description" content="Best PWA app in the world!" /> */}
        <meta property="og:site_name" content="Keletron tennis app" />
        {/* <meta property="og:url" content="https://yourdomain.com" /> */}
        {/* <meta property="og:image" content="/icons/og.png" /> */}
        {/* add the following only if you want to add a startup image for Apple devices. */}
        {/* <link
          rel="apple-touch-startup-image"
          href="/images/apple_splash_2048.png"
          sizes="2048x2732"
        />
        <link
          rel="apple-touch-startup-image"
          href="/images/apple_splash_1668.png"
          sizes="1668x2224"
        />
        <link
          rel="apple-touch-startup-image"
          href="/images/apple_splash_1536.png"
          sizes="1536x2048"
        />
        <link
          rel="apple-touch-startup-image"
          href="/images/apple_splash_1125.png"
          sizes="1125x2436"
        />
        <link
          rel="apple-touch-startup-image"
          href="/images/apple_splash_1242.png"
          sizes="1242x2208"
        />
        <link
          rel="apple-touch-startup-image"
          href="/images/apple_splash_750.png"
          sizes="750x1334"
        />
        <link
          rel="apple-touch-startup-image"
          href="/images/apple_splash_640.png"
          sizes="640x1136"
        /> */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;

// @ts-check
import withPWAInit from 'next-pwa';

const withWPA = withPWAInit({
  dest: 'public',
  disable: false,
  cacheOnFrontEndNav: true,
  cacheStartUrl: true,
  reloadOnOnline: true,
  sw: 'firebase-messaging-sw.js',
});

export default withWPA({
  reactStrictMode: true,
  swcMinify: true,
});

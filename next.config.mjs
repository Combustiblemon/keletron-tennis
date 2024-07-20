// @ts-check
import withPWAInit from 'next-pwa';

const withWPA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  cacheStartUrl: true,
  reloadOnOnline: true,
  sw: 'firebase-messaging-sw.js',
});

export default withWPA({
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/auth/:path*',
  //       destination: 'http://localhost:2000/api/auth/:path*',
  //     },
  //   ];
  // },
});

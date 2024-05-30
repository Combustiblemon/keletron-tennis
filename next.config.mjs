// @ts-check
import withPWAInit from '@ducanh2912/next-pwa';

const withWPA = withPWAInit({
  dest: 'public',
  // disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  cacheStartUrl: true,
  reloadOnOnline: true,
});

/** @type {import('next').NextConfig} */
const NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

export default withWPA(NextConfig);

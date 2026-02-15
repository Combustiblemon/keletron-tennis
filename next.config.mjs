// @ts-check
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: false,
  cacheOnFrontEndNav: true,
  cacheStartUrl: true,
  reloadOnOnline: true,
  sw: 'firebase-messaging-sw.js',
});

export default withPWA({
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { webpack }) => {
    // Important: return the modified config
    return {
      ...config,
      plugins: [
        ...config.plugins,
        new webpack.DefinePlugin({
          'process.env.WEBSITE_URL': JSON.stringify(process.env.WEBSITE_URL),
          'process.env.NEXT_PUBLIC_FIREBASE_CONFIG': JSON.stringify(
            process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}'
          ),
        }),
      ],
    };
  },
});

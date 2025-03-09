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
  webpack: (config, { webpack }) => {
    // Important: return the modified config
    return {
      ...config,
      plugins: [
        ...config.plugins,
        new webpack.DefinePlugin({
          'process.env.WEBSITE_URL': JSON.stringify(process.env.WEBSITE_URL),
        }),
      ],
    };
  },
});

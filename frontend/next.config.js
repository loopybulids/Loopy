// `next dev --turbopack` sets this. The webpack tweak below is webpack-only —
// attaching it under Turbopack just produces a "webpack is configured while
// Turbopack is not" warning and does nothing.
const TURBO = !!process.env.TURBOPACK;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to *this* folder. It used to point two levels up
  // (Desktop/Loopy), which made Next scan the sibling copy of the repo on every
  // build/dev boot — a lot of pointless file I/O, doubly slow on OneDrive.
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },

  // The floating "N" badge Next renders in dev. It sits over the sidebar and
  // is indistinguishable from part of the UI in screenshots.
  devIndicators: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },  
      { protocol: 'http', hostname: '**' },
    ],
  },
};

if (!TURBO) {
  nextConfig.webpack = (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Split vendor code into stable long-lived chunks so only changed
      // chunks need to re-compile on navigation — eliminates the 4-17s
      // per-route compile on first visit after already having loaded the app.
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  };
}

module.exports = nextConfig;

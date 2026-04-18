/** @type {import('next').NextConfig} */
const nextConfig = {
  // ======= ESLint =======
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ======= TypeScript =======
  typescript: {
    // [AUDIT FIX] All TS errors resolved — safe to enforce strict checks.
    ignoreBuildErrors: false,
  },

  // ======= Performance =======
  reactStrictMode: true, // [AUDIT FIX] Enabled for production quality — catches side-effect bugs
  compress: true,

  // ======= Experimental Features =======
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },

    // NOTE: turbopackPersistentCaching requires Next.js Canary — not available in stable 15.5.x.
    // Turbopack's built-in cache at .next/cache/turbopack/ already persists across restarts.
    // dev.js is configured to PRESERVE .next on restart (only cleans webpack subfolder).

    // [PERF] Pre-analyze heavy packages so Turbopack skips re-parsing them per page
    optimizePackageImports: [
      'lucide-react',
      'lodash',
      'date-fns',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-popover',
      '@radix-ui/react-alert-dialog',
      'react-icons',
      'recharts',
      'framer-motion',
      'react-hot-toast',
      'react-hook-form',
      'zod',
      'zustand',
      'axios',
      // [PERF-CRITICAL] Firebase is ~2MB — pre-analyze so Turbopack doesn't re-parse per page
      'firebase',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
    ],
  },

  // ======= Turbopack Configuration =======
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },

  // Optimize builds — strip console.log in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh4.googleusercontent.com' },
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'http',  hostname: 'localhost', port: '8001' },
      { protocol: 'http',  hostname: '127.0.0.1' },
      { protocol: 'http',  hostname: '127.0.0.1', port: '8001' },
    ],
  },

  // ======================================================
  // Redirects — old/orphan pages → new unified routes
  // ======================================================
  async redirects() {
    return [
      { source: '/appreciation-certificates', destination: '/certificates', permanent: true },
      { source: '/professional-community', destination: '/performance-evidence-forms', permanent: true },
      { source: '/parents-interaction', destination: '/performance-evidence-forms', permanent: true },
    ];
  },

  // ======================================================
  // API Proxy الديناميكي
  // ======================================================
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8001';
    return [
      { source: '/api/:path*',     destination: `${backendUrl}/api/:path*` },
      { source: '/storage/:path*', destination: `${backendUrl}/storage/:path*` },
      { source: '/sanctum/:path*', destination: `${backendUrl}/sanctum/:path*` },
    ];
  },

  // ======= Webpack Optimizations (production builds only) =======
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            firebase: {
              test: /[\/\\]node_modules[\/\\](firebase|@firebase)[\/\\]/,
              name: 'firebase',
              chunks: 'all',
              priority: 30,
            },
            ui: {
              test: /[\/\\]node_modules[\/\\](@radix-ui|@headlessui|framer-motion|recharts)[\/\\]/,
              name: 'ui-vendor',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Disable strict mode — avoids double-render issues in Z.ai iframe
  reactStrictMode: false,
  outputFileTracingExcludes: {
    '*': ['./examples/**', './skills/**'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Download-Options', value: 'noopen' },
        ],
      },
      // Note: CORS headers removed from next.config.ts.
      // The app is same-origin (SPA + API served from same origin),
      // so CORS is not needed. Middleware handles security headers.
    ];
  },
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
};

export default nextConfig;

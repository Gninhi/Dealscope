import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Désactiver strict mode — évite le double rendu qui peut causer des problèmes en iframe
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
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
  // Autorise les origines de dev (Z.ai, localhost, etc.)
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

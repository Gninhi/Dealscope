import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Re-enable strict mode for production safety
  reactStrictMode: true,
  // Exclude examples/ and skills/ from the build
  outputFileTracingExcludes: {
    '*': ['./examples/**', './skills/**'],
  },
  // Security headers at the Next.js level (defense in depth)
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
  // Limit server actions body size
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
};

export default nextConfig;

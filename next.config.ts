import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  // Exclude examples/ and skills/ from the build
  outputFileTracingExcludes: {
    '*': ['./examples/**', './skills/**'],
  },
};

export default nextConfig;

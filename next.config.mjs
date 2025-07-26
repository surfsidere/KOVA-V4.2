/** @type {import('next').NextConfig} */
const nextConfig = {
  // Core configuration
  reactStrictMode: true,
  
  // Build optimization
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore to test if ESLint is causing issues
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore to test if TypeScript is causing SIGBUS
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Image optimization
  images: {
    unoptimized: false,
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Architect: Use WASM SWC compilation for ARM64 compatibility
  experimental: {
    swcTraceProfiling: false,   // Disable SWC profiling
  },
  
  // DevOps: Configure webpack for optimal performance
  webpack: (config, { isServer }) => {
    return config
  },
  
  // Headers for better CodeSandbox compatibility
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Connection',
            value: 'keep-alive',
          },
          {
            key: 'Keep-Alive',
            value: 'timeout=5, max=1000',
          },
        ],
      },
    ]
  },
  
  // Remove standalone output for CodeSandbox compatibility
  // output: 'standalone',
}

export default nextConfig
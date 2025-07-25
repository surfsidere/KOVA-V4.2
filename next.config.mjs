/** @type {import('next').NextConfig} */
const nextConfig = {
  // Core configuration
  reactStrictMode: true,
  
  // Build optimization
  eslint: {
    ignoreDuringBuilds: false, // Enable for production quality
  },
  typescript: {
    ignoreBuildErrors: false, // Enable for production quality
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
  
  // Emergency: Disable all experimental features for build stability
  // experimental: {
  //   optimizeCss: true,
  //   optimizePackageImports: [...],
  // },
  
  // Emergency: Disable custom webpack config for build stability
  // webpack: (config, { isServer }) => { ... },
  
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
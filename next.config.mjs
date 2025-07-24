/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration for maximum compatibility
  reactStrictMode: true,
  swcMinify: true,
  
  // Essential overrides
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Image optimization disabled for cloud environments
  images: {
    unoptimized: true,
    domains: [],
  },
  
  // CodeSandbox HTTP compatibility fixes
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
  
  // Force HTTP/1.1 compatibility for CodeSandbox
  compress: false,
  poweredByHeader: false,
  generateEtags: false,
  
  // Experimental features disabled for stability
  experimental: {
    appDir: true,
    // Disable HTTP/2+ features that might cause parsing issues
    serverMinification: false,
    serverSourceMaps: false,
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
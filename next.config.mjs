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
  
  // Experimental features disabled for stability
  experimental: {
    appDir: true,
  },
  
  // Output configuration for better compatibility
  output: 'standalone',
}

export default nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Disable webpack caching to prevent persistent build errors
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
  output: 'standalone',
  // Build performance optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Reduce build time by disabling source maps in production
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
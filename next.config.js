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
}

module.exports = nextConfig
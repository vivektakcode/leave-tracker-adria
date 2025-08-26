/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  experimental: {
    // Disable flight client loader issues
    serverComponentsExternalPackages: [],
    // Ensure proper bundling
    esmExternals: false
  },
  // Ensure proper webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for next-flight-client-entry-loader
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  }
}

module.exports = nextConfig 
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  experimental: {
    serverComponentsExternalPackages: []
  }
}

module.exports = nextConfig
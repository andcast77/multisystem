/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone' - No necesario en Vercel, Vercel maneja esto automáticamente
  trailingSlash: true,
  experimental: {
    serverComponentsExternalPackages: []
  }
}

module.exports = nextConfig
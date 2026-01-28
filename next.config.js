/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone' - No necesario en Vercel, Vercel maneja esto automáticamente
  trailingSlash: true,
  // serverComponentsExternalPackages movido de experimental a nivel raíz en Next.js 16
  serverExternalPackages: []
}

module.exports = nextConfig
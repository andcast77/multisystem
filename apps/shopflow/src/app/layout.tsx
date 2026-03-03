import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { ServiceInitializer } from '@/components/providers/ServiceInitializer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ShopFlow POS',
  description: 'Point of Sale system for managing products, sales, and inventory',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3B82F6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/logo/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo/favicon/favicon-16x16.png" />
        <link rel="icon" type="image/x-icon" href="/logo/favicon/favicon.ico" />
        <meta name="theme-color" content="#3B82F6" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ServiceInitializer />
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: true,
  },

  poweredByHeader: false,

  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    const corsOrigins = process.env.CORS_ALLOWED_ORIGINS
    const allowedOrigins = corsOrigins
      ? corsOrigins.split(',').map(o => o.trim()).filter(Boolean)
      : []

    const securityHeaders = [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "connect-src 'self'",
          "frame-ancestors 'self'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
    ]

    const rules: { source: string; headers: { key: string; value: string }[] }[] = [
      { source: '/:path*', headers: securityHeaders },
    ]

    if (allowedOrigins.length > 0) {
      rules.push({
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: allowedOrigins.join(', ') },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      })
    }

    return rules
  },

  experimental: {},
}

export default nextConfig

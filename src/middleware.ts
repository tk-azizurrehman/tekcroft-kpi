import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextRequest, NextResponse } from 'next/server'

const auth = NextAuth(authConfig).auth

// Static file extensions we never run auth on (served from public/)
const STATIC_EXT = /\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|css|js)(\?.*)?$/i

export default function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    const skipAuth =
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname === '/login' ||
        pathname === '/favicon.ico' ||
        STATIC_EXT.test(pathname)

    if (skipAuth) return NextResponse.next()
    return auth(request)
}

export const config = {
    // Exclude API, _next, login, favicon, and any path with a dot (static files)
    // so middleware never runs for e.g. /tekcroft-logo.png (avoids redirect/parsing issues)
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login)(?!.*\\.).*)'],
}

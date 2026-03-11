import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
    pages: {
        signIn: '/login',
        error: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isLoginPage = nextUrl.pathname === '/login'

            if (isLoginPage) {
                if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
                return true
            }

            if (!isLoggedIn) return false

            return true
        },
    },
    providers: [],
} satisfies NextAuthConfig

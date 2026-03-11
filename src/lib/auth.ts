import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { authConfig } from '@/lib/auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const email = credentials?.email as string
                const password = credentials?.password as string

                if (!email || !password) return null

                const allowedDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || '@tekcroft.com'
                if (!email.endsWith(allowedDomain)) {
                    throw new Error(`Only ${allowedDomain} emails are allowed`)
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                    include: { department: true },
                })

                if (!user || !user.isActive) return null

                const isValid = await bcrypt.compare(password, user.passwordHash)
                if (!isValid) return null

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    departmentId: user.departmentId,
                    departmentName: user.department?.name || null,
                    assignedTeamIds: user.assignedTeamIds,
                }
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = (user as any).role
                token.departmentId = (user as any).departmentId
                token.departmentName = (user as any).departmentName
                token.assignedTeamIds = (user as any).assignedTeamIds || []
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.departmentId = token.departmentId as string | null
                session.user.departmentName = token.departmentName as string | null
                session.user.assignedTeamIds = (token.assignedTeamIds as string[]) || []
            }
            return session
        },
    },
    session: {
        strategy: 'jwt',
        maxAge: 8 * 60 * 60,
    },
})

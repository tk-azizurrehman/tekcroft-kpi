import NextAuth from 'next-auth'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
            role: string
            departmentId: string | null
            departmentName: string | null
            assignedTeamIds: string[]
        }
    }

    interface User {
        role: string
        departmentId: string | null
        departmentName: string | null
        assignedTeamIds: string[]
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role: string
        departmentId: string | null
        departmentName: string | null
        assignedTeamIds: string[]
    }
}

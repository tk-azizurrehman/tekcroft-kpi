import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
// import bcrypt from 'bcryptjs'

const ROLE_CAN_CREATE: Record<string, string[]> = {
    admin: ['manager', 'team_lead', 'team_member'],
    manager: ['team_lead', 'team_member'],
    team_lead: ['team_member'],
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentUser = session.user as any
    const { name, email, password, role, departmentId, leaderId, assignedTeamIds } = await req.json()

    const allowedDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || '@tekcroft.com'
    if (!email?.endsWith(allowedDomain)) {
        return NextResponse.json({ error: `Only ${allowedDomain} emails allowed` }, { status: 400 })
    }

    // Role hierarchy check
    const allowed = ROLE_CAN_CREATE[currentUser.role] || []
    if (!allowed.includes(role)) {
        return NextResponse.json({ error: 'You cannot create this role' }, { status: 403 })
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    // const passwordHash = await bcrypt.hash(password, 12)
    const passwordHash = password

    const cleanedAssignedTeams: string[] =
        Array.isArray(assignedTeamIds) && ['manager', 'team_lead'].includes(role)
            ? assignedTeamIds.filter(Boolean)
            : []

    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            role,
            departmentId: departmentId || null,
            createdById: currentUser.id,
            assignedTeamIds: cleanedAssignedTeams,
        },
    })

    // If creating a team member under a team lead
    if (role === 'team_member' && leaderId) {
        await prisma.teamAssignment.create({
            data: { leaderId, memberId: user.id },
        })
    }

    // Audit log
    await prisma.auditLog.create({
        data: {
            userId: currentUser.id,
            action: 'CREATE_USER',
            tableName: 'users',
            recordId: user.id,
            newValue: { name, email, role, departmentId: departmentId || null, assignedTeamIds: cleanedAssignedTeams },
        },
    })

    return NextResponse.json({ success: true, userId: user.id })
}

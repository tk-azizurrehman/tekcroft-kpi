import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { role, departmentId, id, assignedTeamIds } = session.user as any
    const { searchParams } = new URL(req.url)
    const filterRole = searchParams.get('role')
    const filterDept = searchParams.get('departmentId')
    const limitParam = searchParams.get('limit')
    const take = limitParam ? Math.min(Number(limitParam) || 0, 100) || undefined : undefined

    let where: any = { isActive: true }

    if (role === 'admin') {
        if (filterRole) where.role = filterRole
        if (filterDept) where.departmentId = filterDept
    } else if (role === 'manager') {
        const accessibleDepts: string[] =
            Array.isArray(assignedTeamIds) && assignedTeamIds.length > 0
                ? assignedTeamIds
                : departmentId
                    ? [departmentId]
                    : []

        if (!accessibleDepts.length) {
            return NextResponse.json({ users: [] })
        }

        if (filterDept) {
            if (!accessibleDepts.includes(filterDept)) {
                return NextResponse.json({ users: [] })
            }
            where.departmentId = filterDept
        } else {
            where.departmentId = { in: accessibleDepts }
        }

        if (filterRole) where.role = filterRole
    } else if (role === 'team_lead') {
        // Team leads see their own team members
        const assignments = await prisma.teamAssignment.findMany({
            where: { leaderId: id },
            select: { memberId: true },
        })
        where.id = { in: assignments.map((a: any) => a.memberId) }
    } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            department: { select: { id: true, name: true, colorHex: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...(take ? { take } : {}),
    })

    return NextResponse.json({ users })
}

import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { type AccessUser, getAccessibleDepartmentIds, getAssignableUsers } from '@/lib/kpi-access'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentUser = session.user as AccessUser
    const { role, departmentId, id, assignedTeamIds } = currentUser
    const { searchParams } = new URL(req.url)
    const scope = searchParams.get('scope')
    const filterRole = searchParams.get('role')
    const filterDept = searchParams.get('departmentId')
    const limitParam = searchParams.get('limit')
    const take = limitParam ? Math.min(Number(limitParam) || 0, 100) || undefined : undefined

    if (scope === 'assignable') {
        const users = await getAssignableUsers(currentUser, filterDept)
        return NextResponse.json({ users })
    }

    const where: Prisma.UserWhereInput = { isActive: true }

    if (role === 'admin') {
        if (filterRole) where.role = filterRole
        if (filterDept) where.departmentId = filterDept
    } else if (role === 'manager') {
        const accessibleDepts = getAccessibleDepartmentIds({ id, role, departmentId, assignedTeamIds }) || []

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
        if (!departmentId) {
            return NextResponse.json({ users: [] })
        }

        where.departmentId = departmentId
        where.role = 'team_member'
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

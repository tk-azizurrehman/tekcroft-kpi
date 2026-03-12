import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
    type AccessUser,
    getAccessibleDepartmentIds,
    getAssignableRoles,
    isDepartmentAccessible,
} from '@/lib/kpi-access'

async function resolveAssignableUser(currentUser: AccessUser, assignedUserId?: string | null, requestedDepartmentId?: string | null) {
    if (!assignedUserId) {
        return { assignee: null, departmentId: requestedDepartmentId || null }
    }

    const assignee = await prisma.user.findUnique({
        where: { id: assignedUserId },
        select: {
            id: true,
            role: true,
            departmentId: true,
            isActive: true,
        },
    })

    if (!assignee || !assignee.isActive) {
        return { error: 'Assigned user not found' }
    }

    if (!getAssignableRoles(currentUser.role).includes(assignee.role)) {
        return { error: 'You cannot assign KPI to this role' }
    }

    if (!isDepartmentAccessible(currentUser, assignee.departmentId)) {
        return { error: 'You cannot assign KPI outside your accessible departments' }
    }

    if (requestedDepartmentId && requestedDepartmentId !== assignee.departmentId) {
        return { error: 'Assigned user must belong to the selected department' }
    }

    return { assignee, departmentId: assignee.departmentId }
}

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentUser = session.user as AccessUser
    const { searchParams } = new URL(req.url)
    const departmentId = searchParams.get('departmentId')
    const userId = searchParams.get('userId')

    if (currentUser.role === 'team_member') {
        if (departmentId && departmentId !== currentUser.departmentId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const targetDepartmentId = departmentId || currentUser.departmentId
        if (!targetDepartmentId && !currentUser.id) return NextResponse.json({ criteria: [] })

        const criteria = await prisma.kpiCriteria.findMany({
            where: targetDepartmentId
                ? {
                    OR: [
                        { departmentId: targetDepartmentId, assignedUserId: null },
                        { assignedUserId: currentUser.id },
                    ],
                }
                : {
                    assignedUserId: currentUser.id,
                },
            include: {
                department: { select: { id: true, name: true, colorHex: true } },
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        departmentId: true,
                        department: { select: { id: true, name: true, colorHex: true } },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        })

        return NextResponse.json({ criteria })
    }

    const accessibleDepartments = getAccessibleDepartmentIds(currentUser)
    if (departmentId && !isDepartmentAccessible(currentUser, departmentId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let targetUser: { id: string; departmentId: string | null } | null = null
    if (userId) {
        targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, departmentId: true },
        })

        if (!targetUser || !isDepartmentAccessible(currentUser, targetUser.departmentId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
    }

    const where: Prisma.KpiCriteriaWhereInput = {}
    if (accessibleDepartments !== null) {
        if (!accessibleDepartments.length) return NextResponse.json({ criteria: [] })
        where.departmentId = departmentId
            ? {
                in: [departmentId],
            }
            : { in: accessibleDepartments }
    } else if (departmentId) {
        where.departmentId = departmentId
    }

    if (userId && targetUser?.departmentId) {
        where.OR = [
            { departmentId: targetUser.departmentId, assignedUserId: null },
            { assignedUserId: userId },
        ]
    }

    const criteria = await prisma.kpiCriteria.findMany({
        where,
        include: {
            department: { select: { id: true, name: true, colorHex: true } },
            assignedUser: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    departmentId: true,
                    department: { select: { id: true, name: true, colorHex: true } },
                },
            },
        },
        orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ criteria })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentUser = session.user as AccessUser
    const { role, id, departmentId } = currentUser
    if (!['admin', 'manager', 'team_lead'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { taskName, dailyLimit, isLocked, deptId, assignedUserId } = await req.json()
    const assignment = await resolveAssignableUser(currentUser, assignedUserId, deptId || null)
    if ('error' in assignment) {
        return NextResponse.json({ error: assignment.error }, { status: 400 })
    }

    const useDeptId = assignment.departmentId || deptId || departmentId
    if (!useDeptId) return NextResponse.json({ error: 'Department required' }, { status: 400 })
    if (!isDepartmentAccessible(currentUser, useDeptId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const criteria = await prisma.kpiCriteria.create({
        data: {
            departmentId: useDeptId,
            taskName,
            dailyLimit: Number(dailyLimit),
            isLocked: isLocked ?? false,
            createdById: id,
            assignedUserId: assignment.assignee?.id || null,
        },
    })
    return NextResponse.json({ success: true, criteria })
}

export async function PUT(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentUser = session.user as AccessUser
    const { role } = currentUser
    if (!['admin', 'manager', 'team_lead'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, taskName, dailyLimit, isLocked, assignedUserId } = body
    const hasAssignedUserId = Object.prototype.hasOwnProperty.call(body, 'assignedUserId')
    const existing = await prisma.kpiCriteria.findUnique({
        where: { id },
        select: { id: true, departmentId: true, assignedUserId: true },
    })

    if (!existing || !isDepartmentAccessible(currentUser, existing.departmentId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let nextAssignedUserId = existing.assignedUserId
    if (hasAssignedUserId) {
        const assignment = await resolveAssignableUser(currentUser, assignedUserId, existing.departmentId)
        if ('error' in assignment) {
            return NextResponse.json({ error: assignment.error }, { status: 400 })
        }
        nextAssignedUserId = assignment.assignee?.id || null
    }

    const updated = await prisma.kpiCriteria.update({
        where: { id },
        data: {
            taskName,
            dailyLimit: Number(dailyLimit),
            isLocked,
            assignedUserId: nextAssignedUserId,
        },
    })
    return NextResponse.json({ success: true, criteria: updated })
}

export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentUser = session.user as AccessUser
    const { role } = currentUser
    if (!['admin', 'manager', 'team_lead'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const existing = await prisma.kpiCriteria.findUnique({
        where: { id },
        select: { id: true, departmentId: true },
    })

    if (!existing || !isDepartmentAccessible(currentUser, existing.departmentId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.kpiCriteria.delete({ where: { id } })
    return NextResponse.json({ success: true })
}

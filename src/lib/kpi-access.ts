import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type AppRole = 'admin' | 'manager' | 'team_lead' | 'team_member'

export interface AccessUser {
    id: string
    role: string
    departmentId: string | null
    assignedTeamIds?: string[] | null
}

const KPI_ASSIGNABLE_ROLES: Record<string, AppRole[]> = {
    admin: ['manager', 'team_lead', 'team_member'],
    manager: ['team_lead', 'team_member'],
    team_lead: ['team_member'],
}

function uniq(values: Array<string | null | undefined>) {
    return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

export function getAccessibleDepartmentIds(user: AccessUser): string[] | null {
    if (user.role === 'admin') return null

    if (user.role === 'manager') {
        return uniq([user.departmentId, ...((Array.isArray(user.assignedTeamIds) ? user.assignedTeamIds : []) || [])])
    }

    return uniq([user.departmentId])
}

export function isDepartmentAccessible(user: AccessUser, departmentId: string | null | undefined) {
    const accessibleDepartments = getAccessibleDepartmentIds(user)
    if (accessibleDepartments === null) return true
    if (!departmentId) return false
    return accessibleDepartments.includes(departmentId)
}

export function getAssignableRoles(role: string): AppRole[] {
    return KPI_ASSIGNABLE_ROLES[role] || []
}

export async function getAssignableUsers(user: AccessUser, departmentId?: string | null) {
    const roles = getAssignableRoles(user.role)
    if (!roles.length) return []

    const accessibleDepartments = getAccessibleDepartmentIds(user)
    const where: Prisma.UserWhereInput = {
        isActive: true,
        role: { in: roles },
    }

    if (accessibleDepartments === null) {
        if (departmentId) where.departmentId = departmentId
    } else {
        const scopedDepartments = departmentId
            ? accessibleDepartments.includes(departmentId)
                ? [departmentId]
                : []
            : accessibleDepartments

        if (!scopedDepartments.length) return []
        where.departmentId = { in: scopedDepartments }
    }

    return prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
            department: { select: { id: true, name: true, colorHex: true } },
        },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
    })
}

import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateDailyScore } from '@/lib/kpi-calculator'
import { type AccessUser, getAccessibleDepartmentIds, isDepartmentAccessible } from '@/lib/kpi-access'

type ScoreEntry = {
    countDone: number
    dailyLimit: number
}

type LogWithCriteria = {
    logDate: Date
    countDone: number
    kpiCriteriaId: string | null
    kpiCriteria: {
        dailyLimit: number
    } | null
}

function buildDailyScores(logs: LogWithCriteria[]) {
    const byDate = logs.reduce<Record<string, LogWithCriteria[]>>((acc, log) => {
        const date = log.logDate.toISOString().split('T')[0]
        if (!acc[date]) acc[date] = []
        acc[date].push(log)
        return acc
    }, {})

    return Object.entries(byDate).map(([date, dayLogs]) => {
        const entries: ScoreEntry[] = dayLogs.map(log => ({
            countDone: log.countDone,
            dailyLimit: log.kpiCriteria?.dailyLimit || log.countDone,
        }))

        return { date, score: calculateDailyScore(entries) }
    })
}

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentUser = session.user as AccessUser
    const { id: sessionUserId, role } = currentUser
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'team' // 'team' | 'company' | 'personal' | 'member'
    const filterDepartmentId = searchParams.get('departmentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const accessibleDepartments = getAccessibleDepartmentIds(currentUser)

    const dateFilter = startDate && endDate
        ? { gte: new Date(startDate), lte: new Date(endDate) }
        : undefined

    if (type === 'personal') {
        const logs = await prisma.kpiLog.findMany({
            where: { userId: sessionUserId, ...(dateFilter ? { logDate: dateFilter } : {}) },
            include: { kpiCriteria: true },
            orderBy: { logDate: 'asc' },
        })

        const dailyScores = buildDailyScores(logs)

        return NextResponse.json({ dailyScores, logs })
    }

    if (type === 'member') {
        if (!['admin', 'manager', 'team_lead'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const targetUserId = searchParams.get('userId')
        if (!targetUserId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 })
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, name: true, email: true, departmentId: true, role: true },
        })

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (role !== 'admin' && !isDepartmentAccessible(currentUser, targetUser.departmentId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const logs = await prisma.kpiLog.findMany({
            where: { userId: targetUser.id, ...(dateFilter ? { logDate: dateFilter } : {}) },
            include: { kpiCriteria: true },
            orderBy: { logDate: 'asc' },
        })

        const dailyScores = buildDailyScores(logs)

        return NextResponse.json({ user: targetUser, dailyScores, logs })
    }

    if (type === 'team') {
        if (!['admin', 'manager', 'team_lead'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (filterDepartmentId && !isDepartmentAccessible(currentUser, filterDepartmentId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const memberWhere: Prisma.UserWhereInput = {
            isActive: true,
            role: { in: ['manager', 'team_lead', 'team_member'] },
        }

        if (accessibleDepartments !== null) {
            const scopedDepartments = filterDepartmentId ? [filterDepartmentId] : accessibleDepartments
            if (!scopedDepartments.length) return NextResponse.json({ members: [] })
            memberWhere.departmentId = { in: scopedDepartments }
        } else if (filterDepartmentId) {
            memberWhere.departmentId = filterDepartmentId
        }

        const members = await prisma.user.findMany({
            where: memberWhere,
            select: { id: true, name: true, email: true, role: true, departmentId: true },
        })

        const memberData = await Promise.all(
            members.map(async (member) => {
                const logs = await prisma.kpiLog.findMany({
                    where: { userId: member.id, ...(dateFilter ? { logDate: dateFilter } : {}) },
                    include: { kpiCriteria: true },
                })

                const criteria = await prisma.kpiCriteria.findMany({
                    where: {
                        OR: [
                            { departmentId: member.departmentId, assignedUserId: null },
                            { assignedUserId: member.id },
                        ],
                    },
                })

                const entries: ScoreEntry[] = criteria.map((criterion) => {
                    const log = logs.find(item => item.kpiCriteriaId === criterion.id)
                    return { countDone: log?.countDone || 0, dailyLimit: criterion.dailyLimit }
                })

                const score = calculateDailyScore(entries)
                return { ...member, score, logs, criteria }
            })
        )

        return NextResponse.json({ members: memberData })
    }

    if (type === 'company' && role === 'admin') {
        const departments = await prisma.department.findMany({
            include: { _count: { select: { users: true } } },
        })

        const deptData = await Promise.all(
            departments.map(async (dept) => {
                const users = await prisma.user.findMany({
                    where: { departmentId: dept.id, isActive: true },
                    select: { id: true },
                })

                const logs = await prisma.kpiLog.findMany({
                    where: {
                        userId: { in: users.map(user => user.id) },
                        ...(dateFilter ? { logDate: dateFilter } : {}),
                    },
                    include: { kpiCriteria: true },
                })

                const entries: ScoreEntry[] = logs.map(log => ({
                    countDone: log.countDone,
                    dailyLimit: log.kpiCriteria?.dailyLimit || log.countDone,
                }))

                return {
                    id: dept.id,
                    name: dept.name,
                    colorHex: dept.colorHex,
                    memberCount: dept._count.users,
                    avgScore: calculateDailyScore(entries),
                }
            })
        )

        const topUserLogs = await prisma.kpiLog.groupBy({
            by: ['userId'],
            _sum: { countDone: true },
            orderBy: { _sum: { countDone: 'desc' } },
            take: 10,
        })

        const topUsers = await Promise.all(
            topUserLogs.map(async (t) => {
                const user = await prisma.user.findUnique({
                    where: { id: t.userId },
                    select: { name: true, email: true, department: { select: { name: true } } },
                })
                return { ...user, totalDone: t._sum.countDone }
            })
        )

        return NextResponse.json({ departments: deptData, topUsers })
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
}

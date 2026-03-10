import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateDailyScore } from '@/lib/kpi-calculator'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: sessionUserId, role, departmentId } = session.user as any
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'team' // 'team' | 'company' | 'personal' | 'member'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter = startDate && endDate
        ? { gte: new Date(startDate), lte: new Date(endDate) }
        : undefined

    if (type === 'personal') {
        const logs = await prisma.kpiLog.findMany({
            where: { userId: sessionUserId, ...(dateFilter ? { logDate: dateFilter } : {}) },
            include: { kpiCriteria: true },
            orderBy: { logDate: 'asc' },
        })

        // Group by date
        const byDate = logs.reduce((acc: any, log: any) => {
            const d = log.logDate.toISOString().split('T')[0]
            if (!acc[d]) acc[d] = []
            acc[d].push(log)
            return acc
        }, {})

        const dailyScores = Object.entries(byDate).map(([date, dayLogs]: any) => {
            const entries = dayLogs.map((l: any) => ({
                countDone: l.countDone,
                dailyLimit: l.kpiCriteria?.dailyLimit || l.countDone,
            }))
            return { date, score: calculateDailyScore(entries) }
        })

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

        // Basic access control: managers limited to their department; team leads to their team
        if (role === 'manager' && departmentId && targetUser.departmentId !== departmentId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (role === 'team_lead') {
            const assignment = await prisma.teamAssignment.findFirst({
                where: { leaderId: sessionUserId, memberId: targetUser.id },
            })
            if (!assignment) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        const logs = await prisma.kpiLog.findMany({
            where: { userId: targetUser.id, ...(dateFilter ? { logDate: dateFilter } : {}) },
            include: { kpiCriteria: true },
            orderBy: { logDate: 'asc' },
        })

        const byDate = logs.reduce((acc: any, log: any) => {
            const d = log.logDate.toISOString().split('T')[0]
            if (!acc[d]) acc[d] = []
            acc[d].push(log)
            return acc
        }, {})

        const dailyScores = Object.entries(byDate).map(([date, dayLogs]: any) => {
            const entries = dayLogs.map((l: any) => ({
                countDone: l.countDone,
                dailyLimit: l.kpiCriteria?.dailyLimit || l.countDone,
            }))
            return { date, score: calculateDailyScore(entries) }
        })

        return NextResponse.json({ user: targetUser, dailyScores, logs })
    }

    if (type === 'team') {
        if (!['admin', 'manager', 'team_lead'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        let userIds: string[] = []
        if (role === 'team_lead') {
            const assignments = await prisma.teamAssignment.findMany({
                where: { leaderId: sessionUserId },
                select: { memberId: true },
            })
            userIds = assignments.map((a: any) => a.memberId)
        } else {
            const users = await prisma.user.findMany({
                where: { departmentId, isActive: true },
                select: { id: true },
            })
            userIds = users.map((u: any) => u.id)
        }

        const members = await prisma.user.findMany({
            where: { id: { in: userIds }, isActive: true },
            select: { id: true, name: true, email: true, role: true },
        })

        const memberData = await Promise.all(
            members.map(async (member: any) => {
                const logs = await prisma.kpiLog.findMany({
                    where: { userId: member.id, ...(dateFilter ? { logDate: dateFilter } : {}) },
                    include: { kpiCriteria: true },
                })

                const criteria = await prisma.kpiCriteria.findMany({
                    where: { departmentId: departmentId || undefined },
                })

                const entries = criteria.map((c: any) => {
                    const log = logs.find((l: any) => l.kpiCriteriaId === c.id)
                    return { countDone: log?.countDone || 0, dailyLimit: c.dailyLimit }
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
            departments.map(async (dept: any) => {
                const users = await prisma.user.findMany({
                    where: { departmentId: dept.id, isActive: true },
                    select: { id: true },
                })

                const logs = await prisma.kpiLog.findMany({
                    where: {
                        userId: { in: users.map((u: any) => u.id) },
                        ...(dateFilter ? { logDate: dateFilter } : {}),
                    },
                    include: { kpiCriteria: true },
                })

                const entries = logs.map((l: any) => ({
                    countDone: l.countDone,
                    dailyLimit: l.kpiCriteria?.dailyLimit || l.countDone,
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
            topUserLogs.map(async (t: any) => {
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

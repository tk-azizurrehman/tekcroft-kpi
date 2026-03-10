import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: sessionUserId, role } = session.user as any
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') || sessionUserId
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Only allow viewing others' logs if manager/team_lead/admin
    if (userId !== sessionUserId && !['admin', 'manager', 'team_lead'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const where: any = { userId }
    if (startDate && endDate) {
        where.logDate = {
            gte: new Date(startDate),
            lte: new Date(endDate),
        }
    }

    const logs = await prisma.kpiLog.findMany({
        where,
        include: {
            kpiCriteria: true,
            user: { select: { name: true, email: true } },
        },
        orderBy: { logDate: 'desc' },
    })

    return NextResponse.json({ logs })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: userId } = session.user as any
    const { entries, logDate } = await req.json()
    // entries: Array<{ kpiCriteriaId?: string, countDone: number, notes?: string, isCustomTask?: boolean, customTaskName?: string }>

    const date = new Date(logDate)

    const results = await Promise.allSettled(
        entries.map(async (entry: any) => {
            const { kpiCriteriaId, countDone, notes, isCustomTask, customTaskName } = entry

            // Enforce lock if criteria has daily limit
            if (kpiCriteriaId && !isCustomTask) {
                const criteria = await prisma.kpiCriteria.findUnique({ where: { id: kpiCriteriaId } })
                if (criteria?.isLocked && countDone > criteria.dailyLimit) {
                    throw new Error(`${criteria.taskName} locked at ${criteria.dailyLimit}`)
                }
            }

            return prisma.kpiLog.upsert({
                where: {
                    userId_kpiCriteriaId_logDate: {
                        userId,
                        kpiCriteriaId: kpiCriteriaId || 'custom',
                        logDate: date,
                    },
                },
                update: { countDone, notes, updatedAt: new Date() },
                create: {
                    userId,
                    kpiCriteriaId: kpiCriteriaId || null,
                    logDate: date,
                    countDone,
                    notes,
                    isCustomTask: isCustomTask || false,
                    customTaskName: customTaskName || null,
                },
            })
        })
    )

    return NextResponse.json({ success: true, results })
}

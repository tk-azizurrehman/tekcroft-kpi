import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, departmentId } = session.user as any
    const { searchParams } = new URL(req.url)
    const deptId = searchParams.get('departmentId') || departmentId
    const userId = searchParams.get('userId') || id

    if (!deptId && !userId) return NextResponse.json({ criteria: [] })

    const criteria = await prisma.kpiCriteria.findMany({
        where: deptId
            ? {
                OR: [
                    { departmentId: deptId, assignedUserId: null },
                    userId ? { assignedUserId: userId } : undefined,
                ].filter(Boolean) as any,
            }
            : {
                assignedUserId: userId,
            },
        orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ criteria })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { role, id, departmentId } = session.user as any
    if (!['admin', 'manager', 'team_lead'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { taskName, dailyLimit, isLocked, deptId, assignedUserId } = await req.json()
    const useDeptId = deptId || departmentId
    if (!useDeptId) return NextResponse.json({ error: 'Department required' }, { status: 400 })

    const criteria = await prisma.kpiCriteria.create({
        data: {
            departmentId: useDeptId,
            taskName,
            dailyLimit: Number(dailyLimit),
            isLocked: isLocked ?? false,
            createdById: id,
            assignedUserId: assignedUserId || null,
        },
    })
    return NextResponse.json({ success: true, criteria })
}

export async function PUT(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { role } = session.user as any
    if (!['admin', 'manager', 'team_lead'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, taskName, dailyLimit, isLocked, assignedUserId } = await req.json()
    const updated = await prisma.kpiCriteria.update({
        where: { id },
        data: {
            taskName,
            dailyLimit: Number(dailyLimit),
            isLocked,
            assignedUserId: assignedUserId ?? undefined,
        },
    })
    return NextResponse.json({ success: true, criteria: updated })
}

export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { role } = session.user as any
    if (!['admin', 'manager'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.kpiCriteria.delete({ where: { id } })
    return NextResponse.json({ success: true })
}

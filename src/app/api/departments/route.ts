import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { type AccessUser, getAccessibleDepartmentIds } from '@/lib/kpi-access'

export async function GET() {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentUser = session.user as AccessUser
    const accessibleDepartments = getAccessibleDepartmentIds(currentUser)
    const departments = await prisma.department.findMany({
        where: accessibleDepartments === null ? undefined : { id: { in: accessibleDepartments } },
        orderBy: { createdAt: 'asc' },
        include: {
            _count: { select: { users: true } },
        },
    })
    return NextResponse.json({ departments })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { role, id } = session.user as AccessUser
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, colorHex } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const dept = await prisma.department.create({
        data: { name, colorHex: colorHex || '#F97316', createdById: id },
    })
    return NextResponse.json({ success: true, department: dept })
}

export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { role, departmentId } = session.user as AccessUser
    if (!['admin', 'manager'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    if (role === 'manager' && departmentId && departmentId !== id) {
        return NextResponse.json({ error: 'Managers can only delete their own department' }, { status: 403 })
    }

    try {
        await prisma.department.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json(
            { error: 'Unable to delete department. Make sure it has no users or KPIs linked.' },
            { status: 400 },
        )
    }
}

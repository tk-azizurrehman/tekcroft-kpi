import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { type AccessUser } from '@/lib/kpi-access'

export async function PUT(req: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = session.user as AccessUser
    const body = await req.json()
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''

    if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json({ error: 'All password fields are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'New password and confirm password do not match' }, { status: 400 })
    }

    if (currentPassword === newPassword) {
        return NextResponse.json({ error: 'New password must be different from the temporary password' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { id: true, passwordHash: true },
    })

    if (!user || user.passwordHash !== currentPassword) {
        return NextResponse.json({ error: 'Temporary password is incorrect' }, { status: 400 })
    }

    await prisma.user.update({
        where: { id: currentUser.id },
        data: { passwordHash: newPassword },
    })

    await prisma.auditLog.create({
        data: {
            userId: currentUser.id,
            action: 'CHANGE_PASSWORD',
            tableName: 'users',
            recordId: currentUser.id,
            newValue: { changedBySelf: true },
        },
    })

    return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: currentUserId, role, departmentId } = session.user as any
  if (!['admin', 'manager', 'team_lead'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  if (id === currentUserId) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, departmentId: true },
  })

  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Enforce hierarchy rules
  if (role === 'manager') {
    if (!departmentId || target.departmentId !== departmentId) {
      return NextResponse.json({ error: 'Managers can only delete users in their department' }, { status: 403 })
    }
    if (['admin', 'manager'].includes(target.role as string)) {
      return NextResponse.json({ error: 'Managers cannot delete admins or other managers' }, { status: 403 })
    }
  }

  if (role === 'team_lead') {
    if (target.role !== 'team_member') {
      return NextResponse.json({ error: 'Team Leads can only delete team members' }, { status: 403 })
    }

    const assignment = await prisma.teamAssignment.findFirst({
      where: { leaderId: currentUserId, memberId: target.id },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'You can only delete members assigned to your team' }, { status: 403 })
    }
  }

  // Soft delete: mark as inactive
  await prisma.user.update({
    where: { id: target.id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}


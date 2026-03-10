import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const role = (session.user as any).role
  const redirectMap: Record<string, string> = {
    admin: '/dashboard/admin',
    manager: '/dashboard/manager',
    team_lead: '/dashboard/team-lead',
    team_member: '/dashboard/member',
  }

  redirect(redirectMap[role] || '/login')
}

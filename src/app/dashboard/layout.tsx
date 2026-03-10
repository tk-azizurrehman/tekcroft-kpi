import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { getBrandingSettings } from '@/lib/settings'

const pageTitles: Record<string, string> = {
    '/dashboard/admin': 'Admin Dashboard',
    '/dashboard/admin/staff': 'Staff Management',
    '/dashboard/admin/departments': 'Departments',
    '/dashboard/admin/kpi-criteria': 'KPI Settings',
    '/dashboard/admin/reports': 'Company Reports',
    '/dashboard/manager': 'Manager Dashboard',
    '/dashboard/manager/team': 'My Team',
    '/dashboard/manager/kpi-criteria': 'KPI Settings',
    '/dashboard/manager/reports': 'Team Reports',
    '/dashboard/team-lead': 'Team Lead Dashboard',
    '/dashboard/team-lead/team': 'My Team',
    '/dashboard/team-lead/kpi-setup': 'KPI Setup',
    '/dashboard/team-lead/reports': 'Team Reports',
    '/dashboard/member': 'My Dashboard',
    '/dashboard/member/log-kpi': 'Log KPIs',
    '/dashboard/member/my-progress': 'My Progress',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const user = session.user as any
    const branding = await getBrandingSettings()

    return (
        <div className="dashboard-layout">
            <Sidebar
                role={user.role}
                userName={user.name || ''}
                departmentName={user.departmentName}
                companyName={branding.companyName}
                logoUrl={branding.logoUrl}
            />
            <div className="dashboard-main">
                <Navbar title={branding.companyName} userName={user.name || ''} role={user.role} />
                <main className="dashboard-content">
                    {children}
                </main>
            </div>
        </div>
    )
}

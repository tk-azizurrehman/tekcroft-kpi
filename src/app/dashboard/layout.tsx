import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { type AccessUser } from '@/lib/kpi-access'
import { getBrandingSettings } from '@/lib/settings'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const user = session.user as AccessUser & { name?: string | null; departmentName?: string | null }
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

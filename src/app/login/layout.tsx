import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Login — TekCroft KPI CRM',
    description: 'Sign in to the TekCraft KPI CRM staff portal',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return children
}

'use client'

import PasswordSettingsCard from '@/components/settings/PasswordSettingsCard'

export default function ManagerSettingsPage() {
    return (
        <div>
            <div className="page-header">
                <h1>Settings</h1>
                <p>Update your own account password</p>
            </div>

            <PasswordSettingsCard />
        </div>
    )
}

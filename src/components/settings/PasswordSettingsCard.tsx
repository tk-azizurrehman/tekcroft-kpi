'use client'

import { useState } from 'react'

export default function PasswordSettingsCard() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    async function handleSave() {
        setError('')
        setSuccess('')

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All password fields are required')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirm password do not match')
            return
        }

        setSaving(true)

        const res = await fetch('/api/settings/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentPassword,
                newPassword,
                confirmPassword,
            }),
        })

        setSaving(false)

        if (!res.ok) {
            const json = await res.json().catch(() => ({}))
            setError(json.error || 'Failed to update password')
            return
        }

        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setSuccess('Password changed successfully')
        setTimeout(() => setSuccess(''), 4000)
    }

    return (
        <div className="card" style={{ maxWidth: '720px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Change Password</h2>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#6B7280' }}>
                    Enter your temporary password, then set a new password for your own account.
                </p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                    <label className="form-label">Temporary Password</label>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="Enter your temporary password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="Enter your new password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </div>
        </div>
    )
}

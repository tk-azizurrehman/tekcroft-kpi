'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/SharedComponents'
import PasswordSettingsCard from '@/components/settings/PasswordSettingsCard'

export default function AdminSettingsPage() {
    const [companyName, setCompanyName] = useState('')
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showLogoHelp, setShowLogoHelp] = useState(false)

    useEffect(() => {
        let cancelled = false

        fetch('/api/settings/branding')
            .then(res => (res.ok ? res.json() : null))
            .then(json => {
                if (!json || cancelled) return
                setCompanyName(json.companyName || '')
                setLogoUrl(json.logoUrl || null)
                setPreviewUrl(json.logoUrl || null)
            })

        return () => {
            cancelled = true
        }
    }, [])

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) {
            setPreviewUrl(logoUrl)
            return
        }

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (PNG, JPG, SVG).')
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            setPreviewUrl(result)
        }
        reader.readAsDataURL(file)
    }

    async function handleSave() {
        if (!companyName.trim()) {
            setError('Company name is required')
            return
        }

        setSaving(true)
        setError('')
        setSuccess('')

        const res = await fetch('/api/settings/branding', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                companyName: companyName.trim(),
                logoDataUrl: previewUrl,
            }),
        })

        setSaving(false)

        if (!res.ok) {
            const json = await res.json().catch(() => ({}))
            setError(json.error || 'Failed to save settings')
            return
        }

        const json = await res.json()
        setCompanyName(json.companyName || '')
        setLogoUrl(json.logoUrl || null)
        setPreviewUrl(json.logoUrl || null)
        setSuccess('Branding updated successfully!')
        setTimeout(() => setSuccess(''), 4000)
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1>🎨 Global Branding</h1>
                    <p>Update the company logo and name used across the app</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="card" style={{ maxWidth: '720px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Logo</div>
                        <div
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '24px',
                                border: '1px dashed #E5E7EB',
                                background: '#F9FAFB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                marginBottom: '10px',
                            }}
                        >
                            {previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={previewUrl} alt="Company logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '32px', fontWeight: 800, color: '#D1D5DB' }}>
                                    {companyName ? companyName[0]?.toUpperCase() : 'T'}
                                </span>
                            )}
                        </div>
                        <label className="btn btn-secondary btn-sm">
                            Upload Logo
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                        </label>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ marginLeft: '8px' }}
                            onClick={() => { setPreviewUrl(null); setLogoUrl(null) }}
                        >
                            Remove
                        </button>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '6px' }}>
                            Recommended: square image, at least 128×128px.
                        </div>
                        <button
                            type="button"
                            className="btn btn-link"
                            style={{ padding: 0, fontSize: '12px', marginTop: '6px' }}
                            onClick={() => setShowLogoHelp(true)}
                        >
                            How is this logo used?
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Company / Brand Name</label>
                            <input
                                className="form-input"
                                placeholder="e.g. TekCroft KPI CRM"
                                value={companyName}
                                onChange={e => setCompanyName(e.target.value)}
                            />
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>
                            This name and logo appear in the sidebar, navbar, and other key surfaces across the dashboard.
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Branding'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '24px' }}>
                <PasswordSettingsCard />
            </div>

            <Modal
                isOpen={showLogoHelp}
                onClose={() => setShowLogoHelp(false)}
                title="Where is the logo used?"
                footer={
                    <button className="btn btn-primary" onClick={() => setShowLogoHelp(false)}>
                        Got it
                    </button>
                }
            >
                <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '10px' }}>
                    The uploaded logo and company name are shown:
                </p>
                <ul style={{ fontSize: '14px', color: '#4B5563', paddingLeft: '18px', margin: 0 }}>
                    <li>In the left sidebar header, next to the navigation menu.</li>
                    <li>As the title in the top navbar of all dashboard pages.</li>
                </ul>
            </Modal>
        </div>
    )
}


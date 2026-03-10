'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/SharedComponents'

const PRESET_COLORS = ['#F97316', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6']

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState({ name: '', colorHex: '#F97316' })

    useEffect(() => { fetchDepts() }, [])

    async function fetchDepts() {
        setLoading(true)
        const res = await fetch('/api/departments')
        const json = await res.json()
        setDepartments(json.departments || [])
        setLoading(false)
    }

    async function handleCreate() {
        if (!form.name.trim()) { setError('Department name required'); return }
        setSaving(true); setError('')
        const res = await fetch('/api/departments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        setSaving(false)
        if (res.ok) { setShowModal(false); fetchDepts() }
        else { const j = await res.json(); setError(j.error || 'Failed') }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this department? This will fail if there are still users or KPIs linked.')) return
        const res = await fetch(`/api/departments?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
            setSuccess('Department deleted')
            fetchDepts()
            setTimeout(() => setSuccess(''), 3000)
        } else {
            const j = await res.json().catch(() => ({}))
            setError(j.error || 'Failed to delete department')
        }
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h1>🏢 Departments</h1><p>Manage company departments</p></div>
                <button className="btn btn-primary" onClick={() => { setForm({ name: '', colorHex: '#F97316' }); setError(''); setShowModal(true) }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Department
                </button>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && !showModal && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {departments.map((d: any) => (
                        <div key={d.id} className="card card-hover" style={{ borderTop: `4px solid ${d.colorHex}`, position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${d.colorHex}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                    🏢
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>{d.name}</h3>
                                    <span className="badge badge-orange" style={{ fontSize: '11px' }}>Active</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ textAlign: 'center', flex: 1, padding: '10px', background: '#F9FAFB', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: d.colorHex }}>{d._count?.users || 0}</div>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Members</div>
                                </div>
                                <div style={{ textAlign: 'center', flex: 1, padding: '10px', background: '#F9FAFB', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: d.colorHex }} />
                                </div>
                            </div>
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ position: 'absolute', top: 10, right: 10 }}
                                onClick={() => handleDelete(d.id)}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Department"
                footer={<>
                    <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Department'}</button>
                </>}>
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group">
                    <label className="form-label">Department Name</label>
                    <input className="form-input" placeholder="e.g. Content Writing Dept." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                    <label className="form-label">Color</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {PRESET_COLORS.map(c => (
                            <button key={c} type="button" onClick={() => setForm(f => ({ ...f, colorHex: c }))}
                                style={{ width: '32px', height: '32px', borderRadius: '8px', background: c, border: form.colorHex === c ? '3px solid var(--text-dark)' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.15s', transform: form.colorHex === c ? 'scale(1.15)' : 'scale(1)' }} />
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    )
}

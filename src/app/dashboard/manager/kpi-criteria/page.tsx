'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/SharedComponents'

export default function KpiCriteriaPage() {
    const [criteria, setCriteria] = useState<any[]>([])
    const [departments, setDepartments] = useState<any[]>([])
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [editItem, setEditItem] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        taskName: '',
        dailyLimit: '',
        isLocked: false,
        deptId: '',
        assignedUserId: '',
    })

    useEffect(() => { fetchAll() }, [])

    async function fetchAll() {
        setLoading(true)
        const [cRes, dRes, uRes] = await Promise.all([
            fetch('/api/kpi/criteria'),
            fetch('/api/departments'),
            fetch('/api/users/list'),
        ])
        const cJson = await cRes.json()
        const dJson = await dRes.json()
        const uJson = await uRes.json()
        setCriteria(cJson.criteria || [])
        setDepartments(dJson.departments || [])
        setMembers((uJson.users || []).filter((u: any) => u.role === 'team_member'))
        setLoading(false)
    }

    function openAdd() {
        setForm({ taskName: '', dailyLimit: '', isLocked: false, deptId: '', assignedUserId: '' })
        setEditItem(null)
        setShowAdd(true)
    }

    function openEdit(c: any) {
        setForm({
            taskName: c.taskName,
            dailyLimit: String(c.dailyLimit),
            isLocked: c.isLocked,
            deptId: c.departmentId,
            assignedUserId: c.assignedUserId || '',
        })
        setEditItem(c)
        setShowAdd(true)
    }

    async function handleSave() {
        if (!form.taskName || !form.dailyLimit) { setError('Task name and daily limit are required'); return }
        setSaving(true); setError('')
        const method = editItem ? 'PUT' : 'POST'
        const body = editItem
            ? {
                id: editItem.id,
                taskName: form.taskName,
                dailyLimit: Number(form.dailyLimit),
                isLocked: form.isLocked,
                assignedUserId: form.assignedUserId || null,
            }
            : {
                taskName: form.taskName,
                dailyLimit: Number(form.dailyLimit),
                isLocked: form.isLocked,
                deptId: form.deptId || undefined,
                assignedUserId: form.assignedUserId || undefined,
            }

        const res = await fetch('/api/kpi/criteria', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        setSaving(false)
        if (res.ok) { setShowAdd(false); fetchAll() }
        else { const j = await res.json(); setError(j.error || 'Failed to save') }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this KPI task?')) return
        await fetch(`/api/kpi/criteria?id=${id}`, { method: 'DELETE' })
        fetchAll()
    }

    async function toggleLock(c: any) {
        await fetch('/api/kpi/criteria', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: c.id, taskName: c.taskName, dailyLimit: c.dailyLimit, isLocked: !c.isLocked }),
        })
        fetchAll()
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h1>⚙️ KPI Settings</h1><p>Define task types and daily limits for your team</p></div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Task Type
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Task Name</th>
                                    <th>Daily Limit</th>
                                    <th>Assigned To</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {criteria.length === 0 ? (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                                        No KPI tasks defined yet. Click "Add Task Type" to get started.
                                    </td></tr>
                                ) : criteria.map((c: any) => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.taskName}</td>
                                        <td><span className="badge badge-blue">{c.dailyLimit} / day</span></td>
                                        <td>
                                            {c.assignedUserId
                                                ? (
                                                    <span className="badge badge-orange" style={{ fontSize: '11px' }}>
                                                        {members.find((m: any) => m.id === c.assignedUserId)?.name || 'Specific member'}
                                                    </span>
                                                )
                                                : <span style={{ fontSize: '11px', color: '#6B7280' }}>All in department</span>}
                                        </td>
                                        <td>
                                            <button onClick={() => toggleLock(c)} className="badge" style={{
                                                cursor: 'pointer', border: 'none',
                                                background: c.isLocked ? 'var(--danger-light)' : 'var(--success-light)',
                                                color: c.isLocked ? '#DC2626' : '#059669',
                                            }}>
                                                {c.isLocked ? '🔒 Locked' : '🔓 Open'}
                                            </button>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>
                                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    Edit
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>
                                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showAdd}
                onClose={() => setShowAdd(false)}
                title={editItem ? 'Edit KPI Task' : 'Add KPI Task'}
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : editItem ? 'Update Task' : 'Add Task'}
                        </button>
                    </>
                }
            >
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group">
                    <label className="form-label">Task Name</label>
                    <input className="form-input" placeholder="e.g. On-Page SEO, KW Research" value={form.taskName} onChange={e => setForm(f => ({ ...f, taskName: e.target.value }))} />
                </div>
                <div className="form-group">
                    <label className="form-label">Daily Limit</label>
                    <input className="form-input" type="number" min={1} placeholder="e.g. 10" value={form.dailyLimit} onChange={e => setForm(f => ({ ...f, dailyLimit: e.target.value }))} />
                </div>
                {!editItem && departments.length > 0 && (
                    <div className="form-group">
                        <label className="form-label">Department (optional)</label>
                        <select className="form-select" value={form.deptId} onChange={e => setForm(f => ({ ...f, deptId: e.target.value }))}>
                            <option value="">Use your department</option>
                            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                )}
                {members.length > 0 && (
                    <div className="form-group">
                        <label className="form-label">Assign to Specific Team Member (optional)</label>
                        <select
                            className="form-select"
                            value={form.assignedUserId}
                            onChange={e => setForm(f => ({ ...f, assignedUserId: e.target.value }))}
                        >
                            <option value="">All members in department</option>
                            {members.map((m: any) => (
                                <option key={m.id} value={m.id}>
                                    {m.name} ({m.email})
                                </option>
                            ))}
                        </select>
                        <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                            When set, this KPI will only appear on that member&apos;s dashboard.
                        </p>
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#F9FAFB', borderRadius: '10px' }}>
                    <input type="checkbox" id="lockChk" checked={form.isLocked} onChange={e => setForm(f => ({ ...f, isLocked: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: '#F97316' }} />
                    <label htmlFor="lockChk" style={{ cursor: 'pointer' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>🔒 Lock Daily Limit</span>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Team members cannot exceed this limit</p>
                    </label>
                </div>
            </Modal>
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/SharedComponents'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || '@tekcroft.com'

export default function ManagerTeamPage() {
    const [users, setUsers] = useState<any[]>([])
    const [departments, setDepartments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'team_lead', departmentId: '' })

    useEffect(() => { fetchAll() }, [])

    async function fetchAll() {
        setLoading(true)
        const [uRes, dRes] = await Promise.all([
            fetch('/api/users/list?limit=50'),
            fetch('/api/departments'),
        ])
        setUsers((await uRes.json()).users || [])
        setDepartments((await dRes.json()).departments || [])
        setLoading(false)
    }

    async function handleCreate() {
        if (!form.name || !form.email || !form.password) { setError('All fields required'); return }
        if (!form.email.endsWith(ALLOWED_DOMAIN)) { setError(`Only ${ALLOWED_DOMAIN} emails allowed`); return }
        setSaving(true); setError('')
        const res = await fetch('/api/users/create', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        setSaving(false)
        if (res.ok) { setShowModal(false); setSuccess('Account created!'); fetchAll(); setTimeout(() => setSuccess(''), 4000) }
        else { const j = await res.json(); setError(j.error || 'Error') }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this team member? They will be marked inactive and removed from your team.')) return
        const res = await fetch(`/api/users/delete?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
            setSuccess('User deleted')
            fetchAll()
            setTimeout(() => setSuccess(''), 3000)
        } else {
            const j = await res.json().catch(() => ({}))
            setError(j.error || 'Failed to delete user')
        }
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h1>👥 My Team</h1><p>Manage your team leads and members</p></div>
                <button className="btn btn-primary" onClick={() => { setForm({ name: '', email: '', password: '', role: 'team_lead', departmentId: '' }); setError(''); setShowModal(true) }}>+ Add Team Member</button>
            </div>

            {success && <div className="alert alert-success">{success}</div>}

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th /></tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Loading...</td></tr>
                                : users.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>No team members yet</td></tr>
                                    : users.map((u: any) => (
                                        <tr key={u.id}>
                                            <td><div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>{u.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>
                                                <span style={{ fontWeight: 600 }}>{u.name}</span>
                                            </div></td>
                                            <td style={{ color: '#6B7280' }}>{u.email}</td>
                                            <td><span className={`role-badge role-${u.role}`}>{u.role.replace('_', ' ')}</span></td>
                                            <td>{u.department ? <span className="badge badge-orange">{u.department.name}</span> : '—'}</td>
                                            <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? '● Active' : '● Inactive'}</span></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(u.id)}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Team Member"
                footer={<><button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Account'}</button></>}>
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder={`name${ALLOWED_DOMAIN}`} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" placeholder="Temporary password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Role</label>
                    <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                        <option value="team_lead">Team Lead</option>
                        <option value="team_member">Team Member</option>
                    </select>
                </div>
                <div className="form-group"><label className="form-label">Department</label>
                    <select className="form-select" value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
                        <option value="">Select department</option>
                        {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
            </Modal>
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/SharedComponents'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || '@tekcroft.com'

export default function StaffPage() {
    const [users, setUsers] = useState<any[]>([])
    const [departments, setDepartments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [filterRole, setFilterRole] = useState('')

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'manager',
        departmentId: '',
        assignedTeamIds: [] as string[],
    })

    useEffect(() => { fetchAll() }, [filterRole])

    async function fetchAll() {
        setLoading(true)
        const params = filterRole ? `?role=${filterRole}` : ''
        const [uRes, dRes] = await Promise.all([
            fetch(`/api/users/list${params}`),
            fetch('/api/departments'),
        ])
        const uJson = await uRes.json()
        const dJson = await dRes.json()
        setUsers(uJson.users || [])
        setDepartments(dJson.departments || [])
        setLoading(false)
    }

    async function handleCreate() {
        if (!form.name || !form.email || !form.password) { setError('All fields required'); return }
        if (!form.email.endsWith(ALLOWED_DOMAIN)) { setError(`Only ${ALLOWED_DOMAIN} emails allowed`); return }
        setSaving(true); setError('')
        const res = await fetch('/api/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        setSaving(false)
        if (res.ok) {
            setShowModal(false)
            setSuccess('User created successfully!')
            fetchAll()
            setTimeout(() => setSuccess(''), 4000)
        } else {
            const j = await res.json()
            setError(j.error || 'Failed to create user')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this user? They will be marked inactive and removed from listings.')) return
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

    const roleColors: Record<string, string> = {
        admin: 'role-admin', manager: 'role-manager',
        team_lead: 'role-team_lead', team_member: 'role-team_member',
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div><h1>👥 All Staff</h1><p>Manage all staff accounts across departments</p></div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setForm({ name: '', email: '', password: '', role: 'manager', departmentId: '', assignedTeamIds: [] })
                        setError('')
                        setShowModal(true)
                    }}
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Staff
                </button>
            </div>

            {success && <div className="alert alert-success">{success}</div>}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {(['', 'manager', 'team_lead', 'team_member'] as const).map(r => (
                    <button key={r} className={`date-filter-btn ${filterRole === r ? 'active' : ''}`}
                        style={{ background: filterRole === r ? 'white' : '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                        onClick={() => setFilterRole(r)}>
                        {r === '' ? 'All Roles' : r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                ))}
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Joined</th><th /></tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Loading...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>No staff found</td></tr>
                            ) : users.map((u: any) => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                                                {u.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: '#6B7280' }}>{u.email}</td>
                                    <td><span className={`role-badge ${roleColors[u.role]}`}>{u.role.replace('_', ' ')}</span></td>
                                    <td>
                                        {u.department
                                            ? <span className="badge badge-orange" style={{ fontSize: '12px' }}>{u.department.name}</span>
                                            : <span style={{ color: '#C4C4C4' }}>—</span>}
                                    </td>
                                    <td>
                                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {u.isActive ? '● Active' : '● Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ color: '#9CA3AF', fontSize: '13px' }}>
                                        {new Date(u.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
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

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Create New Staff Account"
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                            {saving ? 'Creating...' : 'Create Staff'}
                        </button>
                    </>
                }
            >
                {error && <div className="alert alert-error">{error}</div>}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                        gap: '18px 16px',
                        marginBottom: '18px',
                    }}
                >
                    <div className="form-group">
                        <label className="form-label" style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                            Full Name
                        </label>
                        <input
                            className="form-input"
                            placeholder="e.g. John Doe"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                            Email
                        </label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder={`name${ALLOWED_DOMAIN}`}
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                            Password
                        </label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Temporary password"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                            Role
                        </label>
                        <select
                            className="form-select"
                            value={form.role}
                            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                        >
                            <option value="manager">Manager</option>
                            <option value="team_lead">Team Lead</option>
                            <option value="team_member">Team Member</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                            Department
                        </label>
                        <select
                            className="form-select"
                            value={form.departmentId}
                            onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}
                        >
                            <option value="">Select department (optional)</option>
                            {departments.map((d: any) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {(form.role === 'manager' || form.role === 'team_lead') && (
                    <div className="form-group" style={{ marginTop: 4 }}>
                        <label className="form-label" style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                            Teams (Departments) they can access
                        </label>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                maxHeight: '190px',
                                overflowY: 'auto',
                                padding: '8px 10px',
                                borderRadius: '14px',
                                border: '1px solid #E5E7EB',
                                background: '#F9FAFB',
                            }}
                        >
                            {departments.map((d: any) => {
                                const checked = (form.assignedTeamIds || []).includes(d.id)
                                return (
                                    <label
                                        key={d.id}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={e => {
                                                setForm(f => ({
                                                    ...f,
                                                    assignedTeamIds: e.target.checked
                                                        ? [...f.assignedTeamIds, d.id]
                                                        : f.assignedTeamIds.filter(id => id !== d.id),
                                                }))
                                            }}
                                            style={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: 4,
                                                accentColor: '#007BFF',
                                            }}
                                        />
                                        <span>{d.name}</span>
                                    </label>
                                )
                            })}
                        </div>
                        <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                            If left empty, they only manage their primary department.
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    )
}

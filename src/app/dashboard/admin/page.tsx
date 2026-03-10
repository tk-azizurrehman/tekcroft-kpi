'use client'

import { useEffect, useState } from 'react'
import { StatCard, DateFilter, ProgressBar, ScoreBadge } from '@/components/ui/SharedComponents'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const DEPT_COLORS = ['#F97316', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

export default function AdminDashboard() {
    const [filter, setFilter] = useState('Weekly')
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<any[]>([])
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    useEffect(() => {
        fetchData()
        fetchUsers()
    }, [filter, startDate, endDate])

    async function fetchData() {
        setLoading(true)
        const params = buildDateParams()
        const res = await fetch(`/api/kpi/reports?type=company&${params}`)
        const json = await res.json()
        setData(json)
        setLoading(false)
    }

    async function fetchUsers() {
        const res = await fetch('/api/users/list?role=manager&limit=10')
        const json = await res.json()
        setUsers(json.users || [])
    }

    function buildDateParams() {
        const now = new Date()
        let start: Date, end: Date
        if (filter === 'Today') {
            start = end = new Date(now.toDateString())
        } else if (filter === 'Yesterday') {
            const y = new Date(now); y.setDate(now.getDate() - 1)
            start = end = new Date(y.toDateString())
        } else if (filter === 'Weekly') {
            const day = now.getDay()
            start = new Date(now); start.setDate(now.getDate() - (day || 7) + 1); start.setHours(0, 0, 0, 0)
            end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999)
        } else if (filter === 'Monthly') {
            start = new Date(now.getFullYear(), now.getMonth(), 1)
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        } else if (filter === 'Custom' && startDate && endDate) {
            return `startDate=${startDate}&endDate=${endDate}`
        } else {
            return ''
        }
        return `startDate=${start!.toISOString().split('T')[0]}&endDate=${end!.toISOString().split('T')[0]}`
    }

    const departments = data?.departments || []
    const topUsers = data?.topUsers || []
    const totalStaff = users.length
    const avgScore = departments.length
        ? Math.round(departments.reduce((s: number, d: any) => s + d.avgScore, 0) / departments.length)
        : 0

    return (
        <div>
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Company-wide KPI overview and performance analytics</p>
                </div>
                <DateFilter
                    active={filter}
                    onChange={setFilter}
                    startDate={startDate}
                    endDate={endDate}
                    onDateChange={(s, e) => { setStartDate(s); setEndDate(e) }}
                />
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <StatCard label="Total Managers" value={totalStaff} color="#8B5CF6"
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                />
                <StatCard label="Departments" value={departments.length} color="#3B82F6"
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                />
                <StatCard label="Company Avg KPI" value={`${avgScore}%`} color="#10B981"
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                />
                <StatCard label="Top Performers" value={topUsers.length} color="#F97316"
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
                />
            </div>

            {/* Charts + Top Performers */}
            <div className="content-grid" style={{ marginBottom: '24px' }}>
                {/* Dept Performance Chart */}
                <div className="card">
                    <div className="section-header">
                        <span className="section-title">📊 Department Performance</span>
                    </div>
                    {loading ? (
                        <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Loading chart...</div>
                    ) : departments.length === 0 ? (
                        <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: '#9CA3AF' }}>
                            <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            <p>No data for selected period</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={departments} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false}
                                    tickFormatter={(v) => v.replace(' Dept.', '').slice(0, 10)} />
                                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                <Tooltip formatter={(v) => [`${v}%`, 'Avg Score']} contentStyle={{ borderRadius: '10px', border: '1px solid #FED7AA', fontSize: '13px' }} />
                                <Bar dataKey="avgScore" radius={[6, 6, 0, 0]}>
                                    {departments.map((_: any, i: number) => (
                                        <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Top Performers */}
                <div className="card">
                    <div className="section-header">
                        <span className="section-title">🏆 Top Performers</span>
                    </div>
                    {topUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                            <p>No performance data yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {topUsers.slice(0, 8).map((u: any, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '12px',
                                        background: i === 0 ? '#FEF3C7' : i === 1 ? '#F3F4F6' : i === 2 ? '#FED7AA' : '#F9FAFB',
                                        color: i === 0 ? '#D97706' : i === 1 ? '#6B7280' : i === 2 ? '#EA580C' : '#9CA3AF'
                                    }}>
                                        {i + 1}
                                    </div>
                                    <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                                        {u.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-dark)' }}>{u.name}</div>
                                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{u.department?.name || 'N/A'}</div>
                                    </div>
                                    <div style={{ fontWeight: 700, color: '#F97316', fontSize: '14px' }}>{u.totalDone} tasks</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* All Managers Table */}
            <div className="card">
                <div className="section-header">
                    <span className="section-title">👥 All Managers</span>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Manager</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px' }}>No managers found</td></tr>
                            ) : users.map((u: any) => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                                {u.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: '#6B7280' }}>{u.email}</td>
                                    <td>
                                        {u.department ? (
                                            <span className="badge badge-orange">{u.department.name}</span>
                                        ) : <span style={{ color: '#9CA3AF' }}>—</span>}
                                    </td>
                                    <td>
                                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {u.isActive ? '● Active' : '● Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

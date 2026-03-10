'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { StatCard, DateFilter, ProgressBar } from '@/components/ui/SharedComponents'
import { getScoreColor, getPerformanceGrade } from '@/lib/kpi-calculator'

export default function ManagerDashboard() {
    const [filter, setFilter] = useState('Weekly')
    const [members, setMembers] = useState<any[]>([])
    const [criteria, setCriteria] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    useEffect(() => { fetchTeam() }, [filter, startDate, endDate])
    useEffect(() => { fetchCriteria() }, [])

    async function fetchTeam() {
        setLoading(true)
        const params = buildDateParams()
        const res = await fetch(`/api/kpi/reports?type=team&${params}`)
        const json = await res.json()
        setMembers(json.members || [])
        setLoading(false)
    }

    async function fetchCriteria() {
        const res = await fetch('/api/kpi/criteria')
        const json = await res.json()
        setCriteria(json.criteria || [])
    }

    function buildDateParams() {
        const now = new Date()
        if (filter === 'Today') return `startDate=${now.toISOString().split('T')[0]}&endDate=${now.toISOString().split('T')[0]}`
        if (filter === 'Yesterday') {
            const y = new Date(now); y.setDate(now.getDate() - 1)
            const d = y.toISOString().split('T')[0]; return `startDate=${d}&endDate=${d}`
        }
        if (filter === 'Weekly') {
            const day = now.getDay(); const start = new Date(now); start.setDate(now.getDate() - (day || 7) + 1); start.setHours(0, 0, 0, 0)
            const end = new Date(start); end.setDate(start.getDate() + 6)
            return `startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`
        }
        if (filter === 'Monthly') {
            const s = new Date(now.getFullYear(), now.getMonth(), 1); const e = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            return `startDate=${s.toISOString().split('T')[0]}&endDate=${e.toISOString().split('T')[0]}`
        }
        if (filter === 'Custom' && startDate && endDate) return `startDate=${startDate}&endDate=${endDate}`
        return ''
    }

    const onTrack = members.filter(m => m.score >= 75).length
    const behind = members.filter(m => m.score < 75).length
    const avgScore = members.length ? Math.round(members.reduce((s, m) => s + m.score, 0) / members.length) : 0

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div><h1>Manager Dashboard</h1><p>Monitor your team's KPI performance</p></div>
                <DateFilter active={filter} onChange={setFilter} startDate={startDate} endDate={endDate} onDateChange={(s, e) => { setStartDate(s); setEndDate(e) }} />
            </div>

            <div className="stats-grid">
                <StatCard label="Team Size" value={members.length} color="#8B5CF6"
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                <StatCard label="On Track ≥75%" value={onTrack} color="#10B981"
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard label="Behind Target" value={behind} color="#EF4444"
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
                <StatCard label="Avg KPI Score" value={`${avgScore}%`} color="#F97316"
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
            </div>

            {/* Team KPI Progress */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="section-header">
                    <span className="section-title">📋 Team KPI Progress</span>
                </div>
                {loading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>Loading team data...</div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Team Member</th>
                                    <th>Role</th>
                                    {criteria.slice(0, 3).map((c: any) => <th key={c.id}>{c.taskName}</th>)}
                                    <th>Overall Score</th>
                                    <th>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.length === 0 ? (
                                    <tr><td colSpan={6 + criteria.slice(0, 3).length} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px' }}>No team members found</td></tr>
                                ) : members.map((m: any) => {
                                    const grade = getPerformanceGrade(m.score)
                                    const color = getScoreColor(m.score)
                                    return (
                                        <tr key={m.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                                        {m.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <Link href={`/dashboard/reports/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}>{m.name}</div>
                                                            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{m.email}</div>
                                                        </div>
                                                    </Link>
                                                </div>
                                            </td>
                                            <td><span className={`role-badge role-${m.role}`}>{m.role.replace('_', ' ')}</span></td>
                                            {criteria.slice(0, 3).map((c: any) => {
                                                const log = m.logs?.find((l: any) => l.kpiCriteriaId === c.id)
                                                return (
                                                    <td key={c.id}>
                                                        <span style={{ fontWeight: 600 }}>{log?.countDone || 0}</span>
                                                        <span style={{ color: '#9CA3AF' }}>/{c.dailyLimit}</span>
                                                    </td>
                                                )
                                            })}
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <ProgressBar score={m.score} />
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color, minWidth: '38px' }}>{m.score}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge" style={{ background: `${color}18`, color }}>
                                                    {grade === 'A' ? '🏆 A' : grade === 'B' ? '✅ B' : grade === 'C' ? '🟡 C' : '🔴 D'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* KPI Criteria */}
            <div className="card">
                <div className="section-header">
                    <span className="section-title">⚙️ KPI Criteria</span>
                    <a href="/dashboard/manager/kpi-criteria" className="btn btn-secondary btn-sm">Manage</a>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead><tr><th>Task</th><th>Daily Limit</th><th>Status</th></tr></thead>
                        <tbody>
                            {criteria.length === 0
                                ? <tr><td colSpan={3} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px' }}>No criteria set yet</td></tr>
                                : criteria.map((c: any) => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.taskName}</td>
                                        <td><span className="badge badge-blue">{c.dailyLimit} / day</span></td>
                                        <td><span className={`badge ${c.isLocked ? 'badge-danger' : 'badge-success'}`}>{c.isLocked ? '🔒 Locked' : '🔓 Open'}</span></td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

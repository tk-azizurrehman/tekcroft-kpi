'use client'

import { useEffect, useState } from 'react'
import { StatCard, DateFilter, ProgressBar } from '@/components/ui/SharedComponents'
import { getScoreColor, getPerformanceGrade } from '@/lib/kpi-calculator'

export default function TeamLeadDashboard() {
    const [filter, setFilter] = useState('Today')
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

    const todayLogged = members.filter(m => m.logs?.length > 0).length
    const avgScore = members.length ? Math.round(members.reduce((s, m) => s + m.score, 0) / members.length) : 0

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div><h1>Team Lead Dashboard</h1><p>Monitor your team's daily KPI logs</p></div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <DateFilter active={filter} onChange={setFilter} startDate={startDate} endDate={endDate} onDateChange={(s, e) => { setStartDate(s); setEndDate(e) }} />
                    <a href="/dashboard/team-lead/team" className="btn btn-primary btn-sm">+ Add Member</a>
                </div>
            </div>

            <div className="stats-grid">
                <StatCard label="Team Members" value={members.length} color="#8B5CF6"
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                <StatCard label="Logged Today" value={todayLogged} color="#10B981"
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} />
                <StatCard label="Team Avg KPI" value={`${avgScore}%`} color="#F97316"
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
            </div>

            {/* Daily KPI Log Table */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="section-header">
                    <span className="section-title">📋 Daily KPI Log Table</span>
                    <a href="/dashboard/team-lead/kpi-setup" className="btn btn-secondary btn-sm">⚙️ KPI Setup</a>
                </div>
                {loading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>
                ) : members.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: '#9CA3AF', marginBottom: '16px' }}>No team members assigned yet</p>
                        <a href="/dashboard/team-lead/team" className="btn btn-primary btn-sm">+ Add Team Members</a>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    {criteria.slice(0, 4).map((c: any) => (
                                        <th key={c.id}>{c.taskName}<span style={{ color: '#9CA3AF', fontWeight: 400 }}> (/{c.dailyLimit})</span></th>
                                    ))}
                                    <th>Progress</th>
                                    <th>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((m: any) => {
                                    const color = getScoreColor(m.score)
                                    const grade = getPerformanceGrade(m.score)
                                    return (
                                        <tr key={m.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '11px' }}>
                                                        {m.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <span style={{ fontWeight: 600 }}>{m.name}</span>
                                                </div>
                                            </td>
                                            {criteria.slice(0, 4).map((c: any) => {
                                                const log = m.logs?.find((l: any) => l.kpiCriteriaId === c.id)
                                                const done = log?.countDone || 0
                                                const pct = Math.min(100, Math.round(done / c.dailyLimit * 100))
                                                const clr = getScoreColor(pct)
                                                return (
                                                    <td key={c.id}>
                                                        <span style={{ fontWeight: 700, color: clr }}>{done}</span>
                                                        <span style={{ color: '#9CA3AF' }}>/{c.dailyLimit}</span>
                                                    </td>
                                                )
                                            })}
                                            <td style={{ minWidth: '140px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <ProgressBar score={m.score} />
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color, minWidth: '36px' }}>{m.score}%</span>
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
        </div>
    )
}

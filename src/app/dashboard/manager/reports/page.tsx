'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DateFilter, ProgressBar } from '@/components/ui/SharedComponents'
import { getScoreColor, getPerformanceGrade } from '@/lib/kpi-calculator'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function ManagerReportsPage() {
    const [filter, setFilter] = useState('Monthly')
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    useEffect(() => { fetchReport() }, [filter, startDate, endDate])

    async function fetchReport() {
        setLoading(true)
        const params = buildDateParams()
        const res = await fetch(`/api/kpi/reports?type=team&${params}`)
        const json = await res.json()
        setMembers(json.members || [])
        setLoading(false)
    }

    function buildDateParams() {
        const now = new Date()
        if (filter === 'Today') return `startDate=${now.toISOString().split('T')[0]}&endDate=${now.toISOString().split('T')[0]}`
        if (filter === 'Yesterday') { const y = new Date(now); y.setDate(now.getDate() - 1); const d = y.toISOString().split('T')[0]; return `startDate=${d}&endDate=${d}` }
        if (filter === 'Weekly') { const day = now.getDay(); const s = new Date(now); s.setDate(now.getDate() - (day || 7) + 1); s.setHours(0, 0, 0, 0); const e = new Date(s); e.setDate(s.getDate() + 6); return `startDate=${s.toISOString().split('T')[0]}&endDate=${e.toISOString().split('T')[0]}` }
        if (filter === 'Monthly') { const s = new Date(now.getFullYear(), now.getMonth(), 1); const e = new Date(now.getFullYear(), now.getMonth() + 1, 0); return `startDate=${s.toISOString().split('T')[0]}&endDate=${e.toISOString().split('T')[0]}` }
        if (filter === 'Custom' && startDate && endDate) return `startDate=${startDate}&endDate=${endDate}`
        return ''
    }

    const sorted = [...members].sort((a, b) => b.score - a.score)

    async function exportCSV() {
        const header = 'Name,Email,Score,Grade\n'
        const rows = members.map(m => `${m.name},${m.email},${m.score}%,${getPerformanceGrade(m.score)}`).join('\n')
        const blob = new Blob([header + rows], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `team-report-${filter}.csv`; a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div><h1>📊 Team Reports</h1><p>Detailed KPI performance analytics for your team</p></div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <DateFilter active={filter} onChange={setFilter} startDate={startDate} endDate={endDate} onDateChange={(s, e) => { setStartDate(s); setEndDate(e) }} />
                    <button className="btn btn-secondary btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
                </div>
            </div>

            <div className="content-grid" style={{ marginBottom: '24px' }}>
                {/* Bar Chart */}
                <div className="card">
                    <div className="section-header"><span className="section-title">📈 Team Comparison</span></div>
                    {loading || members.length === 0 ? (
                        <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                            {loading ? 'Loading...' : 'No data for selected period'}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={members} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={v => v.split(' ')[0]} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                                <Tooltip formatter={(v) => [`${v}%`, 'Score']} contentStyle={{ borderRadius: '10px', border: '1px solid #FED7AA', fontSize: '13px' }} />
                                <Bar dataKey="score" radius={[6, 6, 0, 0]}>{members.map((_: any, i: number) => <Cell key={i} fill={getScoreColor(_.score)} />)}</Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Rankings */}
                <div className="card">
                    <div className="section-header"><span className="section-title">🏆 Member Rankings</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {sorted.slice(0, 8).map((m: any, i: number) => {
                            const color = getScoreColor(m.score)
                            return (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: i === 0 ? '#FEF3C7' : i === 1 ? '#F3F4F6' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: i === 0 ? '#D97706' : '#6B7280', flexShrink: 0 }}>{i + 1}</div>
                                    <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '11px', flexShrink: 0 }}>{m.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{m.name}</div>
                                        <ProgressBar score={m.score} height={5} />
                                    </div>
                                    <span style={{ fontWeight: 700, color, minWidth: '40px', textAlign: 'right', fontSize: '13px' }}>{m.score}%</span>
                                </div>
                            )
                        })}
                        {sorted.length === 0 && <p style={{ color: '#9CA3AF', textAlign: 'center' }}>No data yet</p>}
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="card">
                <div className="section-header"><span className="section-title">📋 Detailed Performance</span></div>
                <div className="table-wrapper">
                    <table>
                        <thead><tr><th>Rank</th><th>Member</th><th>Score</th><th>Progress</th><th>Grade</th></tr></thead>
                        <tbody>
                            {sorted.length === 0
                                ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>No data for selected period</td></tr>
                                : sorted.map((m: any, i: number) => {
                                    const color = getScoreColor(m.score)
                                    const grade = getPerformanceGrade(m.score)
                                    return (
                                        <tr key={m.id}>
                                            <td><span style={{ fontWeight: 700, color: i === 0 ? '#D97706' : '#6B7280' }}>#{i + 1}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '11px' }}>{m.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>
                                                    <Link href={`/dashboard/reports/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}>{m.name}</div>
                                                            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{m.email}</div>
                                                        </div>
                                                    </Link>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 800, color, fontSize: '16px' }}>{m.score}%</td>
                                            <td style={{ minWidth: '160px' }}><ProgressBar score={m.score} showLabel /></td>
                                            <td><span className="badge" style={{ background: `${color}18`, color }}>{grade === 'A' ? '🏆 Excellent' : grade === 'B' ? '✅ Good' : grade === 'C' ? '🟡 Average' : '🔴 Needs Work'}</span></td>
                                        </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

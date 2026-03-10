'use client'

import { useEffect, useState } from 'react'
import { StatCard, DateFilter, ProgressBar } from '@/components/ui/SharedComponents'
import { getScoreColor, getPerformanceGrade, getGradeLabel, calculateDailyScore } from '@/lib/kpi-calculator'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function MemberDashboard() {
    const [filter, setFilter] = useState('Weekly')
    const [logs, setLogs] = useState<any[]>([])
    const [criteria, setCriteria] = useState<any[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    useEffect(() => { fetchData() }, [filter, startDate, endDate])
    useEffect(() => { fetchCriteria() }, [])

    async function fetchData() {
        setLoading(true)
        const params = buildDateParams()
        const res = await fetch(`/api/kpi/reports?type=personal&${params}`)
        const json = await res.json()
        setLogs(json.logs || [])
        setChartData(json.dailyScores || [])
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
            const y = new Date(now); y.setDate(now.getDate() - 1); const d = y.toISOString().split('T')[0]; return `startDate=${d}&endDate=${d}`
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

    // Today's logs
    const today = new Date().toISOString().split('T')[0]
    const todayLogs = logs.filter(l => l.logDate?.split('T')[0] === today)
    const todayEntries = criteria.map(c => {
        const log = todayLogs.find(l => l.kpiCriteriaId === c.id)
        return { countDone: log?.countDone || 0, dailyLimit: c.dailyLimit }
    })
    const todayScore = calculateDailyScore(todayEntries)
    const weeklyScore = chartData.length ? Math.round(chartData.reduce((s, d) => s + d.score, 0) / chartData.length) : 0
    const monthlyScore = weeklyScore
    const grade = getPerformanceGrade(todayScore)
    const gradeLabel = getGradeLabel(grade)

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div><h1>My KPI Dashboard</h1><p>Your personal KPI performance overview</p></div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <DateFilter active={filter} onChange={setFilter} startDate={startDate} endDate={endDate} onDateChange={(s, e) => { setStartDate(s); setEndDate(e) }} />
                    <a href="/dashboard/member/log-kpi" className="btn btn-primary">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Log Today's KPIs
                    </a>
                </div>
            </div>

            <div className="stats-grid">
                <StatCard label="Today's Progress" value={`${todayScore}%`} color={getScoreColor(todayScore)}
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard label="Weekly Avg" value={`${weeklyScore}%`} color="#8B5CF6"
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                <StatCard label="Monthly Avg" value={`${monthlyScore}%`} color="#3B82F6"
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
                <StatCard label="Overall Grade" value={gradeLabel} color={getScoreColor(todayScore)}
                    icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>} />
            </div>

            <div className="content-grid">
                {/* Today's Work Log */}
                <div className="card">
                    <div className="section-header">
                        <span className="section-title">📝 Today's Work Log</span>
                        <a href="/dashboard/member/log-kpi" className="btn btn-secondary btn-sm">Edit</a>
                    </div>
                    {loading ? <div style={{ color: '#9CA3AF', padding: '24px 0' }}>Loading...</div> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {criteria.length === 0 ? (
                                <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>No KPI criteria set for your department yet</p>
                            ) : criteria.map((c: any) => {
                                const log = todayLogs.find((l: any) => l.kpiCriteriaId === c.id)
                                const done = log?.countDone || 0
                                const pct = Math.min(100, Math.round(done / c.dailyLimit * 100))
                                const color = getScoreColor(pct)
                                return (
                                    <div key={c.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{c.taskName}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 700, color }}>{done}<span style={{ color: '#9CA3AF', fontWeight: 400 }}>/{c.dailyLimit}</span></span>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color }}>{pct}%</span>
                                                {pct >= 100 ? <span>✅</span> : pct >= 60 ? <span>🟡</span> : <span>🔴</span>}
                                            </div>
                                        </div>
                                        <ProgressBar score={pct} />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Progress Chart */}
                <div className="card">
                    <div className="section-header">
                        <span className="section-title">📈 Progress Trend</span>
                    </div>
                    {chartData.length === 0 ? (
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', flexDirection: 'column', gap: '8px' }}>
                            <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            <p>No data for selected period</p>
                            <a href="/dashboard/member/log-kpi" className="btn btn-primary btn-sm">Start Logging KPIs</a>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false}
                                    tickFormatter={v => v.slice(5)} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                                <Tooltip formatter={(v) => [`${v}%`, 'Score']} contentStyle={{ borderRadius: '10px', border: '1px solid #FED7AA', fontSize: '13px' }} />
                                <Line type="monotone" dataKey="score" stroke="#F97316" strokeWidth={2.5} dot={{ fill: '#F97316', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { DateFilter } from '@/components/ui/SharedComponents'
import { getScoreColor, getPerformanceGrade, calculateDailyScore } from '@/lib/kpi-calculator'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function MyProgressPage() {
    const [filter, setFilter] = useState('Monthly')
    const [chartData, setChartData] = useState<any[]>([])
    const [logs, setLogs] = useState<any[]>([])
    const [criteria, setCriteria] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    useEffect(() => { fetchData() }, [filter, startDate, endDate])
    useEffect(() => { fetchCriteria() }, [])

    async function fetchCriteria() {
        const res = await fetch('/api/kpi/criteria')
        setCriteria((await res.json()).criteria || [])
    }

    async function fetchData() {
        setLoading(true)
        const params = buildDateParams()
        const res = await fetch(`/api/kpi/reports?type=personal&${params}`)
        const json = await res.json()
        setLogs(json.logs || [])
        setChartData(json.dailyScores || [])
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

    const avgScore = chartData.length ? Math.round(chartData.reduce((s, d) => s + d.score, 0) / chartData.length) : 0
    const grade = getPerformanceGrade(avgScore)

    // Group logs by date
    const byDate = logs.reduce((acc: any, l: any) => {
        const d = l.logDate?.split('T')[0] || l.logDate
        if (!acc[d]) acc[d] = []
        acc[d].push(l)
        return acc
    }, {})
    const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a)).slice(0, 15)

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div><h1>📈 My Progress</h1><p>Your personal KPI history and performance trend</p></div>
                <DateFilter active={filter} onChange={setFilter} startDate={startDate} endDate={endDate} onDateChange={(s, e) => { setStartDate(s); setEndDate(e) }} />
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: 'Avg Score', value: `${avgScore}%`, color: getScoreColor(avgScore) },
                    { label: 'Days Logged', value: chartData.length, color: '#8B5CF6' },
                    { label: 'Grade', value: `${grade === 'A' ? '🏆 A' : grade === 'B' ? '✅ B' : grade === 'C' ? '🟡 C' : '🔴 D'} — ${grade === 'A' ? 'Excellent' : grade === 'B' ? 'Good' : grade === 'C' ? 'Average' : 'Improve'}`, color: getScoreColor(avgScore) },
                ].map((item, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-number" style={{ color: item.color }}>{item.value}</div>
                        <div className="stat-label">{item.label}</div>
                    </div>
                ))}
            </div>

            {/* Trend Chart */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="section-header"><span className="section-title">📊 Daily Score Trend</span></div>
                {chartData.length === 0 ? (
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>No data for this period</div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                            <Tooltip formatter={(v) => [`${v}%`, 'Score']} contentStyle={{ borderRadius: '10px', border: '1px solid #FED7AA', fontSize: '13px' }} />
                            <Line type="monotone" dataKey="score" stroke="#F97316" strokeWidth={2.5} dot={{ fill: '#F97316', r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Log History */}
            <div className="card">
                <div className="section-header"><span className="section-title">📋 KPI Log History</span></div>
                {loading ? <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>
                    : dates.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No logs found for this period</div>
                        : dates.map(date => {
                            const dayLogs = byDate[date]
                            const entries = dayLogs.map((l: any) => ({ countDone: l.countDone, dailyLimit: l.kpiCriteria?.dailyLimit || l.countDone }))
                            const score = calculateDailyScore(entries)
                            const color = getScoreColor(score)
                            return (
                                <div key={date} style={{ marginBottom: '16px', borderBottom: '1px solid #F3F4F6', paddingBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                                            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </span>
                                        <span style={{ fontWeight: 800, color, fontSize: '16px' }}>{score}%</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {dayLogs.map((l: any, i: number) => (
                                            <div key={i} style={{ padding: '8px 14px', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #F3F4F6', fontSize: '13px' }}>
                                                <span style={{ fontWeight: 600 }}>{l.kpiCriteria?.taskName || l.customTaskName || 'Custom'}</span>
                                                <span style={{ color: '#9CA3AF', marginLeft: '6px' }}>{l.countDone}{l.kpiCriteria?.dailyLimit ? `/${l.kpiCriteria.dailyLimit}` : ''}</span>
                                                {l.notes && <span style={{ color: '#9CA3AF', marginLeft: '6px', fontSize: '12px' }}>· {l.notes}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
            </div>
        </div>
    )
}

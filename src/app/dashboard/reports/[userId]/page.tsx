'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { DateFilter, ProgressBar } from '@/components/ui/SharedComponents'
import { getScoreColor, getPerformanceGrade, getGradeLabel } from '@/lib/kpi-calculator'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MemberDetailResponse {
  user: { id: string; name: string; email: string; role: string }
  dailyScores: { date: string; score: number }[]
  logs: any[]
}

export default function MemberDetailReportPage() {
  const params = useParams<{ userId: string }>()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState('Monthly')
  const [data, setData] = useState<MemberDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const userId = params.userId

  useEffect(() => {
    const startFromQuery = searchParams?.get('startDate') || ''
    const endFromQuery = searchParams?.get('endDate') || ''
    if (startFromQuery && endFromQuery) {
      setFilter('Custom')
      setStartDate(startFromQuery)
      setEndDate(endFromQuery)
    }
  }, [searchParams])

  useEffect(() => {
    if (!userId) return
    fetchDetail()
  }, [userId, filter, startDate, endDate])

  function buildDateParams() {
    const now = new Date()
    if (filter === 'Today') return `startDate=${now.toISOString().split('T')[0]}&endDate=${now.toISOString().split('T')[0]}`
    if (filter === 'Yesterday') {
      const y = new Date(now)
      y.setDate(now.getDate() - 1)
      const d = y.toISOString().split('T')[0]
      return `startDate=${d}&endDate=${d}`
    }
    if (filter === 'Weekly') {
      const day = now.getDay()
      const s = new Date(now)
      s.setDate(now.getDate() - (day || 7) + 1)
      s.setHours(0, 0, 0, 0)
      const e = new Date(s)
      e.setDate(s.getDate() + 6)
      return `startDate=${s.toISOString().split('T')[0]}&endDate=${e.toISOString().split('T')[0]}`
    }
    if (filter === 'Monthly') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return `startDate=${s.toISOString().split('T')[0]}&endDate=${e.toISOString().split('T')[0]}`
    }
    if (filter === 'Custom' && startDate && endDate) return `startDate=${startDate}&endDate=${endDate}`
    return ''
  }

  async function fetchDetail() {
    setLoading(true)
    setError('')
    try {
      const params = buildDateParams()
      const res = await fetch(`/api/kpi/reports?type=member&userId=${userId}&${params}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to load member report')
      }
      const json = (await res.json()) as MemberDetailResponse
      setData(json)
    } catch (err: any) {
      setError(err.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  const scores = data?.dailyScores || []
  const latestScore = scores.length ? scores[scores.length - 1].score : 0
  const avgScore = scores.length
    ? Math.round(scores.reduce((s, d) => s + d.score, 0) / scores.length)
    : 0
  const bestScore = scores.length ? Math.max(...scores.map(d => d.score)) : 0
  const worstScore = scores.length ? Math.min(...scores.map(d => d.score)) : 0
  const grade = getPerformanceGrade(avgScore)
  const gradeLabel = getGradeLabel(grade)

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1>Member Performance Detail</h1>
          <p>Deep-dive KPI analytics for this team member</p>
          {data?.user && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '13px' }}>
                {data.user.name
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#E5E7EB' }}>{data.user.name}</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{data.user.email}</div>
              </div>
            </div>
          )}
        </div>
        <DateFilter
          active={filter}
          onChange={setFilter}
          startDate={startDate}
          endDate={endDate}
          onDateChange={(s, e) => {
            setStartDate(s)
            setEndDate(e)
          }}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card card-hover">
          <div className="stat-label">Latest KPI Score</div>
          <div className="stat-number" style={{ color: getScoreColor(latestScore) }}>
            {latestScore}%
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Most recent day in selected range</div>
        </div>
        <div className="stat-card card-hover">
          <div className="stat-label">Average Score</div>
          <div className="stat-number" style={{ color: getScoreColor(avgScore) }}>
            {avgScore}%
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Across all days in range</div>
        </div>
        <div className="stat-card card-hover">
          <div className="stat-label">Best Day</div>
          <div className="stat-number" style={{ color: getScoreColor(bestScore) }}>
            {bestScore}%
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Peak performance day</div>
        </div>
        <div className="stat-card card-hover">
          <div className="stat-label">Overall Grade</div>
          <div className="stat-number" style={{ color: getScoreColor(avgScore) }}>
            {gradeLabel}
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Based on average score</div>
        </div>
      </div>

      <div className="content-grid" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="section-header">
            <span className="section-title">📈 KPI Trend Over Time</span>
          </div>
          {loading ? (
            <div
              style={{
                height: '240px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9CA3AF',
              }}
            >
              Loading chart...
            </div>
          ) : scores.length === 0 ? (
            <div
              style={{
                height: '240px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9CA3AF',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <p>No KPI logs found for the selected range.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={scores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => v.slice(5)}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip
                  formatter={v => [`${v}%`, 'Score']}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid rgba(59,130,246,0.4)',
                    fontSize: '13px',
                    background: '#020617',
                    color: '#E5E7EB',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#1D8BFF"
                  strokeWidth={2.4}
                  dot={{ fill: '#1D8BFF', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <span className="section-title">📋 Recent KPI Activity</span>
          </div>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>Loading logs...</div>
          ) : !data?.logs?.length ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>No logs in this period.</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Task</th>
                    <th>Count</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.slice(0, 40).map(log => (
                    <tr key={log.id}>
                      <td>{new Date(log.logDate).toISOString().split('T')[0]}</td>
                      <td>{log.isCustomTask ? log.customTaskName || 'Custom Task' : log.kpiCriteria?.taskName}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: getScoreColor(100) }}>{log.countDone}</span>
                      </td>
                      <td style={{ color: '#9CA3AF', fontSize: '13px' }}>{log.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


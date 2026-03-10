'use client'

import { useEffect, useState } from 'react'

interface KpiEntry {
    kpiCriteriaId: string
    taskName: string
    dailyLimit: number
    isLocked: boolean
    countDone: number
    notes: string
}

interface CustomTask {
    customTaskName: string
    countDone: number
    notes: string
}

export default function LogKpiPage() {
    const [criteria, setCriteria] = useState<any[]>([])
    const [entries, setEntries] = useState<KpiEntry[]>([])
    const [customTasks, setCustomTasks] = useState<CustomTask[]>([])
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')
    const today = new Date().toISOString().split('T')[0]

    useEffect(() => {
        loadCriteria()
        loadExisting()
    }, [])

    async function loadCriteria() {
        const res = await fetch('/api/kpi/criteria')
        const json = await res.json()
        const c = json.criteria || []
        setCriteria(c)
        setEntries(c.map((cr: any) => ({
            kpiCriteriaId: cr.id,
            taskName: cr.taskName,
            dailyLimit: cr.dailyLimit,
            isLocked: cr.isLocked,
            countDone: 0,
            notes: '',
        })))
    }

    async function loadExisting() {
        const res = await fetch(`/api/kpi/log?startDate=${today}&endDate=${today}`)
        const json = await res.json()
        if (json.logs?.length) {
            setEntries(prev => prev.map(e => {
                const existing = json.logs.find((l: any) => l.kpiCriteriaId === e.kpiCriteriaId)
                return existing ? { ...e, countDone: existing.countDone, notes: existing.notes || '' } : e
            }))
            const customLogs = json.logs.filter((l: any) => l.isCustomTask)
            setCustomTasks(customLogs.map((l: any) => ({
                customTaskName: l.customTaskName || '',
                countDone: l.countDone,
                notes: l.notes || '',
            })))
        }
    }

    function updateEntry(idx: number, field: 'countDone' | 'notes', value: any) {
        setEntries(prev => {
            const next = [...prev]
            const entry = { ...next[idx] }
            if (field === 'countDone') {
                let val = Number(value)
                if (entry.isLocked) val = Math.min(val, entry.dailyLimit)
                entry.countDone = val
            } else {
                entry.notes = value
            }
            next[idx] = entry
            return next
        })
    }

    function addCustomTask() {
        setCustomTasks(prev => [...prev, { customTaskName: '', countDone: 0, notes: '' }])
    }

    function updateCustomTask(idx: number, field: keyof CustomTask, value: any) {
        setCustomTasks(prev => {
            const next = [...prev]
            next[idx] = { ...next[idx], [field]: value }
            return next
        })
    }

    function removeCustomTask(idx: number) {
        setCustomTasks(prev => prev.filter((_, i) => i !== idx))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSaved(false)

        const allEntries = [
            ...entries.map(e => ({
                kpiCriteriaId: e.kpiCriteriaId,
                countDone: e.countDone,
                notes: e.notes,
                isCustomTask: false,
            })),
            ...customTasks.filter(t => t.customTaskName).map(t => ({
                countDone: t.countDone,
                notes: t.notes,
                isCustomTask: true,
                customTaskName: t.customTaskName,
            })),
        ]

        const res = await fetch('/api/kpi/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: allEntries, logDate: today }),
        })

        setLoading(false)
        if (res.ok) {
            setSaved(true)
            setTimeout(() => setSaved(false), 4000)
        } else {
            const json = await res.json()
            setError(json.error || 'Failed to save. Please try again.')
        }
    }

    const totalScore = (() => {
        if (!entries.length) return 0
        const done = entries.reduce((s, e) => s + e.countDone, 0)
        const target = entries.reduce((s, e) => s + e.dailyLimit, 0)
        return target ? Math.min(100, Math.round(done / target * 100)) : 0
    })()

    return (
        <div style={{ maxWidth: '760px' }}>
            <div className="page-header">
                <h1>📝 Log Today's KPIs</h1>
                <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Score Preview */}
            <div style={{ background: 'linear-gradient(135deg, #FFF7ED, #FED7AA)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #FED7AA' }}>
                <div>
                    <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 500 }}>Today's Score Preview</div>
                    <div style={{ fontSize: '36px', fontWeight: 800, color: '#F97316', lineHeight: 1.2 }}>{totalScore}%</div>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                        {totalScore >= 90 ? '🏆 Excellent — Keep it up!' : totalScore >= 75 ? '✅ Good progress!' : totalScore >= 60 ? '🟡 Getting there...' : '🔴 More effort needed'}
                    </div>
                </div>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: `6px solid ${totalScore >= 75 ? '#10B981' : totalScore >= 60 ? '#F59E0B' : '#EF4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: 'var(--text-dark)' }}>
                    {totalScore}%
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {saved && <div className="alert alert-success">✅ KPIs saved successfully for today!</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ marginBottom: '16px' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Standard KPI Tasks</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {entries.length === 0 ? (
                            <p style={{ color: '#9CA3AF', textAlign: 'center' }}>No KPI criteria set for your department. Ask your manager to set up KPIs.</p>
                        ) : entries.map((entry, idx) => (
                            <div key={entry.kpiCriteriaId} style={{ padding: '16px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <div>
                                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{entry.taskName}</span>
                                        {entry.isLocked && <span className="badge badge-danger" style={{ marginLeft: '8px', fontSize: '11px' }}>🔒 Locked at {entry.dailyLimit}</span>}
                                        {!entry.isLocked && <span className="badge badge-blue" style={{ marginLeft: '8px', fontSize: '11px' }}>Target: {entry.dailyLimit}/day</span>}
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '18px', color: '#F97316' }}>
                                        {Math.min(100, Math.round(entry.countDone / entry.dailyLimit * 100))}%
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Count Done</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            min={0}
                                            max={entry.isLocked ? entry.dailyLimit : undefined}
                                            value={entry.countDone}
                                            onChange={e => updateEntry(idx, 'countDone', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Notes (optional)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. Article IDs, client name..."
                                            value={entry.notes}
                                            onChange={e => updateEntry(idx, 'notes', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Custom Tasks */}
                {customTasks.length > 0 && (
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Additional Tasks</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {customTasks.map((task, idx) => (
                                <div key={idx} style={{ padding: '14px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr auto', gap: '10px', alignItems: 'end' }}>
                                        <div className="form-group">
                                            <label className="form-label">Task Name</label>
                                            <input type="text" className="form-input" placeholder="Task name..." value={task.customTaskName} onChange={e => updateCustomTask(idx, 'customTaskName', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Count</label>
                                            <input type="number" min={0} className="form-input" value={task.countDone} onChange={e => updateCustomTask(idx, 'countDone', Number(e.target.value))} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Notes</label>
                                            <input type="text" className="form-input" placeholder="Optional..." value={task.notes} onChange={e => updateCustomTask(idx, 'notes', e.target.value)} />
                                        </div>
                                        <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeCustomTask(idx)} style={{ marginBottom: '0' }}>
                                            <svg width="16" height="16" fill="none" stroke="#EF4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                    <button type="button" className="btn btn-ghost" onClick={addCustomTask}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Other Task
                    </button>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                        {loading ? 'Saving...' : '✅ Submit Today\'s KPIs'}
                    </button>
                </div>
            </form>
        </div>
    )
}

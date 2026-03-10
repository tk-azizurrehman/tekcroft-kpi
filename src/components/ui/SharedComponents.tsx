'use client'

import { getScoreColor, getPerformanceGrade, getGradeLabel } from '@/lib/kpi-calculator'
import { motion } from 'framer-motion'

interface StatCardProps {
    label: string
    value: string | number
    icon: React.ReactNode
    color?: string
    trend?: string
}

export function StatCard({ label, value, icon, color, trend }: StatCardProps) {
    return (
        <motion.div
            className="stat-card card-hover"
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
            <div className="stat-icon" style={color ? { background: `${color}18`, color } : {}}>
                {icon}
            </div>
            <div className="stat-number" style={color ? { color } : {}}>{value}</div>
            <div className="stat-label">{label}</div>
            {trend && <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, marginTop: '2px' }}>{trend}</div>}
        </motion.div>
    )
}

interface ProgressBarProps {
    score: number
    height?: number
    showLabel?: boolean
}

export function ProgressBar({ score, height = 8, showLabel = false }: ProgressBarProps) {
    const color = getScoreColor(score)
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="progress-bar-wrapper" style={{ flex: 1, height }}>
                <motion.div
                    className="progress-bar-fill"
                    style={{ width: `${score}%`, background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
            </div>
            {showLabel && (
                <span style={{ fontSize: '13px', fontWeight: 700, color, minWidth: '40px', textAlign: 'right' }}>
                    {score}%
                </span>
            )}
        </div>
    )
}

interface ScoreBadgeProps {
    score: number
    size?: 'sm' | 'md' | 'lg'
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
    const color = getScoreColor(score)
    const grade = getPerformanceGrade(score)
    const sizes = { sm: '40px', md: '52px', lg: '64px' }
    const fontSizes = { sm: '11px', md: '13px', lg: '16px' }
    return (
        <div
            className="score-circle"
            style={{ width: sizes[size], height: sizes[size], color, borderColor: color, fontSize: fontSizes[size] }}
        >
            {score}%
        </div>
    )
}

interface DateFilterProps {
    active: string
    onChange: (filter: string) => void
    showCustom?: boolean
    startDate?: string
    endDate?: string
    onDateChange?: (start: string, end: string) => void
}

export function DateFilter({ active, onChange, showCustom = true, startDate, endDate, onDateChange }: DateFilterProps) {
    const filters = ['Today', 'Yesterday', 'Weekly', 'Monthly']
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className="date-filter">
                {filters.map(f => (
                    <button
                        key={f}
                        className={`date-filter-btn ${active === f ? 'active' : ''}`}
                        onClick={() => onChange(f)}
                    >
                        {f}
                    </button>
                ))}
            </div>
            {showCustom && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="date"
                        className="form-input"
                        style={{ padding: '7px 12px', fontSize: '13px', width: '150px' }}
                        value={startDate || ''}
                        onChange={e => onDateChange?.(e.target.value, endDate || '')}
                    />
                    <span style={{ color: '#9CA3AF', fontSize: '13px' }}>to</span>
                    <input
                        type="date"
                        className="form-input"
                        style={{ padding: '7px 12px', fontSize: '13px', width: '150px' }}
                        value={endDate || ''}
                        onChange={e => onDateChange?.(startDate || '', e.target.value)}
                    />
                    <button
                        className={`date-filter-btn ${active === 'Custom' ? 'active' : ''}`}
                        onClick={() => onChange('Custom')}
                        style={{ background: active === 'Custom' ? 'white' : 'var(--bg-subtle)', border: '1px solid var(--border)', color: active === 'Custom' ? 'var(--primary)' : 'var(--text-gray)' }}
                    >
                        Apply 📅
                    </button>
                </div>
            )}
        </div>
    )
}

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
    if (!isOpen) return null
    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    )
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '52px', width: '100%' }} />
            ))}
        </div>
    )
}

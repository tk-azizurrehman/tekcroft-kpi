export type PerformanceGrade = 'A' | 'B' | 'C' | 'D'

export interface KpiEntry {
    countDone: number
    dailyLimit: number
}

export function calculateDailyScore(entries: KpiEntry[]): number {
    if (!entries.length) return 0
    const totalDone = entries.reduce((sum, e) => sum + e.countDone, 0)
    const totalTarget = entries.reduce((sum, e) => sum + e.dailyLimit, 0)
    if (totalTarget === 0) return 0
    return Math.min(100, Math.round((totalDone / totalTarget) * 100))
}

export function calculateAverageScore(dailyScores: number[]): number {
    const valid = dailyScores.filter((s) => s !== null && s !== undefined)
    if (!valid.length) return 0
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

export function getPerformanceGrade(score: number): PerformanceGrade {
    if (score >= 90) return 'A'
    if (score >= 75) return 'B'
    if (score >= 60) return 'C'
    return 'D'
}

export function getGradeLabel(grade: PerformanceGrade): string {
    const labels: Record<PerformanceGrade, string> = {
        A: '🏆 Excellent',
        B: '✅ Good',
        C: '🟡 Average',
        D: '🔴 Needs Improvement',
    }
    return labels[grade]
}

export function getGradeColor(grade: PerformanceGrade): string {
    const colors: Record<PerformanceGrade, string> = {
        A: '#10B981',
        B: '#3B82F6',
        C: '#F59E0B',
        D: '#EF4444',
    }
    return colors[grade]
}

export function getScoreColor(score: number): string {
    if (score >= 90) return '#10B981'
    if (score >= 75) return '#3B82F6'
    if (score >= 60) return '#F59E0B'
    return '#EF4444'
}

export function getWeekDateRange(date: Date): { start: Date; end: Date } {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const start = new Date(d.setDate(diff))
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start, end }
}

export function getMonthDateRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
    return { start, end }
}

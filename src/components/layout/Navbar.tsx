'use client'

import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface NavbarProps {
    title: string
    userName: string
    role: string
}

const roleColors: Record<string, string> = {
    admin: 'role-admin',
    manager: 'role-manager',
    team_lead: 'role-team_lead',
    team_member: 'role-team_member',
}

const roleLabels: Record<string, string> = {
    admin: 'Admin',
    manager: 'Manager',
    team_lead: 'Team Lead',
    team_member: 'Member',
}

export default function Navbar({ title, userName, role }: NavbarProps) {
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const isDark = theme === 'dark' || theme === undefined

    const headerStyle: React.CSSProperties = mounted && !isDark
        ? { background: '#FFFFFF', borderBottom: '1px solid rgba(148,163,184,0.35)' }
        : {}

    return (
        <header className="navbar" style={headerStyle}>
            <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)' }}>{title}</h2>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '1px' }}>{dateStr}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {mounted && (
                    <button
                        type="button"
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        style={{
                            borderRadius: 999,
                            border: '1px solid rgba(148,163,184,0.7)',
                            background: isDark ? 'rgba(15,23,42,0.95)' : '#FFFFFF',
                            padding: '5px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            boxShadow: isDark
                                ? '0 0 0 1px rgba(15,23,42,0.8), 0 0 16px rgba(0,123,255,0.45)'
                                : '0 0 0 1px rgba(15,23,42,0.04), 0 0 14px rgba(0,123,255,0.25)',
                        }}
                    >
                        <motion.div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 20,
                                height: 20,
                                borderRadius: 999,
                                background: isDark ? '#020617' : '#EFF6FF',
                            }}
                            layout
                            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                        >
                            {isDark ? (
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#F9FAFB"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            ) : (
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#0F172A"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="4" />
                                    <path d="M12 2v2m0 16v2M4 12H2m20 0h-2M5.64 5.64 4.22 4.22m15.56 15.56-1.42-1.42M18.36 5.64l1.42-1.42M5.64 18.36l-1.42 1.42" />
                                </svg>
                            )}
                        </motion.div>
                        <span
                            style={{
                                fontSize: 11,
                                color: isDark ? '#E5E7EB' : '#0F172A',
                                textTransform: 'uppercase',
                                letterSpacing: 0.6,
                                fontWeight: 600,
                            }}
                        >
                            {isDark ? 'Dark Mode' : 'Light Mode'}
                        </span>
                    </button>
                )}

                <span className={`role-badge ${roleColors[role]}`}>{roleLabels[role]}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="avatar">{initials}</div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{userName}</span>
                </div>
            </div>
        </header>
    )
}

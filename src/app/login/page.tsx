'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || '@tekcroft.com'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [info, setInfo] = useState('')
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<'login' | 'forgot'>('login')
    const [logoError, setLogoError] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setInfo('')

        if (!email.endsWith(ALLOWED_DOMAIN)) {
            setError(`Only ${ALLOWED_DOMAIN} email addresses are allowed.`)
            return
        }

        if (mode === 'login') {
            setLoading(true)
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })
            setLoading(false)

            if (result?.error) {
                setError('Invalid email or password. Please try again.')
            } else {
                router.push('/')
                router.refresh()
            }
        } else {
            // Placeholder backend trigger for reset flow
            setInfo('If an account exists for this email, a reset link will be sent shortly.')
        }
    }

    const kenBurnsVariants = {
        initial: { scale: 1.05, x: 0, y: 0 },
        animate: {
            scale: [1.05, 1.12, 1.05],
            x: [0, -18, 0],
            y: [0, -10, 0],
            transition: {
                duration: 30,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'linear',
            },
        },
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: 'radial-gradient(circle at top, #020617 0%, #000000 60%)',
            }}
        >
            <motion.div
                style={{
                    width: '100%',
                    maxWidth: '1320px',
                    minHeight: '580px',
                    borderRadius: '36px',
                    overflow: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
                    background: 'linear-gradient(135deg, #020617 0%, #020617 40%, #030712 100%)',
                    boxShadow: '0 40px 120px rgba(0,0,0,0.85)',
                    border: '1px solid rgba(15,23,42,0.9)',
                }}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                {/* Left: Animated company portal */}
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <motion.div
                        variants={kenBurnsVariants}
                        initial="initial"
                        animate="animate"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage:
                                'radial-gradient(circle at 20% -20%, rgba(56,189,248,0.25), transparent 55%), radial-gradient(circle at 80% 120%, rgba(59,130,246,0.35), transparent 60%), radial-gradient(circle at 50% 50%, #020617 0%, #000000 65%)',
                            transformOrigin: 'center',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                                'radial-gradient(circle at 50% 120%, rgba(15,23,42,0.9), transparent 70%), radial-gradient(circle at 10% 0%, rgba(15,23,42,0.8), transparent 55%)',
                        }}
                    />
                    <div
                        style={{
                            position: 'relative',
                            height: '100%',
                            padding: '40px 40px 36px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            color: '#E5E7EB',
                        }}
                    >
                        <div>
                            <motion.div
                                style={{
                                    width: 200,
                                    height: 200,
                                    borderRadius: 36,
                                    background: 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 0 1px rgba(15,23,42,0.9), 0 0 80px rgba(0,123,255,0.9)',
                                    marginBottom: 24,
                                }}
                                animate={{
                                    boxShadow: [
                                        '0 0 0 1px rgba(15,23,42,0.9), 0 0 70px rgba(0,123,255,0.75)',
                                        '0 0 0 1px rgba(15,23,42,0.9), 0 0 110px rgba(0,123,255,1)',
                                        '0 0 0 1px rgba(15,23,42,0.9), 0 0 70px rgba(0,123,255,0.75)',
                                    ],
                                }}
                                transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror' }}
                            >
                                {!logoError ? (
                                    <img
                                        src="/tekcroft-logo.png"
                                        alt="TekCroft logo"
                                        width={180}
                                        height={180}
                                        style={{ objectFit: 'contain' }}
                                        onError={() => setLogoError(true)}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            fontSize: 28,
                                            fontWeight: 700,
                                            color: '#E5E7EB',
                                            letterSpacing: 1,
                                        }}
                                    >
                                        <span>Tek</span>
                                        <span style={{ color: '#007BFF' }}>Croft</span>
                                    </div>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                            >
                                <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 0.3 }}>
                                    <span>Tek</span>
                                    <span style={{ color: '#007BFF' }}>Croft</span>
                                </div>
                                <div style={{ marginTop: 4, fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', color: '#9CA3AF' }}>
                                    KPI CRM
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, delay: 0.25 }}
                            style={{ maxWidth: 360 }}
                        >
                            <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 6 }}>Empowering Teams through</p>
                            <motion.p
                                animate={{
                                    y: [0, -4, 0],
                                }}
                                transition={{ duration: 5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                                style={{
                                    fontSize: 18,
                                    fontWeight: 600,
                                    color: '#E5E7EB',
                                }}
                            >
                                Dynamic <span style={{ color: '#38BDF8' }}>KPI Management</span>
                            </motion.p>
                            <p style={{ fontSize: 12, color: '#64748B', marginTop: 10 }}>
                                Real-time insights, performance visibility, and execution clarity for modern teams.
                            </p>
                        </motion.div>

                        <div style={{ display: 'flex', gap: 18, fontSize: 11, color: '#6B7280' }}>
                            <div>
                                <div style={{ color: '#9CA3AF', marginBottom: 2 }}>Latency</div>
                                <div style={{ color: '#22C55E', fontWeight: 600 }}>Ultra-low</div>
                            </div>
                            <div>
                                <div style={{ color: '#9CA3AF', marginBottom: 2 }}>Security</div>
                                <div style={{ color: '#60A5FA', fontWeight: 600 }}>SSO & Audit-ready</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Login hub */}
                <div
                    style={{
                        position: 'relative',
                        padding: '40px 40px 36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background:
                            'radial-gradient(circle at top, rgba(15,23,42,0.9), rgba(15,23,42,1)), radial-gradient(circle at bottom, rgba(15,23,42,0.8), rgba(15,23,42,1))',
                    }}
                >
                    <motion.div
                        whileHover={{ y: -4 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        style={{
                            width: '100%',
                            maxWidth: 420,
                            borderRadius: 28,
                            padding: '30px 28px 26px',
                            background: 'linear-gradient(145deg, rgba(15,23,42,0.92), rgba(15,23,42,0.98))',
                            border: '1px solid rgba(51,65,85,0.9)',
                            boxShadow: '0 26px 80px rgba(0,0,0,0.9)',
                            backdropFilter: 'blur(26px)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: '#F9FAFB' }}>
                            {mode === 'login' ? 'Welcome back' : 'Reset your password'}
                        </h2>
                        <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 24 }}>
                            {mode === 'login'
                                ? 'Sign in to your TekCroft account'
                                : 'Enter your email and we will send you a reset link.'}
                        </p>

                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: 12 }}>
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                {error}
                            </div>
                        )}
                        {info && (
                            <div className="alert alert-success" style={{ marginBottom: 12 }}>
                                {info}
                            </div>
                        )}

                        {mode === 'login' ? (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ color: '#CBD5F5' }}>
                                        Email address
                                    </label>
                                    <motion.div
                                        whileHover={{ y: -1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                                        style={{ position: 'relative' }}
                                    >
                                        <input
                                            id="email"
                                            type="email"
                                            className="form-input"
                                            placeholder={`you${ALLOWED_DOMAIN}`}
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                            style={{
                                                paddingLeft: 42,
                                                paddingTop: 14,
                                                paddingBottom: 14,
                                                background: 'rgba(15,23,42,0.9)',
                                                borderColor: '#1F2937',
                                                color: '#E5E7EB',
                                            }}
                                        />
                                        <svg
                                            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }}
                                            width="16"
                                            height="16"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </motion.div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ color: '#CBD5F5' }}>
                                        Password
                                    </label>
                                    <motion.div
                                        whileHover={{ y: -1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                                        style={{ position: 'relative' }}
                                    >
                                        <input
                                            id="password"
                                            type="password"
                                            className="form-input"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            style={{
                                                paddingLeft: 42,
                                                paddingTop: 14,
                                                paddingBottom: 14,
                                                background: 'rgba(15,23,42,0.9)',
                                                borderColor: '#1F2937',
                                                color: '#E5E7EB',
                                            }}
                                        />
                                        <svg
                                            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }}
                                            width="16"
                                            height="16"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </motion.div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('forgot')
                                        setError('')
                                        setInfo('')
                                    }}
                                    style={{
                                        alignSelf: 'flex-start',
                                        marginTop: 2,
                                        marginBottom: -4,
                                        fontSize: 12,
                                        color: '#38BDF8',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Forgot password?
                                </button>

                                <motion.button
                                    id="login-btn"
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    disabled={loading}
                                    whileHover={{ scale: 1.02, boxShadow: '0 18px 55px rgba(0,123,255,0.75)' }}
                                    whileTap={{ scale: 0.99 }}
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
                                        marginTop: 6,
                                        background: '#007BFF',
                                        borderRadius: 999,
                                        boxShadow: '0 14px 45px rgba(0,123,255,0.6)',
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <svg style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" fill="none" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                                                <path
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                    style={{ opacity: 0.75 }}
                                                />
                                            </svg>
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </motion.button>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ color: '#CBD5F5' }}>
                                        Email address
                                    </label>
                                    <motion.div
                                        whileHover={{ y: -1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                                        style={{ position: 'relative' }}
                                    >
                                        <input
                                            id="reset-email"
                                            type="email"
                                            className="form-input"
                                            placeholder={`you${ALLOWED_DOMAIN}`}
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                            style={{
                                                paddingLeft: 42,
                                                paddingTop: 14,
                                                paddingBottom: 14,
                                                background: 'rgba(15,23,42,0.9)',
                                                borderColor: '#1F2937',
                                                color: '#E5E7EB',
                                            }}
                                        />
                                        <svg
                                            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }}
                                            width="16"
                                            height="16"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </motion.div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('login')
                                            setInfo('')
                                        }}
                                        style={{
                                            fontSize: 12,
                                            color: '#9CA3AF',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Back to Sign In
                                    </button>
                                    <motion.button
                                        type="submit"
                                        className="btn btn-primary btn-sm"
                                        whileHover={{ scale: 1.03, boxShadow: '0 14px 40px rgba(0,123,255,0.75)' }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            background: '#007BFF',
                                            borderRadius: 999,
                                            paddingInline: 18,
                                        }}
                                    >
                                        Send Reset Link
                                    </motion.button>
                                </div>
                            </form>
                        )}

                        <div
                            style={{
                                marginTop: 24,
                                fontSize: 12,
                                color: '#9CA3AF',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>
                                    Only <strong style={{ color: '#38BDF8' }}>{ALLOWED_DOMAIN}</strong> email addresses are permitted.
                                </span>
                            </div>
                            <div style={{ marginTop: 4 }}>
                                Don&apos;t have an account? Contact your manager or admin at{' '}
                                <span style={{ color: '#38BDF8', fontWeight: 600 }}>{`aziz.ur.rahman${ALLOWED_DOMAIN}`}</span>.
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

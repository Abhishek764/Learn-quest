import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import API from '../api'
import AuroraHero from '../components/AuroraHero'
import FloatingCards from '../components/FloatingCards'

const ease = [0.22, 1, 0.36, 1]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await API.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-pane-form">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
        >
          <Link to="/" className="brand-mark" aria-label="LearnQuest home">
            <span className="brand-mark-tile"><Zap size={20} /></span>
            <span className="brand-mark-text">LearnQuest</span>
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
          >
            Welcome back.
          </motion.h1>
          <motion.p
            className="subtitle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.18, ease }}
          >
            Sign in to continue your learning journey.
          </motion.p>

          {error && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              transition={{ duration: 0.3, ease }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 0.875rem', background: 'var(--danger-dim)',
                border: '1px solid rgba(239,68,68,0.22)', borderRadius: 12,
                color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} aria-hidden /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <motion.div
              className="form-group"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease }}
            >
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email" className="input" type="email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
              />
            </motion.div>

            <motion.div
              className="form-group"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.32, ease }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label htmlFor="password" className="form-label">Password</label>
                <a href="#" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Forgot?</a>
              </div>
              <div className="input-wrap">
                <input
                  id="password" className="input" type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                />
                <button
                  type="button" className="input-icon-btn"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <motion.button
              type="submit" className="btn-cta" disabled={loading}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease }}
              whileTap={{ scale: 0.98 }}
              style={{ marginTop: '0.25rem' }}
            >
              {loading
                ? <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                : <>Sign In <ArrowRight size={18} className="arrow" /></>}
            </motion.button>
          </form>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55, ease }}
            style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}
          >
            New here? <Link to="/register" style={{ fontWeight: 600 }}>Create an account</Link>
          </motion.p>

          <div className="trust-strip">
            <div className="trust-stat">
              <div className="num">12k+</div>
              <div className="lbl">Active learners</div>
            </div>
            <div className="trust-stat">
              <div className="num">46</div>
              <div className="lbl">Concepts</div>
            </div>
            <div className="trust-stat">
              <div className="num">AI</div>
              <div className="lbl">Adaptive</div>
            </div>
          </div>
        </motion.div>
      </div>

      <AuroraHero>
        <FloatingCards />
      </AuroraHero>
    </div>
  )
}

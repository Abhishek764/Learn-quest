import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff, ArrowRight, AlertCircle, GraduationCap, BookOpen } from 'lucide-react'
import API from '../api'
import AuroraHero from '../components/AuroraHero'
import OnboardingTeaser from '../components/OnboardingTeaser'

const ease = [0.22, 1, 0.36, 1]

const ROLES = [
  { value: 'student', icon: <GraduationCap size={18} />, label: 'Student', desc: 'Learn & play' },
  { value: 'educator', icon: <BookOpen size={18} />, label: 'Educator', desc: 'Teach & track' },
]

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', display_name: '', role: 'student' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await API.post('/auth/register', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-pane-form">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
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
            Start your quest.
          </motion.h1>
          <motion.p
            className="subtitle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.18, ease }}
          >
            Create an account in under 30 seconds.
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
              transition={{ duration: 0.5, delay: 0.22, ease }}
            >
              <label className="form-label">I am a</label>
              <div className="role-grid" role="radiogroup" aria-label="Account type">
                {ROLES.map(r => {
                  const active = form.role === r.value
                  return (
                    <button
                      key={r.value} type="button" role="radio" aria-checked={active}
                      onClick={() => update('role', r.value)}
                      className={`role-card ${active ? 'active' : ''}`}
                    >
                      <div className="role-card-icon">{r.icon}</div>
                      <div className="role-card-title">{r.label}</div>
                      <div className="role-card-desc">{r.desc}</div>
                    </button>
                  )
                })}
              </div>
            </motion.div>

            <motion.div
              className="form-group"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease }}
            >
              <label htmlFor="display_name" className="form-label">Display name</label>
              <input
                id="display_name" className="input" autoComplete="nickname"
                value={form.display_name} onChange={e => update('display_name', e.target.value)}
                placeholder="Alex" required
              />
            </motion.div>

            <motion.div
              className="form-group"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36, ease }}
            >
              <label htmlFor="reg_email" className="form-label">Email</label>
              <input
                id="reg_email" className="input" type="email" autoComplete="email"
                value={form.email} onChange={e => update('email', e.target.value)}
                placeholder="you@example.com" required
              />
            </motion.div>

            <motion.div
              className="form-group"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42, ease }}
            >
              <label htmlFor="reg_pw" className="form-label">Password</label>
              <div className="input-wrap">
                <input
                  id="reg_pw" className="input" type={showPw ? 'text' : 'password'}
                  autoComplete="new-password" minLength={6}
                  value={form.password} onChange={e => update('password', e.target.value)}
                  placeholder="At least 6 characters" required
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
              transition={{ duration: 0.5, delay: 0.5, ease }}
              whileTap={{ scale: 0.98 }}
              style={{ marginTop: '0.5rem' }}
            >
              {loading
                ? <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                : <>Create account <ArrowRight size={18} className="arrow" /></>}
            </motion.button>
          </form>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6, ease }}
            style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}
          >
            Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
          </motion.p>
        </motion.div>
      </div>

      <AuroraHero>
        <OnboardingTeaser />
      </AuroraHero>
    </div>
  )
}

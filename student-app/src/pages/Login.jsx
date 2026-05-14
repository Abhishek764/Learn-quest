import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff } from 'lucide-react'
import API from '../api'

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
    } catch (err) { setError(err.response?.data?.error || 'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="bg-orb" style={{ width: 500, height: 500, background: '#6366f1', filter: 'blur(150px)', opacity: 0.08, top: -100, left: -100 }} />
      <div className="bg-orb" style={{ width: 400, height: 400, background: '#8b5cf6', filter: 'blur(120px)', opacity: 0.06, bottom: -100, right: -50 }} />

      <div className="auth-left">
        <motion.div className="auth-form" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2.5rem' }}>
            <div style={{ width: 42, height: 42, background: 'var(--accent-gradient)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: 'white', boxShadow: '0 0 30px var(--accent-glow)' }}>⚡</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-heading)' }}>LearnQuest</span>
          </div>

          <h1 style={{ fontSize: '1.75rem' }}>Welcome back</h1>
          <p className="subtitle">Sign in to continue your learning journey</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '0.75rem', background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <motion.button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ marginTop: '0.5rem' }}>
              {loading ? <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><Zap size={18} /> Sign In</>}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/register" style={{ fontWeight: 600 }}>Create one</Link>
          </p>
        </motion.div>
      </div>

      <div className="auth-right">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2, ease }}
          style={{ textAlign: 'center', padding: '3rem', maxWidth: 400 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎮</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Learn by Playing</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.9rem' }}>
            AI adapts every question to your level. Level up, master concepts, and compete with friends.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginTop: '2.5rem' }}>
            {[{ v: '46', l: 'Concepts', c: 'var(--accent-bright)' }, { v: '120+', l: 'Questions', c: 'var(--xp)' }, { v: 'AI', l: 'Powered', c: '#8b5cf6' }].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

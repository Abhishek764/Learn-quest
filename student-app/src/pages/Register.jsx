import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import API from '../api'

const ease = [0.22, 1, 0.36, 1]

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
    } catch (err) { setError(err.response?.data?.error || 'Registration failed') }
    finally { setLoading(false) }
  }

  const roles = [
    { value: 'student', emoji: '🎮', label: 'Student', desc: 'Learn & play games' },
    { value: 'educator', emoji: '📚', label: 'Educator', desc: 'Create & manage content' },
  ]

  return (
    <div className="auth-page">
      <div className="bg-orb" style={{ width: 500, height: 500, background: '#8b5cf6', filter: 'blur(150px)', opacity: 0.07, top: -100, right: -100 }} />
      <div className="bg-orb" style={{ width: 400, height: 400, background: '#6366f1', filter: 'blur(120px)', opacity: 0.05, bottom: -100, left: -50 }} />

      <div className="auth-left">
        <motion.div className="auth-form" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2.5rem' }}>
            <div style={{ width: 42, height: 42, background: 'var(--accent-gradient)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: 'white', boxShadow: '0 0 30px var(--accent-glow)' }}>⚡</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-heading)' }}>LearnQuest</span>
          </div>

          <h1 style={{ fontSize: '1.75rem' }}>Create account</h1>
          <p className="subtitle">Join the AI-powered learning platform</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '0.75rem', background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="input" value={form.display_name} onChange={e => update('display_name', e.target.value)} placeholder="Alex" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min 6 characters" required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                {roles.map(r => (
                  <motion.div key={r.value} onClick={() => update('role', r.value)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{ padding: '1rem', borderRadius: 14, border: `1px solid ${form.role === r.value ? 'var(--accent)' : 'var(--border)'}`, background: form.role === r.value ? 'var(--accent-dim)' : 'var(--bg-card)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{r.emoji}</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.85rem' }}>{r.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ marginTop: '0.5rem' }}>
              {loading ? <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><UserPlus size={18} /> Create Account</>}
            </motion.button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
          </p>
        </motion.div>
      </div>

      <div className="auth-right">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2, ease }}
          style={{ textAlign: 'center', padding: '3rem', maxWidth: 400 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚀</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Start Your Journey</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.9rem' }}>
            Join thousands of learners. Our AI adapts to your unique learning style.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

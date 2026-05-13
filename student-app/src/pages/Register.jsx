import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import API from '../api'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', display_name: '', role: 'student' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
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
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-form" style={{ animation: 'fadeSlideUp 0.5s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <div className="brand-icon" style={{ width: 40, height: 40, fontSize: '1.25rem' }}>⚡</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-heading)' }}>LearnQuest</span>
          </div>

          <h1>Create account</h1>
          <p className="subtitle">Start your learning adventure today</p>

          {error && (
            <div style={{ padding: '0.75rem', background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="input" value={form.display_name} onChange={e => update('display_name', e.target.value)} placeholder="Your name" required />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">I am a</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {['student', 'educator'].map(r => (
                  <button key={r} type="button" onClick={() => update('role', r)}
                    className={`card card-clickable`}
                    style={{
                      flex: 1, textAlign: 'center', padding: '1rem', cursor: 'pointer',
                      borderColor: form.role === r ? 'var(--primary)' : 'var(--border)',
                      background: form.role === r ? 'var(--primary-dim)' : 'var(--bg-surface)'
                    }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{r === 'student' ? '🎮' : '📚'}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: form.role === r ? 'var(--primary)' : 'var(--text)', textTransform: 'capitalize' }}>{r}</div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><UserPlus size={18} /> Create Account</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div style={{ textAlign: 'center', padding: '3rem', maxWidth: 400 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚀</div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Your Journey Starts Here</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Join thousands of learners using AI-powered adaptive quizzes to master any subject.
          </p>
        </div>
      </div>
    </div>
  )
}

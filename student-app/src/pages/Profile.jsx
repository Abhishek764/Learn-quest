import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import API from '../api'
import { User, Zap, Trophy, Settings, LogOut, Edit3 } from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'))
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.display_name || '')

  useEffect(() => {
    API.get(`/users/${user.id}/profile`).then(r => {
      setUser(r.data)
      localStorage.setItem('user', JSON.stringify(r.data))
      setName(r.data.display_name || '')
    }).catch(() => {})
  }, [])

  async function saveName() {
    try {
      await API.put(`/users/${user.id}/profile`, { display_name: name })
      setUser(u => ({ ...u, display_name: name }))
      localStorage.setItem('user', JSON.stringify({ ...user, display_name: name }))
      setEditing(false)
    } catch {}
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const xp = user.xp || 0
  const level = user.level || 1

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Avatar + Name */}
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 700, color: 'white',
            margin: '0 auto 1rem',
            boxShadow: '0 0 30px var(--primary-glow)',
          }}>
            {(user.display_name || 'U')[0].toUpperCase()}
          </div>

          {editing ? (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <input className="input" value={name} onChange={e => setName(e.target.value)} style={{ maxWidth: 200, textAlign: 'center' }} autoFocus />
              <button className="btn btn-primary btn-sm" onClick={saveName}>Save</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          ) : (
            <h1 style={{ marginBottom: '0.25rem', cursor: 'pointer' }} onClick={() => setEditing(true)}>
              {user.display_name || 'Player'} <Edit3 size={14} style={{ color: 'var(--text-muted)' }} />
            </h1>
          )}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</p>
          <span className="badge badge-primary" style={{ marginTop: '0.75rem' }}>{user.role || 'student'}</span>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--xp)' }}><Zap size={18} /></div>
            <div className="stat-value">{xp.toLocaleString()}</div>
            <div className="stat-label">Total XP</div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--primary)' }}><Trophy size={18} /></div>
            <div className="stat-value">{level}</div>
            <div className="stat-label">Level</div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.375rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Level {level} → {level + 1}</span>
            <span style={{ color: 'var(--xp)', fontFamily: 'var(--font-mono)' }}>{xp % 100}/100 XP</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${xp % 100}%` }} />
          </div>
        </div>

        {/* Actions */}
        <button className="btn btn-danger btn-block" onClick={logout} style={{ gap: '0.5rem' }}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  )
}

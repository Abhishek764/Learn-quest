import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import AnimatedBackground from '../components/AnimatedBackground'
import API from '../api'
import { User, Zap, Trophy, LogOut, Edit3 } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'))
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.display_name || '')

  useEffect(() => {
    API.get(`/users/${user.id}/profile`).then(r => {
      setUser(r.data); localStorage.setItem('user', JSON.stringify(r.data)); setName(r.data.display_name || '')
    }).catch(() => {})
  }, [])

  async function saveName() {
    try {
      await API.put(`/users/${user.id}/profile`, { display_name: name })
      setUser(u => ({ ...u, display_name: name })); localStorage.setItem('user', JSON.stringify({ ...user, display_name: name })); setEditing(false)
    } catch {}
  }

  function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login') }

  const xp = user.xp || 0, level = user.level || 1

  return (
    <div className="page-wrapper">
      <AnimatedBackground />
      <Navbar />
      <div className="page-content" style={{ maxWidth: 560, margin: '0 auto' }}>
        <motion.div className="card" initial="hidden" animate="visible" variants={fadeUp}
          style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '1.5rem' }}>
          <motion.div whileHover={{ scale: 1.05 }} style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 700, color: 'white',
            margin: '0 auto 1.25rem',
            boxShadow: '0 0 40px var(--accent-glow)',
          }}>
            {(user.display_name || 'U')[0].toUpperCase()}
          </motion.div>

          {editing ? (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <input className="input" value={name} onChange={e => setName(e.target.value)} style={{ maxWidth: 200, textAlign: 'center' }} autoFocus />
              <button className="btn btn-primary btn-sm" onClick={saveName}>Save</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          ) : (
            <h1 style={{ marginBottom: '0.25rem', cursor: 'pointer', fontSize: '1.5rem' }} onClick={() => setEditing(true)}>
              {user.display_name || 'Player'} <Edit3 size={14} style={{ color: 'var(--text-muted)' }} />
            </h1>
          )}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</p>
          <span className="badge badge-primary" style={{ marginTop: '0.75rem' }}>{user.role || 'student'}</span>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <motion.div className="card stat-card" initial="hidden" animate="visible" variants={fadeUp} whileHover={{ y: -4 }}>
            <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.08)', color: 'var(--xp)' }}><Zap size={20} /></div>
            <div className="stat-value">{xp.toLocaleString()}</div>
            <div className="stat-label">Total XP</div>
          </motion.div>
          <motion.div className="card stat-card" initial="hidden" animate="visible" variants={fadeUp} whileHover={{ y: -4 }}>
            <div className="stat-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent-bright)' }}><Trophy size={20} /></div>
            <div className="stat-value">{level}</div>
            <div className="stat-label">Level</div>
          </motion.div>
        </div>

        <motion.div className="card" initial="hidden" animate="visible" variants={fadeUp} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.375rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Level {level} → {level + 1}</span>
            <span style={{ color: 'var(--xp)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{xp % 100}/100 XP</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${xp % 100}%` }} transition={{ duration: 1, ease }} />
          </div>
        </motion.div>

        <motion.button className="btn btn-danger btn-block btn-lg" onClick={logout} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <LogOut size={18} /> Sign Out
        </motion.button>
      </div>
    </div>
  )
}

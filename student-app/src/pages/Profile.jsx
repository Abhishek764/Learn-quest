import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import AnimatedBackground from '../components/AnimatedBackground'
import API from '../api'
import {
  Zap, Trophy, LogOut, Edit3, Check, X as CloseIcon,
  Flame, Target, Award, Sparkles, Calendar, Lock,
} from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease } }) }

const ACHIEVEMENTS = [
  { id: 'first',      icon: <Sparkles size={16} />, label: 'First Steps',  desc: 'Complete first game', threshold: 1,   stat: 'sessions',  color: '#22d3ee' },
  { id: 'streak3',    icon: <Flame size={16} />,    label: '3-Day Streak', desc: '3 days in a row',      threshold: 3,  stat: 'streak',    color: '#f59e0b' },
  { id: 'streak7',    icon: <Flame size={16} />,    label: 'On Fire',      desc: '7-day streak',          threshold: 7,  stat: 'streak',    color: '#ef4444' },
  { id: 'level5',     icon: <Trophy size={16} />,   label: 'Level 5',      desc: 'Reach level 5',          threshold: 5,  stat: 'level',     color: '#6366f1' },
  { id: 'level10',    icon: <Award size={16} />,    label: 'Veteran',      desc: 'Reach level 10',         threshold: 10, stat: 'level',     color: '#8b5cf6' },
  { id: 'sharp',      icon: <Target size={16} />,   label: 'Sharpshooter', desc: '80% accuracy avg',       threshold: 0.8,stat: 'accuracy',  color: '#10b981' },
]

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'))
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.display_name || '')
  const [stats, setStats] = useState({})

  useEffect(() => {
    if (!user.id) return
    Promise.all([
      API.get(`/users/${user.id}/profile`).catch(() => null),
      API.get(`/analytics/user/${user.id}/stats`).catch(() => ({ data: {} })),
    ]).then(([profile, statsRes]) => {
      if (profile?.data) {
        setUser(profile.data)
        localStorage.setItem('user', JSON.stringify(profile.data))
        setName(profile.data.display_name || '')
      }
      setStats(statsRes.data || {})
    })
  }, [])

  async function saveName() {
    if (!name.trim()) return
    try {
      await API.put(`/users/${user.id}/profile`, { display_name: name })
      const updated = { ...user, display_name: name }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
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
  const xpInLevel = xp % 100
  const streak = user.streak_days || 0
  const accuracy = stats?.avg_accuracy || 0

  const statByKey = { sessions: stats?.total_sessions || 0, streak, level, accuracy }
  const unlocked = (a) => statByKey[a.stat] >= a.threshold

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently'

  return (
    <div className="page-wrapper">
      <AnimatedBackground />
      <Navbar />
      <div className="page-content" style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Hero card */}
        <motion.div
          className="card"
          initial="hidden" animate="visible" variants={fadeUp}
          style={{
            marginBottom: '1.25rem', padding: 0, overflow: 'hidden',
          }}
        >
          {/* Banner */}
          <div style={{
            height: 120, position: 'relative',
            background:
              'linear-gradient(135deg, rgba(99,102,241,0.30), rgba(139,92,246,0.22) 50%, rgba(34,211,238,0.18))',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background:
                'radial-gradient(ellipse 70% 100% at 30% 80%, rgba(99,102,241,0.35), transparent 60%),' +
                'radial-gradient(ellipse 60% 80% at 80% 20%, rgba(236,72,153,0.20), transparent 60%)',
              filter: 'blur(20px)',
            }} />
          </div>

          {/* Avatar & name */}
          <div style={{ padding: '0 2rem 2rem', marginTop: -42, position: 'relative' }}>
            <motion.div
              whileHover={{ scale: 1.04 }}
              style={{
                width: 84, height: 84, borderRadius: 22,
                background: 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '2rem', fontWeight: 800, color: 'white',
                boxShadow: '0 12px 32px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
                border: '3px solid var(--bg-base)',
              }}
            >
              {(user.display_name || 'U').charAt(0).toUpperCase()}
            </motion.div>

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editing ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      className="input" autoFocus
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveName()}
                      style={{ maxWidth: 240, fontSize: '1rem' }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={saveName} aria-label="Save"><Check size={14} /></button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setName(user.display_name || '') }} aria-label="Cancel"><CloseIcon size={14} /></button>
                  </div>
                ) : (
                  <>
                    <h1
                      style={{ fontSize: '1.5rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={() => setEditing(true)}
                      title="Edit name"
                    >
                      {user.display_name || 'Player'}
                      <Edit3 size={14} style={{ color: 'var(--text-muted)' }} />
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>{user.email}</p>
                  </>
                )}

                <div style={{ marginTop: '0.875rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{user.role || 'student'}</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                    <Calendar size={10} /> Joined {memberSince}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
          {[
            { icon: <Zap size={20} />,    label: 'Total XP', value: xp.toLocaleString(),       color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' },
            { icon: <Trophy size={20} />, label: 'Level',    value: level,                      color: '#6366f1', bg: 'rgba(99,102,241,0.10)' },
            { icon: <Flame size={20} />,  label: 'Streak',   value: `${streak}d`,               color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
            { icon: <Target size={20} />, label: 'Accuracy', value: accuracy ? `${Math.round(accuracy * 100)}%` : '—', color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)' },
          ].map((s, i) => (
            <motion.div
              key={i} className="card stat-card"
              custom={i} initial="hidden" animate="visible" variants={fadeUp}
              whileHover={{ y: -4 }}
            >
              <div className="stat-icon" style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}25` }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* XP progress */}
        <motion.div className="card" custom={5} initial="hidden" animate="visible" variants={fadeUp} style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>Level {level} → {level + 1}</span>
            <span style={{ color: 'var(--xp)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{xpInLevel}/100 XP</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${xpInLevel}%` }}
              transition={{ duration: 1.2, ease }}
            />
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div className="card" custom={6} initial="hidden" animate="visible" variants={fadeUp} style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={16} style={{ color: '#fbbf24' }} /> Achievements
            </h3>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}>
              {ACHIEVEMENTS.filter(unlocked).length}/{ACHIEVEMENTS.length}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.625rem' }}>
            {ACHIEVEMENTS.map((a, i) => {
              const got = unlocked(a)
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.05 * i, ease }}
                  style={{
                    padding: '0.875rem',
                    borderRadius: 14,
                    background: got ? `${a.color}10` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${got ? `${a.color}30` : 'var(--border)'}`,
                    opacity: got ? 1 : 0.55,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: got ? `${a.color}25` : 'rgba(255,255,255,0.04)',
                    color: got ? a.color : 'var(--text-muted)',
                    border: `1px solid ${got ? `${a.color}40` : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '0.5rem',
                    boxShadow: got ? `0 0 16px ${a.color}30` : 'none',
                  }}>
                    {got ? a.icon : <Lock size={14} />}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: got ? 'var(--text-heading)' : 'var(--text)' }}>{a.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.desc}</div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.button
          className="btn btn-danger btn-block btn-lg"
          onClick={logout}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          custom={7} initial="hidden" animate="visible" variants={fadeUp}
        >
          <LogOut size={16} /> Sign out
        </motion.button>
      </div>
    </div>
  )
}

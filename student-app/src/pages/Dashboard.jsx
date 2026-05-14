import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import AnimatedBackground from '../components/AnimatedBackground'
import API from '../api'
import { Zap, Flame, Trophy, Target, Gamepad2, TrendingUp, Calendar, Award, ChevronRight, Sparkles, Clock, Brain, Map } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

const ease = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease } }) }

export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState([])
  const [heatmap, setHeatmap] = useState([])
  const [tips, setTips] = useState([])

  useEffect(() => {
    Promise.all([
      API.get(`/analytics/user/${user.id}/stats`).catch(() => ({ data: {} })),
      API.get(`/analytics/user/${user.id}/trends`).catch(() => ({ data: [] })),
      API.get(`/analytics/user/${user.id}/heatmap`).catch(() => ({ data: [] })),
      API.get(`/analytics/user/${user.id}/growth-tips`).catch(() => ({ data: [] })),
    ]).then(([s, t, h, g]) => {
      setStats(s.data); setTrends(t.data); setHeatmap(h.data); setTips(g.data)
    })
  }, [])

  const xp = user.xp || 0, level = user.level || 1, xpInLevel = xp % 100, streak = user.streak_days || 0

  const statCards = [
    { icon: <Zap size={22} />, label: 'Total XP', value: xp.toLocaleString(), color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
    { icon: <Trophy size={22} />, label: 'Level', value: level, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    { icon: <Flame size={22} />, label: 'Streak', value: `${streak}d`, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    { icon: <Target size={22} />, label: 'Accuracy', value: stats?.avg_accuracy ? `${Math.round(stats.avg_accuracy * 100)}%` : '—', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
  ]

  const quickActions = [
    { icon: <Gamepad2 size={18} />, label: 'Lightning Quiz', desc: '10 adaptive questions', path: '/games', color: '#6366f1' },
    { icon: <Brain size={18} />, label: 'Memory Match', desc: 'Match concepts to answers', path: '/games', color: '#8b5cf6' },
    { icon: <Clock size={18} />, label: 'Crew Quest', desc: 'Multiplayer with friends', path: '/games/crew-quest', color: '#22d3ee' },
    { icon: <Map size={18} />, label: 'Skill Tree', desc: 'Your knowledge graph', path: '/skill-tree', color: '#10b981' },
  ]

  return (
    <div className="page-wrapper">
      <AnimatedBackground />
      <Navbar />
      <div className="page-content">
        {/* Hero */}
        <motion.div className="card" initial="hidden" animate="visible" variants={fadeUp}
          style={{ marginBottom: '1.5rem', padding: '2.25rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))', borderColor: 'rgba(99,102,241,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <motion.h1 style={{ fontSize: '2rem', marginBottom: '0.375rem' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease }}>
                Welcome back, {user.display_name || 'Player'} <span style={{ fontSize: '1.5rem' }}>👋</span>
              </motion.h1>
              <p style={{ color: 'var(--text-muted)' }}>Your AI tutor has new challenges waiting.</p>
            </div>
            <motion.button className="btn btn-primary btn-lg" onClick={() => navigate('/games')}
              whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(99,102,241,0.4)' }} whileTap={{ scale: 0.97 }}>
              <Gamepad2 size={20} /> Play Now
            </motion.button>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.375rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Level {level} Progress</span>
              <span style={{ color: 'var(--xp)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{xpInLevel}/100 XP</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${xpInLevel}%` }} transition={{ duration: 1.2, ease }} />
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          {statCards.map((s, i) => (
            <motion.div key={i} className="card stat-card" custom={i} initial="hidden" animate="visible" variants={fadeUp}
              whileHover={{ y: -4, boxShadow: `0 16px 48px rgba(0,0,0,0.3), 0 0 20px ${s.color}15` }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Chart */}
          <motion.div className="card" custom={4} initial="hidden" animate="visible" variants={fadeUp}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--accent-bright)' }} /> Engagement
            </h3>
            <div style={{ height: 180 }}>
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <Line type="monotone" dataKey="engagement_score" stroke="#6366f1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    <Tooltip contentStyle={{ background: '#0e0e14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#eee', fontSize: '0.8rem' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Play more to see trends
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div className="card" custom={5} initial="hidden" animate="visible" variants={fadeUp}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} style={{ color: '#fbbf24' }} /> Quick Launch
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quickActions.map((a, i) => (
                <motion.div key={i} onClick={() => navigate(a.path)}
                  whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.03)' }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 14, cursor: 'pointer', border: '1px solid transparent', transition: 'border-color 0.2s' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${a.color}12`, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${a.color}15` }}>
                    {a.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)' }}>{a.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid-2">
          {/* Heatmap */}
          <motion.div className="card" custom={6} initial="hidden" animate="visible" variants={fadeUp}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} style={{ color: 'var(--accent-bright)' }} /> Activity
            </h3>
            <div className="heatmap-grid">
              {(heatmap.length > 0 ? heatmap.slice(-364) : Array(364).fill({ count: 0 })).map((d, i) => {
                const c = d.count || d.sessions_count || 0
                const lvl = c === 0 ? '' : c < 2 ? 'l1' : c < 4 ? 'l2' : c < 6 ? 'l3' : 'l4'
                return <div key={i} className={`heatmap-cell ${lvl}`} />
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)', justifyContent: 'flex-end' }}>
              Less {['', 'l1', 'l2', 'l3', 'l4'].map(l => <div key={l} className={`heatmap-cell ${l}`} style={{ width: 10, height: 10, borderRadius: 2 }} />)} More
            </div>
          </motion.div>

          {/* Tips */}
          <motion.div className="card" custom={7} initial="hidden" animate="visible" variants={fadeUp}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={16} style={{ color: '#fbbf24' }} /> Growth Tips
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {(Array.isArray(tips) ? tips : []).slice(0, 4).map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', fontSize: '0.8rem', color: 'var(--text)', lineHeight: 1.5 }}>
                  <Sparkles size={13} style={{ color: 'var(--accent-bright)', flexShrink: 0, marginTop: 3 }} />
                  {tip}
                </div>
              ))}
              {(!tips || tips.length === 0) && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Play more games to get AI-powered tips</p>}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

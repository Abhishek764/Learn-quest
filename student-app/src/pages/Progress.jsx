import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import AnimatedBackground from '../components/AnimatedBackground'
import API from '../api'
import { BarChart2, TrendingUp, Target, Clock, Brain } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const ease = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease } }) }

export default function Progress() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [stats, setStats] = useState({})
  const [trends, setTrends] = useState([])
  const [mastery, setMastery] = useState([])

  useEffect(() => {
    Promise.all([
      API.get(`/analytics/user/${user.id}/stats`).catch(() => ({ data: {} })),
      API.get(`/analytics/user/${user.id}/trends`).catch(() => ({ data: [] })),
      API.get(`/aboa/learner/${user.id}/mastery`).catch(() => ({ data: [] })),
    ]).then(([s, t, m]) => { setStats(s.data); setTrends(t.data); setMastery(m.data) })
  }, [])

  const subjects = {}
  mastery.forEach(m => { if (!subjects[m.subject]) subjects[m.subject] = []; subjects[m.subject].push(m) })

  return (
    <div className="page-wrapper">
      <AnimatedBackground />
      <Navbar />
      <div className="page-content">
        <motion.div className="page-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <h1><BarChart2 size={22} style={{ display: 'inline', marginRight: 8 }} />Progress</h1>
          <p>Your learning analytics powered by AI</p>
        </motion.div>

        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Sessions', value: stats.total_sessions || 0, icon: <Clock size={20} />, color: 'var(--accent-bright)', bg: 'var(--accent-dim)' },
            { label: 'Accuracy', value: stats.avg_accuracy ? `${Math.round(stats.avg_accuracy * 100)}%` : '—', icon: <Target size={20} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
            { label: 'Concepts', value: mastery.length, icon: <Brain size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { label: 'Engagement', value: stats.avg_engagement ? `${Math.round(stats.avg_engagement * 100)}%` : '—', icon: <TrendingUp size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          ].map((s, i) => (
            <motion.div key={i} className="card stat-card" custom={i} initial="hidden" animate="visible" variants={fadeUp} whileHover={{ y: -4 }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid-2">
          <motion.div className="card" custom={4} initial="hidden" animate="visible" variants={fadeUp}>
            <h3 style={{ marginBottom: '1rem' }}>📈 Engagement Over Time</h3>
            <div style={{ height: 200 }}>
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <XAxis dataKey="date" tick={{ fill: '#4a4a58', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#4a4a58', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} />
                    <Tooltip contentStyle={{ background: '#0e0e14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#eee', fontSize: '0.8rem' }} />
                    <Line type="monotone" dataKey="engagement_score" stroke="#6366f1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Play more to see trends</div>}
            </div>
          </motion.div>

          <motion.div className="card" custom={5} initial="hidden" animate="visible" variants={fadeUp}>
            <h3 style={{ marginBottom: '1rem' }}>🧠 Concept Mastery</h3>
            {Object.keys(subjects).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(subjects).map(([subj, concepts]) => {
                  const avg = concepts.reduce((s, c) => s + (c.mastery_score || 0), 0) / concepts.length
                  return (
                    <div key={subj}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.375rem' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-heading)' }}>{subj}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-bright)' }}>{Math.round(avg * 100)}%</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${avg * 100}%` }} /></div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{concepts.length} concepts tracked</div>
                    </div>
                  )
                })}
              </div>
            ) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Play games to start tracking</div>}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

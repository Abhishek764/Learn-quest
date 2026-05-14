import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, TrendingUp, Activity, Target, ArrowRight, Sparkles, Plus, BookOpen, Award } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import AnimatedBackground from '../components/AnimatedBackground'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import GlareCard from '../components/reactbits/GlareCard'
import TiltCard from '../components/reactbits/TiltCard'
import API from '../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const ease = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease } }) }

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [classes, setClasses] = useState([])

  useEffect(() => {
    Promise.all([
      API.get('/users/leaderboard').then(r => setLeaderboard(r.data || [])).catch(() => {}),
      API.get('/classes').then(r => setClasses(r.data || [])).catch(() => {}),
    ])
  }, [])

  const bins = [
    { range: '0–20%', count: 0 }, { range: '20–40%', count: 0 },
    { range: '40–60%', count: 0 }, { range: '60–80%', count: 0 },
    { range: '80–100%', count: 0 },
  ]
  leaderboard.forEach(u => {
    const score = Math.min((u.xp || 0) / 500, 1)
    const bin = Math.min(Math.floor(score * 5), 4)
    bins[bin].count++
  })

  const students = leaderboard.filter(u => u.role === 'student')
  const totalStudents = students.length
  const avgXp = students.length ? Math.round(students.reduce((s, u) => s + (u.xp || 0), 0) / students.length) : 0
  const topXp = students.length ? Math.max(...students.map(u => u.xp || 0)) : 0

  const stats = [
    { icon: <Users size={18} />,        label: 'Total Students', value: totalStudents,           color: '#14b8a6', glow: 'rgba(20,184,166,0.22)' },
    { icon: <TrendingUp size={18} />,   label: 'Avg XP',         value: avgXp.toLocaleString(),  color: '#0ea5e9', glow: 'rgba(14,165,233,0.22)' },
    { icon: <Award size={18} />,        label: 'Top XP',         value: topXp.toLocaleString(),  color: '#f59e0b', glow: 'rgba(245,158,11,0.22)' },
    { icon: <Target size={18} />,       label: 'Classes',        value: classes.length,          color: '#10b981', glow: 'rgba(16,185,129,0.22)' },
  ]

  return (
    <div className="edu-shell">
      <AnimatedBackground />
      <Sidebar />
      <main className="edu-main">
        {/* Hero */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} style={{ marginBottom: '1.5rem' }}>
          <SpotlightCard
            spotlightColor="rgba(20,184,166,0.22)"
            style={{
              background: 'linear-gradient(135deg, rgba(20,184,166,0.06), rgba(14,165,233,0.04) 60%, rgba(245,158,11,0.03))',
              borderColor: 'rgba(20,184,166,0.18)',
            }}
          >
            <div style={{ padding: '0.5rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <motion.h1
                  style={{ fontSize: '1.875rem', marginBottom: '0.375rem' }}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, ease }}
                >
                  Good to see you, {user.display_name || 'teacher'}
                </motion.h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {totalStudents > 0
                    ? `${totalStudents} students learning across ${classes.length} ${classes.length === 1 ? 'class' : 'classes'}.`
                    : 'Create your first classroom to start tracking student progress.'}
                </p>
              </div>
              <motion.button
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/classes')}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              >
                <Plus size={18} /> New classroom
              </motion.button>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Stats — Tilt cards with spotlight */}
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          {stats.map((s, i) => (
            <motion.div
              key={i}
              custom={i} initial="hidden" animate="visible" variants={fadeUp}
            >
              <TiltCard maxTilt={6} scale={1.02}>
                <SpotlightCard
                  spotlightColor={s.glow}
                  className="stat-card"
                  radius={300}
                >
                  <div className="stat-row">
                    <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}>{s.icon}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                  <div className="stat-value">{s.value}</div>
                </SpotlightCard>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {/* Top students + chart */}
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp}>
            <SpotlightCard spotlightColor="rgba(245,158,11,0.16)">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} style={{ color: 'var(--amber)' }} /> Top performers
                </h3>
                <span className="badge badge-muted">{students.length}</span>
              </div>
              {students.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0', textAlign: 'center' }}>
                  No students enrolled yet. Share a classroom invite code.
                </p>
              ) : (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th style={{ width: 50 }}>#</th>
                        <th>Name</th>
                        <th style={{ width: 70 }}>Level</th>
                        <th style={{ textAlign: 'right', width: 80 }}>XP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.slice(0, 5).map((s, i) => (
                        <tr key={s.id}>
                          <td className={i === 0 ? 'tbl-rank-gold' : i === 1 ? 'tbl-rank-silver' : i === 2 ? 'tbl-rank-bronze' : ''}>
                            {i + 1}
                          </td>
                          <td className="name">{s.display_name}</td>
                          <td>Lv {s.level || 1}</td>
                          <td style={{ textAlign: 'right', color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {(s.xp || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SpotlightCard>
          </motion.div>

          <motion.div custom={6} initial="hidden" animate="visible" variants={fadeUp}>
            <SpotlightCard spotlightColor="rgba(14,165,233,0.20)">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={16} style={{ color: 'var(--accent-bright)' }} /> XP distribution
              </h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bins} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(14,18,24,0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12, color: '#eef2f6',
                        fontSize: '0.8rem', backdropFilter: 'blur(20px)',
                      }}
                      cursor={{ fill: 'rgba(20,184,166,0.06)' }}
                    />
                    <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>

        {/* Classes preview — Glare cards */}
        <motion.div custom={7} initial="hidden" animate="visible" variants={fadeUp}>
          <SpotlightCard spotlightColor="rgba(20,184,166,0.16)">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={16} style={{ color: 'var(--accent-bright)' }} /> Your classrooms
              </h3>
              <button onClick={() => navigate('/classes')} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-bright)' }}>
                View all <ArrowRight size={14} />
              </button>
            </div>

            {classes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  No classrooms yet. Create one to start enrolling students.
                </p>
                <button onClick={() => navigate('/classes')} className="btn btn-primary">
                  <Plus size={16} /> Create your first classroom
                </button>
              </div>
            ) : (
              <div className="grid-3">
                {classes.slice(0, 6).map(c => (
                  <GlareCard
                    key={c.id}
                    onClick={() => navigate(`/classes/${c.id}`)}
                    style={{ cursor: 'pointer', background: 'var(--bg-card-solid)' }}
                  >
                    <div style={{ padding: '0.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.95rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>{c.subject}</div>
                      <div style={{
                        marginTop: '0.875rem', paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>Invite</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.15em',
                          background: 'var(--accent-gradient)',
                          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>{c.invite_code}</span>
                      </div>
                    </div>
                  </GlareCard>
                ))}
              </div>
            )}
          </SpotlightCard>
        </motion.div>
      </main>
    </div>
  )
}

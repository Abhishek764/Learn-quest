import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Copy, Check, Download, TrendingUp, Award } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import AnimatedBackground from '../components/AnimatedBackground'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import TiltCard from '../components/reactbits/TiltCard'
import API from '../api'

const ease = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease } }) }

export default function ClassDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cls, setCls] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    try {
      const [cRes, mRes] = await Promise.all([
        API.get(`/classes/${id}`),
        API.get(`/classes/${id}/members`),
      ])
      setCls(cRes.data); setMembers(mRes.data || [])
    } catch {}
    setLoading(false)
  }

  function copyCode() {
    if (!cls) return
    navigator.clipboard.writeText(cls.invite_code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function exportCSV() {
    if (!members.length) return
    const header = 'Name,XP,Level,Accuracy,Sessions'
    const rows = members.map(m =>
      `"${m.display_name}",${m.xp || 0},${m.level || 1},${m.avg_accuracy != null ? (m.avg_accuracy * 100).toFixed(1) + '%' : 'N/A'},${m.sessions || 0}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cls?.name || 'class'}-members.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="edu-shell">
      <AnimatedBackground />
      <Sidebar />
      <main className="edu-main" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <span className="loading-spinner" style={{ display: 'inline-block' }} />
      </main>
    </div>
  )

  if (!cls) return (
    <div className="edu-shell">
      <AnimatedBackground />
      <Sidebar />
      <main className="edu-main" style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-muted)' }}>
        Classroom not found.
      </main>
    </div>
  )

  const sorted = [...members].sort((a, b) => (b.xp || 0) - (a.xp || 0))
  const avgXp = members.length ? Math.round(members.reduce((s, m) => s + (m.xp || 0), 0) / members.length) : 0
  const maxXp = members.length ? Math.max(...members.map(m => m.xp || 0)) : 500

  const stats = [
    { icon: <Users size={18} />,      label: 'Members', value: members.length,           color: '#14b8a6', glow: 'rgba(20,184,166,0.22)' },
    { icon: <TrendingUp size={18} />, label: 'Avg XP',  value: avgXp.toLocaleString(),   color: '#0ea5e9', glow: 'rgba(14,165,233,0.22)' },
    { icon: <Award size={18} />,      label: 'Top XP',  value: maxXp.toLocaleString(),   color: '#f59e0b', glow: 'rgba(245,158,11,0.22)' },
  ]

  return (
    <div className="edu-shell">
      <AnimatedBackground />
      <Sidebar />
      <main className="edu-main">
        <button onClick={() => navigate('/classes')} className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={14} /> Back to classrooms
        </button>

        <motion.div
          className="page-header" initial="hidden" animate="visible" variants={fadeUp}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <div>
            <h1>{cls.name}</h1>
            <p style={{ textTransform: 'capitalize' }}>{cls.subject}{cls.description ? ` · ${cls.description}` : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="invite-pill">
              <div>
                <div className="lbl">Invite Code</div>
                <div className="code">{cls.invite_code}</div>
              </div>
              <button onClick={copyCode} className="copy-btn" aria-label="Copy invite code">
                {copied ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={15} />}
              </button>
            </div>
            <button onClick={exportCSV} disabled={!members.length} className="btn btn-secondary">
              <Download size={15} /> Export CSV
            </button>
          </div>
        </motion.div>

        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          {stats.map((s, i) => (
            <motion.div key={i} custom={i + 1} initial="hidden" animate="visible" variants={fadeUp}>
              <TiltCard maxTilt={6} scale={1.02}>
                <SpotlightCard spotlightColor={s.glow} className="stat-card" radius={280}>
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

        <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp}>
          <SpotlightCard spotlightColor="rgba(20,184,166,0.14)" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3>Members ({members.length})</h3>
            </div>

            {members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>No students enrolled yet.</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Share invite code{' '}
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.15em',
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>{cls.invite_code}</span> with your students.
                </p>
              </div>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Rank</th>
                      <th>Name</th>
                      <th style={{ width: 80 }}>Level</th>
                      <th>XP progress</th>
                      <th style={{ textAlign: 'right', width: 90 }}>XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((m, i) => {
                      const pct = maxXp > 0 ? Math.round(((m.xp || 0) / maxXp) * 100) : 0
                      const rankClass = i === 0 ? 'tbl-rank-gold' : i === 1 ? 'tbl-rank-silver' : i === 2 ? 'tbl-rank-bronze' : ''
                      return (
                        <tr key={m.id}>
                          <td className={rankClass} style={{ fontFamily: 'var(--font-mono)' }}>#{i + 1}</td>
                          <td className="name">{m.display_name}</td>
                          <td>Lv {m.level || 1}</td>
                          <td style={{ minWidth: 180 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                              <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                                <div className="progress-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 36, textAlign: 'right' }}>{pct}%</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {(m.xp || 0).toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SpotlightCard>
        </motion.div>
      </main>
    </div>
  )
}

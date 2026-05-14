import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import AnimatedBackground from '../components/AnimatedBackground'
import API from '../api'
import {
  Map, Lock, Target, Flame, Calculator, FlaskConical, BookOpen, Globe2,
  ChevronRight, Brain,
} from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease } }) }

const SUBJECTS = [
  { key: 'math',    label: 'Math',    icon: <Calculator size={14} />,    color: '#6366f1' },
  { key: 'science', label: 'Science', icon: <FlaskConical size={14} />,  color: '#8b5cf6' },
  { key: 'english', label: 'English', icon: <BookOpen size={14} />,      color: '#22d3ee' },
  { key: 'general', label: 'General', icon: <Globe2 size={14} />,        color: '#10b981' },
]

function masteryColor(score) {
  if (score >= 0.8) return '#fbbf24'
  if (score >= 0.5) return '#6366f1'
  if (score > 0)    return '#f59e0b'
  return 'rgba(255,255,255,0.18)'
}
function masteryLabel(score) {
  if (score >= 0.8) return 'Mastered'
  if (score >= 0.5) return 'Competent'
  if (score > 0)    return 'Learning'
  return 'Not Started'
}

export default function SkillTree() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [data, setData] = useState(null)
  const [subject, setSubject] = useState('math')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTree() }, [subject])

  async function fetchTree() {
    setLoading(true)
    try {
      const res = await API.get(`/aboa/learner/${user.id}/skill-tree?subject=${subject}`)
      setData(res.data)
    } catch {
      setData({ nodes: [], edges: [] })
    }
    setLoading(false)
  }

  return (
    <div className="page-wrapper">
      <AnimatedBackground />
      <Navbar />
      <div className="page-content">
        <motion.div className="page-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <div>
            <h1>
              <Map size={20} style={{ display: 'inline', marginRight: 8, color: 'var(--accent-bright)', verticalAlign: -3 }} />
              Skill Tree
            </h1>
            <p>Your knowledge graph — master concepts to unlock new ones.</p>
          </div>
        </motion.div>

        {/* Subject pills */}
        <motion.div
          style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.4 }}
        >
          {SUBJECTS.map(s => (
            <motion.button
              key={s.key}
              onClick={() => { setSubject(s.key); setSelected(null) }}
              className={`btn ${subject === s.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem' }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              {s.icon} {s.label}
            </motion.button>
          ))}
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div className="loading-spinner" style={{ display: 'inline-block' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Graph canvas */}
            <motion.div
              className="card"
              style={{ flex: '1 1 600px', padding: '2rem', minHeight: 460, position: 'relative', overflow: 'hidden' }}
              initial="hidden" animate="visible" variants={fadeUp}
            >
              {/* SVG edges */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <defs>
                  <linearGradient id="edge-grad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="rgba(99,102,241,0.30)" />
                    <stop offset="100%" stopColor="rgba(139,92,246,0.20)" />
                  </linearGradient>
                </defs>
                {data?.edges?.map((edge, i) => {
                  const from = data.nodes.find(n => n.id === edge.from_node_id)
                  const to = data.nodes.find(n => n.id === edge.to_node_id)
                  if (!from || !to) return null
                  const x1 = (from.position_x + 3) * 80 + 70
                  const y1 = from.position_y * 90 + 70
                  const x2 = (to.position_x + 3) * 80 + 70
                  const y2 = to.position_y * 90 + 70
                  return (
                    <line
                      key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="url(#edge-grad)" strokeWidth={1.5} strokeDasharray="4 6"
                    />
                  )
                })}
              </svg>

              {/* Nodes */}
              {data?.nodes?.map((node, idx) => {
                const x = (node.position_x + 3) * 80 + 40
                const y = node.position_y * 90 + 40
                const color = node.locked ? 'rgba(255,255,255,0.18)' : masteryColor(node.mastery_score)
                const pct = Math.round((node.mastery_score || 0) * 100)
                const active = selected?.id === node.id
                return (
                  <motion.div
                    key={node.id}
                    onClick={() => !node.locked && setSelected(node)}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: node.locked ? 0.45 : 1, scale: active ? 1.12 : 1 }}
                    transition={{ duration: 0.4, delay: idx * 0.03, ease }}
                    whileHover={!node.locked ? { scale: active ? 1.14 : 1.07 } : {}}
                    style={{
                      position: 'absolute', left: x, top: y,
                      width: 60, height: 60, borderRadius: 16,
                      background: node.locked
                        ? 'rgba(255,255,255,0.02)'
                        : `linear-gradient(135deg, ${color}25, ${color}08)`,
                      border: `1.5px solid ${color}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: node.locked ? 'not-allowed' : 'pointer',
                      boxShadow: active ? `0 0 30px ${color}55, inset 0 1px 0 rgba(255,255,255,0.08)` : `inset 0 1px 0 rgba(255,255,255,0.05)`,
                      zIndex: 2,
                    }}
                  >
                    {node.locked
                      ? <Lock size={18} style={{ color: 'var(--text-muted)' }} />
                      : <Target size={18} style={{ color }} />}
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700,
                      color: node.locked ? 'var(--text-muted)' : color, marginTop: 3,
                    }}>{pct}%</span>
                  </motion.div>
                )
              })}

              {(!data?.nodes || data.nodes.length === 0) && (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                  <Brain size={36} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem' }}>No concepts tracked for this subject yet.</p>
                </div>
              )}
            </motion.div>

            {/* Detail panel */}
            <div style={{ flex: '0 0 300px', minWidth: 0 }}>
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key={selected.id}
                    className="card"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.35, ease }}
                  >
                    <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                      <div style={{
                        width: 64, height: 64, margin: '0 auto 0.875rem',
                        borderRadius: 16,
                        background: `linear-gradient(135deg, ${masteryColor(selected.mastery_score)}25, ${masteryColor(selected.mastery_score)}08)`,
                        border: `1.5px solid ${masteryColor(selected.mastery_score)}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: masteryColor(selected.mastery_score),
                        boxShadow: `0 0 32px ${masteryColor(selected.mastery_score)}40`,
                      }}>
                        <Target size={24} />
                      </div>
                      <h3 style={{ marginBottom: '0.375rem' }}>{selected.display_name}</h3>
                      <span
                        className="badge"
                        style={{
                          background: `${masteryColor(selected.mastery_score)}15`,
                          color: masteryColor(selected.mastery_score),
                        }}
                      >
                        {masteryLabel(selected.mastery_score)}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.375rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Mastery</span>
                        <span style={{ color: masteryColor(selected.mastery_score), fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {Math.round((selected.mastery_score || 0) * 100)}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${(selected.mastery_score || 0) * 100}%` }}
                          transition={{ duration: 0.9, ease }}
                          style={{ background: masteryColor(selected.mastery_score), boxShadow: `0 0 12px ${masteryColor(selected.mastery_score)}50` }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', fontSize: '0.78rem' }}>
                      {[
                        { l: 'Attempts', v: selected.attempts || 0 },
                        { l: 'Streak',   v: <>{selected.streak || 0} <Flame size={11} style={{ color: '#f59e0b', display: 'inline', verticalAlign: -1 }} /></> },
                        { l: 'Confidence', v: `${Math.round((selected.confidence || 0) * 100)}%` },
                        { l: 'Status',   v: <span style={{ color: masteryColor(selected.mastery_score), fontWeight: 600 }}>{selected.status}</span> },
                      ].map((s, i) => (
                        <div key={i} style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border)',
                          borderRadius: 12, padding: '0.625rem 0.75rem',
                        }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-heading)', marginTop: 2 }}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    className="card"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}
                  >
                    <ChevronRight size={28} style={{ opacity: 0.4, marginBottom: '0.625rem' }} />
                    <p style={{ fontSize: '0.85rem' }}>Click a concept node to see your progress.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import AnimatedBackground from '../components/AnimatedBackground'
import API from '../api'
import { Sword, Zap, Target, ChevronRight, Compass } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.5, ease } }) }

export default function Quests() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [paths, setPaths] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get(`/aboa/learner/${user.id}/learning-paths`)
      .then(r => setPaths(r.data || []))
      .catch(() => setPaths([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-wrapper">
      <AnimatedBackground />
      <Navbar />
      <div className="page-content">
        <motion.div className="page-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <h1>
            <Sword size={22} style={{ display: 'inline', marginRight: 8, color: 'var(--accent-bright)', verticalAlign: -2 }} />
            Quests
          </h1>
          <p>AI-generated learning paths targeting your weakest concepts.</p>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div className="loading-spinner" style={{ display: 'inline-block' }} />
          </div>
        ) : paths.length === 0 ? (
          <motion.div
            className="card" initial="hidden" animate="visible" variants={fadeUp}
            style={{ textAlign: 'center', padding: '4rem 2rem' }}
          >
            <div style={{
              width: 72, height: 72, margin: '0 auto 1.25rem',
              borderRadius: 20, background: 'var(--accent-dim)',
              border: '1px solid rgba(99,102,241,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-bright)',
            }}>
              <Compass size={32} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>No active quests yet</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Play more games — once the AI has enough data, it generates personalised quests targeting your weak concepts.
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {paths.map((path, i) => {
              const progress = path.total_stages > 0 ? (path.current_stage / path.total_stages) * 100 : 0
              return (
                <motion.div
                  key={path.id}
                  className="card card-clickable"
                  custom={i} initial="hidden" animate="visible" variants={fadeUp}
                  whileHover={{ y: -3 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.10))',
                    border: '1px solid rgba(99,102,241,0.30)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-bright)',
                    flexShrink: 0,
                    boxShadow: '0 0 24px rgba(99,102,241,0.18)',
                  }}>
                    <Target size={24} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ marginBottom: '0.25rem' }}>{path.title}</h3>
                    {path.description && (
                      <p style={{
                        fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.625rem',
                        display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>{path.description}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
                      <div className="progress-bar" style={{ flex: '1 1 160px', maxWidth: 220, height: 6 }}>
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease, delay: i * 0.05 }}
                        />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {path.current_stage}/{path.total_stages}
                      </span>
                      <span
                        className="badge"
                        style={{ background: 'rgba(251,191,36,0.10)', color: 'var(--xp)', border: '1px solid rgba(251,191,36,0.20)' }}
                      >
                        <Zap size={10} /> {path.xp_reward} XP
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

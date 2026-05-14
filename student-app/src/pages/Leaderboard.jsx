import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import AnimatedBackground from '../components/AnimatedBackground'
import API from '../api'
import { Trophy, Zap } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.5, ease } }) }

export default function Leaderboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [leaders, setLeaders] = useState([])

  useEffect(() => { API.get('/users/leaderboard').then(r => setLeaders(r.data)).catch(() => {}) }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="page-wrapper">
      <AnimatedBackground />
      <Navbar />
      <div className="page-content">
        <motion.div className="page-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <h1><Trophy size={22} style={{ display: 'inline', marginRight: 8 }} />Rankings</h1>
          <p>Top players across all subjects</p>
        </motion.div>

        <motion.div className="card" style={{ padding: 0, overflow: 'hidden' }} initial="hidden" animate="visible" variants={fadeUp}>
          <div style={{ display: 'flex', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span style={{ width: 50 }}>Rank</span><span style={{ flex: 1 }}>Player</span><span style={{ width: 80, textAlign: 'right' }}>Level</span><span style={{ width: 100, textAlign: 'right' }}>XP</span>
          </div>
          {leaders.map((p, i) => {
            const isYou = p.id === user.id, rank = i + 1
            return (
              <motion.div key={p.id} className={`lb-row ${isYou ? 'is-you' : ''}`} custom={i} initial="hidden" animate="visible" variants={fadeUp}
                style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <span className={`lb-rank ${rank <= 3 ? ['gold', 'silver', 'bronze'][rank - 1] : ''}`} style={{ width: 50 }}>{rank <= 3 ? medals[rank - 1] : rank}</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: isYou ? 'var(--accent-dim)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: isYou ? 'var(--accent-bright)' : 'var(--text-muted)' }}>
                    {(p.display_name || 'U')[0].toUpperCase()}
                  </div>
                  <div><div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.9rem' }}>{p.display_name || 'Unknown'} {isYou && <span style={{ fontSize: '0.7rem', color: 'var(--accent-bright)' }}>(you)</span>}</div></div>
                </div>
                <span className="level-badge" style={{ width: 80, textAlign: 'center' }}>Lv.{p.level || 1}</span>
                <span style={{ width: 100, textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--xp)' }}><Zap size={12} style={{ display: 'inline' }} /> {(p.xp || 0).toLocaleString()}</span>
              </motion.div>
            )
          })}
          {leaders.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No players yet. Be the first!</div>}
        </motion.div>
      </div>
    </div>
  )
}

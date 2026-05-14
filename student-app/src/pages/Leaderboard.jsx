import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import AnimatedBackground from '../components/AnimatedBackground'
import API from '../api'
import { Trophy, Zap, Crown, Medal, Award, Users } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.5, ease } }) }

const PODIUM_META = [
  { icon: <Crown size={22} />, color: '#fbbf24', glow: 'rgba(251,191,36,0.45)', label: '1st', height: 140 },
  { icon: <Medal size={20} />, color: '#cbd5e1', glow: 'rgba(203,213,225,0.35)', label: '2nd', height: 110 },
  { icon: <Award size={20} />, color: '#d97706', glow: 'rgba(217,119,6,0.40)', label: '3rd', height: 90 },
]

function avatarInitial(name) {
  return (name || 'U').trim().charAt(0).toUpperCase()
}

export default function Leaderboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/users/leaderboard')
      .then(r => setLeaders(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const podium = leaders.slice(0, 3)
  const rest = leaders.slice(3)
  const myRank = leaders.findIndex(p => p.id === user.id) + 1

  // Render order for visual podium: 2nd, 1st, 3rd
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean)
  const podiumIdxMap = (player) => podium.findIndex(p => p?.id === player.id)

  return (
    <div className="page-wrapper">
      <AnimatedBackground />
      <Navbar />
      <div className="page-content">
        <motion.div className="page-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <div>
            <h1>
              <Trophy size={22} style={{ display: 'inline', marginRight: 8, color: '#fbbf24', verticalAlign: -2 }} />
              Rankings
            </h1>
            <p>{leaders.length} {leaders.length === 1 ? 'player' : 'players'} competing across all subjects.</p>
          </div>
          {myRank > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.875rem', borderRadius: 999,
              background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.20)',
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your rank</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem',
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>#{myRank}</span>
            </div>
          )}
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div className="loading-spinner" style={{ display: 'inline-block' }} />
          </div>
        ) : leaders.length === 0 ? (
          <motion.div
            className="card" initial="hidden" animate="visible" variants={fadeUp}
            style={{ textAlign: 'center', padding: '4rem 2rem' }}
          >
            <div style={{
              width: 64, height: 64, margin: '0 auto 1.25rem',
              borderRadius: 18, background: 'var(--accent-dim)',
              border: '1px solid rgba(99,102,241,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-bright)',
            }}>
              <Users size={28} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>No players yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Be the first on the leaderboard.</p>
          </motion.div>
        ) : (
          <>
            {/* Podium */}
            {podium.length > 0 && (
              <motion.div
                className="card"
                initial="hidden" animate="visible" variants={fadeUp}
                style={{
                  marginBottom: '1.25rem', padding: '2.5rem 1.5rem 1.5rem',
                  background: 'linear-gradient(180deg, rgba(99,102,241,0.05), rgba(139,92,246,0.03) 50%, transparent)',
                  borderColor: 'rgba(99,102,241,0.12)',
                  overflow: 'hidden', position: 'relative',
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: podium.length === 3 ? '1fr 1.1fr 1fr' : podium.length === 2 ? '1fr 1fr' : '1fr',
                  alignItems: 'end', gap: '1rem', maxWidth: 560, margin: '0 auto',
                }}>
                  {podiumOrder.map((player) => {
                    const rankIdx = podiumIdxMap(player)
                    const meta = PODIUM_META[rankIdx]
                    const isYou = player.id === user.id
                    return (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 + rankIdx * 0.12, ease }}
                        style={{ textAlign: 'center' }}
                      >
                        {/* Avatar */}
                        <div style={{
                          position: 'relative', width: rankIdx === 0 ? 72 : 56, height: rankIdx === 0 ? 72 : 56,
                          margin: '0 auto 0.625rem',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${meta.color}, ${meta.color}aa)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontWeight: 700,
                          fontSize: rankIdx === 0 ? '1.6rem' : '1.25rem',
                          color: '#0e0e14',
                          boxShadow: `0 0 32px ${meta.glow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                          border: isYou ? '2px solid var(--accent-bright)' : 'none',
                        }}>
                          {avatarInitial(player.display_name)}
                          <div style={{
                            position: 'absolute', top: -8, right: -8,
                            width: 26, height: 26, borderRadius: '50%',
                            background: 'var(--bg-card-solid)', border: `1px solid ${meta.color}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: meta.color, boxShadow: `0 0 12px ${meta.glow}`,
                          }}>
                            {meta.icon}
                          </div>
                        </div>
                        <div style={{
                          fontWeight: 600, fontSize: rankIdx === 0 ? '0.95rem' : '0.85rem',
                          color: 'var(--text-heading)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          maxWidth: '100%',
                        }}>{player.display_name}{isYou && <span style={{ marginLeft: 4, color: 'var(--accent-bright)', fontSize: '0.7rem' }}>(you)</span>}</div>
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700,
                          color: meta.color, marginTop: 2,
                        }}>{(player.xp || 0).toLocaleString()} XP</div>

                        {/* Podium block */}
                        <motion.div
                          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                          transition={{ duration: 0.6, delay: 0.3 + rankIdx * 0.12, ease }}
                          style={{
                            marginTop: '0.875rem',
                            height: meta.height, transformOrigin: 'bottom',
                            background: `linear-gradient(180deg, ${meta.color}25, ${meta.color}08 70%, transparent)`,
                            border: `1px solid ${meta.color}40`,
                            borderRadius: '14px 14px 0 0',
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                            paddingTop: '0.625rem',
                            fontFamily: 'var(--font-display)', fontWeight: 800,
                            fontSize: rankIdx === 0 ? '1.5rem' : '1.15rem',
                            color: meta.color,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {meta.label}
                        </motion.div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Rest of table */}
            {rest.length > 0 && (
              <motion.div
                className="card"
                initial="hidden" animate="visible" variants={fadeUp}
                style={{ padding: 0, overflow: 'hidden' }}
              >
                <div style={{
                  display: 'flex', padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--text-muted)', fontWeight: 600,
                }}>
                  <span style={{ width: 50 }}>Rank</span>
                  <span style={{ flex: 1 }}>Player</span>
                  <span style={{ width: 80, textAlign: 'right' }}>Level</span>
                  <span style={{ width: 100, textAlign: 'right' }}>XP</span>
                </div>

                {rest.map((p, i) => {
                  const rank = i + 4
                  const isYou = p.id === user.id
                  return (
                    <motion.div
                      key={p.id}
                      custom={i} initial="hidden" animate="visible" variants={fadeUp}
                      className={`lb-row ${isYou ? 'is-you' : ''}`}
                      style={{
                        padding: '0.875rem 1.25rem',
                        borderBottom: i === rest.length - 1 ? 'none' : '1px solid var(--border)',
                      }}
                    >
                      <span className="lb-rank" style={{ width: 50, fontFamily: 'var(--font-mono)' }}>#{rank}</span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 10,
                          background: isYou ? 'var(--accent-dim)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isYou ? 'rgba(99,102,241,0.30)' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem', fontWeight: 700,
                          color: isYou ? 'var(--accent-bright)' : 'var(--text)',
                          flexShrink: 0,
                        }}>
                          {avatarInitial(p.display_name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.9rem',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {p.display_name || 'Unknown'}
                            {isYou && <span style={{ marginLeft: 6, fontSize: '0.68rem', color: 'var(--accent-bright)' }}>(you)</span>}
                          </div>
                        </div>
                      </div>
                      <span className="level-badge" style={{ width: 80, textAlign: 'center' }}>Lv.{p.level || 1}</span>
                      <span style={{
                        width: 100, textAlign: 'right',
                        fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--xp)',
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
                      }}>
                        <Zap size={11} /> {(p.xp || 0).toLocaleString()}
                      </span>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

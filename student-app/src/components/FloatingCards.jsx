import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { TrendingUp, Users, Flame, Sparkles } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]

export default function FloatingCards() {
  const stackRef = useRef(null)

  useEffect(() => {
    const el = stackRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const cards = el.querySelectorAll('.float-card')
    const qRX = Array.from(cards).map(c => gsap.quickTo(c, 'rotationY', { duration: 0.8, ease: 'power2.out' }))
    const qRY = Array.from(cards).map(c => gsap.quickTo(c, 'rotationX', { duration: 0.8, ease: 'power2.out' }))

    function onMove(e) {
      const rect = el.getBoundingClientRect()
      const cx = (e.clientX - rect.left) / rect.width - 0.5
      const cy = (e.clientY - rect.top) / rect.height - 0.5
      cards.forEach((_, i) => {
        const factor = 1 - i * 0.15
        qRX[i](cx * 12 * factor)
        qRY[i](-cy * 10 * factor)
      })
    }
    function onLeave() {
      cards.forEach((_, i) => { qRX[i](0); qRY[i](0) })
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div style={{ width: '100%', maxWidth: 460, position: 'relative' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease }}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700,
          letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.75rem',
          background: 'linear-gradient(180deg,#fff 30%,#a8a8c2 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Learn by playing.<br />Level up for real.
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
          Adaptive AI tutor. Multiplayer quests. A skill tree that maps how you actually think.
        </p>
      </motion.div>

      <div ref={stackRef} className="float-stack" style={{ height: 320 }}>
        {/* Card 1 — XP / Level */}
        <motion.div
          className="float-card"
          initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease }}
          style={{ top: 0, left: '6%', width: '78%', transform: 'translateZ(40px)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(251,191,36,0.10)', color: '#fbbf24',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(251,191,36,0.15)',
            }}>
              <Sparkles size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Level Up</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-heading)', fontWeight: 600 }}>Lv 12 unlocked</div>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700,
              color: '#fbbf24',
            }}>+500 XP</div>
          </div>
          <div className="sparkline">
            <svg viewBox="0 0 100 36" preserveAspectRatio="none">
              <defs>
                <linearGradient id="spark1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,28 L12,24 L24,26 L36,18 L48,22 L60,12 L72,16 L84,8 L100,4 L100,36 L0,36 Z" fill="url(#spark1)" />
              <path d="M0,28 L12,24 L24,26 L36,18 L48,22 L60,12 L72,16 L84,8 L100,4"
                fill="none" stroke="#818cf8" strokeWidth="1.5" />
            </svg>
          </div>
        </motion.div>

        {/* Card 2 — Crew Quest live */}
        <motion.div
          className="float-card"
          initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4, ease }}
          style={{ top: 120, left: '20%', width: '80%', transform: 'translateZ(0)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(34,211,238,0.10)', color: '#22d3ee',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(34,211,238,0.18)',
            }}>
              <Users size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 2 }}>
                <span className="live-dot" />
                <span style={{ fontSize: '0.65rem', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Live</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-heading)', fontWeight: 600 }}>Crew Quest · code 4827</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>6 players · tasks in progress</div>
            </div>
            <div style={{ display: 'flex', marginLeft: 'auto' }}>
              {['#6366f1', '#22d3ee', '#ec4899', '#fbbf24'].map((c, i) => (
                <div key={i} style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: c, marginLeft: i === 0 ? 0 : -7,
                  border: '2px solid var(--bg-card-solid)', boxShadow: `0 0 8px ${c}40`,
                }} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Card 3 — Streak */}
        <motion.div
          className="float-card"
          initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.55, ease }}
          style={{ top: 240, left: '0%', width: '74%', transform: 'translateZ(-40px)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(245,158,11,0.10)', color: '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(245,158,11,0.18)',
            }}>
              <Flame size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Streak</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-heading)', fontWeight: 600 }}>7 days · top 4%</div>
            </div>
            <TrendingUp size={16} style={{ color: 'var(--success)' }} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

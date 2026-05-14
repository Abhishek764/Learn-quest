import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Sparkles, Target, BookOpen } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]

const TOASTS = [
  { icon: <Trophy size={16} />, color: '#fbbf24', title: 'Badge unlocked', sub: 'First Steps' },
  { icon: <Sparkles size={16} />, color: '#8b5cf6', title: 'New concept', sub: 'Fractions mastered' },
  { icon: <Target size={16} />, color: '#22d3ee', title: 'Streak +1', sub: 'Day 3 · keep going' },
  { icon: <BookOpen size={16} />, color: '#10b981', title: 'Quest complete', sub: '+120 XP' },
]

export default function OnboardingTeaser() {
  const [xp, setXp] = useState(0)
  const [toastIdx, setToastIdx] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setXp(340); return
    }
    let raf
    const start = performance.now()
    const tick = (t) => {
      const p = Math.min((t - start) / 1800, 1)
      setXp(Math.round(340 * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const id = setInterval(() => setToastIdx(i => (i + 1) % TOASTS.length), 2200)
    return () => { cancelAnimationFrame(raf); clearInterval(id) }
  }, [])

  const xpPct = Math.min((xp / 500) * 100, 100)

  return (
    <div style={{ width: '100%', maxWidth: 440, position: 'relative' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        style={{ textAlign: 'center', marginBottom: '2.5rem' }}
      >
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700,
          letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.75rem',
          background: 'linear-gradient(180deg,#fff 30%,#a8a8c2 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Your quest begins<br />the moment you join.
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
          Earn XP, unlock badges, master 46 concepts at your own pace.
        </p>
      </motion.div>

      {/* Live XP card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2, ease }}
        className="float-card"
        style={{ position: 'relative', marginBottom: '1rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Level 3 Progress</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)', marginTop: 2 }}>
              {xp}<span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> / 500 XP</span>
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', boxShadow: '0 0 18px var(--accent-glow)',
          }}>
            <Sparkles size={20} />
          </div>
        </div>
        <div className="progress-bar" style={{ height: 8 }}>
          <div
            className="progress-fill"
            style={{ width: `${xpPct}%`, transition: 'none' }}
          />
        </div>
      </motion.div>

      {/* Toast stream */}
      <div style={{ position: 'relative', height: 64 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={toastIdx}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.4, ease }}
            className="float-card"
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem' }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `${TOASTS[toastIdx].color}15`,
              color: TOASTS[toastIdx].color,
              border: `1px solid ${TOASTS[toastIdx].color}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {TOASTS[toastIdx].icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)' }}>{TOASTS[toastIdx].title}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{TOASTS[toastIdx].sub}</div>
            </div>
            <span className="live-dot" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Trust strip */}
      <div className="trust-strip" style={{ justifyContent: 'center' }}>
        <div className="trust-stat" style={{ textAlign: 'center' }}>
          <div className="num">46</div>
          <div className="lbl">Concepts</div>
        </div>
        <div className="trust-stat" style={{ textAlign: 'center' }}>
          <div className="num">120+</div>
          <div className="lbl">Questions</div>
        </div>
        <div className="trust-stat" style={{ textAlign: 'center' }}>
          <div className="num">7</div>
          <div className="lbl">Game Modes</div>
        </div>
      </div>
    </div>
  )
}

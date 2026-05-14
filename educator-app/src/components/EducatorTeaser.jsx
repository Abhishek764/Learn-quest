import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { Users, TrendingUp, Award, Activity } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]

export default function EducatorTeaser() {
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
        qRX[i](cx * 10 * factor)
        qRY[i](-cy * 8 * factor)
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
        style={{ textAlign: 'center', marginBottom: '2.5rem' }}
      >
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700,
          letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.75rem',
          background: 'linear-gradient(180deg,#fff 25%,#94a3b8 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Teach with clarity.<br />Track every learner.
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
          Build classes, write questions, and watch progress unfold across every concept your students touch.
        </p>
      </motion.div>

      <div ref={stackRef} className="float-stack" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {/* Card 1 — Class roster */}
        <motion.div
          className="float-card"
          initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(20,184,166,0.12)', color: '#2dd4bf',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(20,184,166,0.20)',
            }}>
              <Users size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Grade 9 · Math</div>
              <div style={{ fontSize: '0.92rem', color: 'var(--text-heading)', fontWeight: 600 }}>28 students enrolled</div>
            </div>
            <div style={{ display: 'flex', marginLeft: 'auto' }}>
              {['#14b8a6', '#0ea5e9', '#f59e0b', '#10b981', '#06b6d4'].map((c, i) => (
                <div key={i} style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: c, marginLeft: i === 0 ? 0 : -7,
                  border: '2px solid var(--bg-card-solid)', boxShadow: `0 0 8px ${c}40`,
                }} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Card 2 — Avg mastery sparkline */}
        <motion.div
          className="float-card"
          initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4, ease }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'rgba(14,165,233,0.12)', color: '#0ea5e9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingUp size={15} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg Mastery</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: 'var(--text-heading)', fontWeight: 700 }}>
                  74<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>
            </div>
            <span className="badge badge-success">+8 this wk</span>
          </div>
          <div className="sparkline" style={{ background: 'linear-gradient(180deg, rgba(14,165,233,0.16), transparent 80%)' }}>
            <svg viewBox="0 0 100 36" preserveAspectRatio="none">
              <defs>
                <linearGradient id="edu-spark1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,30 L12,28 L24,24 L36,26 L48,18 L60,22 L72,14 L84,10 L100,6 L100,36 L0,36 Z" fill="url(#edu-spark1)" />
              <path d="M0,30 L12,28 L24,24 L36,26 L48,18 L60,22 L72,14 L84,10 L100,6"
                fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
            </svg>
          </div>
        </motion.div>

        {/* Card 3 — Top performer */}
        <motion.div
          className="float-card"
          initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.55, ease }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(245,158,11,0.20)',
            }}>
              <Award size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 2 }}>
                <span className="live-dot" />
                <span style={{ fontSize: '0.62rem', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Live</span>
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-heading)', fontWeight: 600 }}>Maya · Lv 14 · 2,840 XP</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Just mastered: Linear Equations</div>
            </div>
            <Activity size={15} style={{ color: 'var(--accent-bright)' }} />
          </div>
        </motion.div>
      </div>

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
          <div className="num">ABOA</div>
          <div className="lbl">AI engine</div>
        </div>
      </div>
    </div>
  )
}

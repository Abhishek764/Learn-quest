import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function AuroraHero({ children }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const orbs = el.querySelectorAll('.hero-orb')
    const qx = Array.from(orbs).map(o => gsap.quickTo(o, 'x', { duration: 1.2, ease: 'power3.out' }))
    const qy = Array.from(orbs).map(o => gsap.quickTo(o, 'y', { duration: 1.2, ease: 'power3.out' }))

    function onMove(e) {
      const rect = el.getBoundingClientRect()
      const cx = (e.clientX - rect.left) / rect.width - 0.5
      const cy = (e.clientY - rect.top) / rect.height - 0.5
      orbs.forEach((_, i) => {
        const depth = (i + 1) * 18
        qx[i](cx * depth)
        qy[i](cy * depth)
      })
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div ref={ref} className="auth-pane-hero">
      <div className="aurora-mesh" />
      <div className="aurora-grid" />
      <div
        className="hero-orb"
        style={{
          position: 'absolute', width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.35), transparent 70%)',
          filter: 'blur(60px)', top: '-10%', left: '-10%', pointerEvents: 'none',
        }}
      />
      <div
        className="hero-orb"
        style={{
          position: 'absolute', width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.25), transparent 70%)',
          filter: 'blur(50px)', bottom: '-10%', right: '-5%', pointerEvents: 'none',
        }}
      />
      <div style={{
        position: 'relative', zIndex: 2, height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(2rem, 4vw, 4rem)',
      }}>
        {children}
      </div>
    </div>
  )
}

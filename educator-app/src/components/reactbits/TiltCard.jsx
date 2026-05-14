import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

export default function TiltCard({
  children, className = '', style = {}, maxTilt = 8, scale = 1.015, ...rest
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const qRX = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power2.out' })
    const qRY = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power2.out' })
    const qS  = gsap.quickTo(el, 'scale',     { duration: 0.6, ease: 'power2.out' })

    function onMove(e) {
      const rect = el.getBoundingClientRect()
      const cx = (e.clientX - rect.left) / rect.width - 0.5
      const cy = (e.clientY - rect.top) / rect.height - 0.5
      qRX(-cy * maxTilt)
      qRY(cx * maxTilt)
      qS(scale)
    }
    function onLeave() {
      qRX(0); qRY(0); qS(1)
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [maxTilt, scale])

  return (
    <div ref={ref} className={`rb-tilt ${className}`} style={{ transformStyle: 'preserve-3d', willChange: 'transform', ...style }} {...rest}>
      {children}
    </div>
  )
}

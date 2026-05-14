import { useRef } from 'react'

export default function GlareCard({
  children, className = '', style = {}, glareColor = 'rgba(255,255,255,0.18)', ...rest
}) {
  const ref = useRef(null)

  function onMove(e) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    el.style.setProperty('--gx', `${x}%`)
    el.style.setProperty('--gy', `${y}%`)
    el.style.setProperty('--g-opacity', '1')
  }
  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--g-opacity', '0')
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`rb-glare ${className}`}
      style={{ ['--glare-color']: glareColor, ...style }}
      {...rest}
    >
      <div className="rb-glare-shine" />
      <div className="rb-glare-inner">{children}</div>
    </div>
  )
}

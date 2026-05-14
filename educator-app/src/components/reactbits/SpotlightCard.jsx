import { useRef } from 'react'

export default function SpotlightCard({
  children, className = '', style = {},
  spotlightColor = 'rgba(20,184,166,0.18)',
  radius = 360,
  ...rest
}) {
  const ref = useRef(null)

  function onMove(e) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--sx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--sy', `${e.clientY - rect.top}px`)
    el.style.setProperty('--opacity', '1')
  }
  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--opacity', '0')
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`rb-spotlight ${className}`}
      style={{
        ['--spotlight-color']: spotlightColor,
        ['--spotlight-radius']: `${radius}px`,
        ...style,
      }}
      {...rest}
    >
      <div className="rb-spotlight-glow" />
      <div className="rb-spotlight-inner">{children}</div>
    </div>
  )
}

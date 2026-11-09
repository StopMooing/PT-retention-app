// A looping drawing of how an exercise moves, for every exercise whose name matches one of
// our movement patterns (squat, hinge, press, row, curl and so on). Shown in the exercise
// sheets on both sides. Our own artwork, so there is nothing to license. Nothing renders
// for exercises with no pattern (cardio machines, for example).
import { useEffect, useRef, useState } from 'react'
import { PATTERNS, matchPattern } from './patterns'
import { pose, blend, cycle } from './rig'
import { figure, GROUND } from './draw'

const TONE = {
  body: 'var(--ink)', far: 'var(--faint)', gear: 'var(--dot)', kit: 'var(--line-strong)', cable: 'var(--faint)',
}

function Shape({ s }) {
  if (s.k === 'line') return <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={TONE[s.tone]} strokeWidth={s.w} strokeLinecap="round" />
  if (s.k === 'circle') return <circle cx={s.cx} cy={s.cy} r={s.r} fill={TONE[s.tone]} />
  return <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} fill={TONE[s.tone]} />
}

export default function MovementDemo({ name, className = '' }) {
  const key = matchPattern(name)
  const p = key ? PATTERNS[key] : null
  const [t, setT] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (!p) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let visible = true
    const start = performance.now()
    const tick = (now) => {
      if (visible) setT(cycle(now - start, p.period))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const io = ref.current && 'IntersectionObserver' in window
      ? new IntersectionObserver(([e]) => { visible = e.isIntersecting })
      : null
    if (io) io.observe(ref.current)
    return () => { cancelAnimationFrame(raf); io?.disconnect() }
  }, [p])

  if (!p) return null
  const j = pose(blend(p.A, p.B, t))
  const shapes = [
    ...(p.scene || []),
    { k: 'rect', x: 8, y: GROUND, w: 224, h: 2.5, rx: 1, tone: 'kit' },
    ...figure(j),
    ...(p.kit ? p.kit(j) : []),
  ]
  return (
    <div ref={ref} className={`rounded-[16px] bg-surface-2 overflow-hidden ${className}`}>
      <svg viewBox={p.view || '0 0 240 200'} className="block w-full h-auto max-h-[240px] mx-auto" role="img" aria-label={`How ${name} moves`}>
        {shapes.map((s, i) => <Shape key={i} s={s} />)}
      </svg>
    </div>
  )
}

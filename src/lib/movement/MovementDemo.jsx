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

// Off until every drawing has been checked one by one (Luke, 9 Nov: too many were wrong).
const ON = false

function Shape({ s }) {
  if (s.k === 'line') return <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={TONE[s.tone]} strokeWidth={s.w} strokeLinecap="round" />
  if (s.k === 'circle') return <circle cx={s.cx} cy={s.cy} r={s.r} fill={TONE[s.tone]} />
  return <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} fill={TONE[s.tone]} />
}

// A square view around the figure and its kit, so a small still fills its box.
function fitBox(shapes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  const add = (x, y, r = 0) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r) }
  for (const s of shapes) {
    if (s.k === 'line') { add(s.x1, s.y1, s.w / 2); add(s.x2, s.y2, s.w / 2) }
    else if (s.k === 'circle') add(s.cx, s.cy, s.r)
    else { add(s.x, s.y); add(s.x + s.w, s.y + s.h) }
  }
  const size = Math.max(x1 - x0, y1 - y0) + 16
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  return `${cx - size / 2} ${cy - size / 2} ${size} ${size}`
}

// A still of the movement for lists: the end of the move, small. Muscle group initial
// when there is no drawing, so every row has something in the same spot.
export function MovementThumb({ name, fallback = '', size = 44 }) {
  if (!ON) return null
  const key = matchPattern(name)
  const p = key ? PATTERNS[key] : null
  const box = { width: size, height: size }
  if (!p) {
    return (
      <span style={box} className="rounded-[12px] bg-surface-2 text-muted text-[13px] font-bold flex items-center justify-center shrink-0" aria-hidden="true">
        {String(fallback).slice(0, 2)}
      </span>
    )
  }
  const j = pose(blend(p.A, p.B, p.thumb ?? 1))
  const shapes = [...figure(j), ...(p.kit ? p.kit(j) : [])]
  return (
    <span style={box} className="rounded-[12px] bg-surface-2 overflow-hidden shrink-0 flex items-center justify-center" aria-hidden="true">
      <svg viewBox={fitBox(shapes)} className="w-full h-full">
        {shapes.map((s, i) => <Shape key={i} s={s} />)}
      </svg>
    </span>
  )
}

export default function MovementDemo({ name, className = '' }) {
  const key = ON ? matchPattern(name) : null
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

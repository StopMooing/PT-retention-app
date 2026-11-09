// A looping drawing of how an exercise moves: a side-on person with the working muscles
// tinted and the right kit (bar, dumbbells, cable, band, bench). Only exercises listed by
// exact name in library.js get one, so nothing renders for the rest (cardio machines,
// complexes). Our own artwork, so there is nothing to license. Colours come from the
// --fig-* variables in index.css, so light and dark both work.
import { useEffect, useMemo, useRef, useState } from 'react'
import { MOVES, GROUND } from './moves'
import { drawingFor } from './library'
import { pose, blend, cycle } from './rig'
import { body } from './body'
import { kitFor } from './kit'

const C = {
  body: 'var(--fig-body)', far: 'var(--fig-far)', muscle: 'var(--fig-muscle)', kit: 'var(--fig-kit)',
  gear: 'var(--fig-gear)', gearIn: 'var(--fig-bg)', band: 'var(--fig-band)', cable: 'var(--fig-cable)',
  shadow: 'var(--fig-shadow)', none: 'none',
}

function Shape({ s, outline }) {
  const ol = s.outline ? { stroke: 'var(--fig-bg)', strokeWidth: outline, strokeLinejoin: 'round' } : null
  if (s.k === 'path') {
    const st = s.stroke ? { stroke: C[s.stroke], strokeWidth: s.w, strokeLinecap: 'round' } : ol
    return <path d={s.d} fill={C[s.tone]} {...st} />
  }
  if (s.k === 'circle') return <circle cx={s.cx} cy={s.cy} r={s.r} fill={C[s.tone]} {...ol} />
  if (s.k === 'ellipse') return <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={C[s.tone]} />
  if (s.k === 'line') return <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={C[s.tone]} strokeWidth={s.w} strokeLinecap="round" />
  return <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} fill={C[s.tone]} />
}

// Everything drawn for one moment of the move.
function frame(d, t) {
  const p = MOVES[d.move]
  const j = pose(blend(p.A, p.B, t))
  const k = kitFor(d.kit, p, j)
  return { j, shapes: [...(p.scene || []), ...k.behind, ...body(j, d.work || p.work || []), ...k.front] }
}

// A view around the figure and its kit over the whole move (so nothing moves out of the
// box), at the given width:height, with the floor near the bottom.
function fitView(d, ratio, ts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  let floor = false // drawn only when something stands on it (not under a hanging figure)
  const add = (x, y, r = 0) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r) }
  for (const t of ts) {
    const { j, shapes } = frame(d, t)
    for (const pt of Object.values(j)) { add(pt[0], pt[1], 13); if (pt[1] > GROUND - 14) floor = true }
    for (const s of shapes) {
      if (s.k === 'line') { add(s.x1, s.y1, s.w / 2); add(s.x2, s.y2, s.w / 2) }
      else if (s.k === 'circle') add(s.cx, s.cy, s.r)
      else if (s.k === 'rect') { add(s.x, s.y); add(s.x + s.w, s.y + s.h); if (s.y + s.h >= GROUND - 1) floor = true }
    }
  }
  if (floor) y1 = Math.max(y1, GROUND + 3)
  const pad = 12
  let w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2
  if (w / h < ratio) w = h * ratio
  else h = w / ratio
  const cx = (x0 + x1) / 2
  const bottom = y1 + pad
  return { x: cx - w / 2, y: floor ? bottom - h : (y0 + y1) / 2 - h / 2, w, h, floor }
}

function Drawing({ d, t, view, outline, label }) {
  const { shapes } = frame(d, t)
  return (
    <svg viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} className="block w-full h-full" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {view.floor && <rect x={view.x} y={GROUND} width={view.w} height={2.5} rx={1} fill={C.kit} />}
      {shapes.map((s, i) => <Shape key={i} s={s} outline={outline} />)}
    </svg>
  )
}

// A still for lists: the end of the move, filling a small square. Muscle group initials
// when there is no drawing, so every row has something in the same spot.
export function MovementThumb({ name, fallback = '', size = 44 }) {
  const d = drawingFor(name)
  const view = useMemo(() => (d ? fitView(d, 1, [1]) : null), [d?.move, d?.kit]) // eslint-disable-line react-hooks/exhaustive-deps
  const box = { width: size, height: size }
  if (!d) {
    return (
      <span style={box} className="rounded-[12px] bg-surface-2 text-muted text-[13px] font-bold flex items-center justify-center shrink-0" aria-hidden="true">
        {String(fallback).slice(0, 2)}
      </span>
    )
  }
  return (
    <span style={{ ...box, backgroundColor: 'var(--fig-bg)' }} className="rounded-[12px] overflow-hidden shrink-0" aria-hidden="true">
      <Drawing d={d} t={1} view={view} outline={3} />
    </span>
  )
}

export default function MovementDemo({ name, className = '' }) {
  const d = drawingFor(name)
  const view = useMemo(() => (d ? fitView(d, 4 / 3, [0, 0.25, 0.5, 0.75, 1]) : null), [d?.move, d?.kit]) // eslint-disable-line react-hooks/exhaustive-deps
  const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [t, setT] = useState(still ? 1 : 0)
  const ref = useRef(null)
  const key = d ? d.move : null

  useEffect(() => {
    if (!key || still) return
    let raf = 0
    let visible = true
    const start = performance.now()
    const tick = (now) => {
      if (visible) setT(cycle(now - start, 2800))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const io = ref.current && 'IntersectionObserver' in window
      ? new IntersectionObserver(([e]) => { visible = e.isIntersecting })
      : null
    if (io) io.observe(ref.current)
    return () => { cancelAnimationFrame(raf); io?.disconnect() }
  }, [key, still])

  if (!d) return null
  return (
    <div ref={ref} style={{ backgroundColor: 'var(--fig-bg)' }} className={`rounded-[16px] overflow-hidden ${className}`}>
      <div className="mx-auto aspect-[4/3] max-h-[280px]">
        <Drawing d={d} t={t} view={view} outline={2.2} label={`How ${name} moves`} />
      </div>
    </div>
  )
}

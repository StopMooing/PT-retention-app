// Body weight over time: each weigh-in as a small dot, the 7-day average as the line.
// The trend matters more than any single day, so the line is what stands out.
import { useState } from 'react'
import { parseDay, formatShortDate } from './dates'

const W = 340
const H = 168
const PAD = { top: 12, right: 36, bottom: 24, left: 4 }

// onHero: drawn inside the hero block, so it uses the hero colours.
const PLAIN = { grid: 'var(--line)', text: 'var(--muted)', line: 'var(--accent)', area: 'var(--accent)', dot: 'var(--faint)', picked: 'var(--ink)' }
const HERO = { grid: 'var(--hero-track)', text: 'var(--hero-muted)', line: 'var(--on-hero)', area: 'var(--on-hero)', dot: 'var(--hero-muted)', picked: 'var(--hero-dot)' }

export default function WeightChart({ series, onHero }) {
  const [picked, setPicked] = useState(null)
  const C = onHero ? HERO : PLAIN
  if (series.length < 2) return null

  const t0 = parseDay(series[0].date).getTime()
  const span = Math.max(1, parseDay(series[series.length - 1].date).getTime() - t0)
  const values = series.flatMap((p) => [p.weight, p.avg])
  const lo = Math.floor(Math.min(...values) - 0.5)
  const hi = Math.ceil(Math.max(...values) + 0.5)
  const x = (d) => PAD.left + ((parseDay(d).getTime() - t0) / span) * (W - PAD.left - PAD.right)
  const y = (v) => PAD.top + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD.top - PAD.bottom)

  const line = series.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)} ${y(p.avg).toFixed(1)}`).join(' ')
  const area = `${line} L${x(series[series.length - 1].date).toFixed(1)} ${H - PAD.bottom} L${x(series[0].date).toFixed(1)} ${H - PAD.bottom} Z`
  const ticks = [hi, (hi + lo) / 2, lo]
  const label = (d) => parseDay(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  const sel = picked !== null ? series[picked] : null

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="Body weight chart with 7-day average">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={C.grid} strokeWidth="1" />
            <text x={W - PAD.right + 6} y={y(t) + 4} fontSize="11" fill={C.text}>{Math.round(t * 10) / 10}</text>
          </g>
        ))}
        <path d={area} fill={C.area} fillOpacity="0.08" />
        {series.map((p, i) => (
          <circle key={p.date} cx={x(p.date)} cy={y(p.weight)} r={picked === i ? 4.5 : 2.5} fill={picked === i ? C.picked : C.dot} />
        ))}
        <path d={line} fill="none" stroke={C.line} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {series.map((p, i) => (
          <circle key={`hit${p.date}`} cx={x(p.date)} cy={y(p.weight)} r="11" fill="transparent" onClick={() => setPicked(picked === i ? null : i)} style={{ cursor: 'pointer' }} />
        ))}
        <text x={PAD.left} y={H - 6} fontSize="11" fill={C.text}>{label(series[0].date)}</text>
        <text x={W - PAD.right} y={H - 6} fontSize="11" fill={C.text} textAnchor="end">{label(series[series.length - 1].date)}</text>
      </svg>
      <div className={`flex items-center justify-between gap-3 mt-1 text-xs min-h-[18px] ${onHero ? 'text-hero-muted' : 'text-muted'}`}>
        {sel ? (
          <span className={`font-bold ${onHero ? 'text-on-hero' : 'text-ink'}`}>{sel.weight} kg on {formatShortDate(sel.date)} <span className={`font-semibold ${onHero ? 'text-hero-muted' : 'text-muted'}`}>(average {sel.avg} kg)</span></span>
        ) : (
          <>
            <span className="flex items-center gap-1.5"><span className="w-4 h-[3px] rounded-full" style={{ backgroundColor: C.line }} /> 7-day average</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.dot }} /> Weigh-ins</span>
          </>
        )}
      </div>
    </div>
  )
}

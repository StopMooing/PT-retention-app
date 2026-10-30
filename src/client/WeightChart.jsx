// Body weight over time: each weigh-in as a small dot, the 7-day average as the line.
// The trend matters more than any single day, so the line is what stands out.
import { useState } from 'react'
import { parseDay, formatShortDate } from './dates'

const W = 340
const H = 168
const PAD = { top: 12, right: 36, bottom: 24, left: 4 }

export default function WeightChart({ series }) {
  const [picked, setPicked] = useState(null)
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
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={W - PAD.right + 6} y={y(t) + 4} fontSize="11" fill="var(--muted)">{Math.round(t * 10) / 10}</text>
          </g>
        ))}
        <path d={area} fill="var(--accent)" fillOpacity="0.08" />
        {series.map((p, i) => (
          <circle key={p.date} cx={x(p.date)} cy={y(p.weight)} r={picked === i ? 4.5 : 2.5} fill={picked === i ? 'var(--ink)' : 'var(--faint)'} />
        ))}
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {series.map((p, i) => (
          <circle key={`hit${p.date}`} cx={x(p.date)} cy={y(p.weight)} r="11" fill="transparent" onClick={() => setPicked(picked === i ? null : i)} style={{ cursor: 'pointer' }} />
        ))}
        <text x={PAD.left} y={H - 6} fontSize="11" fill="var(--muted)">{label(series[0].date)}</text>
        <text x={W - PAD.right} y={H - 6} fontSize="11" fill="var(--muted)" textAnchor="end">{label(series[series.length - 1].date)}</text>
      </svg>
      <div className="flex items-center justify-between gap-3 mt-1 text-xs text-muted min-h-[18px]">
        {sel ? (
          <span className="text-ink font-bold">{sel.weight} kg on {formatShortDate(sel.date)} <span className="text-muted font-semibold">(average {sel.avg} kg)</span></span>
        ) : (
          <>
            <span className="flex items-center gap-1.5"><span className="w-4 h-[3px] rounded-full bg-accent" /> 7-day average</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-faint" /> Weigh-ins</span>
          </>
        )}
      </div>
    </div>
  )
}

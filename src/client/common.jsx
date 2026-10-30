// Small pieces shared by the client screens. Built from src/ui so they match the app.
import { ArrowLeft, Check } from 'lucide-react'
import { Mark } from '../ui'
import { toLocalDateStr, addDays, parseDay } from './dates'

const cx = (...c) => c.filter(Boolean).join(' ')

export function Loading({ full }) {
  return (
    <div className={cx('flex items-center justify-center text-ink', full ? 'min-h-screen bg-bg' : 'py-16')}>
      <Mark size={36} className="animate-pulse" />
    </div>
  )
}

/* Full-screen page that sits over the tabs (workout preview, logging, chat). */
export function Overlay({ children, z = 'z-40' }) {
  return (
    <div className={cx('fixed inset-0 bg-bg', z)}>
      <div className="h-full max-w-[480px] mx-auto flex flex-col">{children}</div>
    </div>
  )
}

export function BackHeader({ onBack, eyebrow, title, right, children }) {
  return (
    <div className="shrink-0 bg-bg border-b border-line px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3">
      <div className="flex items-center gap-3">
        <button onClick={onBack} aria-label="Back" className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-ink hover:bg-surface-2 shrink-0">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          {eyebrow && <p className="text-[13px] text-muted truncate">{eyebrow}</p>}
          <h1 className="text-[19px] font-bold text-ink truncate leading-tight">{title}</h1>
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

export function Toast({ message }) {
  if (!message) return null
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] bg-ink text-bg text-sm font-bold px-5 py-3 rounded-full shadow-lg pointer-events-none whitespace-nowrap">
      {message}
    </div>
  )
}

/* Thin horizontal bar for a macro. color is a CSS var like 'var(--protein)'. */
export function MacroBar({ label, value, target, color, unit = 'g' }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  const left = target > 0 ? target - value : null
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-bold text-ink">{label}</span>
        <span className="text-[13px] text-muted tabular-nums">
          {value}{target > 0 ? ` / ${target}` : ''} {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 mt-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {left !== null && (
        <p className="text-xs text-muted mt-1 tabular-nums">{left >= 0 ? `${left} ${unit} to go` : `${-left} ${unit} over`}</p>
      )}
    </div>
  )
}

/* Grid of upcoming days (from today) for picking one or many dates.
   selected: array of 'YYYY-MM-DD'. busy: Set of dates that already have a session. */
export function DayGrid({ days = 28, selected = [], onToggle, busy }) {
  const today = toLocalDateStr()
  const list = Array.from({ length: days }, (_, i) => addDays(today, i))
  const dow = parseDay(list[0]).getDay()
  const pad = dow === 0 ? 6 : dow - 1
  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs font-bold text-faint py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: pad }).map((_, i) => <div key={`p${i}`} />)}
        {list.map((d) => {
          const on = selected.includes(d)
          const isToday = d === today
          return (
            <button
              key={d}
              onClick={() => onToggle(d)}
              className={cx(
                'h-11 rounded-full flex flex-col items-center justify-center transition-colors',
                on ? 'bg-accent text-on-accent' : isToday ? 'ring-2 ring-inset ring-accent text-ink' : 'text-ink hover:bg-surface-2',
              )}
            >
              <span className="text-sm font-bold tabular-nums">{parseInt(d.slice(8), 10)}</span>
              <span className={cx('w-1 h-1 rounded-full mt-0.5', busy?.has(d) ? (on ? 'bg-on-accent' : 'bg-muted') : 'bg-transparent')} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* Round tick used for done sessions and sets. */
export function DoneDot({ done, size = 28 }) {
  return (
    <span
      className={cx('rounded-full flex items-center justify-center shrink-0', done ? 'bg-accent text-on-accent' : 'border-2 border-line-strong')}
      style={{ width: size, height: size }}
    >
      {done && <Check size={size * 0.55} strokeWidth={3} />}
    </span>
  )
}

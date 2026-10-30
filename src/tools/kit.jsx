// Small pieces shared by the coach tool pages (programs, exercises, nutrition, habits).
// Built on src/ui and the semantic colour tokens only.
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronDown, Search, X, Check, AlertCircle } from 'lucide-react'
import { Mark } from '../ui'

const cx = (...c) => c.filter(Boolean).join(' ')

/* Loading: a small pulsing mark, not a spinner. */
export function Loading({ className }) {
  return (
    <div className={cx('flex items-center justify-center py-16 text-ink', className)} aria-label="Loading">
      <Mark size={36} className="animate-pulse" />
    </div>
  )
}

/* A short message that floats above the bottom of the screen (see useToast.js). */
export function Toast({ toast }) {
  if (!toast) return null
  const bad = toast.tone === 'bad'
  return (
    <div
      role="status"
      className="fixed left-1/2 -translate-x-1/2 z-[60] max-w-[calc(100vw-32px)]"
      style={{ bottom: 'calc(24px + env(safe-area-inset-bottom))' }}
    >
      <div
        className={cx(
          'flex items-center gap-2 pl-3 pr-4 h-11 rounded-full shadow-lg border text-sm font-bold',
          bad ? 'bg-bad-soft text-bad border-bad/20' : 'bg-ink text-bg border-transparent',
        )}
      >
        {bad ? <AlertCircle size={18} className="shrink-0" /> : <Check size={18} className="shrink-0" />}
        <span className="truncate">{toast.message}</span>
      </div>
    </div>
  )
}

export function BackLink({ onClick, children }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 h-9 -ml-1.5 pr-2 text-sm font-bold text-muted hover:text-ink">
      <ChevronLeft size={18} />
      {children}
    </button>
  )
}

const inputBase =
  'w-full rounded-[14px] border border-line-strong bg-surface text-ink placeholder:text-faint outline-none transition-colors focus:border-accent'

export function Select({ label, className, children, ...rest }) {
  return (
    <label className={cx('flex flex-col gap-1.5', className)}>
      {label && <span className="text-sm font-semibold text-ink">{label}</span>}
      <span className="relative">
        <select className={cx(inputBase, 'h-12 pl-4 pr-10 appearance-none')} {...rest}>
          {children}
        </select>
        <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      </span>
    </label>
  )
}

export function TextArea({ label, className, rows = 3, ...rest }) {
  return (
    <label className={cx('flex flex-col gap-1.5', className)}>
      {label && <span className="text-sm font-semibold text-ink">{label}</span>}
      <textarea rows={rows} className={cx(inputBase, 'px-4 py-3 resize-none leading-relaxed')} {...rest} />
    </label>
  )
}

/* Compact labelled number/text box for quick edits (sets, reps, rest, grams). */
export function MiniField({ label, className, ...rest }) {
  return (
    <label className={cx('flex flex-col gap-1 min-w-0', className)}>
      <span className="text-xs font-semibold text-muted">{label}</span>
      <input className={cx(inputBase, 'h-11 px-3 text-center font-bold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none')} {...rest} />
    </label>
  )
}

export function SearchBox({ value, onChange, placeholder = 'Search', autoFocus, className }) {
  return (
    <div className={cx('relative', className)}>
      <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(inputBase, 'h-12 pl-11 pr-10')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-2"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

/* One-row, sideways-scrolling filter pills. options: [{ value, label }] or strings. */
export function FilterChips({ options, value, onChange, className }) {
  return (
    <div className={cx('flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none]', className)}>
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cx(
              'shrink-0 h-9 px-3.5 rounded-full text-sm font-bold whitespace-nowrap border transition-colors',
              active ? 'bg-accent text-on-accent border-accent' : 'bg-surface text-muted border-line hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* A remove button that asks once before acting. First tap arms it, second tap confirms. */
export function ConfirmRemove({ onConfirm, label = 'Remove', confirmLabel = 'Tap again to remove', icon: Icon, disabled, className }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3500)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (armed) { setArmed(false); onConfirm() } else setArmed(true)
      }}
      aria-label={armed ? confirmLabel : label}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-bold text-sm transition-colors disabled:opacity-50',
        armed ? 'h-9 px-3.5 bg-bad text-bg' : Icon ? 'w-9 h-9 text-faint hover:text-bad hover:bg-bad-soft' : 'h-9 px-3.5 bg-bad-soft text-bad',
        className,
      )}
    >
      {armed ? confirmLabel : Icon ? <Icon size={18} /> : label}
    </button>
  )
}

// UNFNSHD building blocks. Every screen is made from these so the app looks like one
// product in both light and dark mode. Colours come from the semantic tokens in
// index.css (bg, surface, ink, muted, line, accent...). Keep this file small: add a
// piece here only when two or more screens need it.
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useTheme } from '../theme'

const cx = (...c) => c.filter(Boolean).join(' ')

/* The open ring. Ink ring, accent dot in the gap. */
export function Mark({ size = 28, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" aria-hidden="true" className={className}>
      <g transform="rotate(-30 120 120)">
        <circle cx="120" cy="120" r="80" fill="none" stroke="currentColor" strokeWidth="26" strokeLinecap="round" strokeDasharray="400 102.65" />
      </g>
      <circle cx="160" cy="50.7" r="15" fill="var(--accent)" />
    </svg>
  )
}

export function Logo({ size = 24, className }) {
  return (
    <span className={cx('inline-flex items-center gap-2 text-ink', className)}>
      <Mark size={size} />
      <span className="font-display uppercase leading-none tracking-[0.01em]" style={{ fontSize: size * 0.95 }}>UNFNSHD</span>
    </span>
  )
}

/* Big rounded title for the top of a screen. */
export function PageTitle({ title, eyebrow, action, className }) {
  return (
    <div className={cx('flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-sm text-muted mb-0.5">{eyebrow}</p>}
        <h1 className="font-display text-[32px] leading-[1.05] text-ink truncate">{title}</h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* Small label above a group of content, with an optional link on the right. */
export function SectionLabel({ children, action, className }) {
  return (
    <div className={cx('flex items-center justify-between mb-2.5 px-1', className)}>
      <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">{children}</h2>
      {action}
    </div>
  )
}

export function Card({ as: Tag = 'div', className, children, padded = true, ...rest }) {
  const interactive = !!rest.onClick
  return (
    <Tag
      className={cx(
        'bg-surface rounded-[20px] border border-line',
        padded && 'p-4',
        interactive && 'text-left w-full cursor-pointer transition-transform active:scale-[0.99]',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

const BUTTON = {
  primary: 'bg-accent text-on-accent hover:bg-accent-strong',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2',
  soft: 'bg-accent-soft text-accent hover:brightness-95',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'bg-bad-soft text-bad hover:brightness-95',
}
const SIZE = { sm: 'h-9 px-3.5 text-sm', md: 'h-11 px-5 text-[15px]', lg: 'h-[52px] px-6 text-base' }

export function Button({ variant = 'primary', size = 'md', block, className, children, ...rest }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none',
        BUTTON[variant], SIZE[size], block && 'w-full', className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

const CHIP = {
  neutral: 'bg-surface-2 text-muted',
  accent: 'bg-accent-soft text-accent',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  solid: 'bg-accent text-on-accent',
}
export function Chip({ tone = 'neutral', className, children }) {
  return (
    <span className={cx('inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-bold whitespace-nowrap', CHIP[tone], className)}>
      {children}
    </span>
  )
}

/* Progress ring. value 0..1. Round line ends, like the logo. */
export function Ring({ value = 0, size = 64, stroke = 7, color = 'var(--accent)', track = 'var(--surface-2)', children, className }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value || 0))
  return (
    <div className={cx('relative inline-flex items-center justify-center shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {v > 0 && (
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${c * v} ${c}`} style={{ transition: 'stroke-dasharray 400ms ease' }}
          />
        )}
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>}
    </div>
  )
}

/* Pill switch between a few views. options: [{ value, label }] */
export function Segmented({ options, value, onChange, className }) {
  return (
    <div className={cx('flex p-1 rounded-full bg-surface-2', className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'flex-1 h-9 px-3 rounded-full text-sm font-bold whitespace-nowrap transition-colors',
              active ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* One number with a label. */
export function Stat({ label, value, unit, hint, className }) {
  return (
    <div className={cx('min-w-0', className)}>
      <p className="text-[13px] text-muted truncate">{label}</p>
      <p className="font-display text-[28px] leading-tight text-ink">
        {value}
        {unit && <span className="font-sans text-sm font-semibold text-muted ml-1">{unit}</span>}
      </p>
      {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
    </div>
  )
}

export function Avatar({ name = '', src, size = 40, className }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?'
  return src ? (
    <img src={src} alt="" className={cx('rounded-full object-cover shrink-0', className)} style={{ width: size, height: size }} />
  ) : (
    <span
      className={cx('rounded-full bg-accent-soft text-accent font-bold inline-flex items-center justify-center shrink-0', className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  )
}

/* Bottom sheet on phones, centred dialog on wider screens. actions: optional buttons in
   the header, before the close button. */
export function Sheet({ open, onClose, title, children, footer, actions }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* rgba, not bg-black: "black" is the ink colour, which is light in dark mode */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-md max-h-[90vh] flex flex-col bg-surface rounded-t-[24px] sm:rounded-[24px] border border-line shadow-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
          <h3 className="flex-1 min-w-0 text-lg font-bold text-ink truncate">{title}</h3>
          {actions}
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-muted hover:bg-surface-2">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 pb-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-line">{footer}</div>}
      </div>
    </div>
  )
}

/* A photo filling the screen, for tapping a thumbnail to see it big. Dark backdrop in
   both modes (it's a photo viewer). footer: optional actions under the photo. */
export function PhotoViewer({ src, caption, onClose, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])
  return (
    <div role="dialog" aria-modal="true" aria-label={caption || 'Photo'} className="fixed inset-0 z-[70] flex flex-col" style={{ backgroundColor: '#000', color: 'rgba(255,255,255,0.95)' }}>
      <div className="flex items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),16px)] pb-2">
        <p className="text-[15px] font-bold truncate">{caption}</p>
        <button onClick={onClose} aria-label="Close" className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center px-4" onClick={onClose}>
        {src && <img src={src} alt={caption || ''} className="max-w-full max-h-full object-contain rounded-[12px]" onClick={(e) => e.stopPropagation()} />}
      </div>
      {footer && <div className="px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">{footer}</div>}
    </div>
  )
}

/* Coach-side only: a calm placeholder for an empty list. Client screens hide empty
   sections instead (house rule). */
export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-6">
      {Icon && (
        <span className="w-12 h-12 rounded-full bg-surface-2 text-muted flex items-center justify-center mb-3">
          <Icon size={22} />
        </span>
      )}
      <p className="font-bold text-ink">{title}</p>
      {body && <p className="text-sm text-muted mt-1 max-w-xs">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* Light / Dark / Phone switch for Settings. */
export function ThemeSwitch({ className }) {
  const { choice, setChoice } = useTheme()
  return (
    <Segmented
      className={className}
      value={choice}
      onChange={setChoice}
      options={[
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'system', label: 'Match phone' },
      ]}
    />
  )
}

/* Text input styled for both modes. */
export function Field({ label, hint, className, inputClassName, id, ...rest }) {
  return (
    <label className={cx('flex flex-col gap-1.5', className)} htmlFor={id}>
      {label && <span className="text-sm font-semibold text-ink">{label}</span>}
      <input
        id={id}
        className={cx(
          'h-12 px-4 rounded-[14px] border border-line-strong bg-surface text-ink placeholder:text-faint outline-none transition-colors focus:border-accent',
          inputClassName,
        )}
        {...rest}
      />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  )
}

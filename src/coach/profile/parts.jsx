// Small pieces shared by the client profile tabs. Colours are semantic tokens only.
import { useEffect, useRef } from 'react'
import { Send, Pencil } from 'lucide-react'
import { Card, Chip, Button } from '../../ui'
import { formatDate, relativeDay, checkinNote } from '../lib'

const cx = (...c) => c.filter(Boolean).join(' ')

/* Card with a title row. */
export function Panel({ title, icon: Icon, action, sub, children, className, bodyClassName, padded = true }) {
  return (
    <Card padded={false} className={cx('overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-1">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon size={18} className="text-muted shrink-0" />}
            <h3 className="text-[17px] font-bold text-ink truncate">{title}</h3>
            {sub && <span className="text-[13px] text-muted whitespace-nowrap">{sub}</span>}
          </div>
          {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={cx(padded && 'p-4 pt-3', bodyClassName)}>{children}</div>
    </Card>
  )
}

export function TextArea({ className, ...rest }) {
  return (
    <textarea
      className={cx(
        'w-full px-4 py-3 rounded-[14px] border border-line-strong bg-surface text-ink text-[15px] leading-relaxed placeholder:text-faint outline-none focus:border-accent transition-colors resize-none',
        className,
      )}
      {...rest}
    />
  )
}

/* Number box with a unit on the right. */
export function UnitInput({ unit, className, inputClassName, icon: Icon, ...rest }) {
  return (
    <label className={cx('flex items-center gap-2 h-12 px-4 rounded-[14px] border border-line-strong bg-surface focus-within:border-accent transition-colors', className)}>
      {Icon && <Icon size={16} className="text-muted shrink-0" />}
      <input type="number" inputMode="decimal" className={cx('w-full min-w-0 bg-transparent text-ink font-semibold outline-none placeholder:text-faint placeholder:font-normal', inputClassName)} {...rest} />
      {unit && <span className="text-[13px] text-muted shrink-0">{unit}</span>}
    </label>
  )
}

/* Five-step score as a row of pills. */
export function ScoreMeter({ label, score }) {
  const s = Number(score) || 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-[13px] text-muted shrink-0">{label}</span>
      <span className="flex gap-1 flex-1 max-w-[160px]">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={cx('h-2 flex-1 rounded-full', n <= s ? 'bg-accent' : 'bg-surface-2')} />
        ))}
      </span>
      <span className="text-sm font-bold text-ink tabular-nums w-8 text-right">{s || '-'}/5</span>
    </div>
  )
}

/* Horizontal progress bar. value 0..1 */
export function Bar({ value, color = 'var(--accent)', className }) {
  const v = Math.max(0, Math.min(1, value || 0))
  return (
    <div className={cx('h-2 rounded-full bg-surface-2 overflow-hidden', className)}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${v * 100}%`, backgroundColor: color }} />
    </div>
  )
}

/* Small line chart. series: [{ values: number[], color, dots?, width? }]. Optional dashed target line. */
export function LineChart({ series, labels = [], target, height = 120 }) {
  const W = 400
  const all = series.flatMap((s) => s.values.filter((v) => v != null))
  if (target) all.push(target)
  if (all.length === 0) return null
  let min = Math.min(...all)
  let max = Math.max(...all)
  if (max - min < 1) { min -= 1; max += 1 }
  const pad = (max - min) * 0.12
  min -= pad; max += pad
  const n = Math.max(...series.map((s) => s.values.length))
  const x = (i) => (n <= 1 ? W / 2 : (i / (n - 1)) * W)
  const y = (v) => height - ((v - min) / (max - min)) * height
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full overflow-visible" style={{ height }} preserveAspectRatio="none" aria-hidden="true">
        {target ? <line x1="0" x2={W} y1={y(target)} y2={y(target)} stroke="var(--line-strong)" strokeWidth="1.5" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" /> : null}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean)
          const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')
          return (
            <g key={si}>
              {pts.length > 1 && !s.dotsOnly && (
                <path d={d} fill="none" stroke={s.color} strokeWidth={s.width ?? 2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              )}
              {(s.dots || pts.length === 1) && pts.map((p, i) => (
                <path key={i} d={`M${p[0]},${p[1]} l0,0`} stroke={s.color} strokeWidth={s.dotSize ?? 6} strokeLinecap="round" opacity={s.dotOpacity ?? 1} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          )
        })}
      </svg>
      {labels.length > 0 && (
        <div className="flex justify-between mt-1.5 text-xs text-faint">
          {labels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  )
}

/* One check-in, with the coach reply right under the client's words. */
export function CheckinCard({ ci, number, clientName, reply, autoFocus, compact }) {
  const { drafts, setDrafts, savingId, editingId, setEditingId, error, onSave } = reply
  const ref = useRef(null)
  const note = checkinNote(ci)
  const editing = editingId === ci.id || !ci.coach_reply
  const draft = drafts[ci.id] ?? ci.coach_reply ?? ''

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus({ preventScroll: false })
      ref.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [autoFocus])

  function cancelEdit() {
    setEditingId(null)
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[ci.id]
      return next
    })
  }

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="px-4 pt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-ink">{formatDate(ci.submitted_at, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <p className="text-[13px] text-muted">{relativeDay(ci.submitted_at)}{number ? ` · Check-in ${number}` : ''}</p>
        </div>
        {!ci.coach_reply && <Chip tone="warn">Needs reply</Chip>}
      </div>

      <div className="px-4 pt-3 space-y-2">
        <ScoreMeter label="Training" score={ci.training_score} />
        <ScoreMeter label="Energy" score={ci.energy_score} />
        {ci.mood_score != null && <ScoreMeter label="Mood" score={ci.mood_score} />}
      </div>

      <div className="px-4 pt-3">
        {note ? (
          <p className="text-[15px] text-ink leading-relaxed bg-surface-2 rounded-[14px] px-4 py-3 whitespace-pre-wrap">{note}</p>
        ) : (
          !compact && <p className="text-[13px] text-muted">No note this week.</p>
        )}
      </div>

      <div className="p-4">
        {editing ? (
          <>
            <TextArea
              ref={ref}
              rows={3}
              placeholder={`Reply to ${clientName}`}
              value={draft}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [ci.id]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSave(ci.id) }}
            />
            <div className="flex items-center gap-2 mt-2.5">
              <Button onClick={() => onSave(ci.id)} disabled={savingId === ci.id || !draft.trim()}>
                <Send size={16} />
                {savingId === ci.id ? 'Sending' : ci.coach_reply ? 'Update reply' : 'Send reply'}
              </Button>
              {ci.coach_reply && <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>}
            </div>
          </>
        ) : (
          <div className="rounded-[14px] bg-accent-soft px-4 py-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs font-bold text-accent">Your reply{ci.replied_at ? ` · ${relativeDay(ci.replied_at).toLowerCase()}` : ''}</p>
              <button onClick={() => setEditingId(ci.id)} className="flex items-center gap-1 text-xs font-bold text-accent hover:underline">
                <Pencil size={13} /> Edit
              </button>
            </div>
            <p className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap">{ci.coach_reply}</p>
          </div>
        )}
        {error?.id === ci.id && <p className="text-[13px] text-bad mt-2">{error.message}</p>}
      </div>
    </Card>
  )
}

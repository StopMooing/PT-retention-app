// Body measurements card, the same on both sides: the client's Progress tab (variant
// "client") and the coach's client Overview (variant "coach"). Either can log them; the
// numbers come from summary() in measurements.js so both screens agree.
import { useEffect, useState } from 'react'
import { Ruler, Plus, ChevronDown, X } from 'lucide-react'
import { supabase } from '../supabase'
import { Card, Button, Sheet, SectionLabel } from '../ui'
import { Panel } from '../coach/profile/parts'
import { toLocalDateStr, addDays, dayMonth, formatShortDate } from '../client/dates'
import { PARTS, fetchMeasurements, saveMeasurements, deleteMeasurement, summary, fmtCm } from './measurements'

function LogSheet({ clientId, rows, onClose, onSaved, who }) {
  const today = toLocalDateStr()
  const [day, setDay] = useState(today)
  const existing = (d) => rows.find((r) => r.measured_on === d)
  const fill = (d) => Object.fromEntries(PARTS.map((p) => [p.key, existing(d)?.[p.key] != null ? fmtCm(existing(d)[p.key]) : '']))
  const [values, setValues] = useState(() => fill(today))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    setSaving(true)
    setError(null)
    const res = await saveMeasurements(clientId, day, values)
    setSaving(false)
    if (res.error === 'empty') { setError('Enter at least one measurement.'); return }
    if (res.error === 'range') { setError(`Check the ${res.part.toLowerCase()} number. Measurements are in cm.`); return }
    if (res.error) { console.error('Save measurements error:', res.detail); setError("Couldn't save. Try again."); return }
    onSaved(res.row)
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Log measurements"
      footer={<Button size="lg" block onClick={save} disabled={saving}>{saving ? 'Saving' : existing(day) ? 'Update' : 'Save'}</Button>}
    >
      <p className="text-[14px] text-muted -mt-1 mb-4">{who === 'coach' ? 'In cm. Fill in the ones you measured.' : 'In cm, measured the same way each time (first thing in the morning is best). Fill in the ones you measured.'}</p>
      <label className="flex items-center gap-2 text-[15px] text-ink mb-4">
        <span className="font-semibold">Day</span>
        <input
          type="date" value={day} min={addDays(today, -60)} max={today}
          onChange={(e) => { const d = e.target.value; if (d && d <= today && d >= addDays(today, -60)) { setDay(d); setValues(fill(d)) } }}
          className="h-10 px-3 rounded-[12px] border border-line-strong bg-surface text-ink outline-none focus:border-accent"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        {PARTS.map((p) => (
          <label key={p.key} className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">{p.label}</span>
            <span className="relative">
              <input
                type="text" inputMode="decimal" value={values[p.key]}
                onChange={(e) => setValues((v) => ({ ...v, [p.key]: e.target.value }))}
                className="w-full h-12 pl-4 pr-11 rounded-[14px] border border-line-strong bg-surface text-ink outline-none focus:border-accent tabular-nums"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm">cm</span>
            </span>
          </label>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3 mt-4">{error}</p>}
    </Sheet>
  )
}

function Body({ rows, sum, userId, onDelete, emptyText }) {
  const [showAll, setShowAll] = useState(false)
  if (!rows.length) return <p className="text-[15px] text-muted">{emptyText}</p>
  const latest = rows[rows.length - 1]
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
        {sum.map((s) => (
          <div key={s.key} className="min-w-0">
            <p className="text-[13px] text-muted">{s.label}</p>
            <p className="font-display text-[26px] leading-tight text-ink tabular-nums">{fmtCm(s.value)}<span className="font-sans text-sm font-semibold text-muted ml-1">cm</span></p>
            {s.change !== 0 && <p className="text-[12px] text-muted tabular-nums">{s.change < 0 ? 'Down' : 'Up'} {fmtCm(Math.abs(s.change))} cm since {dayMonth(s.since)}</p>}
          </div>
        ))}
      </div>
      <button onClick={() => setShowAll((v) => !v)} className="w-full flex items-center justify-between mt-4 pt-3 border-t border-line text-[13px] font-semibold text-muted">
        <span>Last measured {dayMonth(latest.measured_on)} · {rows.length} {rows.length === 1 ? 'entry' : 'entries'}</span>
        <ChevronDown size={16} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
      </button>
      {showAll && (
        <div className="divide-y divide-line mt-1">
          {[...rows].reverse().map((r) => (
            <div key={r.id} className="flex items-center gap-2 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-ink">{formatShortDate(r.measured_on)}</p>
                <p className="text-[13px] text-muted tabular-nums">{PARTS.filter((p) => r[p.key] != null).map((p) => `${p.label} ${fmtCm(r[p.key])}`).join(' · ')}</p>
              </div>
              {r.logged_by === userId && (
                <button onClick={() => onDelete(r)} aria-label={`Delete measurements from ${formatShortDate(r.measured_on)}`} className="w-10 h-10 rounded-full flex items-center justify-center text-faint hover:text-bad hover:bg-surface-2 shrink-0">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function Measurements({ clientId, variant = 'client', name }) {
  const [rows, setRows] = useState(null)
  const [userId, setUserId] = useState(null)
  const [logging, setLogging] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!clientId) return
    let live = true
    Promise.all([fetchMeasurements(clientId), supabase.auth.getUser()])
      .then(([r, { data }]) => { if (live) { setRows(r); setUserId(data?.user?.id ?? null) } })
      .catch((e) => { console.error('Measurements load error:', e); if (live) setRows([]) })
    return () => { live = false }
  }, [clientId])

  if (rows === null) return null
  const sum = summary(rows)

  function saved(row) {
    setRows((prev) => [...prev.filter((r) => r.measured_on !== row.measured_on), row].sort((a, b) => (a.measured_on < b.measured_on ? -1 : 1)))
    setLogging(false)
  }

  async function remove(r) {
    if (!window.confirm(`Delete the measurements from ${formatShortDate(r.measured_on)}? You can't undo this.`)) return
    setError(null)
    const res = await deleteMeasurement(r.id)
    if (res.error) { console.error('Delete measurements error:', res.error); setError("Couldn't delete that. Try again."); return }
    setRows((prev) => prev.filter((x) => x.id !== r.id))
  }

  const sheet = logging && <LogSheet clientId={clientId} rows={rows} who={variant} onClose={() => setLogging(false)} onSaved={saved} />
  const err = error && <p role="alert" className="text-[13px] font-semibold text-bad mt-2">{error}</p>

  if (variant === 'coach') {
    return (
      <Panel title="Measurements" icon={Ruler} action={<Button variant="soft" size="sm" aria-label="Log measurements" onClick={() => setLogging(true)}><Plus size={16} /> Log</Button>}>
        <Body rows={rows} sum={sum} userId={userId} onDelete={remove} emptyText={`None yet. ${name || 'Your client'} can log waist, hips and more in Progress, or you can log them in a session.`} />
        {err}
        {sheet}
      </Panel>
    )
  }

  return (
    <section>
      <SectionLabel action={<Button variant="soft" size="sm" aria-label="Log measurements" onClick={() => setLogging(true)}><Ruler size={16} /> Log</Button>}>Measurements</SectionLabel>
      <Card>
        <Body rows={rows} sum={sum} userId={userId} onDelete={remove} emptyText="Waist, hips, chest, arms and thighs. Measuring every 2 to 4 weeks shows changes the scale can miss." />
        {err}
      </Card>
      {sheet}
    </section>
  )
}

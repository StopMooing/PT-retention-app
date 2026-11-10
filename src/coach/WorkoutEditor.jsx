// Building one workout day, the way Hevy, Trainerize and TrueCoach do it: every exercise
// shows its sets as rows (type, reps, kg, RPE, rest), "Add set" copies the last row, and
// exercises can be joined into a superset. Beside it (or under "Client view" on a phone)
// is exactly what the client will see in their app. Nothing is saved until Save, and
// then the whole day saves in one step (save_program_day), so it is never half saved.
import { useMemo, useState } from 'react'
import { Plus, ChevronUp, ChevronDown, Trash2, Link2, Unlink, X, Check } from 'lucide-react'
import { supabase } from '../supabase'
import { Button, Card, Chip, Segmented } from '../ui'
import { BackLink, ConfirmRemove } from '../tools/kit'
import ExercisePicker from './ExercisePicker'
import {
  SET_TYPES, plannedSets, prescriptionText, setText, setLabels, summaryColumns, supersets, restLabel,
} from '../lib/setTargets.js'
import { estMinutes, totalSets } from '../client/metrics'

const cx = (...c) => c.filter(Boolean).join(' ')
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`
const blank = (v) => (v === null || v === undefined ? '' : String(v))
let keySeq = 0
const newKey = () => `new_${++keySeq}`

// A saved row (workout_exercises with its set rows) as an editable draft.
function toDraft(row, next) {
  return {
    key: row.id,
    id: row.id,
    exercise_id: row.exercise_id ?? row.exercises?.id,
    exercises: row.exercises,
    notes: row.notes ?? '',
    linkNext: row.superset_group != null && next?.superset_group === row.superset_group,
    sets: plannedSets(row).map((s) => ({
      type: s.type, reps: blank(s.reps), weight_kg: blank(s.weight_kg), rpe: blank(s.rpe), rest_seconds: blank(s.rest_seconds),
    })),
  }
}

// Superset groups from the "joined to the next one" links: 1, 2, 3 in order, none for
// exercises on their own.
function groupsOf(items) {
  const out = []
  let g = 0
  items.forEach((it, i) => {
    if (i > 0 && items[i - 1].linkNext) out.push(out[i - 1])
    else if (it.linkNext && i < items.length - 1) out.push(++g)
    else out.push(null)
  })
  return out
}

// The draft in the same shape the client app reads, so the preview and the saved day agree.
function asRows(items) {
  const groups = groupsOf(items)
  return items.map((it, i) => ({
    id: it.key,
    exercises: it.exercises,
    notes: it.notes.trim() || null,
    superset_group: groups[i],
    workout_exercise_sets: it.sets.map((s, n) => ({
      set_number: n + 1, set_type: s.type, reps: s.reps.trim(), weight_kg: s.weight_kg === '' ? null : s.weight_kg,
      rpe: s.rpe === '' ? null : s.rpe, rest_seconds: s.rest_seconds === '' ? null : s.rest_seconds,
    })),
  }))
}

const decimal = (v, max) => v === '' || (/^\d*\.?\d*$/.test(v) && parseFloat(v || '0') <= max)
const whole = (v, max) => v === '' || (/^\d+$/.test(v) && parseInt(v, 10) <= max)

function SetRow({ set, label, onChange, onRemove, canRemove, readOnly }) {
  const cell = 'w-full h-10 rounded-[10px] border border-line-strong bg-bg text-ink text-center text-[14px] font-semibold tabular-nums outline-none focus:border-accent placeholder:text-faint placeholder:font-normal min-w-0'
  const typeName = SET_TYPES.find((t) => t.value === set.type)?.label
  return (
    <div className="grid grid-cols-[44px_minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_28px] gap-1.5 items-center">
      <label className={cx('relative h-10 rounded-[10px] border flex items-center justify-center text-[15px] font-bold', set.type === 'normal' ? 'bg-surface-2 border-transparent text-ink' : 'bg-accent-soft border-accent text-accent')} title={typeName}>
        <span aria-hidden="true">{label}</span>
        <select
          value={set.type}
          disabled={readOnly}
          aria-label={`Set ${label}: ${typeName}. Change set type`}
          onChange={(e) => onChange({ type: e.target.value })}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
        >
          {SET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </label>
      <input aria-label={`Set ${label} reps`} placeholder="reps" value={set.reps} readOnly={readOnly} maxLength={30}
        onChange={(e) => onChange({ reps: e.target.value })} className={cell} />
      <input aria-label={`Set ${label} kg`} placeholder="kg" inputMode="decimal" value={set.weight_kg} readOnly={readOnly}
        onChange={(e) => decimal(e.target.value, 1000) && onChange({ weight_kg: e.target.value })} className={cell} />
      <input aria-label={`Set ${label} RPE`} placeholder="RPE" inputMode="decimal" value={set.rpe} readOnly={readOnly}
        onChange={(e) => decimal(e.target.value, 10) && onChange({ rpe: e.target.value })} className={cell} />
      <input aria-label={`Set ${label} rest in seconds`} placeholder="rest" inputMode="numeric" value={set.rest_seconds} readOnly={readOnly}
        onChange={(e) => whole(e.target.value, 1800) && onChange({ rest_seconds: e.target.value })} className={cell} />
      {canRemove && !readOnly ? (
        <button type="button" onClick={onRemove} aria-label={`Remove set ${label}`} className="w-8 h-8 rounded-full flex items-center justify-center text-faint hover:text-bad hover:bg-bad-soft">
          <X size={16} />
        </button>
      ) : <span />}
    </div>
  )
}

/* What the client sees: the same lines and set rows as their logging screen. */
export function ClientPreview({ rows, title }) {
  const marks = supersets(rows)
  if (!rows.length) {
    return <p className="text-[14px] text-muted px-4 py-6 text-center">Add an exercise to see the client's view.</p>
  }
  return (
    <div className="space-y-3">
      <div className="px-1">
        <p className="text-[15px] font-bold text-ink">{title}</p>
        <p className="text-[13px] text-muted">{plural(rows.length, 'exercise')} · {plural(totalSets(rows), 'set')} · about {estMinutes(rows)} min</p>
      </div>
      {rows.map((ex, i) => {
        const sets = plannedSets(ex)
        const labels = setLabels(sets)
        const mark = marks[ex.id]
        return (
          <div key={ex.id} className="rounded-[18px] bg-surface border border-line overflow-hidden">
            <div className="px-3.5 pt-3 pb-2">
              {mark && <p className="text-[12px] font-bold text-accent">Superset {mark.letter}{mark.last ? ': rest after this one' : ': straight to the next'}</p>}
              <p className="text-[15px] font-bold text-ink leading-snug">{i + 1}. {ex.exercises?.name ?? 'Exercise'}</p>
              {prescriptionText(ex) && <p className="text-[12px] text-muted mt-0.5">{prescriptionText(ex)}</p>}
              {ex.notes && <p className="text-[12px] text-muted italic mt-1">{ex.notes}</p>}
            </div>
            <div className="grid grid-cols-[28px_1fr_32px] gap-2 px-3.5 pb-1 text-[11px] font-semibold text-faint">
              <span className="text-center">Set</span><span>Target</span><span className="flex justify-center"><Check size={12} strokeWidth={3} /></span>
            </div>
            {sets.map((s, n) => (
              <div key={n} className="grid grid-cols-[28px_1fr_32px] gap-2 items-center px-3.5 py-1">
                <span className={cx('text-center text-[14px] font-bold tabular-nums', s.type === 'normal' ? 'text-ink' : 'text-muted')}>{labels[n]}</span>
                <span className="text-[13px] text-ink tabular-nums truncate">
                  {setText(s) || '-'}{s.rest_seconds && !(mark && !mark.last) ? <span className="text-muted"> · {restLabel(s.rest_seconds)} rest</span> : null}
                </span>
                <span className="w-7 h-7 rounded-full border-2 border-line-strong justify-self-center" aria-hidden="true" />
              </div>
            ))}
            <div className="h-2" />
          </div>
        )
      })}
    </div>
  )
}

export default function WorkoutEditor({ dayLabel, title, day, rows, library, readOnly, onBack, onSaved, showToast }) {
  const initial = useMemo(() => rows.map((r, i) => toDraft(r, rows[i + 1])), [rows])
  const [items, setItems] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [picking, setPicking] = useState(false)
  const [view, setView] = useState('edit')
  const preview = asRows(items)
  const marks = supersets(preview)

  function change(fn) {
    setItems((prev) => fn(prev.map((it) => ({ ...it, sets: [...it.sets] }))))
    setDirty(true)
  }
  const setField = (i, field, value) => change((list) => { list[i][field] = value; return list })
  const setSet = (i, n, patch) => change((list) => { list[i].sets[n] = { ...list[i].sets[n], ...patch }; return list })
  const addSet = (i) => change((list) => {
    const last = list[i].sets[list[i].sets.length - 1] ?? { reps: '10', weight_kg: '', rpe: '', rest_seconds: '90' }
    list[i].sets.push({ ...last, type: last.type === 'warmup' || !last.type ? 'normal' : last.type })
    return list
  })
  const removeSet = (i, n) => change((list) => { list[i].sets.splice(n, 1); return list })
  const removeExercise = (i) => change((list) => {
    if (i > 0 && !list[i].linkNext) list[i - 1].linkNext = false
    list.splice(i, 1)
    return list
  })
  const move = (i, dir) => change((list) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return list
    // Moving takes the two exercises out of any superset; join them again if wanted.
    for (const k of [i - 1, i, j - 1, j]) if (list[k]) list[k].linkNext = false
    ;[list[i], list[j]] = [list[j], list[i]]
    return list
  })
  const toggleLink = (i) => change((list) => { list[i].linkNext = !list[i].linkNext; return list })

  function pick(ex) {
    change((list) => [...list, {
      key: newKey(), id: null, exercise_id: ex.id, exercises: { id: ex.id, name: ex.name, muscle_group: ex.muscle_group }, notes: '', linkNext: false,
      sets: Array.from({ length: 3 }, () => ({ type: 'normal', reps: '10', weight_kg: '', rpe: '', rest_seconds: '90' })),
    }])
    showToast(`${ex.name} added`)
  }

  function back() {
    if (dirty && !window.confirm('Leave without saving your changes?')) return
    onBack()
  }

  async function save() {
    if (saving) return
    if (items.some((it) => it.sets.length === 0)) { showToast('Every exercise needs at least one set.', 'bad'); return }
    if (items.some((it) => it.sets.some((s) => s.rpe !== '' && parseFloat(s.rpe) < 1))) { showToast('RPE goes from 1 to 10.', 'bad'); return }
    setSaving(true)
    const groups = groupsOf(items)
    const payload = items.map((it, i) => {
      const setRows = it.sets.map((s) => ({
        set_type: s.type, reps: s.reps.trim(), weight_kg: s.weight_kg.replace(/\.$/, ''), rpe: s.rpe.replace(/\.$/, ''), rest_seconds: s.rest_seconds,
      }))
      const summary = summaryColumns(it.sets.map((s) => ({ type: s.type, reps: s.reps, rest_seconds: s.rest_seconds })))
      return { id: it.id, exercise_id: it.exercise_id, notes: it.notes, superset_group: groups[i], ...summary, set_rows: setRows }
    })
    const { error } = await supabase.rpc('save_program_day', { p_day: day.id, p_items: payload })
    setSaving(false)
    if (error) { console.error('save_program_day', error); showToast('Could not save this workout. Check your signal and try again.', 'bad'); return }
    setDirty(false)
    showToast('Workout saved')
    onSaved()
  }

  const editor = (
    <div className="flex flex-col gap-3">
      {items.length === 0 && (
        <Card><p className="text-[15px] text-muted text-center py-4">No exercises yet. Add the first one below.</p></Card>
      )}
      {items.map((it, i) => {
        const row = preview[i]
        const mark = marks[row.id]
        const labels = setLabels(it.sets.map((s) => ({ type: s.type })))
        const badge = mark ? `${mark.letter}${preview.slice(0, i + 1).filter((r) => marks[r.id]?.letter === mark.letter).length}` : String(i + 1)
        return (
          <div key={it.key}>
            <Card padded={false} className={cx('overflow-hidden', mark && 'border-l-4')} style={mark ? { borderLeftColor: 'var(--accent)' } : undefined}>
              <div className="px-4 pt-3.5 pb-2 flex items-start gap-3">
                <span className={cx('min-w-7 h-7 px-1.5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 tabular-nums', mark ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted')}>{badge}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold text-ink leading-snug">{it.exercises?.name ?? 'Exercise'}</p>
                  <p className="text-[13px] text-muted">{[it.exercises?.muscle_group, prescriptionText(row)].filter(Boolean).join(' · ')}</p>
                </div>
                {!readOnly && (
                  <div className="flex items-center -mr-2 shrink-0">
                    <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:bg-surface-2 disabled:opacity-30"><ChevronUp size={19} /></button>
                    <button type="button" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:bg-surface-2 disabled:opacity-30"><ChevronDown size={19} /></button>
                    <ConfirmRemove icon={Trash2} label={`Remove ${it.exercises?.name ?? 'exercise'}`} onConfirm={() => removeExercise(i)} />
                  </div>
                )}
              </div>
              <div className="px-3 pb-1 grid grid-cols-[44px_minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_28px] gap-1.5 text-[11px] font-semibold text-faint text-center">
                <span>Set</span><span>Reps</span><span>kg</span><span>RPE</span><span>Rest (s)</span><span />
              </div>
              <div className="px-3 flex flex-col gap-1.5">
                {it.sets.map((s, n) => (
                  <SetRow key={n} set={s} label={labels[n]} readOnly={readOnly} canRemove={it.sets.length > 1}
                    onChange={(patch) => setSet(i, n, patch)} onRemove={() => removeSet(i, n)} />
                ))}
              </div>
              {!readOnly && (
                <div className="px-3 pt-2 pb-3 flex flex-col gap-2">
                  <button type="button" onClick={() => addSet(i)} className="h-9 px-3.5 self-start rounded-full bg-surface-2 text-ink text-[13px] font-bold inline-flex items-center gap-1.5">
                    <Plus size={15} /> Add set
                  </button>
                  <textarea
                    rows={1} maxLength={500} placeholder="Coaching note (optional)"
                    value={it.notes} onChange={(e) => setField(i, 'notes', e.target.value)}
                    className="w-full rounded-[12px] border border-line-strong bg-bg text-ink text-[14px] placeholder:text-faint px-3 py-2 outline-none focus:border-accent resize-none"
                  />
                </div>
              )}
              {readOnly && it.notes && <p className="px-4 pb-3 pt-1 text-[13px] text-muted italic">{it.notes}</p>}
            </Card>
            {!readOnly && i < items.length - 1 && (
              <div className="flex justify-center -my-1 relative z-10">
                <button
                  type="button" onClick={() => toggleLink(i)}
                  className={cx('h-8 px-3 rounded-full text-[12px] font-bold inline-flex items-center gap-1.5 border', it.linkNext ? 'bg-accent text-on-accent border-accent' : 'bg-bg text-muted border-line-strong hover:text-ink')}
                >
                  {it.linkNext ? <><Unlink size={14} /> Superset: tap to split</> : <><Link2 size={14} /> Superset with next</>}
                </button>
              </div>
            )}
          </div>
        )
      })}
      {!readOnly && (
        <Button variant="secondary" block onClick={() => setPicking(true)}><Plus size={18} /> Add exercise</Button>
      )}
      {!readOnly && dirty && (
        <Button size="lg" block onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save workout'}</Button>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div>
        <BackLink onClick={back}>Program</BackLink>
        <div className="flex items-end justify-between gap-3 mt-1">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-accent">{dayLabel}</p>
            <h1 className="font-display text-[30px] leading-tight text-ink break-words">{title}</h1>
          </div>
          {!readOnly && (
            <Button className="shrink-0" onClick={save} disabled={!dirty || saving}>{saving ? 'Saving...' : dirty ? 'Save workout' : 'Saved'}</Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Chip>{plural(items.length, 'exercise')}</Chip>
          <Chip>{plural(totalSets(preview), 'set')}</Chip>
          {items.length > 0 && <Chip>About {estMinutes(preview)} min</Chip>}
        </div>
      </div>

      <Segmented
        className="lg:hidden"
        value={view}
        onChange={setView}
        options={[{ value: 'edit', label: readOnly ? 'Sets' : 'Build' }, { value: 'preview', label: 'Client view' }]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className={cx(view === 'preview' && 'max-lg:hidden')}>{editor}</div>
        <aside className={cx('lg:sticky lg:top-4', view === 'edit' && 'max-lg:hidden')}>
          <p className="text-[13px] font-bold text-muted mb-2 px-1 max-lg:hidden">What your client sees</p>
          <div className="rounded-[28px] bg-bg border border-line p-3">
            <ClientPreview rows={preview} title={title} />
          </div>
        </aside>
      </div>


      <ExercisePicker
        open={picking}
        onClose={() => setPicking(false)}
        title={`Add to ${title}`}
        library={library}
        onPick={pick}
        footer={<Button size="lg" block onClick={() => setPicking(false)}>Done</Button>}
      />
    </div>
  )
}

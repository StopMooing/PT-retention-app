// A program the client made themselves: its name, its days (week by week when there is
// more than one), and each day's exercises in the same editor coaches use. Saves go
// straight to the database; the row rules let a client change only programs they own.
import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../supabase'
import { Button, Card, Field, Segmented, Sheet } from '../ui'
import { ConfirmRemove } from '../tools/kit'
import WorkoutEditor from '../coach/WorkoutEditor'
import { Overlay, BackHeader, Loading } from './common'
import { estMinutes, plural } from './metrics'
import { builtWeeks } from '../lib/schedule.js'
import { loadExerciseLibrary } from '../lib/exerciseLibrary.js'

const DAY_ROWS = '*, exercises(id, name, muscle_group, equipment, category), workout_exercise_sets(set_number, set_type, reps, weight_kg, rpe, rest_seconds)'
const byWeekDay = (a, b) => (a.week_number ?? 1) - (b.week_number ?? 1) || (a.day_number ?? 0) - (b.day_number ?? 0)
const IN_USE = "You've trained from this, so it stays to keep your history whole."

export default function MyProgramEditor({ programId, showToast, onClose, onChanged }) {
  const [program, setProgram] = useState(null)
  const [name, setName] = useState('')
  const [days, setDays] = useState([])
  const [rowsByDay, setRowsByDay] = useState({})
  const [library, setLibrary] = useState([])
  const [failed, setFailed] = useState(false)
  const [week, setWeek] = useState(1)
  const [editingDayId, setEditingDayId] = useState(null)
  const [daySheet, setDaySheet] = useState(null) // { id?, name } for adding or renaming a day
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('programs')
      .select(`id, name, description, program_workouts(id, name, day_number, week_number, workout_exercises(${DAY_ROWS}))`)
      .eq('id', programId)
      .single()
    if (error || !data) { console.error('Program load error:', error); setFailed(true); return }
    const list = [...(data.program_workouts ?? [])].sort(byWeekDay)
    const rows = {}
    for (const d of list) rows[d.id] = [...(d.workout_exercises ?? [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    setProgram({ id: data.id, name: data.name, description: data.description })
    setName((prev) => prev || data.name)
    setDays(list.map(({ id, name: n, day_number, week_number }) => ({ id, name: n, day_number, week_number: week_number || 1 })))
    setRowsByDay(rows)
  }, [programId])

  useEffect(() => {
    let cancelled = false
    ;(async () => { await load() })()
    loadExerciseLibrary().then((l) => { if (!cancelled) setLibrary(l) }).catch((e) => console.error('Exercise library load error:', e))
    return () => { cancelled = true }
  }, [load])

  async function saveName() {
    const next = name.trim().slice(0, 80)
    if (!next || next === program?.name) { setName(program?.name ?? ''); return }
    const { data, error } = await supabase.from('programs').update({ name: next }).eq('id', programId).select('id')
    if (error || !data?.length) { console.error('Rename program error:', error); showToast("Couldn't rename it. Try again."); setName(program.name); return }
    setProgram((p) => ({ ...p, name: next }))
    onChanged()
  }

  async function saveDay() {
    const dayName = daySheet?.name.trim().slice(0, 60)
    if (!dayName || busy) return
    setBusy(true)
    if (daySheet.id) {
      const { data, error } = await supabase.from('program_workouts').update({ name: dayName }).eq('id', daySheet.id).select('id')
      setBusy(false)
      if (error || !data?.length) { console.error('Rename day error:', error); showToast("Couldn't rename that day. Try again."); return }
      setDaySheet(null)
      await load()
      onChanged()
      return
    }
    const inWeek = days.filter((d) => d.week_number === week)
    const dayNumber = inWeek.length ? Math.max(...inWeek.map((d) => d.day_number || 0)) + 1 : 1
    const { data, error } = await supabase
      .from('program_workouts')
      .insert({ program_id: programId, name: dayName, day_number: dayNumber, week_number: week })
      .select('id')
      .single()
    setBusy(false)
    if (error || !data) { console.error('Add day error:', error); showToast("Couldn't add that day. Try again."); return }
    setDaySheet(null)
    await load()
    onChanged()
    setEditingDayId(data.id)
  }

  async function removeDay(day) {
    const { data, error } = await supabase.from('program_workouts').delete().eq('id', day.id).select('id')
    if (error?.message?.includes('in_use')) { showToast(IN_USE, { ms: 4000 }); return }
    if (error || !data?.length) { console.error('Remove day error:', error); showToast("Couldn't remove that day. Try again."); return }
    await load()
    onChanged()
  }

  async function deleteProgram() {
    setBusy(true)
    const { data, error } = await supabase.from('programs').delete().eq('id', programId).select('id')
    setBusy(false)
    setConfirmDelete(false)
    if (error?.message?.includes('in_use')) { showToast(IN_USE, { ms: 4000 }); return }
    if (error || !data?.length) { console.error('Delete program error:', error); showToast("Couldn't delete it. Try again."); return }
    onChanged()
    onClose()
    showToast('Program deleted')
  }

  const weeks = Math.max(1, builtWeeks(days))
  const shownWeek = Math.min(week, weeks)
  const shownDays = days.filter((d) => d.week_number === shownWeek)
  const editingDay = days.find((d) => d.id === editingDayId)

  if (editingDay) {
    return (
      <Overlay z="z-50">
        <div className="flex-1 overflow-y-auto px-4 pt-[max(env(safe-area-inset-top),16px)]">
          <WorkoutEditor
            key={editingDay.id}
            forClient
            day={editingDay}
            dayLabel={weeks > 1 ? `Week ${editingDay.week_number} · Day ${editingDay.day_number}` : `Day ${editingDay.day_number}`}
            title={editingDay.name || `Day ${editingDay.day_number}`}
            rows={rowsByDay[editingDay.id] ?? []}
            library={library}
            showToast={(msg) => showToast(msg)}
            onBack={() => setEditingDayId(null)}
            onSaved={async () => { await load(); onChanged() }}
          />
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay z="z-50">
      <BackHeader onBack={onClose} eyebrow="Your program" title={program?.name ?? 'Program'} />
      {failed ? (
        <div className="p-6 text-center space-y-3">
          <p className="text-[15px] text-muted">Couldn't open this program. Check your signal and try again.</p>
          <Button variant="secondary" onClick={() => { setFailed(false); load() }}>Try again</Button>
        </div>
      ) : !program ? (
        <Loading />
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          <Field label="Program name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} onBlur={saveName} />

          {weeks > 1 && (
            <Segmented
              value={shownWeek}
              onChange={setWeek}
              options={Array.from({ length: weeks }, (_, i) => ({ value: i + 1, label: `Week ${i + 1}` }))}
            />
          )}

          {shownDays.length > 0 && (
            <Card padded={false} className="divide-y divide-line">
              {shownDays.map((d) => {
                const rows = rowsByDay[d.id] ?? []
                const mins = estMinutes(rows)
                return (
                  <div key={d.id} className="flex items-center gap-1 pr-2">
                    <button onClick={() => setEditingDayId(d.id)} className="flex-1 min-w-0 text-left flex items-center gap-3 px-4 py-3.5 min-h-[64px]">
                      <span className="w-11 h-11 rounded-[14px] bg-accent-soft text-accent flex items-center justify-center shrink-0 text-[13px] font-bold">D{d.day_number}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-bold text-ink truncate">{d.name || `Day ${d.day_number}`}</span>
                        <span className="block text-[13px] text-muted">{rows.length ? [plural(rows.length, 'exercise'), mins ? `about ${mins} min` : null].filter(Boolean).join(' · ') : 'Tap to add exercises'}</span>
                      </span>
                    </button>
                    <button onClick={() => setDaySheet({ id: d.id, name: d.name || '' })} aria-label={`Rename ${d.name}`} className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:bg-surface-2 shrink-0">
                      <Pencil size={17} />
                    </button>
                    <ConfirmRemove icon={Trash2} label={`Remove ${d.name || 'day'}`} onConfirm={() => removeDay(d)} />
                  </div>
                )
              })}
            </Card>
          )}

          <Button variant="secondary" block onClick={() => setDaySheet({ name: '' })}>
            <Plus size={18} /> {shownDays.length ? 'Add a day' : 'Add your first day'}
          </Button>

          <button onClick={() => setConfirmDelete(true)} className="w-full text-center text-[14px] font-bold text-bad py-2">Delete this program</button>
        </div>
      )}

      <Sheet
        open={!!daySheet}
        onClose={() => setDaySheet(null)}
        title={daySheet?.id ? 'Rename day' : weeks > 1 ? `Add a day to week ${shownWeek}` : 'Add a day'}
        footer={<Button size="lg" block disabled={busy || !daySheet?.name.trim()} onClick={saveDay}>{busy ? 'Saving...' : daySheet?.id ? 'Save' : 'Add day'}</Button>}
      >
        <Field
          label="Day name"
          placeholder="For example Upper body or Legs"
          value={daySheet?.name ?? ''}
          maxLength={60}
          autoFocus
          onChange={(e) => setDaySheet((s) => ({ ...s, name: e.target.value }))}
          onKeyDown={(e) => { if (e.key === 'Enter') saveDay() }}
        />
      </Sheet>

      <Sheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this program?"
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setConfirmDelete(false)}>Keep it</Button>
            <Button variant="danger" size="lg" className="flex-1" disabled={busy} onClick={deleteProgram}>{busy ? 'Deleting...' : 'Delete'}</Button>
          </div>
        }
      >
        <p className="text-[15px] text-muted">It goes for good. If you've already trained from it, it stays so your history keeps its workouts.</p>
      </Sheet>
    </Overlay>
  )
}

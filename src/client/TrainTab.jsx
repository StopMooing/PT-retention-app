// Train: the schedule (week or month), the program and its workouts, saved workouts and
// past sessions. Adding, moving and duplicating sessions all happen in sheets.
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Sparkles, CalendarPlus, Check } from 'lucide-react'
import { supabase } from '../supabase'
import { PageTitle, Card, Button, Segmented, Sheet, SectionLabel, Field } from '../ui'
import { toLocalDateStr, formatDateLabel, formatShortDate, weekDays, addDays, parseDay } from './dates'
import { isDone, workoutName, groupByDate, estMinutes, sessionExercises, plural } from './metrics'
import { DayGrid, DoneDot, Loading } from './common'
import WorkoutPreview from './WorkoutPreview'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const cx = (...c) => c.filter(Boolean).join(' ')

function Row({ onClick, children, className }) {
  return (
    <button onClick={onClick} className={cx('w-full text-left flex items-center gap-3 px-4 py-3.5 min-h-[64px] hover:bg-surface-2 first:rounded-t-[20px] last:rounded-b-[20px]', className)}>
      {children}
    </button>
  )
}

/* ---------- Schedule ---------- */

function WeekStrip({ selected, onSelect, byDate, completedIds, today }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {weekDays(selected).map((d, i) => {
        const sessions = byDate[d] ?? []
        const done = sessions.some((sw) => isDone(sw, completedIds))
        const on = d === selected
        return (
          <button key={d} onClick={() => onSelect(d)} className={cx('flex flex-col items-center gap-1 py-2 rounded-[16px] transition-colors', on ? 'bg-accent text-on-accent' : 'hover:bg-surface-2')}>
            <span className={cx('text-[11px] font-bold', on ? 'opacity-80' : 'text-faint')}>{DAY_LETTERS[i]}</span>
            <span className={cx('text-[17px] font-bold tabular-nums', !on && (d === today ? 'text-accent' : 'text-ink'))}>{parseDay(d).getDate()}</span>
            <span className="h-3.5 flex items-center">
              {done ? <Check size={13} strokeWidth={3.5} className={on ? '' : 'text-accent'} /> : sessions.length > 0 ? <span className={cx('w-1.5 h-1.5 rounded-full', on ? 'bg-on-accent' : 'bg-muted')} /> : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function MonthGrid({ year, month, selected, onSelect, byDate, completedIds, today }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const first = new Date(year, month, 1).getDay()
  const pad = first === 0 ? 6 : first - 1
  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LETTERS.map((d, i) => <div key={i} className="text-center text-[11px] font-bold text-faint py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: pad }).map((_, i) => <div key={`p${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = toLocalDateStr(new Date(year, month, i + 1))
          const sessions = byDate[d] ?? []
          const done = sessions.some((sw) => isDone(sw, completedIds))
          const on = d === selected
          return (
            <button key={d} onClick={() => onSelect(d)} className="flex flex-col items-center py-0.5">
              <span className={cx('w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold tabular-nums', on ? 'bg-accent text-on-accent' : d === today ? 'text-accent ring-2 ring-inset ring-accent' : 'text-ink hover:bg-surface-2')}>
                {i + 1}
              </span>
              <span className={cx('w-1.5 h-1.5 rounded-full mt-0.5', done ? 'bg-accent' : sessions.length ? 'bg-muted' : 'bg-transparent')} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- History ---------- */

function HistoryList({ client }) {
  const [state, setState] = useState({ loading: true, logs: [] })
  const [expandedId, setExpandedId] = useState(null)
  const [setLogs, setSetLogs] = useState({})

  // Last 30 finished sessions, with program workout names looked up in a second step.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: logs, error } = await supabase
          .from('workout_logs')
          .select('id, client_id, program_workout_id, scheduled_workout_id, logged_at, completed, total_volume_kg')
          .eq('client_id', client.id)
          .eq('completed', true)
          .order('logged_at', { ascending: false })
          .limit(30)
        if (error) throw error
        const pwIds = [...new Set((logs ?? []).map((l) => l.program_workout_id).filter(Boolean))]
        const nameMap = {}
        if (pwIds.length > 0) {
          const { data: pwData } = await supabase.from('program_workouts').select('id, name').in('id', pwIds)
          if (pwData) pwData.forEach((pw) => { nameMap[pw.id] = pw.name })
        }
        // AI and saved workouts have no program day: use the saved workout's name.
        const swIds = [...new Set((logs ?? []).filter((l) => !l.program_workout_id && l.scheduled_workout_id).map((l) => l.scheduled_workout_id))]
        const savedNames = {}
        if (swIds.length > 0) {
          const { data: swData, error: swErr } = await supabase.from('scheduled_workouts').select('id, saved_workouts(name)').in('id', swIds)
          if (swErr) console.error('History saved workout names error:', swErr)
          for (const sw of swData ?? []) if (sw.saved_workouts?.name) savedNames[sw.id] = sw.saved_workouts.name
        }
        if (!cancelled) setState({ loading: false, logs: (logs ?? []).map((l) => ({ ...l, _workoutName: nameMap[l.program_workout_id] || savedNames[l.scheduled_workout_id] || null })) })
      } catch (e) {
        console.error('History load error:', e)
        if (!cancelled) setState({ loading: false, logs: [] })
      }
    })()
    return () => { cancelled = true }
  }, [client.id])

  async function toggle(log) {
    if (expandedId === log.id) { setExpandedId(null); return }
    setExpandedId(log.id)
    if (setLogs[log.id]) return
    try {
      const { data } = await supabase
        .from('workout_set_logs')
        .select('id, set_number, reps_completed, weight_kg, exercise_id, exercises(name, muscle_group)')
        .eq('workout_log_id', log.id)
        .order('exercise_id')
        .order('set_number')
      if (data) setSetLogs((prev) => ({ ...prev, [log.id]: data }))
    } catch (e) { console.error('Set logs load error:', e) }
  }

  if (state.loading) return <Loading />
  if (state.logs.length === 0) return <p className="text-center text-muted py-8">Finished sessions will show up here.</p>

  return (
    <Card padded={false} className="divide-y divide-line">
      {state.logs.map((log) => {
        const open = expandedId === log.id
        const sets = setLogs[log.id] ?? []
        const byEx = {}
        for (const s of sets) (byEx[s.exercise_id] ||= { name: s.exercises?.name || 'Exercise', sets: [] }).sets.push(s)
        return (
          <div key={log.id}>
            <Row onClick={() => toggle(log)}>
              <DoneDot done size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-ink truncate">{log._workoutName || 'Workout'}</p>
                <p className="text-[13px] text-muted">
                  {new Date(log.logged_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {log.total_volume_kg > 0 ? ` · ${Math.round(log.total_volume_kg).toLocaleString('en-AU')} kg moved` : ''}
                </p>
              </div>
              <ChevronRight size={18} className={cx('text-faint transition-transform', open && 'rotate-90')} />
            </Row>
            {open && (
              <div className="px-4 pb-4 space-y-3">
                {sets.length === 0 ? (
                  <p className="text-[13px] text-muted">This one was logged without sets.</p>
                ) : Object.values(byEx).map((ex) => (
                  <div key={ex.name}>
                    <p className="text-[13px] font-bold text-ink mb-1.5">{ex.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ex.sets.map((s) => (
                        <span key={s.id} className="h-8 px-3 rounded-full bg-surface-2 text-[13px] font-semibold text-ink inline-flex items-center tabular-nums">
                          {s.weight_kg > 0 ? `${s.weight_kg} kg x ${s.reps_completed}` : plural(s.reps_completed, 'rep')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </Card>
  )
}

/* ---------- Tab ---------- */

export default function TrainTab({
  client, scheduledWorkouts, completedIds, workoutLogs, workoutExercises, showToast,
  view, setView, selectedDate, setSelectedDate, assignment, programWorkouts, allProgramExercises,
  savedWorkouts, setScheduledWorkouts, reloadScheduledWorkouts, onOpenWorkout, onPreviewWorkout, onBuildWorkout,
}) {
  const today = toLocalDateStr()
  const byDate = groupByDate(scheduledWorkouts)
  const selectedWorkouts = byDate[selectedDate] ?? []

  const [monthView, setMonthView] = useState(false)
  const [cal, setCal] = useState(() => ({ y: parseDay(selectedDate).getFullYear(), m: parseDay(selectedDate).getMonth() }))

  const [detailSw, setDetailSw] = useState(null) // options sheet
  const [dateMode, setDateMode] = useState(null) // 'move' | 'duplicate'
  const [pickedDate, setPickedDate] = useState(today)

  const [programDay, setProgramDay] = useState(null)
  const [addToCalOpen, setAddToCalOpen] = useState(false)
  const [addToCalDates, setAddToCalDates] = useState([])

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSelected, setPickerSelected] = useState(null)

  const [savedPreview, setSavedPreview] = useState(null)
  const [savedToSchedule, setSavedToSchedule] = useState(null)
  const [scheduleDate, setScheduleDate] = useState(today)
  const [sheetError, setSheetError] = useState(null) // friendly message in whichever sheet is open
  const [busy, setBusy] = useState(false)

  function selectDate(d) {
    setSelectedDate(d)
    const p = parseDay(d)
    setCal({ y: p.getFullYear(), m: p.getMonth() })
  }

  function shift(dir) {
    if (monthView) {
      const m = cal.m + dir
      setCal({ y: cal.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 })
    } else {
      selectDate(addDays(selectedDate, dir * 7))
    }
  }

  async function handleMoveWorkout(date) {
    if (!detailSw || !date) return
    try {
      const { error } = await supabase.from('scheduled_workouts').update({ scheduled_date: date }).eq('id', detailSw.id)
      if (error) throw error
      await reloadScheduledWorkouts()
      setDateMode(null)
      setDetailSw(null)
      showToast(`Moved to ${formatShortDate(date)}`)
    } catch (e) {
      console.error('Move workout error:', e)
      setSheetError("Couldn't move that session. Try again.")
    }
  }

  async function handleDuplicateWorkout(date) {
    if (!detailSw || !date) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('scheduled_workouts').insert({
        client_id: client.id,
        program_workout_id: detailSw.program_workout_id ?? null,
        custom_workout_id: detailSw.custom_workout_id ?? null,
        scheduled_date: date,
        created_by: user.id,
      })
      if (error) throw error
      await reloadScheduledWorkouts()
      setDateMode(null)
      setDetailSw(null)
      showToast(`Copied to ${formatShortDate(date)}`)
    } catch (e) {
      console.error('Duplicate workout error:', e)
      setSheetError("Couldn't copy that session. Try again.")
    }
  }

  async function handleAddToCalConfirm() {
    if (!addToCalDates.length || !programDay) return
    setBusy(true)
    setSheetError(null)
    let added = 0
    const failed = []
    for (const dateStr of addToCalDates) {
      const exists = scheduledWorkouts.some((sw) => sw.program_workout_id === programDay.id && sw.scheduled_date === dateStr)
      if (exists) continue
      const { error } = await supabase.from('scheduled_workouts').insert({
        client_id: client.id,
        program_workout_id: programDay.id,
        custom_workout_id: null,
        scheduled_date: dateStr,
        created_by: client.user_id,
      })
      if (error) { console.error('Add to calendar error:', error); failed.push(dateStr) }
      else added++
    }
    await reloadScheduledWorkouts()
    setBusy(false)
    if (failed.length > 0) {
      // Keep the sheet open with only the days that didn't go in, so Add tries them again.
      setAddToCalDates(failed)
      setSheetError(added > 0
        ? `Added to ${plural(added, 'day')}, but ${plural(failed.length, "day didn't", "days didn't")} go in. Try again.`
        : "Couldn't add that to your calendar. Try again.")
      return
    }
    setAddToCalOpen(false)
    setAddToCalDates([])
    if (added > 0) showToast(`Added to ${plural(added, 'day')}`)
  }

  async function handleWorkoutPickerConfirm() {
    if (!pickerSelected) return
    setBusy(true)
    setSheetError(null)
    const isProgram = pickerSelected.type === 'program'
    const { error } = await supabase.from('scheduled_workouts').insert({
      client_id: client.id,
      program_workout_id: isProgram ? pickerSelected.workout.id : null,
      custom_workout_id: isProgram ? null : pickerSelected.workout.id,
      scheduled_date: selectedDate,
      created_by: client.user_id,
    })
    if (error) {
      console.error('Add workout error:', error)
      setBusy(false)
      setSheetError("Couldn't add that session. Try again.")
      return
    }
    await reloadScheduledWorkouts()
    setBusy(false)
    setPickerOpen(false)
    setPickerSelected(null)
    showToast(`Added to ${formatShortDate(selectedDate)}`)
  }

  async function handleScheduleSaved() {
    if (!savedToSchedule || !scheduleDate) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('scheduled_workouts')
        .insert({ client_id: client.id, program_workout_id: null, custom_workout_id: savedToSchedule.id, scheduled_date: scheduleDate, created_by: user.id })
        .select('id, scheduled_date, program_workout_id, custom_workout_id')
        .single()
      if (error) {
        console.error('Schedule error:', error)
        setSheetError("Couldn't add that to your calendar. Try again.")
        return
      }
      setScheduledWorkouts((prev) => [...prev, { ...data, program_workouts: { name: savedToSchedule.name, day_number: 0 }, _isCustom: true, _customWorkout: savedToSchedule }])
      showToast(`Added to ${formatShortDate(scheduleDate)}`)
      setSavedToSchedule(null)
      setSavedPreview(null)
    } catch (e) {
      console.error('Schedule exception:', e)
      setSheetError("Couldn't add that to your calendar. Try again.")
    }
  }

  const monthName = new Date(cal.y, cal.m).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
  const weekLabel = (() => {
    const days = weekDays(selectedDate)
    const f = (d) => parseDay(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
    return days.includes(today) ? 'This week' : `${f(days[0])} to ${f(days[6])}`
  })()

  const views = [
    { value: 'schedule', label: 'Schedule' },
    { value: 'program', label: 'Program' },
    ...(workoutLogs.length > 0 ? [{ value: 'history', label: 'History' }] : []),
  ]

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),24px)] space-y-5">
      <PageTitle
        title="Training"
        action={
          view === 'schedule' && (
            <Button variant="secondary" size="sm" onClick={() => { setSheetError(null); setPickerSelected(null); setPickerOpen(true) }}>
              <Plus size={16} /> Add
            </Button>
          )
        }
      />
      <Segmented options={views} value={view} onChange={setView} />

      {view === 'schedule' && (
        <div className="space-y-7">
          <Card className="space-y-3">
            <div className="flex items-center gap-1">
              <button onClick={() => shift(-1)} aria-label="Previous" className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:bg-surface-2"><ChevronLeft size={20} /></button>
              <p className="flex-1 text-center text-[15px] font-bold text-ink">{monthView ? monthName : weekLabel}</p>
              <button onClick={() => shift(1)} aria-label="Next" className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:bg-surface-2"><ChevronRight size={20} /></button>
            </div>
            {monthView
              ? <MonthGrid year={cal.y} month={cal.m} selected={selectedDate} onSelect={selectDate} byDate={byDate} completedIds={completedIds} today={today} />
              : <WeekStrip selected={selectedDate} onSelect={selectDate} byDate={byDate} completedIds={completedIds} today={today} />}
            <button onClick={() => setMonthView((v) => !v)} className="w-full text-center text-[13px] font-bold text-accent py-1">
              {monthView ? 'Show week' : 'Show month'}
            </button>
          </Card>

          <section>
            <SectionLabel>{formatDateLabel(selectedDate)}</SectionLabel>
            {selectedWorkouts.length > 0 ? (
              <Card padded={false} className="divide-y divide-line">
                {selectedWorkouts.map((sw) => {
                  const done = isDone(sw, completedIds)
                  const exs = sessionExercises(sw, workoutExercises)
                  const mins = estMinutes(exs)
                  return (
                    <div key={sw.id} className="flex items-center">
                      <Row onClick={() => onOpenWorkout(sw)} className="flex-1 min-w-0 pr-1">
                        <DoneDot done={done} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-ink truncate">{workoutName(sw)}</p>
                          <p className="text-[13px] text-muted">
                            {[done ? 'Done' : null, exs.length ? plural(exs.length, 'exercise') : null, mins ? `about ${mins} min` : null].filter(Boolean).join(' · ') || 'Ready when you are'}
                          </p>
                        </div>
                      </Row>
                      <button onClick={() => setDetailSw(sw)} aria-label="Workout options" className="w-11 h-11 mr-2 rounded-full flex items-center justify-center text-muted hover:bg-surface-2 shrink-0">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  )
                })}
              </Card>
            ) : (
              <Card className="flex items-center gap-3">
                <p className="flex-1 text-[15px] text-muted">
                  {selectedDate >= today ? 'Rest day. Want to add something?' : selectedDate >= addDays(today, -7) ? 'Nothing on this day. Add a session you did?' : 'No session this day.'}
                </p>
                {selectedDate >= addDays(today, -7) && (
                  <Button variant="soft" size="sm" onClick={() => { setSheetError(null); setPickerSelected(null); setPickerOpen(true) }}><Plus size={16} /> Add</Button>
                )}
              </Card>
            )}
          </section>
        </div>
      )}

      {view === 'program' && (
        <div className="space-y-7">
          {assignment && (
            <section>
              <SectionLabel>{assignment.programs?.name || 'Your program'}</SectionLabel>
              <Card padded={false} className="divide-y divide-line">
                {programWorkouts.map((pw) => {
                  const exs = allProgramExercises[pw.id] ?? []
                  const mins = estMinutes(exs)
                  return (
                    <Row key={pw.id} onClick={() => setProgramDay(pw)}>
                      <span className="w-10 h-10 rounded-full bg-surface-2 text-muted text-[13px] font-bold flex items-center justify-center shrink-0">D{pw.day_number}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-ink truncate">{pw.name}</p>
                        <p className="text-[13px] text-muted">{plural(exs.length, 'exercise')}{mins > 0 ? ` · about ${mins} min` : ''}</p>
                      </div>
                      <ChevronRight size={18} className="text-faint shrink-0" />
                    </Row>
                  )
                })}
              </Card>
              {assignment.start_date && (
                <p className="text-[13px] text-muted mt-2 px-1">Started {parseDay(assignment.start_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              )}
            </section>
          )}

          {savedWorkouts.length > 0 && (
            <section>
              <SectionLabel>Your saved workouts</SectionLabel>
              <Card padded={false} className="divide-y divide-line">
                {savedWorkouts.map((sw) => (
                  <Row key={sw.id} onClick={() => setSavedPreview(sw)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-ink truncate">{sw.name || sw.title}</p>
                      <p className="text-[13px] text-muted">Saved {new Date(sw.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <ChevronRight size={18} className="text-faint shrink-0" />
                  </Row>
                ))}
              </Card>
            </section>
          )}

          <Card onClick={onBuildWorkout} as="button" className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0"><Sparkles size={20} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-ink">Build a workout with AI</p>
              <p className="text-[13px] text-muted">Describe what you want and save it here.</p>
            </div>
            <ChevronRight size={18} className="text-faint shrink-0" />
          </Card>
        </div>
      )}

      {view === 'history' && <HistoryList client={client} />}

      {/* Options for a scheduled session */}
      <Sheet open={!!detailSw && !dateMode} onClose={() => setDetailSw(null)} title={detailSw ? workoutName(detailSw) : ''}>
        {detailSw && (
          <div className="space-y-2.5">
            <p className="text-[13px] text-muted -mt-1 mb-3">{formatShortDate(detailSw.scheduled_date)}</p>
            <Button size="lg" block onClick={() => { onPreviewWorkout(detailSw); setDetailSw(null) }}>Open workout</Button>
            <Button variant="secondary" size="lg" block onClick={() => { setSheetError(null); setPickedDate(today); setDateMode('move') }}>Move to another day</Button>
            <Button variant="secondary" size="lg" block onClick={() => { setSheetError(null); setPickedDate(today); setDateMode('duplicate') }}>Copy to another day</Button>
          </div>
        )}
      </Sheet>

      {/* Pick a day for move / copy */}
      <Sheet
        open={!!dateMode}
        onClose={() => { setDateMode(null); setDetailSw(null) }}
        title={dateMode === 'move' ? 'Move to another day' : 'Copy to another day'}
        footer={<Button size="lg" block onClick={() => (dateMode === 'move' ? handleMoveWorkout(pickedDate) : handleDuplicateWorkout(pickedDate))}>{dateMode === 'move' ? 'Move' : 'Copy'} to {formatShortDate(pickedDate)}</Button>}
      >
        <DayGrid days={28} selected={[pickedDate]} onToggle={setPickedDate} busy={new Set(Object.keys(byDate))} />
        {sheetError && <p role="alert" className="text-[13px] font-semibold text-bad mt-3">{sheetError}</p>}
      </Sheet>

      {/* Add a workout to the selected day */}
      <Sheet
        open={pickerOpen}
        onClose={() => { setPickerOpen(false); setPickerSelected(null) }}
        title={`Add to ${formatShortDate(selectedDate)}`}
        footer={<Button size="lg" block disabled={!pickerSelected || busy} onClick={handleWorkoutPickerConfirm}>{busy ? 'Adding...' : pickerSelected ? `Add ${pickerSelected.workout.name}` : 'Pick a workout'}</Button>}
      >
        {programWorkouts.length === 0 && savedWorkouts.length === 0 ? (
          <div className="py-4 space-y-3">
            <p className="text-muted">Nothing to add yet. Your coach can set you a program, or you can build a workout now.</p>
            <Button variant="soft" block onClick={() => { setPickerOpen(false); onBuildWorkout() }}><Sparkles size={16} /> Build with AI</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {[['program', 'Your program', programWorkouts], ['saved', 'Saved workouts', savedWorkouts]].map(([type, label, list]) => list.length > 0 && (
              <div key={type}>
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted mb-2">{label}</p>
                <div className="rounded-[16px] border border-line divide-y divide-line overflow-hidden">
                  {list.map((w) => {
                    const on = pickerSelected?.type === type && pickerSelected.workout.id === w.id
                    const count = type === 'program' ? (allProgramExercises[w.id] ?? []).length : null
                    return (
                      <button key={w.id} onClick={() => setPickerSelected({ type, workout: w })} className={cx('w-full text-left flex items-center gap-3 px-4 py-3 min-h-[56px]', on ? 'bg-accent-soft' : 'hover:bg-surface-2')}>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-ink truncate">{w.name}</p>
                          <p className="text-[13px] text-muted">{type === 'program' ? `Day ${w.day_number} · ${plural(count, 'exercise')}` : 'Saved workout'}</p>
                        </div>
                        {on && <Check size={20} strokeWidth={3} className="text-accent shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {sheetError && <p role="alert" className="text-[13px] font-semibold text-bad">{sheetError}</p>}
          </div>
        )}
      </Sheet>

      {/* A program day: look at it and add it to the calendar */}
      {programDay && (
        <WorkoutPreview
          eyebrow={`Day ${programDay.day_number} of ${assignment?.programs?.name || 'your program'}`}
          title={programDay.name}
          exercises={allProgramExercises[programDay.id] ?? []}
          onBack={() => setProgramDay(null)}
          footer={<Button size="lg" block onClick={() => { setSheetError(null); setAddToCalDates([]); setAddToCalOpen(true) }}><CalendarPlus size={20} /> Add to calendar</Button>}
        />
      )}
      <Sheet
        open={addToCalOpen && !!programDay}
        onClose={() => { setAddToCalOpen(false); setAddToCalDates([]) }}
        title="Add to calendar"
        footer={<Button size="lg" block disabled={addToCalDates.length === 0 || busy} onClick={handleAddToCalConfirm}>{busy ? 'Adding...' : addToCalDates.length === 0 ? 'Pick one or more days' : `Add to ${plural(addToCalDates.length, 'day')}`}</Button>}
      >
        <p className="text-[13px] text-muted -mt-1 mb-3">{programDay?.name}. Dots show days it's already on.</p>
        <DayGrid
          days={42}
          selected={addToCalDates}
          onToggle={(d) => setAddToCalDates((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))}
          busy={new Set(scheduledWorkouts.filter((sw) => sw.program_workout_id === programDay?.id).map((sw) => sw.scheduled_date))}
        />
        {sheetError && <p role="alert" className="text-[13px] font-semibold text-bad mt-3">{sheetError}</p>}
      </Sheet>

      {/* A saved workout: look at it and schedule it */}
      {savedPreview && (
        <WorkoutPreview
          eyebrow="Saved workout"
          title={savedPreview.name || savedPreview.title}
          customContent={savedPreview.content || ''}
          onBack={() => setSavedPreview(null)}
          footer={<Button size="lg" block onClick={() => { setSheetError(null); setScheduleDate(today); setSavedToSchedule(savedPreview) }}><CalendarPlus size={20} /> Add to calendar</Button>}
        />
      )}
      <Sheet
        open={!!savedToSchedule}
        onClose={() => setSavedToSchedule(null)}
        title="Add to calendar"
        footer={<Button size="lg" block onClick={handleScheduleSaved}>Schedule</Button>}
      >
        <p className="text-[13px] text-muted -mt-1 mb-3 truncate">{savedToSchedule?.name}</p>
        <Field label="Date" type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
        {sheetError && <p role="alert" className="text-[13px] font-semibold text-bad mt-3">{sheetError}</p>}
      </Sheet>
    </div>
  )
}

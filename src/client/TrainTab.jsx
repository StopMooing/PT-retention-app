// Training: Workouts | Programs at the top. Workouts is the week's sessions (a week at a
// time, back and forward), then on-demand and saved workouts. Programs is the active
// program with its workouts, then on-demand programs. Adding, moving and copying sessions
// happen in sheets.
import { useState } from 'react'
import {
  ChevronRight, MoreHorizontal, Plus, Sparkles, CalendarPlus, Check, Dumbbell, Bookmark, Play,
} from 'lucide-react'
import { supabase } from '../supabase'
import { PageTitle, Card, Button, Segmented, Sheet, SectionLabel, Chip } from '../ui'
import { toLocalDateStr, formatShortDate, addDays, mondayOf, weekDays, weekLabel, shortDayLabel, dayMonth, parseDay } from './dates'
import {
  isDone, workoutName, groupByDate, estMinutes, plural, muscleGroups, programWeeks, programProgress,
  sessionsInWeek, sessionStatusLine,
} from './metrics'
import { parseAiJson } from './foods'
import { DayGrid, StepNav, Overlay, BackHeader } from './common'
import { scheduleOne, startProgram, stopProgram } from './programs'
import StartPlanFields from '../lib/StartPlanFields'
import { defaultStartDate, defaultTrainingDays, planReady, planWeeks } from '../lib/schedule.js'
import WorkoutPreview from './WorkoutPreview'

const cx = (...c) => c.filter(Boolean).join(' ')

function Row({ onClick, children, className }) {
  return (
    <button onClick={onClick} className={cx('w-full text-left flex items-center gap-3 px-4 py-3.5 min-h-[64px] hover:bg-surface-2 first:rounded-t-[20px] last:rounded-b-[20px]', className)}>
      {children}
    </button>
  )
}

/* ---------- Workout items ----------
   One shape for anything the client can start or add to the calendar:
   { key, type: 'program' | 'saved', id, name, eyebrow, badge, exercises | content, count, mins, muscles } */

function programItem(pw, exMap, extra = {}) {
  const exercises = exMap?.[pw.id] ?? []
  return {
    key: `p_${pw.id}`, type: 'program', id: pw.id, name: pw.name || 'Workout', dayNumber: pw.day_number,
    exercises, count: exercises.length, mins: estMinutes(exercises), muscles: muscleGroups(exercises), ...extra,
  }
}

function savedItem(w, extra = {}) {
  const parsed = parseAiJson(w.content || '')
  const exs = Array.isArray(parsed?.exercises) ? parsed.exercises : []
  return {
    key: `s_${w.id}`, type: 'saved', id: w.id, name: w.name || w.title || 'Workout', eyebrow: 'Saved workout', saved: w,
    content: w.content || '', count: exs.length, mins: estMinutes(exs), muscles: muscleGroups(exs), ...extra,
  }
}

const itemMeta = (it, short) => [it.count ? plural(it.count, 'exercise') : null, it.mins ? `${short ? '' : 'about '}${it.mins} min` : null].filter(Boolean).join(' · ')
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function ItemBadge({ item }) {
  const Icon = item.type === 'saved' ? Bookmark : item.onDemand ? Play : Dumbbell
  return (
    <span className="w-11 h-11 rounded-[14px] bg-accent-soft text-accent flex items-center justify-center shrink-0 text-[13px] font-bold">
      {item.dayNumber && !item.onDemand ? `D${item.dayNumber}` : <Icon size={19} />}
    </span>
  )
}

function ItemList({ items, onOpen, short }) {
  return (
    <Card padded={false} className="divide-y divide-line">
      {items.map((it) => (
        <Row key={it.key} onClick={() => onOpen(it)}>
          <ItemBadge item={it} />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-ink truncate">{it.name}</p>
            {itemMeta(it, short) && <p className="text-[13px] text-muted">{itemMeta(it, short)}</p>}
            {!short && it.muscles.length > 0 && <p className="text-[12px] text-faint truncate mt-0.5">{it.muscles.join(' · ')}</p>}
          </div>
          <ChevronRight size={18} className="text-faint shrink-0" />
        </Row>
      ))}
    </Card>
  )
}

/* ---------- Program detail ---------- */

function ProgramDetail({
  eyebrow, program, days, exMap, note, footer, onBack, onOpenItem, onStartItem, onAddItem, progress, busy,
}) {
  const items = days.map((pw) => programItem(pw, exMap, { eyebrow: `Day ${pw.day_number} of ${program.name}` }))
  const weeks = programWeeks(program)
  const avgMins = items.length ? Math.round(items.reduce((s, it) => s + it.mins, 0) / items.length) : 0
  const stats = [
    weeks ? { label: weeks === 1 ? 'Week' : 'Weeks', value: weeks } : null,
    { label: items.length === 1 ? 'Day a week' : 'Days a week', value: items.length },
    avgMins ? { label: 'Min a session', value: `~${avgMins}` } : null,
  ].filter(Boolean)
  return (
    <Overlay>
      <BackHeader onBack={onBack} title={eyebrow} />
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        <div>
          <h2 className="font-display text-[30px] leading-[1.05] text-ink">{program.name}</h2>
          {program.description && <p className="text-[15px] text-muted leading-relaxed mt-2">{program.description}</p>}
        </div>
        <Card padded={false} className={cx('grid divide-x divide-line', stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
          {stats.map((s) => (
            <div key={s.label} className="py-3 text-center">
              <p className="font-display text-[26px] leading-none text-ink tabular-nums">{s.value}</p>
              <p className="text-xs text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </Card>
        {progress && progress.total > 0 && (
          <div>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="font-bold text-ink">{progress.upcoming ? `Starts ${shortDayLabel(progress.start)}` : `Week ${progress.week} of ${progress.weeks}`}</span>
              <span className="text-muted tabular-nums">{progress.done} of {plural(progress.total, 'session')} done</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden mt-1.5">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          </div>
        )}
        {note && <p className="text-[15px] text-ink bg-accent-soft rounded-[16px] px-4 py-3 leading-relaxed">{note}</p>}
        <section>
          <SectionLabel>Workouts</SectionLabel>
          <Card padded={false} className="divide-y divide-line">
            {items.map((it) => (
              <div key={it.key} className="flex items-center gap-2 pr-3">
                <Row onClick={() => onOpenItem(it)} className="flex-1 min-w-0 pr-1">
                  <ItemBadge item={it} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-ink truncate">{it.name}</p>
                    {itemMeta(it) && <p className="text-[13px] text-muted truncate">{itemMeta(it, true)}</p>}
                  </div>
                </Row>
                <button onClick={() => onAddItem(it)} aria-label={`Add ${it.name} to calendar`} className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:bg-surface-2 shrink-0">
                  <CalendarPlus size={19} />
                </button>
                <Button variant="soft" size="sm" disabled={busy} onClick={() => onStartItem(it)}>Start</Button>
              </div>
            ))}
          </Card>
        </section>
      </div>
      {footer && (
        <div className="shrink-0 border-t border-line bg-bg px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)] space-y-2">{footer}</div>
      )}
    </Overlay>
  )
}

/* ---------- Active program ---------- */

// Name, who set it, week and dates, progress, description (two lines, then More) and,
// for a program the client started, stop.
function ProgramHeader({ assignment, progress, coachProgram, busy, onStop }) {
  const [more, setMore] = useState(false)
  const program = assignment.programs ?? {}
  const desc = program.description || ''
  const long = desc.length > 90
  const meta = [
    progress.upcoming ? `Starts ${shortDayLabel(progress.start)}` : progress.week ? `Week ${progress.week} of ${progress.weeks}` : null,
    progress.start && progress.end ? `${dayMonth(progress.start)} to ${dayMonth(progress.end)}` : null,
  ].filter(Boolean).join(' · ')
  return (
    <Card className="space-y-3">
      <div>
        <p className="text-[13px] font-bold text-muted">{coachProgram ? 'From your coach' : 'Started by you'}</p>
        <p className="font-display text-[26px] leading-tight text-ink">{program.name}</p>
        {meta && <p className="text-[13px] text-muted mt-0.5 tabular-nums">{meta}</p>}
      </div>
      {progress.total > 0 && (
        <div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <p className="text-[13px] text-muted mt-1.5 tabular-nums">{progress.done} of {plural(progress.total, 'session')} done</p>
        </div>
      )}
      {desc && (
        <div>
          <p className={cx('text-[15px] text-ink leading-relaxed', !more && 'line-clamp-2')}>{desc}</p>
          {long && (
            <button onClick={() => setMore((m) => !m)} className="text-[13px] font-bold text-accent mt-0.5">{more ? 'Less' : 'More'}</button>
          )}
        </div>
      )}
      {!coachProgram && (
        <div className="pt-1">
          <Button variant="secondary" size="sm" block disabled={busy} onClick={onStop}>Stop program</Button>
        </div>
      )}
    </Card>
  )
}

/* ---------- Tab ---------- */

export default function TrainTab({
  client, scheduledWorkouts, completedIds, workoutLogs, workoutExercises, showToast,
  view, setView, assignment, programWorkouts,
  savedWorkouts, onDemand, reloadScheduledWorkouts, reloadAssignment,
  onOpenWorkout, onStartWorkout, onPreviewWorkout, onBuildWorkout,
}) {
  const today = toLocalDateStr()
  const earliestAdd = addDays(today, -7)
  const [weekStart, setWeekStart] = useState(() => mondayOf(today))
  const byDate = groupByDate(scheduledWorkouts)
  const weekSessions = sessionsInWeek(scheduledWorkouts, weekStart)

  const [detailSw, setDetailSw] = useState(null) // options for one scheduled session
  const [dateMode, setDateMode] = useState(null) // 'move' | 'duplicate'
  const [pickedDate, setPickedDate] = useState(today)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSelected, setPickerSelected] = useState(null)
  const [addDate, setAddDate] = useState(today)

  const [previewItem, setPreviewItem] = useState(null)
  const [calItem, setCalItem] = useState(null) // add to calendar
  const [calDates, setCalDates] = useState([])
  const [openProgram, setOpenProgram] = useState(null) // an on-demand program
  const [confirmStop, setConfirmStop] = useState(false)
  const [startFor, setStartFor] = useState(null) // the program in the Start sheet
  const [startDate, setStartDate] = useState(today)
  const [trainingDays, setTrainingDays] = useState([])
  const [sheetError, setSheetError] = useState(null)
  const [busy, setBusy] = useState(false)

  const userId = client.user_id
  const coachProgram = !!assignment && assignment.assigned_by !== userId
  const ownProgram = !!assignment && assignment.assigned_by === userId
  const exMap = workoutExercises

  /* ----- what's on offer ----- */
  const programDayIds = new Set(programWorkouts.map((pw) => pw.id))
  const programName = assignment?.programs?.name || 'your program'
  const myProgramItems = programWorkouts.map((pw) => programItem(pw, exMap, { eyebrow: `Day ${pw.day_number} of ${programName}` }))

  // Sessions the coach put on the calendar that aren't days of the program, one each
  // (offered in the add sheet).
  const coachExtras = []
  const seen = new Set()
  for (const sw of scheduledWorkouts) {
    if (!sw.created_by || sw.created_by === userId || sw.scheduled_date < today || isDone(sw, completedIds)) continue
    if (sw.program_workout_id && programDayIds.has(sw.program_workout_id)) continue
    const k = sw.program_workout_id || `s${sw.custom_workout_id}`
    if (seen.has(k)) continue
    seen.add(k)
    if (sw.program_workout_id) coachExtras.push(programItem({ id: sw.program_workout_id, name: workoutName(sw) }, exMap, { eyebrow: 'From your coach' }))
    else if (sw._customWorkout) coachExtras.push(savedItem(sw._customWorkout, { eyebrow: 'From your coach' }))
  }
  const onDemandItems = onDemand.workouts.map((p) => programItem(p.days[0], exMap, { key: `od_${p.id}`, name: p.name, eyebrow: 'On demand', onDemand: true }))
  const savedItems = savedWorkouts.map((w) => savedItem(w))
  const hasPrograms = !!assignment || onDemand.programs.length > 0
  const tab = view === 'programs' ? 'programs' : 'workouts'
  const progress = assignment ? programProgress({ assignment, programWorkouts, workoutLogs, today }) : null

  /* ----- the shown week ----- */
  const days = weekDays(weekStart)
  const canAdd = days[6] >= earliestAdd // keep the 7-days-back limit

  function openPicker() {
    setSheetError(null)
    setPickerSelected(null)
    const first = days.includes(today) ? today : days[0]
    setAddDate(first < earliestAdd ? earliestAdd : first)
    setPickerOpen(true)
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

  async function handlePickerConfirm() {
    if (!pickerSelected) return
    setBusy(true)
    setSheetError(null)
    const { error } = await scheduleOne({ client, item: pickerSelected, date: addDate })
    if (error) {
      setBusy(false)
      setSheetError("Couldn't add that session. Try again.")
      return
    }
    await reloadScheduledWorkouts()
    setBusy(false)
    setPickerOpen(false)
    setPickerSelected(null)
    showToast(`Added to ${formatShortDate(addDate)}`)
  }

  /* ----- start now / add to calendar ----- */
  const sameWorkout = (sw, item) => (item.type === 'program' ? sw.program_workout_id === item.id : sw.custom_workout_id === item.id)

  // Puts the workout on today (unless it's already there and not done) and opens logging.
  async function startNow(item) {
    setBusy(true)
    let sw = (byDate[today] ?? []).find((s) => sameWorkout(s, item) && !isDone(s, completedIds))
    if (!sw) {
      const { data, error } = await scheduleOne({ client, item, date: today })
      if (error || !data) {
        setBusy(false)
        showToast("Couldn't start that one. Try again.", { ms: 4000 })
        return
      }
      sw = item.type === 'program'
        ? { ...data, program_workouts: { id: item.id, name: item.name, day_number: item.dayNumber ?? 0 }, _isCustom: false, _customWorkout: null }
        : { ...data, program_workouts: { name: item.name, day_number: 0 }, saved_workouts: item.saved, _isCustom: true, _customWorkout: item.saved }
      await reloadScheduledWorkouts()
    }
    setBusy(false)
    setPreviewItem(null)
    setOpenProgram(null)
    onStartWorkout(sw)
  }

  function openAddToCalendar(item) {
    setSheetError(null)
    setCalDates([])
    setCalItem(item)
  }

  async function handleAddToCalConfirm() {
    if (!calDates.length || !calItem) return
    setBusy(true)
    setSheetError(null)
    let added = 0
    const failed = []
    for (const date of calDates) {
      if (scheduledWorkouts.some((sw) => sameWorkout(sw, calItem) && sw.scheduled_date === date)) continue
      const { error } = await scheduleOne({ client, item: calItem, date })
      if (error) failed.push(date)
      else added++
    }
    await reloadScheduledWorkouts()
    setBusy(false)
    if (failed.length > 0) {
      // Keep the sheet open with only the days that didn't go in, so Add tries them again.
      setCalDates(failed)
      setSheetError(added > 0
        ? `Added to ${plural(added, 'day')}, but ${plural(failed.length, "day didn't", "days didn't")} go in. Try again.`
        : "Couldn't add that to your calendar. Try again.")
      return
    }
    setCalItem(null)
    setCalDates([])
    if (added > 0) showToast(`Added to ${plural(added, 'day')}`)
  }

  /* ----- programs ----- */
  // This program's sessions from today on that haven't been done.
  const upcomingProgramIds = () => scheduledWorkouts
    .filter((sw) => programDayIds.has(sw.program_workout_id) && sw.scheduled_date >= today && !isDone(sw, completedIds))
    .map((sw) => sw.id)

  function openStartSheet(program) {
    setStartDate(defaultStartDate(today))
    setTrainingDays(defaultTrainingDays(program.days?.length ?? 0))
    setStartFor(program)
  }

  async function handleStartProgram() {
    const program = startFor
    if (!program) return
    setBusy(true)
    const current = ownProgram ? assignment : null
    const res = await startProgram({
      client, program, current, currentUpcomingIds: current ? upcomingProgramIds() : [], startDate, trainingDays,
    })
    await Promise.all([reloadAssignment(), reloadScheduledWorkouts()])
    setBusy(false)
    if (res.error) { showToast("Couldn't start that program. Try again.", { ms: 4000 }); return }
    setStartFor(null)
    setOpenProgram(null)
    setView('programs')
    showToast(res.count > 0 ? `Program started. ${plural(res.count, 'session')} on your calendar.` : 'Program started')
  }

  async function handleStopProgram() {
    setBusy(true)
    const { error } = await stopProgram(assignment, client, upcomingProgramIds())
    await Promise.all([reloadAssignment(), reloadScheduledWorkouts()])
    setBusy(false)
    setConfirmStop(false)
    if (error) { showToast("Couldn't stop that program. Try again.", { ms: 4000 }); return }
    setOpenProgram(null)
    showToast('Program stopped')
  }

  // Picker groups for adding to a day.
  const pickerGroups = [
    ['Your program', myProgramItems],
    ['From your coach', coachExtras],
    ['On demand', onDemandItems],
    ['Saved workouts', savedItems],
  ].filter(([, list]) => list.length > 0)

  /* ----- program detail ----- */
  let programPage = null
  if (openProgram) {
    const mine = !!assignment && assignment.programs?.id === openProgram.id
    const program = mine ? { ...assignment.programs, days: programWorkouts } : openProgram
    let note = null
    let footer = null
    if (mine && ownProgram) {
      footer = <Button size="lg" block variant="secondary" disabled={busy} onClick={() => setConfirmStop(true)}>Stop program</Button>
    } else if (!mine && coachProgram) {
      note = "You're on your coach's program. Add any of these workouts to your calendar."
    } else if (!mine) {
      if (ownProgram) note = `Starting this one stops ${assignment.programs?.name} and takes its upcoming sessions off your calendar. Sessions you've done stay in your history.`
      footer = <Button size="lg" block disabled={busy} onClick={() => openStartSheet(program)}>Start program</Button>
    }
    programPage = (
      <ProgramDetail
        eyebrow={mine ? (coachProgram ? 'From your coach' : 'Your program') : 'On demand program'}
        program={program}
        days={program.days ?? []}
        exMap={exMap}
        note={note}
        footer={footer}
        progress={mine ? progress : null}
        busy={busy}
        onBack={() => setOpenProgram(null)}
        onOpenItem={setPreviewItem}
        onStartItem={startNow}
        onAddItem={openAddToCalendar}
      />
    )
  }

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),24px)] space-y-5">
      <PageTitle
        title="Training"
        action={
          <button onClick={onBuildWorkout} aria-label="Build a workout with AI" className="w-11 h-11 rounded-full bg-surface border border-line-strong text-accent flex items-center justify-center hover:bg-surface-2">
            <Sparkles size={20} />
          </button>
        }
      />

      <Segmented
        options={[{ value: 'workouts', label: 'Workouts' }, { value: 'programs', label: 'Programs' }]}
        value={tab}
        onChange={setView}
      />

      {tab === 'workouts' && (
        <div className="space-y-7">
          {/* A week at a time: back into what was done, forward into what's planned */}
          <div className="space-y-3">
            <StepNav
              label={weekLabel(weekStart, today)}
              onPrev={() => setWeekStart(addDays(weekStart, -7))}
              onNext={() => setWeekStart(addDays(weekStart, 7))}
              prevLabel="Previous week"
              nextLabel="Next week"
            />
            {weekSessions.length > 0 ? (
              <Card padded={false} className="divide-y divide-line overflow-hidden">
                {weekSessions.map((sw) => {
                  const done = isDone(sw, completedIds)
                  const isToday = sw.scheduled_date === today
                  const line = sessionStatusLine(sw, { completedIds, workoutLogs, exMap, today })
                  return (
                    <div key={sw.id} className={cx('flex items-center gap-1 pr-2', isToday && 'bg-accent-soft')}>
                      <Row onClick={() => onOpenWorkout(sw)} className="flex-1 min-w-0 pr-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-ink truncate">
                            <span className={isToday ? 'text-accent' : 'text-muted'}>{shortDayLabel(sw.scheduled_date, today)}</span> · {workoutName(sw)}
                          </p>
                          {line && <p className="text-[13px] text-muted truncate">{line}</p>}
                        </div>
                        {done ? (
                          <Check size={20} strokeWidth={3} className="text-accent shrink-0" aria-label="Done" />
                        ) : sw.scheduled_date > today ? (
                          <ChevronRight size={18} className="text-faint shrink-0" />
                        ) : null}
                      </Row>
                      {!done && isToday && <Button size="sm" onClick={() => onOpenWorkout(sw)}>Start</Button>}
                      <button onClick={() => setDetailSw(sw)} aria-label="Workout options" className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:bg-surface-2 shrink-0">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  )
                })}
              </Card>
            ) : (
              <p className="text-[15px] text-muted px-1">Nothing planned this week.</p>
            )}
            {canAdd && (
              <Button variant="secondary" block onClick={openPicker}><Plus size={18} /> Add a workout</Button>
            )}
          </div>

          {onDemandItems.length > 0 && (
            <section>
              <SectionLabel>On demand</SectionLabel>
              <ItemList items={onDemandItems} onOpen={setPreviewItem} />
            </section>
          )}
          {savedItems.length > 0 && (
            <section>
              <SectionLabel>Saved</SectionLabel>
              <ItemList items={savedItems} onOpen={setPreviewItem} />
            </section>
          )}
          {onDemandItems.length + savedItems.length === 0 && (
            <Card onClick={onBuildWorkout} as="button" className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0"><Sparkles size={20} /></span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-ink">Build a workout with AI</p>
                <p className="text-[13px] text-muted">Describe what you want and save it here.</p>
              </div>
              <ChevronRight size={18} className="text-faint shrink-0" />
            </Card>
          )}
        </div>
      )}

      {tab === 'programs' && (
        <div className="space-y-7">
          {!hasPrograms && (
            <p className="text-[15px] text-muted text-center px-4 py-2">No programs yet. Your coach can give you one, or start an on-demand program when they're available.</p>
          )}
          {assignment && (
            <section className="space-y-3">
              <ProgramHeader
                assignment={assignment}
                progress={progress}
                coachProgram={coachProgram}
                busy={busy}
                onStop={() => setConfirmStop(true)}
              />
              {myProgramItems.length > 0 && <ItemList items={myProgramItems} onOpen={setPreviewItem} short />}
            </section>
          )}
          {onDemand.programs.length > 0 && (
            <section>
              <SectionLabel>On demand programs</SectionLabel>
              <div className="space-y-3">
                {onDemand.programs.map((p) => {
                  const weeks = programWeeks(p)
                  const current = assignment?.programs?.id === p.id
                  const mins = p.days.map((d) => estMinutes(exMap[d.id])).filter(Boolean)
                  const avg = mins.length ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : 0
                  return (
                    <Card key={p.id} as="button" onClick={() => setOpenProgram(p)} className="block">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-[22px] leading-tight text-ink">{p.name}</p>
                          {p.description && <p className="text-[13px] text-muted mt-1 line-clamp-2">{p.description}</p>}
                        </div>
                        <ChevronRight size={18} className="text-faint shrink-0 mt-1" />
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {current && <Chip tone="solid">You're on this</Chip>}
                        {weeks && <Chip>{plural(weeks, 'week')}</Chip>}
                        <Chip>{plural(p.days.length, 'day')} a week</Chip>
                        {avg > 0 && <Chip>about {avg} min</Chip>}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {programPage}

      {/* A workout: look at it, start it now or add it to the calendar */}
      {previewItem && (
        <WorkoutPreview
          eyebrow={previewItem.eyebrow}
          title={previewItem.name}
          exercises={previewItem.exercises ?? []}
          customContent={previewItem.type === 'saved' ? previewItem.content : null}
          onBack={() => setPreviewItem(null)}
          footer={
            <div className="space-y-2">
              <Button size="lg" block disabled={busy} onClick={() => startNow(previewItem)}><Dumbbell size={19} /> {busy ? 'Starting...' : 'Start now'}</Button>
              <Button variant="secondary" size="lg" block onClick={() => openAddToCalendar(previewItem)}><CalendarPlus size={19} /> Add to calendar</Button>
            </div>
          }
        />
      )}

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

      {/* Add a workout to a day of the shown week */}
      <Sheet
        open={pickerOpen}
        onClose={() => { setPickerOpen(false); setPickerSelected(null) }}
        title={`Add to ${formatShortDate(addDate)}`}
        footer={pickerGroups.length > 0 && <Button size="lg" block disabled={!pickerSelected || busy} onClick={handlePickerConfirm}>{busy ? 'Adding...' : pickerSelected ? `Add ${pickerSelected.name}` : 'Pick a workout'}</Button>}
      >
        {pickerGroups.length === 0 ? (
          <div className="py-4 space-y-3">
            <p className="text-muted">Nothing to add yet. Your coach can set you a program, or you can build a workout now.</p>
            <Button variant="soft" block onClick={() => { setPickerOpen(false); onBuildWorkout() }}><Sparkles size={16} /> Build with AI</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-1" role="group" aria-label="Day">
              {days.map((d, i) => {
                const on = d === addDate
                return (
                  <button
                    key={d}
                    disabled={d < earliestAdd}
                    onClick={() => setAddDate(d)}
                    aria-pressed={on}
                    aria-label={formatShortDate(d)}
                    className={cx(
                      'h-14 rounded-[14px] flex flex-col items-center justify-center gap-0.5 transition-colors disabled:opacity-30',
                      on ? 'bg-accent text-on-accent' : d === today ? 'ring-2 ring-inset ring-accent text-ink' : 'text-ink hover:bg-surface-2',
                    )}
                  >
                    <span className={cx('text-[11px] font-bold', on ? '' : 'text-faint')}>{DAY_LETTERS[i]}</span>
                    <span className="text-sm font-bold tabular-nums">{parseDay(d).getDate()}</span>
                  </button>
                )
              })}
            </div>
            {pickerGroups.map(([label, list]) => (
              <div key={label}>
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted mb-2">{label}</p>
                <div className="rounded-[16px] border border-line divide-y divide-line overflow-hidden">
                  {list.map((it) => {
                    const on = pickerSelected?.key === it.key
                    return (
                      <button key={it.key} onClick={() => setPickerSelected(it)} className={cx('w-full text-left flex items-center gap-3 px-4 py-3 min-h-[56px]', on ? 'bg-accent-soft' : 'hover:bg-surface-2')}>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-ink truncate">{it.name}</p>
                          <p className="text-[13px] text-muted">{[it.dayNumber && !it.onDemand ? `Day ${it.dayNumber}` : null, itemMeta(it) || null].filter(Boolean).join(' · ') || it.eyebrow}</p>
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

      {/* Add a workout to one or more days */}
      <Sheet
        open={!!calItem}
        onClose={() => { setCalItem(null); setCalDates([]) }}
        title="Add to calendar"
        footer={<Button size="lg" block disabled={calDates.length === 0 || busy} onClick={handleAddToCalConfirm}>{busy ? 'Adding...' : calDates.length === 0 ? 'Pick one or more days' : `Add to ${plural(calDates.length, 'day')}`}</Button>}
      >
        <p className="text-[13px] text-muted -mt-1 mb-3">{calItem?.name}. Dots show days it's already on.</p>
        <DayGrid
          days={42}
          selected={calDates}
          onToggle={(d) => setCalDates((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))}
          busy={new Set(calItem ? scheduledWorkouts.filter((sw) => sameWorkout(sw, calItem)).map((sw) => sw.scheduled_date) : [])}
        />
        {sheetError && <p role="alert" className="text-[13px] font-semibold text-bad mt-3">{sheetError}</p>}
      </Sheet>

      {/* Start an on-demand program: when, and which days */}
      <Sheet
        open={!!startFor}
        onClose={() => setStartFor(null)}
        title={startFor ? `Start ${startFor.name}` : ''}
        footer={
          <Button
            size="lg"
            block
            disabled={busy || !startFor || !planReady({ dayCount: startFor.days?.length ?? 0, startDate, trainingDays, today })}
            onClick={handleStartProgram}
          >
            {busy ? 'Starting...' : 'Start program'}
          </Button>
        }
      >
        {startFor && (
          <>
            <p className="text-[13px] text-muted -mt-1 mb-4">Every week of the program goes on your calendar. You can move any session later.</p>
            <StartPlanFields
              dayCount={startFor.days?.length ?? 0}
              weeks={planWeeks(startFor)}
              startDate={startDate}
              onStartDate={setStartDate}
              trainingDays={trainingDays}
              onTrainingDays={setTrainingDays}
              today={today}
            />
          </>
        )}
      </Sheet>

      {/* Stop a program the client started */}
      <Sheet
        open={confirmStop}
        onClose={() => setConfirmStop(false)}
        title="Stop this program?"
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setConfirmStop(false)}>Keep going</Button>
            <Button variant="danger" size="lg" className="flex-1" disabled={busy} onClick={handleStopProgram}>{busy ? 'Stopping...' : 'Stop program'}</Button>
          </div>
        }
      >
        <p className="text-[15px] text-muted">Its upcoming sessions come off your calendar. Sessions you've done stay in your history. You can start this or another program any time.</p>
      </Sheet>
    </div>
  )
}

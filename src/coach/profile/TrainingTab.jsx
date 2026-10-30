// Training: the assigned program, the schedule (drag to move on desktop), logged
// sessions and personal bests. All saving happens in ClientProfile.jsx.
import { useState } from 'react'
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core'
import { ClipboardList, ChevronLeft, ChevronRight, ChevronDown, Plus, X, CalendarPlus, Trophy, Search, Check, Dumbbell, AlertCircle } from 'lucide-react'
import { Button, Card, Chip, Segmented, Sheet, EmptyState, SectionLabel } from '../../ui'
import { Panel } from './parts'
import { toLocalDateStr, dayOf, formatDate, relativeDay, addDays, firstName } from '../lib'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function mondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0, 0, 0, 0)
  return d
}

/* ---------------- Calendar (desktop) ---------------- */
function DraggableWorkout({ workout, onRemove, onClick, done }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: workout.uniqueId || workout.id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 999 : 'auto', position: 'relative' } : {}
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="group relative">
      <div
        {...listeners}
        onClick={() => onClick && onClick(workout)}
        className={`text-xs font-bold px-2 py-1.5 rounded-[10px] cursor-pointer truncate transition-colors ${done ? 'bg-accent text-on-accent' : workout._isCustom ? 'bg-surface-2 text-ink border border-line-strong' : 'bg-accent-soft text-accent'}`}
      >
        {done && <Check size={11} strokeWidth={3} className="inline -mt-0.5 mr-0.5" />}
        {workout._displayName || workout.program_workouts?.name || workout.saved_workouts?.name || 'Workout'}
      </div>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(workout) }}
          aria-label="Remove from schedule"
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-surface border border-line-strong text-muted hover:text-bad rounded-full hidden group-hover:flex items-center justify-center z-10"
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}

function DroppableDay({ dateStr, isToday, isPast, day, items, canAdd, dragging, onAdd, onRemove, onOpen, isDone }) {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr })
  return (
    <div
      ref={setNodeRef}
      className={`group/day min-h-[112px] p-1.5 border-r border-line last:border-r-0 transition-colors ${isOver && dragging ? 'bg-accent-soft' : isPast ? 'bg-bg/50' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${isToday ? 'bg-accent text-on-accent' : 'text-muted'}`}>{day.getDate()}</span>
        {canAdd && !dragging && (
          <button onClick={onAdd} aria-label="Add workout" className="w-6 h-6 rounded-full text-muted hover:text-accent hover:bg-accent-soft opacity-0 group-hover/day:opacity-100 focus:opacity-100 flex items-center justify-center transition">
            <Plus size={14} />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {items.map((sw) => <DraggableWorkout key={sw.id} workout={sw} done={isDone(sw)} onRemove={() => onRemove(sw.id)} onClick={() => onOpen(sw)} />)}
      </div>
    </div>
  )
}

/* ---------------- Sheets ---------------- */
function FindWorkoutSheet({ open, date, onClose, allPrograms, allProgramWorkouts, workoutExercises, programAssignment, onSchedule }) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(programAssignment?.programs?.id ?? null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  function close() { setSearch(''); setSelected(null); onClose() }

  const q = search.trim().toLowerCase()
  const results = q
    ? [...new Map(allProgramWorkouts.filter((pw) => pw.name?.toLowerCase().includes(q) || allPrograms.find((p) => p.id === pw.program_id && p.name?.toLowerCase().includes(q))).map((pw) => [pw.id, pw])).values()]
    : null

  function WorkoutRow({ pw, showProgram }) {
    const ex = workoutExercises[pw.id] ?? []
    const isSel = selected?.id === pw.id
    return (
      <div className={isSel ? 'bg-accent-soft' : ''}>
        <button onClick={() => setSelected(isSel ? null : pw)} className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-[14px] hover:bg-surface-2">
          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSel ? 'border-accent bg-accent text-on-accent' : 'border-line-strong'}`}>{isSel && <Check size={12} strokeWidth={3} />}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink truncate">{pw.name || `Day ${pw.day_number}`}</span>
            <span className="block text-[13px] text-muted">{showProgram ? `${allPrograms.find((p) => p.id === pw.program_id)?.name ?? 'Program'} · ` : ''}{ex.length} {ex.length === 1 ? 'exercise' : 'exercises'}</span>
          </span>
        </button>
        {isSel && ex.length > 0 && (
          <ol className="px-4 pb-3 pl-11 space-y-1">
            {ex.map((e) => (
              <li key={e.id} className="flex justify-between gap-2 text-[13px]"><span className="text-ink truncate">{e.exercises?.name}</span><span className="text-muted shrink-0">{e.sets} × {e.reps}</span></li>
            ))}
          </ol>
        )}
      </div>
    )
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Add a workout"
      footer={
        <Button block size="lg" disabled={!selected || saving} onClick={async () => { setSaving(true); const ok = await onSchedule(selected, date); setSaving(false); if (ok) close() }}>
          {saving ? 'Saving' : date ? `Schedule for ${date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}` : 'Schedule'}
        </Button>
      }
    >
      <label className="relative block mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setSelected(null) }} placeholder="Search workouts or programs" className="w-full h-11 pl-11 pr-4 rounded-full border border-line-strong bg-surface text-ink placeholder:text-faint outline-none focus:border-accent" />
      </label>
      {results ? (
        results.length === 0 ? <p className="text-sm text-muted text-center py-6">No workouts match.</p> : results.map((pw) => <WorkoutRow key={pw.id} pw={pw} showProgram />)
      ) : allPrograms.length === 0 ? (
        <p className="text-sm text-muted text-center py-6">Build a program on the Programs page first.</p>
      ) : (
        allPrograms.map((p) => {
          const pws = allProgramWorkouts.filter((pw) => pw.program_id === p.id)
          const isOpen = expanded === p.id
          return (
            <div key={p.id} className="border-b border-line last:border-0">
              <button onClick={() => { setExpanded(isOpen ? null : p.id); setSelected(null) }} className="w-full flex items-center gap-3 py-3 text-left">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><span className="font-bold text-ink truncate">{p.name}</span>{programAssignment?.programs?.id === p.id && <Chip tone="accent">Assigned</Chip>}</span>
                  <span className="block text-[13px] text-muted">{pws.length} {pws.length === 1 ? 'workout' : 'workouts'}</span>
                </span>
                <ChevronDown size={18} className={`text-faint transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="pb-2">
                  {pws.length === 0 ? <p className="text-[13px] text-muted px-3 pb-2">No workouts in this program yet.</p> : pws.map((pw) => <WorkoutRow key={pw.id} pw={pw} />)}
                </div>
              )}
            </div>
          )
        })
      )}
    </Sheet>
  )
}

function AssignProgramSheet({ open, onClose, clientName, allPrograms, allProgramWorkouts, programAssignment, onAssign }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  function close() { setSearch(''); setSelected(null); onClose() }
  const list = allPrograms.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
  return (
    <Sheet
      open={open}
      onClose={close}
      title={programAssignment ? 'Change program' : 'Assign a program'}
      footer={
        <Button block size="lg" disabled={!selected || saving} onClick={async () => { setSaving(true); const ok = await onAssign(selected); setSaving(false); if (ok) close() }}>
          {saving ? 'Assigning' : selected ? `Assign ${selected.name}` : 'Choose a program'}
        </Button>
      }
    >
      <p className="text-[13px] text-muted -mt-1 mb-3">Pick the program {clientName} follows from today.</p>
      <label className="relative block mb-2">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search programs" className="w-full h-11 pl-11 pr-4 rounded-full border border-line-strong bg-surface text-ink placeholder:text-faint outline-none focus:border-accent" />
      </label>
      {allPrograms.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No programs yet" body="Build one on the Programs page first." />
      ) : (
        list.map((p) => {
          const current = programAssignment?.programs?.id === p.id
          const isSel = selected?.id === p.id
          const n = allProgramWorkouts.filter((pw) => pw.program_id === p.id).length
          return (
            <button
              key={p.id}
              disabled={current}
              onClick={() => setSelected(isSel ? null : p)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-[14px] text-left transition-colors disabled:opacity-50 ${isSel ? 'bg-accent-soft' : 'hover:bg-surface-2'}`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSel ? 'border-accent bg-accent text-on-accent' : 'border-line-strong'}`}>{isSel && <Check size={12} strokeWidth={3} />}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2"><span className="font-bold text-ink truncate">{p.name}</span>{current && <Chip>Current</Chip>}</span>
                <span className="block text-[13px] text-muted truncate">{n} {n === 1 ? 'workout' : 'workouts'}{p.description ? ` · ${p.description}` : ''}</span>
              </span>
            </button>
          )
        })
      )}
    </Sheet>
  )
}

function AutoScheduleSheet({ open, onClose, programAssignment, programWorkouts, onAutoSchedule }) {
  const [start, setStart] = useState(() => toLocalDateStr())
  const [rest, setRest] = useState(1)
  const [saving, setSaving] = useState(false)
  const dateFor = (i) => addDays(start, i * (1 + rest))
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Fill the schedule"
      footer={
        <Button block size="lg" disabled={!start || programWorkouts.length === 0 || saving} onClick={async () => { setSaving(true); await onAutoSchedule(start, rest); setSaving(false) }}>
          {saving ? 'Scheduling' : `Schedule ${programWorkouts.length} ${programWorkouts.length === 1 ? 'session' : 'sessions'}`}
        </Button>
      }
    >
      <p className="text-[13px] text-muted -mt-1 mb-4">Lays out each workout in {programAssignment?.programs?.name} once, in order.</p>
      <p className="text-sm font-semibold text-ink mb-1.5">Start date</p>
      <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full h-12 px-4 rounded-[14px] border border-line-strong bg-surface text-ink outline-none focus:border-accent" />
      <p className="text-sm font-semibold text-ink mt-4 mb-1.5">Rest days between sessions</p>
      <Segmented value={rest} onChange={setRest} options={[{ value: 0, label: 'None' }, { value: 1, label: '1 day' }, { value: 2, label: '2 days' }]} />
      {start && programWorkouts.length > 0 && (
        <>
          <SectionLabel className="!px-0 mt-5">Preview</SectionLabel>
          <ul className="divide-y divide-line rounded-[14px] border border-line">
            {programWorkouts.map((pw, i) => (
              <li key={pw.id} className="flex items-center justify-between px-3 h-11 text-[15px]">
                <span className="font-semibold text-ink truncate">{pw.name || `Day ${pw.day_number}`}</span>
                <span className="text-[13px] text-muted shrink-0">{formatDate(dateFor(i), { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  )
}

/* ---------------- History and PBs ---------------- */
const PB_LABEL = { '1rm': 'Est. 1RM', best_set: 'Best set', volume: 'Volume', max_weight: 'Heaviest', estimated_1rm: 'Est. 1RM' }
const PB_UNIT = { best_set: 'pts' }

function History({ workoutLogs, scheduledWorkouts, personalBests, sessionSetLogs, loadSessionSets, onOpenWorkout }) {
  const [openId, setOpenId] = useState(null)
  const [openEx, setOpenEx] = useState(null)
  if (workoutLogs.length === 0) return <Card><EmptyState icon={Dumbbell} title="No sessions logged yet" body="Sessions show here once they are logged in the app or from the schedule." /></Card>
  return (
    <Card padded={false} className="overflow-hidden divide-y divide-line">
      {workoutLogs.map((log) => {
        const day = dayOf(log.logged_at)
        const sched = scheduledWorkouts.find((sw) => sw.id === log.scheduled_workout_id) ?? null
        const isOpen = openId === log.id
        const sets = sessionSetLogs[log.id] || []
        const byEx = sets.reduce((acc, s) => { const k = s.exercise_id || 'unknown'; (acc[k] ||= { name: s.exercises?.name || 'Exercise', sets: [] }).sets.push(s); return acc }, {})
        const pbs = personalBests.reduce((acc, pb) => {
          if (pb.achieved_at && dayOf(pb.achieved_at) === day) (acc[pb.exercise_id] ||= new Set()).add(pb.pb_type)
          return acc
        }, {})
        return (
          <div key={log.id}>
            <button
              onClick={() => { if (isOpen) setOpenId(null); else { setOpenId(log.id); setOpenEx(null); loadSessionSets(log) } }}
              className="w-full flex items-center gap-3 px-4 min-h-[60px] text-left hover:bg-surface-2 transition-colors"
            >
              <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${log.completed ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'}`}>
                {log.completed ? <Check size={18} /> : <Dumbbell size={16} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink truncate">{sched?._displayName ?? 'Workout'}</span>
                <span className="block text-[13px] text-muted">{formatDate(log.logged_at, { weekday: 'short', day: 'numeric', month: 'short' })} · {relativeDay(log.logged_at)}{log.completed ? '' : ' · Not finished'}</span>
              </span>
              <ChevronDown size={18} className={`text-faint shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 bg-bg/60">
                {sched && (
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => onOpenWorkout(sched, log)}>Edit session</Button>
                )}
                {Object.keys(byEx).length === 0 ? (
                  <p className="text-[13px] text-muted pt-3">No set data recorded for this session.</p>
                ) : (
                  <ul className="mt-3 space-y-1.5">
                    {Object.entries(byEx).map(([k, ex]) => {
                      const exOpen = openEx === `${log.id}_${k}`
                      const hit = pbs[k]
                      return (
                        <li key={k} className="rounded-[14px] bg-surface border border-line">
                          <button onClick={() => setOpenEx(exOpen ? null : `${log.id}_${k}`)} className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left">
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="text-[15px] font-semibold text-ink truncate">{ex.name}</span>
                              {hit?.size > 0 && <Chip tone="accent"><Trophy size={12} /> PB</Chip>}
                            </span>
                            <span className="flex items-center gap-2 shrink-0 text-[13px] text-muted">{ex.sets.length} sets<ChevronDown size={16} className={`text-faint transition-transform ${exOpen ? 'rotate-180' : ''}`} /></span>
                          </button>
                          {exOpen && (
                            <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                              {ex.sets.map((s, i) => (
                                <span key={s.id || i} className="rounded-[10px] bg-surface-2 px-2.5 py-1.5 text-center">
                                  <span className="block text-[11px] text-muted">Set {s.set_number}</span>
                                  <span className="block text-[13px] font-bold text-ink tabular-nums">{s.weight_kg} kg × {s.reps_completed}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        )
      })}
    </Card>
  )
}

function PersonalBests({ personalBests }) {
  const [search, setSearch] = useState('')
  const grouped = Object.values(
    personalBests.reduce((acc, pb) => {
      const key = pb.exercise_id || pb.id
      ;(acc[key] ||= { name: pb.exercises?.name || 'Exercise', types: {}, latest: pb.achieved_at }).types[pb.pb_type] = pb
      return acc
    }, {}),
  ).filter((row) => row.name.toLowerCase().includes(search.trim().toLowerCase()))
  if (personalBests.length === 0) return <Card><EmptyState icon={Trophy} title="No personal bests yet" body="They are worked out automatically from logged sets." /></Card>
  return (
    <div>
      <label className="relative block mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find an exercise" className="w-full h-11 pl-11 pr-4 rounded-full border border-line-strong bg-surface text-ink placeholder:text-faint outline-none focus:border-accent" />
      </label>
      <Card padded={false} className="divide-y divide-line overflow-hidden">
        {grouped.length === 0 ? (
          <p className="text-[15px] text-muted p-4">No personal bests for that exercise.</p>
        ) : grouped.map((row, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-ink truncate">{row.name}</p>
              <p className="text-[13px] text-muted shrink-0">{relativeDay(row.latest)}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {Object.entries(row.types).map(([t, pb]) => (
                <span key={t} className="text-[13px] rounded-full bg-surface-2 px-2.5 py-1"><span className="text-muted">{PB_LABEL[t] ?? t}</span> <span className="font-bold text-ink tabular-nums">{pb.value} {PB_UNIT[t] ?? 'kg'}</span></span>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

/* ---------------- Tab ---------------- */
export default function TrainingTab(props) {
  const {
    client, programAssignment, programWorkouts, allPrograms, allProgramWorkouts, workoutExercises, scheduledWorkouts, workoutLogs,
    onScheduleWorkout, onRemoveScheduled, onAssignProgram, onRemoveProgram, onAutoSchedule, onMoveWorkout, onOpenWorkout,
    assignOpen, setAssignOpen,
  } = props
  const [section, setSection] = useState('schedule')
  const [view, setView] = useState('4week')
  const [start, setStart] = useState(() => mondayOf(new Date()))
  const [addDate, setAddDate] = useState(null)
  const [autoOpen, setAutoOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [dragging, setDragging] = useState(null)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const weeksN = view === '1week' ? 1 : view === '2week' ? 2 : 4
  const days = Array.from({ length: weeksN * 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d })
  const today = toLocalDateStr()
  const end = days[days.length - 1]
  const doneLog = (sw) => workoutLogs.find((l) => l.scheduled_workout_id === sw.id && l.completed) ?? null
  const isDone = (sw) => !!doneLog(sw)
  const openSw = (sw) => onOpenWorkout(sw, doneLog(sw))
  const move = (dir) => setStart((prev) => { const d = new Date(prev); d.setDate(d.getDate() + dir * weeksN * 7); return d })

  function handleDragEnd({ active, over }) {
    setDragging(null)
    if (!over || active.id === over.id) return
    onMoveWorkout(active.id, over.id)
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Program */}
      <Card className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="w-11 h-11 rounded-[14px] bg-accent-soft text-accent flex items-center justify-center shrink-0"><ClipboardList size={20} /></span>
          <div className="min-w-0">
            {programAssignment ? (
              <>
                <p className="font-bold text-ink truncate">{programAssignment.programs?.name}</p>
                <p className="text-[13px] text-muted">Started {formatDate(programAssignment.start_date)} · {programWorkouts.length} {programWorkouts.length === 1 ? 'workout' : 'workouts'}</p>
              </>
            ) : (
              <>
                <p className="font-bold text-ink">No program yet</p>
                <p className="text-[13px] text-muted">Assign one to start scheduling sessions.</p>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {programAssignment && <Button variant="secondary" size="sm" onClick={() => setAutoOpen(true)}><CalendarPlus size={16} /> Fill schedule</Button>}
          <Button variant={programAssignment ? 'secondary' : 'primary'} size="sm" onClick={() => setAssignOpen(true)}>{programAssignment ? 'Change' : 'Assign program'}</Button>
          {programAssignment && <Button variant="danger" size="sm" onClick={() => setRemoveOpen(true)}>Remove</Button>}
        </div>
      </Card>

      <Segmented
        className="max-w-[440px]"
        value={section}
        onChange={setSection}
        options={[{ value: 'schedule', label: 'Schedule' }, { value: 'history', label: 'Sessions' }, { value: 'pbs', label: 'Personal bests' }]}
      />

      {section === 'schedule' && (
        <Panel
          title={`${start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} to ${end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`}
          padded={false}
          action={
            <>
              <Button variant="ghost" size="sm" onClick={() => setStart(mondayOf(new Date()))}>Today</Button>
              <button onClick={() => move(-1)} aria-label="Earlier" className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:bg-surface-2"><ChevronLeft size={18} /></button>
              <button onClick={() => move(1)} aria-label="Later" className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:bg-surface-2"><ChevronRight size={18} /></button>
            </>
          }
        >
          <div className="px-4 pb-3 pt-1">
            <Segmented className="max-w-[300px]" value={view} onChange={setView} options={[{ value: '1week', label: '1 week' }, { value: '2week', label: '2 weeks' }, { value: '4week', label: '4 weeks' }]} />
          </div>

          {/* Desktop grid, drag to move */}
          <div className="hidden md:block border-t border-line">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active }) => setDragging(scheduledWorkouts.find((sw) => sw.id === active.id) ?? null)} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-7 border-b border-line">
                {WEEKDAYS.map((d) => <div key={d} className="py-2 text-center text-xs font-bold uppercase tracking-[0.06em] text-muted">{d}</div>)}
              </div>
              {Array.from({ length: weeksN }, (_, w) => (
                <div key={w} className="grid grid-cols-7 border-b border-line last:border-b-0">
                  {days.slice(w * 7, w * 7 + 7).map((day) => {
                    const ds = toLocalDateStr(day)
                    return (
                      <DroppableDay
                        key={ds}
                        dateStr={ds}
                        day={day}
                        isToday={ds === today}
                        isPast={ds < today}
                        items={scheduledWorkouts.filter((sw) => sw.scheduled_date === ds)}
                        canAdd={!!programAssignment}
                        dragging={dragging}
                        isDone={isDone}
                        onAdd={() => setAddDate(day)}
                        onRemove={onRemoveScheduled}
                        onOpen={openSw}
                      />
                    )
                  })}
                </div>
              ))}
              <DragOverlay>
                {dragging ? <div className="bg-surface border-2 border-accent rounded-[10px] px-2 py-1.5 shadow-xl w-[120px] text-xs font-bold text-accent truncate">{dragging._displayName}</div> : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Phone agenda */}
          <ul className="md:hidden border-t border-line divide-y divide-line">
            {days.map((day) => {
              const ds = toLocalDateStr(day)
              const items = scheduledWorkouts.filter((sw) => sw.scheduled_date === ds)
              return (
                <li key={ds} className={`flex gap-3 px-4 py-2 ${ds < today ? 'opacity-70' : ''}`}>
                  <span className={`w-10 shrink-0 text-center pt-1.5 ${ds === today ? 'text-accent' : 'text-muted'}`}>
                    <span className="block text-[11px] font-bold uppercase">{day.toLocaleDateString('en-AU', { weekday: 'short' })}</span>
                    <span className="block font-display text-lg leading-tight">{day.getDate()}</span>
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col gap-1.5 justify-center min-h-[44px]">
                    {items.map((sw) => {
                      const done = isDone(sw)
                      return (
                        <span key={sw.id} className={`flex items-center rounded-[12px] ${done ? 'bg-accent text-on-accent' : 'bg-accent-soft text-accent'}`}>
                          <button onClick={() => openSw(sw)} className="flex-1 min-w-0 text-left px-3 py-2 text-sm font-bold truncate">
                            {done && <Check size={13} strokeWidth={3} className="inline -mt-0.5 mr-1" />}{sw._displayName}
                          </button>
                          <button onClick={() => onRemoveScheduled(sw.id)} aria-label="Remove from schedule" className="w-10 h-10 flex items-center justify-center opacity-70"><X size={15} /></button>
                        </span>
                      )
                    })}
                  </span>
                  {programAssignment && (
                    <button onClick={() => setAddDate(day)} aria-label={`Add workout on ${ds}`} className="w-10 h-10 self-center rounded-full flex items-center justify-center text-muted hover:bg-surface-2"><Plus size={18} /></button>
                  )}
                </li>
              )
            })}
          </ul>
        </Panel>
      )}

      {section === 'history' && <History {...props} onOpenWorkout={onOpenWorkout} />}
      {section === 'pbs' && <PersonalBests personalBests={props.personalBests} />}

      <FindWorkoutSheet
        open={!!addDate}
        date={addDate}
        onClose={() => setAddDate(null)}
        allPrograms={allPrograms}
        allProgramWorkouts={allProgramWorkouts}
        workoutExercises={workoutExercises}
        programAssignment={programAssignment}
        onSchedule={onScheduleWorkout}
      />
      <AssignProgramSheet
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        clientName={firstName(client.full_name)}
        allPrograms={allPrograms}
        allProgramWorkouts={allProgramWorkouts}
        programAssignment={programAssignment}
        onAssign={onAssignProgram}
      />
      {autoOpen && (
        <AutoScheduleSheet
          open
          onClose={() => setAutoOpen(false)}
          programAssignment={programAssignment}
          programWorkouts={programWorkouts}
          onAutoSchedule={async (s, r) => { const first = await onAutoSchedule(s, r); if (first) { setStart(mondayOf(first)); setAutoOpen(false); setSection('schedule') } }}
        />
      )}
      <Sheet
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title="Remove program?"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" disabled={removing} onClick={() => setRemoveOpen(false)}>Keep it</Button>
            <Button variant="danger" className="flex-1" disabled={removing} onClick={async () => { setRemoving(true); const ok = await onRemoveProgram(); setRemoving(false); if (ok) setRemoveOpen(false) }}>
              {removing ? 'Removing' : 'Remove program'}
            </Button>
          </div>
        }
      >
        <div className="flex gap-3">
          <AlertCircle size={20} className="text-bad shrink-0 mt-0.5" />
          <p className="text-[15px] text-ink leading-relaxed">
            This takes <span className="font-bold">{programAssignment?.programs?.name}</span> off {client.full_name}'s profile. Sessions already on the schedule are not deleted.
          </p>
        </div>
      </Sheet>
    </div>
  )
}

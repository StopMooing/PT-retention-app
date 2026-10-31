import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronRight, ChevronUp, ChevronDown, Trash2, ClipboardList, Dumbbell, Check, UserPlus, PlayCircle } from 'lucide-react'
import { supabase } from './supabase'
import { PageTitle, Card, Button, Chip, Sheet, EmptyState, Field, Segmented, SectionLabel } from './ui'
import { Loading, Toast, BackLink, Select, TextArea, MiniField, SearchBox, FilterChips, ConfirmRemove, Toggle } from './tools/kit'
import { useToast } from './tools/useToast'
import { toLocalDateStr } from './tools/dates'
import StartPlanFields from './lib/StartPlanFields'
import { programPlan, planWeeks, defaultStartDate, defaultTrainingDays, planReady } from './lib/schedule.js'
import { insertPlannedSessions } from './lib/planWrites'

const EQUIPMENT = [
  ['barbell', 'Barbell'], ['dumbbell', 'Dumbbell'], ['cable', 'Cable'], ['machine', 'Machine'],
  ['bodyweight', 'Bodyweight'], ['band', 'Band'], ['kettlebell', 'Kettlebell'], ['trx', 'TRX'],
  ['sled', 'Sled'], ['landmine', 'Landmine'], ['trap_bar', 'Trap bar'], ['functional', 'Functional'], ['plate', 'Plate'],
]

// What the "New program" sheet can build. On-demand ones only show once the database
// has the on-demand columns (see onDemandOK below).
const NEW_TYPES = [
  { value: 'coaching', label: 'Coaching program', hint: 'Built for you to assign to clients.' },
  { value: 'program', label: 'On-demand program', hint: 'A multi-day plan every member can start.' },
  { value: 'workout', label: 'On-demand workout', hint: 'A single session every member can start.' },
]
const EMPTY_NEW_PROGRAM = { name: '', description: '', type: 'coaching' }

const EMPTY_NEW_EXERCISE = { exercise_id: '', sets: '', reps: '', rest_seconds: '', notes: '' }

// Rough session length: each set is about 45 seconds of work plus its rest.
function estimateMinutes(exercises) {
  return Math.round(
    (exercises || []).reduce((total, ex) => {
      const sets = parseInt(ex.sets) || 3
      const rest = parseInt(ex.rest_seconds) || 90
      return total + sets * (rest + 45)
    }, 0) / 60,
  )
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function prescription(ex) {
  const parts = []
  if (ex.sets != null && ex.reps) parts.push(`${ex.sets} x ${ex.reps}`)
  else if (ex.sets != null) parts.push(plural(ex.sets, 'set'))
  else if (ex.reps) parts.push(`${ex.reps} reps`)
  if (ex.rest_seconds != null) parts.push(`${ex.rest_seconds}s rest`)
  return parts.join(' · ')
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgramBuilder({ user }) {
  // Programs
  const [programs, setPrograms] = useState([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [newProgram, setNewProgram] = useState(EMPTY_NEW_PROGRAM)
  const [savingProgram, setSavingProgram] = useState(false)

  // On-demand library. onDemandOK stays false until the database has programs.is_on_demand
  // (migration pending_on_demand_library). Until then every on-demand control is hidden and
  // is_on_demand / kind are never sent.
  const [onDemandOK, setOnDemandOK] = useState(false)
  const [listView, setListView] = useState('coaching')
  const [savingOnDemand, setSavingOnDemand] = useState(false)

  // Workout days and their exercises (exercisesByDay: day id -> ordered rows)
  const [workoutDays, setWorkoutDays] = useState([])
  const [exercisesByDay, setExercisesByDay] = useState({})
  const [loadingDays, setLoadingDays] = useState(false)
  const [newDay, setNewDay] = useState({ name: '', day_number: '' })
  const [savingDay, setSavingDay] = useState(false)

  // Adding an exercise (sheet), searching the library
  const [allExercises, setAllExercises] = useState([])
  const [addToDay, setAddToDay] = useState(null)
  const [newExercise, setNewExercise] = useState(EMPTY_NEW_EXERCISE)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('')
  const [muscleFilter, setMuscleFilter] = useState('')
  const [savingExercise, setSavingExercise] = useState(false)

  // Inline editing of one exercise row
  const [editingExerciseId, setEditingExerciseId] = useState(null)
  const [editExercise, setEditExercise] = useState({ sets: '', reps: '', rest_seconds: '', notes: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [reordering, setReordering] = useState(false)

  // Assign to a client
  const [clients, setClients] = useState([])
  const [assignClientId, setAssignClientId] = useState('')
  // Local date, not UTC: toISOString() gives yesterday's date before 9:30am in Adelaide
  const [assignStartDate, setAssignStartDate] = useState(() => defaultStartDate(toLocalDateStr()))
  const [assignDays, setAssignDays] = useState([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState('')

  // Which sheet is open: 'program' | 'day' | 'exercise' | 'assign' | null
  const [sheet, setSheet] = useState(null)
  const [toast, showToast] = useToast()

  // ── Fetch programs ──
  const fetchPrograms = useCallback(async () => {
    setLoadingPrograms(true)
    const { data, error } = await supabase
      .from('programs')
      .select('*, program_workouts(id)')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
    if (!error && data) setPrograms(data)
    setLoadingPrograms(false)
  }, [user.id])

  // ── Fetch all exercises for the search ──
  const fetchAllExercises = useCallback(async () => {
    const { data } = await supabase
      .from('exercises')
      .select('id, name, muscle_group, equipment, category, is_global, exercise_aliases(alias)')
      .or(`is_global.eq.true,created_by.eq.${user.id}`)
      .order('name')
    if (data) setAllExercises(data)
  }, [user.id])

  useEffect(() => {
    let cancelled = false
    supabase.from('programs').select('is_on_demand').limit(1).then(({ error }) => {
      if (cancelled) return
      if (error) console.warn('On-demand library hidden: programs.is_on_demand is not available yet.', error.message)
      else setOnDemandOK(true)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    fetchPrograms()
    fetchAllExercises()
    supabase.from('clients').select('id, full_name').eq('pt_id', user.id).order('full_name')
      .then(({ data }) => { if (data) setClients(data) })
  }, [fetchPrograms, fetchAllExercises, user.id])

  function openAssign() {
    setAssignError('')
    setAssignStartDate(defaultStartDate(toLocalDateStr()))
    setAssignDays(defaultTrainingDays(workoutDays.length))
    setSheet('assign')
  }

  // Assigns the program from the start date (the client's current program is switched
  // off first, as on the client profile) and puts every week of it on their schedule on
  // the chosen weekdays. Sessions already there are skipped.
  async function handleAssignProgram() {
    if (!assignClientId) return
    setAssignLoading(true)
    setAssignError('')
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: previous } = await supabase.from('program_assignments').select('id').eq('client_id', assignClientId).eq('is_active', true)
    const previousIds = (previous ?? []).map(a => a.id)
    if (previousIds.length > 0) {
      const { error: offError } = await supabase.from('program_assignments').update({ is_active: false }).in('id', previousIds)
      if (offError) {
        setAssignLoading(false)
        setAssignError('Something went wrong. Please try again.')
        return
      }
    }
    const { error } = await supabase.from('program_assignments').insert({
      program_id:  selectedProgram.id,
      client_id:   assignClientId,
      assigned_by: authUser.id,
      start_date:  assignStartDate,
      is_active:   true,
    })
    if (error) {
      if (previousIds.length > 0) await supabase.from('program_assignments').update({ is_active: true }).in('id', previousIds)
      setAssignLoading(false)
      setAssignError('Something went wrong. Please try again.')
      return
    }
    const plan = programPlan({ days: workoutDays, weeks: planWeeks(selectedProgram), startDate: assignStartDate, trainingDays: assignDays })
    const { error: planError } = await insertPlannedSessions({ clientId: assignClientId, createdBy: authUser.id, plan })
    setAssignLoading(false)
    const name = clients.find(c => c.id === assignClientId)?.full_name ?? 'client'
    setSheet(null)
    setAssignClientId('')
    showToast(planError
      ? `Assigned to ${name.split(' ')[0]}, but the sessions didn't go on the schedule. Use Fill schedule on their profile.`
      : `Assigned to ${name.split(' ')[0]}, starting ${formatDate(assignStartDate)}`)
  }

  async function fetchDayExercises(workoutId) {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*, exercises(id, name, muscle_group)')
      .eq('program_workout_id', workoutId)
      .order('order_index')
      .order('created_at')
    if (!error && data) setExercisesByDay(prev => ({ ...prev, [workoutId]: data }))
  }

  async function fetchWorkoutDays(programId) {
    setLoadingDays(true)
    const { data, error } = await supabase
      .from('program_workouts')
      .select('*, workout_exercises(*)')
      .eq('program_id', programId)
      .order('day_number')
    if (!error && data) {
      setWorkoutDays(data)
      // Each day's exercises, in order and with names, using the same per-day query as before.
      await Promise.all(data.map(d => fetchDayExercises(d.id)))
    }
    setLoadingDays(false)
  }

  function openProgram(program) {
    setSelectedProgram(program)
    setWorkoutDays([])
    setExercisesByDay({})
    setEditingExerciseId(null)
    fetchWorkoutDays(program.id)
  }

  function closeProgram() {
    // Land on the list the program now belongs to, so a just-toggled one is easy to find.
    setListView(isOnDemand(selectedProgram) ? 'ondemand' : 'coaching')
    setSelectedProgram(null)
    setEditingExerciseId(null)
  }

  function openNewProgram() {
    setNewProgram({ ...EMPTY_NEW_PROGRAM, type: onDemandOK && listView === 'ondemand' ? 'workout' : 'coaching' })
    setSheet('program')
  }

  // A single on-demand workout is a program with exactly one day, named after the workout.
  async function createWorkoutDay(program) {
    const { data, error } = await supabase
      .from('program_workouts')
      .insert({ program_id: program.id, name: program.name, day_number: 1 })
      .select()
      .single()
    return error ? null : data
  }

  async function handleSaveProgram(e) {
    e.preventDefault()
    if (!newProgram.name.trim()) return
    const type = onDemandOK ? newProgram.type : 'coaching'
    const row = { name: newProgram.name.trim(), description: newProgram.description.trim() || null, created_by: user.id }
    if (onDemandOK) {
      row.is_on_demand = type !== 'coaching'
      row.kind = type === 'workout' ? 'workout' : 'program'
    }
    setSavingProgram(true)
    const { data, error } = await supabase.from('programs').insert(row).select().single()
    let day = null
    if (!error && type === 'workout') day = await createWorkoutDay(data)
    setSavingProgram(false)
    if (error) { showToast(type === 'workout' ? 'Could not save workout.' : 'Could not save program.', 'bad'); return }
    const withMeta = { ...data, program_workouts: day ? [{ id: day.id }] : [] }
    setPrograms(prev => [withMeta, ...prev])
    setNewProgram(EMPTY_NEW_PROGRAM)
    setSheet(null)
    setListView(type === 'coaching' ? 'coaching' : 'ondemand')
    showToast(type === 'workout' ? 'Workout created' : 'Program created')
    openProgram(withMeta)
  }

  // Workout editor with no day yet (its day failed to save on create): make it, then add.
  async function addToSingleWorkout() {
    let day = workoutDays[0]
    if (!day) {
      day = await createWorkoutDay(selectedProgram)
      if (!day) { showToast('Could not set up this workout. Try again.', 'bad'); return }
      setWorkoutDays([{ ...day, workout_exercises: [] }])
      setExercisesByDay(prev => ({ ...prev, [day.id]: [] }))
      setPrograms(prev => prev.map(p => p.id === selectedProgram.id ? { ...p, program_workouts: [{ id: day.id }] } : p))
    }
    openAddExercise(day)
  }

  async function handleToggleOnDemand(next) {
    if (!onDemandOK || savingOnDemand) return
    setSavingOnDemand(true)
    const { data, error } = await supabase
      .from('programs')
      .update({ is_on_demand: next })
      .eq('id', selectedProgram.id)
      .select('id')
    setSavingOnDemand(false)
    // A blocked update returns no error and no rows, so check both.
    if (error || !data || data.length === 0) { showToast('Could not change that. Try again.', 'bad'); return }
    setSelectedProgram(p => ({ ...p, is_on_demand: next }))
    setPrograms(prev => prev.map(p => p.id === selectedProgram.id ? { ...p, is_on_demand: next } : p))
    showToast(next ? 'Added to the on-demand library' : 'Taken out of the on-demand library')
  }

  function isOnDemand(program) {
    return onDemandOK && !!program?.is_on_demand
  }

  function isSingleWorkout(program) {
    return onDemandOK && program?.kind === 'workout'
  }

  function openNewDay() {
    const next = workoutDays.reduce((max, d) => Math.max(max, d.day_number || 0), 0) + 1
    setNewDay({ name: '', day_number: String(next) })
    setSheet('day')
  }

  async function handleSaveDay(e) {
    e.preventDefault()
    if (!newDay.name.trim() || !newDay.day_number) return
    setSavingDay(true)
    const { data, error } = await supabase
      .from('program_workouts')
      .insert({ program_id: selectedProgram.id, name: newDay.name.trim(), day_number: parseInt(newDay.day_number, 10) })
      .select()
      .single()
    setSavingDay(false)
    if (error) { showToast('Could not save day.', 'bad'); return }
    setWorkoutDays(prev => [...prev, { ...data, workout_exercises: [] }].sort((a, b) => a.day_number - b.day_number))
    setExercisesByDay(prev => ({ ...prev, [data.id]: [] }))
    setPrograms(prev => prev.map(p =>
      p.id === selectedProgram.id
        ? { ...p, program_workouts: [...(p.program_workouts ?? []), { id: data.id }] }
        : p
    ))
    setNewDay({ name: '', day_number: '' })
    setSheet(null)
    showToast(`${data.name} added`)
  }

  function openAddExercise(day) {
    setAddToDay(day)
    setNewExercise(EMPTY_NEW_EXERCISE)
    setExerciseSearch('')
    setSheet('exercise')
  }

  async function handleSaveExercise(e) {
    e.preventDefault()
    if (!newExercise.exercise_id || savingExercise || !addToDay) return
    setSavingExercise(true)
    const dayExercises = exercisesByDay[addToDay.id] ?? []
    // Next position in this day. Older rows may all be 0; created_at breaks ties when fetching.
    const nextOrderIndex = dayExercises.reduce((max, ex) => Math.max(max, ex.order_index ?? 0), -1) + 1
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert({
        program_workout_id: addToDay.id,
        exercise_id: newExercise.exercise_id,
        sets: newExercise.sets ? parseInt(newExercise.sets, 10) : null,
        reps: newExercise.reps.trim() || null,
        rest_seconds: newExercise.rest_seconds ? parseInt(newExercise.rest_seconds, 10) : null,
        notes: newExercise.notes.trim() || null,
        order_index: nextOrderIndex,
      })
      .select('*, exercises(id, name, muscle_group)')
      .single()
    setSavingExercise(false)
    if (error) { showToast('Could not add exercise.', 'bad'); return }
    setExercisesByDay(prev => ({ ...prev, [addToDay.id]: [...(prev[addToDay.id] ?? []), data] }))
    // The sheet stays open so the coach can add the next exercise straight away.
    setNewExercise(EMPTY_NEW_EXERCISE)
    setExerciseSearch('')
    showToast(`${data.exercises?.name ?? 'Exercise'} added`)
  }

  async function handleDeleteExercise(dayId, id) {
    setDeletingId(id)
    const { error } = await supabase.from('workout_exercises').delete().eq('id', id)
    if (error) {
      showToast('Could not delete exercise.', 'bad')
    } else {
      setExercisesByDay(prev => ({ ...prev, [dayId]: (prev[dayId] ?? []).filter(e => e.id !== id) }))
      setEditingExerciseId(null)
    }
    setDeletingId(null)
  }

  function startEditExercise(exercise) {
    setEditingExerciseId(exercise.id)
    setEditExercise({
      sets: exercise.sets != null ? String(exercise.sets) : '',
      reps: exercise.reps ?? '',
      rest_seconds: exercise.rest_seconds != null ? String(exercise.rest_seconds) : '',
      notes: exercise.notes ?? '',
    })
  }

  function cancelEditExercise() {
    setEditingExerciseId(null)
    setEditExercise({ sets: '', reps: '', rest_seconds: '', notes: '' })
  }

  async function handleUpdateExercise(dayId, id) {
    if (savingEdit) return
    setSavingEdit(true)
    const updates = {
      sets: editExercise.sets ? parseInt(editExercise.sets, 10) : null,
      reps: editExercise.reps.trim() || null,
      rest_seconds: editExercise.rest_seconds ? parseInt(editExercise.rest_seconds, 10) : null,
      notes: editExercise.notes.trim() || null,
    }
    const { data, error } = await supabase
      .from('workout_exercises')
      .update(updates)
      .eq('id', id)
      .select('*, exercises(id, name, muscle_group)')
    setSavingEdit(false)
    // An update blocked by RLS returns no error and no rows. Treat that as a failure, not a success.
    if (error || !data || data.length === 0) { showToast('Could not save changes.', 'bad'); return }
    const updated = data[0]
    setExercisesByDay(prev => ({ ...prev, [dayId]: (prev[dayId] ?? []).map(e => e.id === id ? updated : e) }))
    cancelEditExercise()
    showToast('Saved')
  }

  // Move one exercise up or down. Rewrites order_index for every row whose position
  // changed (older rows may all share 0), then re-reads the day if anything fails.
  async function moveExercise(dayId, index, dir) {
    const list = [...(exercisesByDay[dayId] ?? [])]
    const target = index + dir
    if (reordering || target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
    const changed = list
      .map((ex, i) => ({ ex, i }))
      .filter(({ ex, i }) => ex.order_index !== i)
    setExercisesByDay(prev => ({ ...prev, [dayId]: list.map((ex, i) => ({ ...ex, order_index: i })) }))
    setReordering(true)
    const results = await Promise.all(changed.map(({ ex, i }) =>
      supabase.from('workout_exercises').update({ order_index: i }).eq('id', ex.id).select('id')
    ))
    setReordering(false)
    if (results.some(r => r.error || !r.data || r.data.length === 0)) {
      showToast('Could not save the new order.', 'bad')
      fetchDayExercises(dayId)
    }
  }

  function dayCount(program) {
    if (selectedProgram?.id === program.id) return workoutDays.length
    return program.program_workouts?.length ?? 0
  }

  const muscleOptions = ['All', ...[...new Set(allExercises.map(e => e.muscle_group).filter(Boolean))].sort()]

  const filteredExercises = allExercises.filter(ex => {
    const q = exerciseSearch.toLowerCase()
    const matchesSearch = !q ||
      ex.name.toLowerCase().includes(q) ||
      ex.exercise_aliases?.some(a => a.alias.toLowerCase().includes(q))
    const matchesEquipment = !equipmentFilter || ex.equipment === equipmentFilter
    const matchesMuscle = !muscleFilter || ex.muscle_group === muscleFilter
    return matchesSearch && matchesEquipment && matchesMuscle
  })
  const pickedExercise = allExercises.find(e => e.id === newExercise.exercise_id)
  const totalExercises = workoutDays.reduce((t, d) => t + (exercisesByDay[d.id]?.length ?? 0), 0)

  // ─── Sheets ────────────────────────────────────────────────────────────────

  const newIsWorkout = onDemandOK && newProgram.type === 'workout'
  const newProgramSheet = (
    <Sheet open={sheet === 'program'} onClose={() => setSheet(null)} title={onDemandOK ? 'Create new' : 'New program'}>
      <form onSubmit={handleSaveProgram} className="flex flex-col gap-4">
        {onDemandOK && (
          <div role="radiogroup" aria-label="What are you building?" className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink mb-0.5">What are you building?</span>
            {NEW_TYPES.map(t => {
              const on = newProgram.type === t.value
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setNewProgram(p => ({ ...p, type: t.value }))}
                  className={`w-full flex items-center gap-3 px-3 min-h-[56px] py-2 rounded-[14px] border text-left transition-colors ${on ? 'bg-accent-soft border-accent' : 'border-line hover:bg-surface-2'}`}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-accent bg-accent text-on-accent' : 'border-line-strong'}`}>
                    {on && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold text-ink">{t.label}</span>
                    <span className="block text-[13px] text-muted">{t.hint}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
        <Field
          label="Name" autoFocus required placeholder={newIsWorkout ? 'e.g. 30 minute dumbbell session' : 'e.g. 12 week strength'}
          value={newProgram.name} onChange={e => setNewProgram(p => ({ ...p, name: e.target.value }))}
        />
        <TextArea
          label="What is it for? (optional)" rows={2} placeholder={newIsWorkout ? 'e.g. Quick full body, dumbbells only' : 'e.g. Full body build for beginners'}
          value={newProgram.description} onChange={e => setNewProgram(p => ({ ...p, description: e.target.value }))}
        />
        <Button type="submit" size="lg" block disabled={savingProgram || !newProgram.name.trim()}>
          {savingProgram ? 'Creating…' : newIsWorkout ? 'Create workout' : 'Create program'}
        </Button>
      </form>
    </Sheet>
  )

  const newDaySheet = (
    <Sheet open={sheet === 'day'} onClose={() => setSheet(null)} title="Add workout day">
      <form onSubmit={handleSaveDay} className="flex flex-col gap-4">
        <div className="grid grid-cols-[96px_1fr] gap-3">
          <Field
            label="Day" type="number" inputMode="numeric" min="1" required
            value={newDay.day_number} onChange={e => setNewDay(d => ({ ...d, day_number: e.target.value }))}
          />
          <Field
            label="Name" autoFocus required placeholder="e.g. Upper A"
            value={newDay.name} onChange={e => setNewDay(d => ({ ...d, name: e.target.value }))}
          />
        </div>
        <Button type="submit" size="lg" block disabled={savingDay || !newDay.name.trim() || !newDay.day_number}>
          {savingDay ? 'Adding…' : 'Add day'}
        </Button>
      </form>
    </Sheet>
  )

  const addExerciseSheet = (
    <Sheet
      open={sheet === 'exercise'}
      onClose={() => setSheet(null)}
      title={addToDay ? `Add to ${addToDay.name}` : 'Add exercise'}
      footer={pickedExercise ? (
        <Button type="submit" form="add-exercise-form" size="lg" block disabled={savingExercise}>
          {savingExercise ? 'Adding…' : 'Add to workout'}
        </Button>
      ) : null}
    >
      {pickedExercise ? (
        <form id="add-exercise-form" onSubmit={handleSaveExercise} className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 rounded-[14px] bg-accent-soft">
            <span className="w-9 h-9 rounded-full bg-accent text-on-accent flex items-center justify-center shrink-0">
              <Check size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink truncate">{pickedExercise.name}</p>
              {pickedExercise.muscle_group && <p className="text-[13px] text-muted">{pickedExercise.muscle_group}</p>}
            </div>
            <button
              type="button"
              onClick={() => setNewExercise(ex => ({ ...ex, exercise_id: '' }))}
              className="text-sm font-bold text-accent px-2 h-9"
            >
              Change
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MiniField
              label="Sets" type="number" inputMode="numeric" min="1" placeholder="3" autoFocus
              value={newExercise.sets} onChange={e => setNewExercise(ex => ({ ...ex, sets: e.target.value }))}
            />
            <MiniField
              label="Reps" type="text" placeholder="8-12"
              value={newExercise.reps} onChange={e => setNewExercise(ex => ({ ...ex, reps: e.target.value }))}
            />
            <MiniField
              label="Rest (sec)" type="number" inputMode="numeric" min="0" placeholder="90"
              value={newExercise.rest_seconds} onChange={e => setNewExercise(ex => ({ ...ex, rest_seconds: e.target.value }))}
            />
          </div>
          <TextArea
            label="Coaching note (optional)" rows={2} placeholder="e.g. Pause at the bottom"
            value={newExercise.notes} onChange={e => setNewExercise(ex => ({ ...ex, notes: e.target.value }))}
          />
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <SearchBox value={exerciseSearch} onChange={setExerciseSearch} placeholder="Search exercises" autoFocus />
          <FilterChips
            options={muscleOptions}
            value={muscleFilter || 'All'}
            onChange={v => setMuscleFilter(v === 'All' ? '' : v)}
          />
          <Select value={equipmentFilter} onChange={e => setEquipmentFilter(e.target.value)} aria-label="Equipment">
            <option value="">Any equipment</option>
            {EQUIPMENT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          {filteredExercises.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">
              {exerciseSearch ? `No exercises match "${exerciseSearch}".` : 'No exercises match these filters.'}
            </p>
          ) : (
            <ul className="divide-y divide-line -mx-1">
              {filteredExercises.slice(0, 50).map(ex => (
                <li key={ex.id}>
                  <button
                    type="button"
                    onClick={() => setNewExercise(n => ({ ...n, exercise_id: ex.id }))}
                    className="w-full min-h-[52px] px-1 py-2 flex items-center justify-between gap-3 text-left hover:bg-surface-2 rounded-xl"
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-ink truncate">{ex.name}</span>
                      {ex.muscle_group && <span className="block text-[13px] text-muted">{ex.muscle_group}</span>}
                    </span>
                    <Plus size={18} className="text-accent shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {filteredExercises.length > 50 && (
            <p className="text-[13px] text-muted text-center">Showing 50 of {filteredExercises.length}. Search to narrow it down.</p>
          )}
        </div>
      )}
    </Sheet>
  )

  const assignReady = workoutDays.length > 0
    ? planReady({ dayCount: workoutDays.length, startDate: assignStartDate, trainingDays: assignDays })
    : assignStartDate >= toLocalDateStr()
  const assignSheet = (
    <Sheet
      open={sheet === 'assign'}
      onClose={() => setSheet(null)}
      title="Assign to a client"
      footer={
        <Button size="lg" block onClick={handleAssignProgram} disabled={assignLoading || !assignClientId || !assignReady}>
          {assignLoading ? 'Assigning…' : 'Assign program'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[15px] text-muted">
          <span className="font-bold text-ink">{selectedProgram?.name}</span> goes in your client's app, with every week on their schedule from the start date.
        </p>
        {clients.length === 0 ? (
          <p className="text-sm text-muted bg-surface-2 rounded-[14px] px-4 py-3">Add a client from the dashboard first.</p>
        ) : (
          <Select label="Client" value={assignClientId} onChange={e => setAssignClientId(e.target.value)}>
            <option value="">Choose a client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </Select>
        )}
        {workoutDays.length > 0 ? (
          <StartPlanFields
            dayCount={workoutDays.length}
            weeks={planWeeks(selectedProgram)}
            startDate={assignStartDate}
            onStartDate={setAssignStartDate}
            trainingDays={assignDays}
            onTrainingDays={setAssignDays}
          />
        ) : (
          <Field label="Start date" type="date" min={toLocalDateStr()} value={assignStartDate} onChange={e => e.target.value && setAssignStartDate(e.target.value)} />
        )}
        {assignError && <p className="m-0 text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3">{assignError}</p>}
      </div>
    </Sheet>
  )

  // ─── Program list ──────────────────────────────────────────────────────────

  if (!selectedProgram) {
    const programCard = (program) => {
      const single = isSingleWorkout(program)
      const Icon = single ? PlayCircle : Dumbbell
      return (
        <Card key={program.id} as="button" onClick={() => openProgram(program)} className="flex items-center gap-3 min-h-[88px]">
          <span className="w-11 h-11 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
            <Icon size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-bold text-ink truncate">{program.name}</span>
            {program.description && <span className="block text-[13px] text-muted truncate">{program.description}</span>}
            <span className="block text-[13px] text-muted mt-0.5">{single ? 'Single workout' : plural(dayCount(program), 'day')}</span>
          </span>
          <ChevronRight size={20} className="text-faint shrink-0" />
        </Card>
      )
    }
    const grid = (list) => <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{list.map(programCard)}</div>
    const showOnDemand = onDemandOK && listView === 'ondemand'
    const coaching = programs.filter(p => !isOnDemand(p))
    const odWorkouts = programs.filter(p => isOnDemand(p) && p.kind === 'workout')
    const odPrograms = programs.filter(p => isOnDemand(p) && p.kind !== 'workout')
    const newButton = label => <Button onClick={openNewProgram}><Plus size={18} /> {label}</Button>

    return (
      <div className="flex flex-col gap-6">
        <PageTitle title="Programs" action={newButton(showOnDemand ? 'New' : 'New program')} />
        {onDemandOK && (
          <Segmented
            className="max-w-[320px] -mt-2"
            value={listView}
            onChange={setListView}
            options={[{ value: 'coaching', label: 'Coaching' }, { value: 'ondemand', label: 'On demand' }]}
          />
        )}
        {loadingPrograms ? (
          <Loading />
        ) : showOnDemand ? (
          odWorkouts.length === 0 && odPrograms.length === 0 ? (
            <Card>
              <EmptyState
                icon={PlayCircle}
                title="Nothing on demand yet"
                body="Build a workout or program that every member can see and start on their own."
                action={newButton('New on-demand workout')}
              />
            </Card>
          ) : (
            <>
              {odWorkouts.length > 0 && <section><SectionLabel>Workouts</SectionLabel>{grid(odWorkouts)}</section>}
              {odPrograms.length > 0 && <section><SectionLabel>Programs</SectionLabel>{grid(odPrograms)}</section>}
            </>
          )
        ) : coaching.length === 0 ? (
          <Card>
            <EmptyState
              icon={ClipboardList}
              title="No programs yet"
              body="Build a program once, then assign it to as many clients as you like."
              action={newButton('New program')}
            />
          </Card>
        ) : (
          grid(coaching)
        )}
        {newProgramSheet}
        <Toast toast={toast} />
      </div>
    )
  }

  // ─── One program ───────────────────────────────────────────────────────────

  // A single on-demand workout hides day management: one list of exercises, no "Day 1".
  const single = isSingleWorkout(selectedProgram)
  const shownDays = single ? workoutDays.slice(0, 1) : workoutDays
  const singleList = single && shownDays[0] ? (exercisesByDay[shownDays[0].id] ?? []) : []

  return (
    <div className="flex flex-col gap-5">
      <div>
        <BackLink onClick={closeProgram}>Programs</BackLink>
        <PageTitle
          className="mt-1 items-start [&_h1]:whitespace-normal [&_h1]:break-words"
          title={selectedProgram.name}
          action={
            <Button onClick={openAssign} disabled={loadingDays}>
              <UserPlus size={18} /> Assign
            </Button>
          }
        />
        {selectedProgram.description && <p className="text-[15px] text-muted mt-1.5">{selectedProgram.description}</p>}
        {!loadingDays && single && singleList.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <Chip>Single workout</Chip>
            <Chip>{plural(singleList.length, 'exercise')}</Chip>
            <Chip>About {estimateMinutes(singleList)} min</Chip>
          </div>
        )}
        {!loadingDays && !single && workoutDays.length > 0 && (
          <div className="flex gap-2 mt-3">
            <Chip>{plural(workoutDays.length, 'day')}</Chip>
            <Chip>{plural(totalExercises, 'exercise')}</Chip>
          </div>
        )}
      </div>

      {onDemandOK && (
        <Card className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
            <PlayCircle size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-ink">On demand</span>
            <span className="block text-[13px] text-muted">Every member can see and start this.</span>
          </span>
          <Toggle
            checked={!!selectedProgram.is_on_demand}
            onChange={handleToggleOnDemand}
            disabled={savingOnDemand}
            label="On demand: every member can see and start this"
          />
        </Card>
      )}

      {loadingDays ? (
        <Loading />
      ) : single && workoutDays.length === 0 ? (
        <Card>
          <EmptyState
            icon={Dumbbell}
            title="No exercises yet"
            body="Add the exercises for this workout, in the order they're done."
            action={<Button onClick={addToSingleWorkout}><Plus size={18} /> Add exercise</Button>}
          />
        </Card>
      ) : workoutDays.length === 0 ? (
        <Card>
          <EmptyState
            icon={Dumbbell}
            title="No workout days yet"
            body="Add the first day, then fill it with exercises."
            action={<Button onClick={openNewDay}><Plus size={18} /> Add workout day</Button>}
          />
        </Card>
      ) : (
        <>
          <div className={`grid gap-3 items-start ${single ? 'max-w-[720px]' : 'lg:grid-cols-2'}`}>
            {shownDays.map(day => {
              const list = exercisesByDay[day.id] ?? []
              return (
                <Card key={day.id} padded={false} className="overflow-hidden">
                  <div className="px-4 pt-4 pb-3 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      {!single && <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Day {day.day_number}</p>}
                      <h2 className="text-[17px] font-bold text-ink truncate">{single ? 'Exercises' : day.name}</h2>
                    </div>
                    {!single && list.length > 0 && (
                      <p className="text-[13px] text-muted shrink-0">
                        {plural(list.length, 'exercise')} · about {estimateMinutes(list)} min
                      </p>
                    )}
                  </div>

                  {list.length > 0 && (
                    <ul className="divide-y divide-line border-t border-line">
                      {list.map((ex, index) => {
                        const isEditing = editingExerciseId === ex.id
                        const name = ex.exercises?.name || ex.name
                        const muscle = ex.exercises?.muscle_group || ex.muscle_group
                        if (!isEditing) {
                          return (
                            <li key={ex.id}>
                              <button
                                type="button"
                                onClick={() => startEditExercise(ex)}
                                className={`w-full min-h-[60px] px-4 py-2.5 flex items-center gap-3 text-left hover:bg-surface-2 transition-colors ${deletingId === ex.id ? 'opacity-40 pointer-events-none' : ''}`}
                              >
                                <span className="w-7 h-7 rounded-full bg-surface-2 text-muted text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                                  {index + 1}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[15px] font-semibold text-ink truncate">{name}</span>
                                  <span className="block text-[13px] text-muted truncate">
                                    {[muscle, prescription(ex)].filter(Boolean).join(' · ') || 'Tap to set sets and reps'}
                                  </span>
                                  {ex.notes && <span className="block text-[13px] text-faint truncate">{ex.notes}</span>}
                                </span>
                                <ChevronRight size={18} className="text-faint shrink-0" />
                              </button>
                            </li>
                          )
                        }
                        return (
                          <li key={ex.id} className="bg-accent-soft/40">
                            <form
                              onSubmit={e => { e.preventDefault(); handleUpdateExercise(day.id, ex.id) }}
                              className="px-4 py-3 flex flex-col gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-full bg-accent text-on-accent text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                                  {index + 1}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[15px] font-bold text-ink truncate">{name}</span>
                                  {muscle && <span className="block text-[13px] text-muted">{muscle}</span>}
                                </span>
                                <button
                                  type="button" aria-label="Move up" disabled={index === 0 || reordering}
                                  onClick={() => moveExercise(day.id, index, -1)}
                                  className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:bg-surface-2 disabled:opacity-30"
                                >
                                  <ChevronUp size={20} />
                                </button>
                                <button
                                  type="button" aria-label="Move down" disabled={index === list.length - 1 || reordering}
                                  onClick={() => moveExercise(day.id, index, 1)}
                                  className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:bg-surface-2 disabled:opacity-30"
                                >
                                  <ChevronDown size={20} />
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-2.5">
                                <MiniField
                                  label="Sets" type="number" inputMode="numeric" min="1" autoFocus
                                  value={editExercise.sets} onChange={e => setEditExercise(x => ({ ...x, sets: e.target.value }))}
                                />
                                <MiniField
                                  label="Reps" type="text"
                                  value={editExercise.reps} onChange={e => setEditExercise(x => ({ ...x, reps: e.target.value }))}
                                />
                                <MiniField
                                  label="Rest (sec)" type="number" inputMode="numeric" min="0"
                                  value={editExercise.rest_seconds} onChange={e => setEditExercise(x => ({ ...x, rest_seconds: e.target.value }))}
                                />
                              </div>
                              <TextArea
                                rows={2} placeholder="Coaching note (optional)" aria-label="Coaching note"
                                value={editExercise.notes} onChange={e => setEditExercise(x => ({ ...x, notes: e.target.value }))}
                              />
                              <div className="flex items-center gap-2">
                                <ConfirmRemove
                                  icon={Trash2} label="Remove exercise" disabled={deletingId === ex.id}
                                  onConfirm={() => handleDeleteExercise(day.id, ex.id)}
                                />
                                <span className="flex-1" />
                                <Button type="button" variant="ghost" size="sm" onClick={cancelEditExercise}>Cancel</Button>
                                <Button type="submit" size="sm" disabled={savingEdit}>{savingEdit ? 'Saving…' : 'Save'}</Button>
                              </div>
                            </form>
                          </li>
                        )
                      })}
                    </ul>
                  )}

                  <div className={list.length > 0 ? 'border-t border-line' : ''}>
                    <button
                      type="button"
                      onClick={() => openAddExercise(day)}
                      className="w-full h-12 px-4 flex items-center gap-2 text-[15px] font-bold text-accent hover:bg-surface-2"
                    >
                      <Plus size={18} /> Add exercise
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
          {!single && (
            <Button variant="secondary" block onClick={openNewDay} className="sm:w-auto sm:self-start">
              <Plus size={18} /> Add workout day
            </Button>
          )}
        </>
      )}

      {newDaySheet}
      {addExerciseSheet}
      {assignSheet}
      <Toast toast={toast} />
    </div>
  )
}

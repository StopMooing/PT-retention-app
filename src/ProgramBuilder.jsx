import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronRight, Trash2, ClipboardList, Dumbbell, Check, UserPlus, PlayCircle, Pencil, Copy, Sparkles, Link2 } from 'lucide-react'
import { supabase } from './supabase'
import { PageTitle, Card, Button, Chip, Sheet, EmptyState, Field, Segmented, SectionLabel } from './ui'
import { Loading, Toast, BackLink, Select, TextArea, Toggle } from './tools/kit'
import { useToast } from './tools/useToast'
import { toLocalDateStr } from './tools/dates'
import StartPlanFields from './lib/StartPlanFields'
import { programPlan, planWeeks, daysPerWeek, builtWeeks, defaultStartDate, defaultTrainingDays, planReady, PAST_START_NOTE } from './lib/schedule.js'
import { prescriptionText, supersets } from './lib/setTargets.js'
import { estMinutes } from './client/metrics'
import WorkoutEditor from './coach/WorkoutEditor'
import { insertPlannedSessions, clearUpcoming } from './lib/planWrites'

// What the "New program" sheet can build. On-demand ones only show once the database
// has the on-demand columns (see onDemandOK below).
const NEW_TYPES = [
  { value: 'coaching', label: 'Coaching program', hint: 'Built for you to assign to clients.' },
  { value: 'program', label: 'On-demand program', hint: 'A multi-day plan every member can start.' },
  { value: 'workout', label: 'On-demand workout', hint: 'A single session every member can start.' },
]
const EMPTY_NEW_PROGRAM = { name: '', description: '', type: 'coaching' }

// Each program exercise with its name and its set rows.
const DAY_EXERCISES = '*, exercises(id, name, muscle_group), workout_exercise_sets(set_number, set_type, reps, weight_kg, rpe, rest_seconds)'

// Program days in order: week 1 day 1, week 1 day 2, ... then week 2.
const byWeekDay = (a, b) => (a.week_number || 1) - (b.week_number || 1) || a.day_number - b.day_number

// What "Add week" can add to the working sets of the copied week (warm-ups stay the same).
const PROGRESSIONS = [
  { value: 'same', label: 'Same as last week', hint: 'An exact copy to change by hand.', kg: 0, reps: 0 },
  { value: 'kg', label: '+2.5 kg on every working set', hint: 'Sets with a kg target go up 2.5 kg.', kg: 2.5, reps: 0 },
  { value: 'reps', label: '+1 rep on every working set', hint: '8 becomes 9, 8-12 becomes 9-13.', kg: 0, reps: 1 },
]

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgramBuilder({ user }) {
  // Programs
  const [programs, setPrograms] = useState([])
  // The UNFNSHD library: every on-demand program and workout, whoever made it. Every coach
  // can view, assign and copy them; only the person who made one can edit it.
  const [library, setLibrary] = useState([])
  // How many of this coach's clients are on each program right now: { programId: n }
  const [inUse, setInUse] = useState({})
  const [copying, setCopying] = useState(false)
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [newProgram, setNewProgram] = useState(EMPTY_NEW_PROGRAM)
  const [savingProgram, setSavingProgram] = useState(false)

  // On-demand library. onDemandOK stays false until the database has programs.is_on_demand
  // (migration pending_on_demand_library). Until then every on-demand control is hidden and
  // is_on_demand / kind are never sent.
  const [onDemandOK, setOnDemandOK] = useState(false)
  const [listView, setListView] = useState('coaching') // 'coaching' (your programs) | 'library'
  const [savingOnDemand, setSavingOnDemand] = useState(false)

  // Workout days and their exercises (exercisesByDay: day id -> ordered rows)
  const [workoutDays, setWorkoutDays] = useState([])
  const [exercisesByDay, setExercisesByDay] = useState({})
  const [loadingDays, setLoadingDays] = useState(false)
  const [newDay, setNewDay] = useState({ name: '', day_number: '' })
  const [savingDay, setSavingDay] = useState(false)

  // The exercise library (for the workout editor's picker)
  const [allExercises, setAllExercises] = useState([])

  // Which day is open in the workout editor (its id), which week the program page shows,
  // and the "Add week" sheet's progression choice.
  const [editingDayId, setEditingDayId] = useState(null)
  const [week, setWeek] = useState(1)
  const [progression, setProgression] = useState('same')
  const [addingWeek, setAddingWeek] = useState(false)

  // Assign to a client
  const [clients, setClients] = useState([])
  const [assignClientId, setAssignClientId] = useState('')
  // The chosen client's current program ({ name }), so the sheet can say it gets replaced
  const [assignCurrent, setAssignCurrent] = useState(null)
  // Local date, not UTC: toISOString() gives yesterday's date before 9:30am in Adelaide
  const [assignStartDate, setAssignStartDate] = useState(() => defaultStartDate(toLocalDateStr()))
  const [assignDays, setAssignDays] = useState([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState('')

  // Editing the open program (name, description) or one of its days (number, name)
  const [editProgram, setEditProgram] = useState({ name: '', description: '' })
  const [editDay, setEditDay] = useState(null)
  const [savingEdits, setSavingEdits] = useState(false)

  // Which sheet is open: 'program' | 'day' | 'week' | 'assign' | 'editProgram' | 'editDay' | null
  const [sheet, setSheet] = useState(null)
  const [toast, showToast] = useToast()

  // ── Fetch programs ──
  const fetchPrograms = useCallback(async () => {
    setLoadingPrograms(true)
    const { data, error } = await supabase
      .from('programs')
      .select('*, program_workouts(id, week_number)')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
    if (!error && data) setPrograms(data)
    const { data: lib } = await supabase
      .from('programs')
      .select('*, program_workouts(id, week_number)')
      .eq('is_on_demand', true)
      .order('name')
    setLibrary(lib ?? [])
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
    supabase.from('clients').select('id, full_name').eq('pt_id', user.id).is('archived_at', null).order('full_name')
      .then(async ({ data }) => {
        if (!data) return
        setClients(data)
        if (!data.length) return
        const { data: active } = await supabase.from('program_assignments').select('program_id').eq('is_active', true).in('client_id', data.map((c) => c.id))
        const counts = {}
        for (const a of active ?? []) counts[a.program_id] = (counts[a.program_id] || 0) + 1
        setInUse(counts)
      })
  }, [fetchPrograms, fetchAllExercises, user.id])

  function openAssign() {
    setAssignError('')
    setAssignClientId('')
    setAssignCurrent(null)
    setAssignStartDate(defaultStartDate(toLocalDateStr()))
    setAssignDays(defaultTrainingDays(daysPerWeek(workoutDays)))
    setSheet('assign')
  }

  async function pickAssignClient(id) {
    setAssignClientId(id)
    setAssignCurrent(null)
    if (!id) return
    const { data } = await supabase.from('program_assignments').select('programs(name)').eq('client_id', id).eq('is_active', true).limit(1)
    setAssignCurrent(data?.[0]?.programs ?? null)
  }

  // Assigns the program from the start date (the client's current program is switched
  // off first, as on the client profile) and puts every week of it on their schedule on
  // the chosen weekdays. Sessions already there are skipped. Then the old program's
  // upcoming sessions that aren't done come off the calendar (done ones stay).
  async function handleAssignProgram() {
    if (!assignClientId) return
    setAssignLoading(true)
    setAssignError('')
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: previous } = await supabase.from('program_assignments').select('id, program_id').eq('client_id', assignClientId).eq('is_active', true)
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
    const plan = programPlan({ days: workoutDays, weeks: planWeeks(selectedProgram, workoutDays), startDate: assignStartDate, trainingDays: assignDays })
    const { error: planError } = await insertPlannedSessions({ clientId: assignClientId, createdBy: authUser.id, plan })
    // A failed clear is only logged (inside clearUpcoming); the new program is already on.
    for (const programId of new Set((previous ?? []).map(a => a.program_id))) {
      await clearUpcoming({ clientId: assignClientId, programId, keep: plan })
    }
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
      .select(DAY_EXERCISES)
      .eq('program_workout_id', workoutId)
      .order('order_index')
      .order('created_at')
    if (!error && data) setExercisesByDay(prev => ({ ...prev, [workoutId]: data }))
  }

  async function fetchWorkoutDays(programId) {
    setLoadingDays(true)
    const { data, error } = await supabase
      .from('program_workouts')
      .select('*')
      .eq('program_id', programId)
      .order('week_number')
      .order('day_number')
    if (!error && data) {
      setWorkoutDays(data)
      // Each day's exercises, in order and with names, using the same per-day query as before.
      await Promise.all(data.map(d => fetchDayExercises(d.id)))
    }
    setLoadingDays(false)
  }

  function openProgram(program, openWeek = 1) {
    setSelectedProgram(program)
    setWorkoutDays([])
    setExercisesByDay({})
    setEditingDayId(null)
    setWeek(openWeek)
    fetchWorkoutDays(program.id)
  }

  function closeProgram() {
    // Land on the list the program now belongs to, so a just-toggled one is easy to find.
    setListView(isOnDemand(selectedProgram) || selectedProgram?.created_by !== user.id ? 'library' : 'coaching')
    setSelectedProgram(null)
    setEditingDayId(null)
  }

  /* ── Rename and delete. The database refuses to delete anything a client has used
     (its calendar or history depends on it), so those come back as "in_use". ── */
  const IN_USE_PROGRAM = "Clients have used this, so it stays to keep their history. You can still rename it."
  const IN_USE_DAY = "This day is on a client's calendar or in their history, so it stays. You can still rename it."

  function openEditProgram() {
    setEditProgram({ name: selectedProgram.name ?? '', description: selectedProgram.description ?? '' })
    setSheet('editProgram')
  }

  async function handleUpdateProgram(e) {
    e.preventDefault()
    if (!editProgram.name.trim() || savingEdits) return
    setSavingEdits(true)
    const fields = { name: editProgram.name.trim(), description: editProgram.description.trim() || null }
    const { data, error } = await supabase.from('programs').update(fields).eq('id', selectedProgram.id).select('id')
    setSavingEdits(false)
    if (error || !data?.length) { showToast('Could not save that. Try again.', 'bad'); return }
    setSelectedProgram(p => ({ ...p, ...fields }))
    setPrograms(prev => prev.map(p => (p.id === selectedProgram.id ? { ...p, ...fields } : p)))
    setSheet(null)
    showToast('Saved')
  }

  async function handleDeleteProgram() {
    if (savingEdits) return
    if (!window.confirm(`Delete ${selectedProgram.name}? This can't be undone.`)) return
    setSavingEdits(true)
    const { data, error } = await supabase.from('programs').delete().eq('id', selectedProgram.id).select('id')
    setSavingEdits(false)
    if (error?.message?.includes('in_use')) { showToast(IN_USE_PROGRAM, 'bad'); return }
    if (error || !data?.length) { showToast('Could not delete that. Try again.', 'bad'); return }
    const gone = selectedProgram.id
    setSheet(null)
    closeProgram()
    setPrograms(prev => prev.filter(p => p.id !== gone))
    showToast('Deleted')
  }

  function openEditDay(day) {
    setEditDay({ id: day.id, name: day.name ?? '', day_number: String(day.day_number ?? '') })
    setSheet('editDay')
  }

  async function handleUpdateDay(e) {
    e.preventDefault()
    if (!editDay?.name.trim() || !editDay.day_number || savingEdits) return
    setSavingEdits(true)
    const fields = { name: editDay.name.trim(), day_number: parseInt(editDay.day_number, 10) }
    const { data, error } = await supabase.from('program_workouts').update(fields).eq('id', editDay.id).select('id')
    setSavingEdits(false)
    if (error || !data?.length) { showToast('Could not save that. Try again.', 'bad'); return }
    setWorkoutDays(prev => prev.map(d => (d.id === editDay.id ? { ...d, ...fields } : d)).sort(byWeekDay))
    setSheet(null)
    showToast('Saved')
  }

  async function handleDeleteDay() {
    if (!editDay || savingEdits) return
    if (!window.confirm(`Delete ${editDay.name} and its exercises? This can't be undone.`)) return
    setSavingEdits(true)
    const { data, error } = await supabase.from('program_workouts').delete().eq('id', editDay.id).select('id')
    setSavingEdits(false)
    if (error?.message?.includes('in_use')) { showToast(IN_USE_DAY, 'bad'); return }
    if (error || !data?.length) { showToast('Could not delete that. Try again.', 'bad'); return }
    const gone = editDay.id
    setWorkoutDays(prev => prev.filter(d => d.id !== gone))
    setExercisesByDay(prev => { const next = { ...prev }; delete next[gone]; return next })
    setPrograms(prev => prev.map(p => (p.id === selectedProgram.id ? { ...p, program_workouts: (p.program_workouts ?? []).filter(w => w.id !== gone) } : p)))
    setSheet(null)
    showToast('Day deleted')
  }

  function openNewProgram() {
    setNewProgram({ ...EMPTY_NEW_PROGRAM, type: canPublish && listView === 'library' ? 'workout' : 'coaching' })
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
    const type = canPublish ? newProgram.type : 'coaching'
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
    const withMeta = { ...data, program_workouts: day ? [{ id: day.id, week_number: 1 }] : [] }
    setPrograms(prev => [withMeta, ...prev])
    if (type !== 'coaching') setLibrary(prev => [withMeta, ...prev])
    setNewProgram(EMPTY_NEW_PROGRAM)
    setSheet(null)
    setListView(type === 'coaching' ? 'coaching' : 'library')
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
      setPrograms(prev => prev.map(p => p.id === selectedProgram.id ? { ...p, program_workouts: [{ id: day.id, week_number: 1 }] } : p))
    }
    setEditingDayId(day.id)
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
    setLibrary(prev => next ? [{ ...selectedProgram, is_on_demand: true }, ...prev.filter(p => p.id !== selectedProgram.id)] : prev.filter(p => p.id !== selectedProgram.id))
    showToast(next ? 'Added to the on-demand library' : 'Taken out of the on-demand library')
  }

  // A ready-made program becomes the coach's own: every week, day, exercise, superset and
  // set, free to change. One step in the database (copy_program), so it never half copies.
  // The original stays as it is.
  async function handleCopyProgram() {
    if (copying || !selectedProgram) return
    setCopying(true)
    const { data: id, error } = await supabase.rpc('copy_program', { p_program: selectedProgram.id })
    const { data: prog } = id ? await supabase.from('programs').select('*, program_workouts(id, week_number)').eq('id', id).single() : { data: null }
    setCopying(false)
    if (error || !prog) { console.error('copy_program', error); showToast('Could not copy that program. Try again.', 'bad'); return }
    setPrograms((prev) => [prog, ...prev])
    showToast('Copied to your programs. Change anything you like.')
    openProgram(prog)
  }

  // A new week at the end, copied from the last one, with the progression the coach picked
  // added to the working sets (copy_program_week does it in one step).
  async function handleAddWeek() {
    if (addingWeek) return
    const from = builtWeeks(workoutDays)
    const step = PROGRESSIONS.find((p) => p.value === progression) ?? PROGRESSIONS[0]
    setAddingWeek(true)
    const { data: newWeek, error } = await supabase.rpc('copy_program_week', { p_program: selectedProgram.id, p_from_week: from, p_kg: step.kg, p_reps: step.reps })
    if (!error) await fetchWorkoutDays(selectedProgram.id)
    setAddingWeek(false)
    if (error) { console.error('copy_program_week', error); showToast(error.message?.includes('too_many_weeks') ? 'A program can have up to 52 weeks.' : 'Could not add the week. Try again.', 'bad'); return }
    const { data: ids } = await supabase.from('program_workouts').select('id, week_number').eq('program_id', selectedProgram.id)
    if (ids) setPrograms((prev) => prev.map((p) => (p.id === selectedProgram.id ? { ...p, program_workouts: ids } : p)))
    setSheet(null)
    setWeek(newWeek)
    showToast(`Week ${newWeek} added`)
  }

  // Removing the last week (only the last, so the weeks stay in order). The database keeps
  // any day a client has already used.
  async function handleRemoveWeek() {
    const last = builtWeeks(workoutDays)
    if (last < 2 || savingEdits) return
    if (!window.confirm(`Remove week ${last} and its workouts? This can't be undone.`)) return
    setSavingEdits(true)
    const { data, error } = await supabase.from('program_workouts').delete().eq('program_id', selectedProgram.id).eq('week_number', last).select('id')
    setSavingEdits(false)
    if (error?.message?.includes('in_use')) { showToast(IN_USE_DAY, 'bad'); return }
    if (error || !data?.length) { showToast('Could not remove that week. Try again.', 'bad'); return }
    const gone = new Set(data.map((d) => d.id))
    setWorkoutDays((prev) => prev.filter((d) => !gone.has(d.id)))
    setPrograms((prev) => prev.map((p) => (p.id === selectedProgram.id ? { ...p, program_workouts: (p.program_workouts ?? []).filter((w) => !gone.has(w.id)) } : p)))
    setWeek(last - 1)
    showToast(`Week ${last} removed`)
  }

  // Only whoever runs the library (has published to it) can add to it or change what is in
  // it. Everyone else builds their own programs and uses the library as it is.
  const canPublish = onDemandOK && library.some((p) => p.created_by === user.id)

  function isOnDemand(program) {
    return onDemandOK && !!program?.is_on_demand
  }

  function isSingleWorkout(program) {
    return onDemandOK && program?.kind === 'workout'
  }

  function openNewDay() {
    const next = workoutDays.filter(d => (d.week_number || 1) === week).reduce((max, d) => Math.max(max, d.day_number || 0), 0) + 1
    setNewDay({ name: '', day_number: String(next) })
    setSheet('day')
  }

  async function handleSaveDay(e) {
    e.preventDefault()
    if (!newDay.name.trim() || !newDay.day_number) return
    setSavingDay(true)
    const { data, error } = await supabase
      .from('program_workouts')
      .insert({ program_id: selectedProgram.id, name: newDay.name.trim(), day_number: parseInt(newDay.day_number, 10), week_number: week })
      .select()
      .single()
    setSavingDay(false)
    if (error) { showToast('Could not save day.', 'bad'); return }
    setWorkoutDays(prev => [...prev, data].sort(byWeekDay))
    setExercisesByDay(prev => ({ ...prev, [data.id]: [] }))
    setPrograms(prev => prev.map(p =>
      p.id === selectedProgram.id
        ? { ...p, program_workouts: [...(p.program_workouts ?? []), { id: data.id, week_number: data.week_number }] }
        : p
    ))
    setNewDay({ name: '', day_number: '' })
    setSheet(null)
    showToast(`${data.name} added`)
  }

  // "3 days a week", or "4 weeks · 3 days a week" when each week is written out.
  function daysLine(program) {
    const days = selectedProgram?.id === program.id ? workoutDays : program.program_workouts ?? []
    const weeks = builtWeeks(days)
    const perWeek = daysPerWeek(days)
    return weeks > 1 ? `${plural(weeks, 'week')} · ${plural(perWeek, 'day')} a week` : `${plural(perWeek, 'day')} a week`
  }

  // ─── Sheets ────────────────────────────────────────────────────────────────

  const newIsWorkout = canPublish && newProgram.type === 'workout'
  const newProgramSheet = (
    <Sheet open={sheet === 'program'} onClose={() => setSheet(null)} title={canPublish ? 'Create new' : 'New program'}>
      <form onSubmit={handleSaveProgram} className="flex flex-col gap-4">
        {canPublish && (
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

  const editProgramSheet = (
    <Sheet open={sheet === 'editProgram'} onClose={() => setSheet(null)} title="Edit">
      <form onSubmit={handleUpdateProgram} className="flex flex-col gap-4">
        <Field label="Name" required value={editProgram.name} onChange={e => setEditProgram(p => ({ ...p, name: e.target.value }))} />
        <TextArea label="What is it for? (optional)" rows={2} value={editProgram.description} onChange={e => setEditProgram(p => ({ ...p, description: e.target.value }))} />
        <Button type="submit" size="lg" block disabled={savingEdits || !editProgram.name.trim()}>{savingEdits ? 'Saving...' : 'Save'}</Button>
        <Button type="button" variant="danger" block onClick={handleDeleteProgram} disabled={savingEdits}>
          <Trash2 size={18} /> Delete
        </Button>
      </form>
    </Sheet>
  )

  const editDaySheet = (
    <Sheet open={sheet === 'editDay'} onClose={() => setSheet(null)} title="Edit workout day">
      {editDay && (
        <form onSubmit={handleUpdateDay} className="flex flex-col gap-4">
          <div className="grid grid-cols-[96px_1fr] gap-3">
            <Field label="Day" type="number" inputMode="numeric" min="1" required value={editDay.day_number} onChange={e => setEditDay(d => ({ ...d, day_number: e.target.value }))} />
            <Field label="Name" required value={editDay.name} onChange={e => setEditDay(d => ({ ...d, name: e.target.value }))} />
          </div>
          <Button type="submit" size="lg" block disabled={savingEdits || !editDay.name.trim() || !editDay.day_number}>{savingEdits ? 'Saving...' : 'Save'}</Button>
          <Button type="button" variant="danger" block onClick={handleDeleteDay} disabled={savingEdits}>
            <Trash2 size={18} /> Delete day
          </Button>
        </form>
      )}
    </Sheet>
  )

  const lastWeek = builtWeeks(workoutDays)
  const weekSheet = (
    <Sheet
      open={sheet === 'week'}
      onClose={() => setSheet(null)}
      title={`Add week ${lastWeek + 1}`}
      footer={<Button size="lg" block onClick={handleAddWeek} disabled={addingWeek}>{addingWeek ? 'Adding...' : `Add week ${lastWeek + 1}`}</Button>}
    >
      <div className="flex flex-col gap-3">
        <p className="text-[15px] text-muted">Week {lastWeek + 1} starts as a copy of week {lastWeek}: the same days, exercises and sets. Then change anything you like.</p>
        <div role="radiogroup" aria-label="Progression" className="flex flex-col gap-1.5">
          {PROGRESSIONS.map(p => {
            const on = progression === p.value
            return (
              <button
                key={p.value} type="button" role="radio" aria-checked={on} onClick={() => setProgression(p.value)}
                className={`w-full flex items-center gap-3 px-3 min-h-[56px] py-2 rounded-[14px] border text-left transition-colors ${on ? 'bg-accent-soft border-accent' : 'border-line hover:bg-surface-2'}`}
              >
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-accent bg-accent text-on-accent' : 'border-line-strong'}`}>
                  {on && <Check size={12} strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold text-ink">{p.label}</span>
                  <span className="block text-[13px] text-muted">{p.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </Sheet>
  )

  const assignReady = workoutDays.length > 0
    ? planReady({ dayCount: daysPerWeek(workoutDays), startDate: assignStartDate, trainingDays: assignDays, minDate: null })
    : !!assignStartDate
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
          <Select label="Client" value={assignClientId} onChange={e => pickAssignClient(e.target.value)}>
            <option value="">Choose a client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </Select>
        )}
        {workoutDays.length > 0 ? (
          <StartPlanFields
            dayCount={daysPerWeek(workoutDays)}
            weeks={planWeeks(selectedProgram, workoutDays)}
            startDate={assignStartDate}
            onStartDate={setAssignStartDate}
            trainingDays={assignDays}
            onTrainingDays={setAssignDays}
            minDate={null}
            pastNote={PAST_START_NOTE}
          />
        ) : (
          <Field label="Start date" type="date" value={assignStartDate} onChange={e => e.target.value && setAssignStartDate(e.target.value)} />
        )}
        {assignCurrent && (
          <p className="m-0 text-[13px] text-muted bg-surface-2 rounded-[14px] px-4 py-3">
            This replaces <span className="font-bold text-ink">{assignCurrent.name}</span>. Its upcoming sessions come off {clients.find(c => c.id === assignClientId)?.full_name?.split(' ')[0] ?? 'the client'}'s calendar. Completed ones stay.
          </p>
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
            <span className="block text-[17px] leading-snug font-bold text-ink line-clamp-2">{program.name}</span>
            {program.description && <span className="block text-[13px] text-muted line-clamp-2">{program.description}</span>}
            <span className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-[13px] text-muted">{single ? 'Single workout' : daysLine(program)}</span>
              {inUse[program.id] > 0 && <Chip tone="accent">{plural(inUse[program.id], 'client')}</Chip>}
            </span>
          </span>
          <ChevronRight size={20} className="text-faint shrink-0" />
        </Card>
      )
    }
    const grid = (list) => <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{list.map(programCard)}</div>
    const showLibrary = listView === 'library' && library.length > 0
    const coaching = programs.filter(p => !isOnDemand(p))
    const libWorkouts = library.filter(p => p.kind === 'workout')
    const libPrograms = library.filter(p => p.kind !== 'workout')
    const libInUse = libPrograms.reduce((n, p) => n + (inUse[p.id] || 0), 0)
    const newButton = label => <Button onClick={openNewProgram}><Plus size={18} /> {label}</Button>

    return (
      <div className="flex flex-col gap-6">
        <PageTitle title="Programs" action={showLibrary ? (canPublish ? newButton('New') : null) : newButton('New program')} />
        {library.length > 0 && (
          <Segmented
            className="max-w-[360px] -mt-2"
            value={listView}
            onChange={setListView}
            options={[{ value: 'coaching', label: 'Your programs' }, { value: 'library', label: 'Library' }]}
          />
        )}
        {loadingPrograms ? (
          <Loading />
        ) : showLibrary ? (
          <>
            <Card className="flex items-start gap-3">
              <span className="w-11 h-11 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0"><Sparkles size={20} /></span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold text-ink">The UNFNSHD library</span>
                <span className="block text-[14px] text-muted mt-0.5">
                  {plural(libPrograms.length, 'program')}{libWorkouts.length ? ` and ${plural(libWorkouts.length, 'single workout')}` : ''}, beginner to advanced.{' '}
                  {canPublish
                    ? 'You made these: members without a coach can start them in the app, and every coach can assign them.'
                    : 'Assign one to a client as it is, or copy it into your programs to change it. Members without a coach can also start these themselves in the app.'}
                  {libInUse > 0 && ` ${plural(libInUse, 'client')} of yours ${libInUse === 1 ? 'is' : 'are'} on one now.`}
                </span>
              </span>
            </Card>
            {libPrograms.length > 0 && <section><SectionLabel>Programs</SectionLabel>{grid(libPrograms)}</section>}
            {libWorkouts.length > 0 && <section><SectionLabel>Single workouts</SectionLabel>{grid(libWorkouts)}</section>}
          </>
        ) : coaching.length === 0 ? (
          <Card>
            <EmptyState
              icon={ClipboardList}
              title="No programs of your own yet"
              body={library.length > 0
                ? `Build your own, or start from the library of ${plural(library.filter(p => p.kind !== 'workout').length, 'program')}${Object.keys(inUse).length ? '. Your clients on library programs show there.' : '.'}`
                : 'Build a program once, then assign it to as many clients as you like.'}
              action={library.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={() => setListView('library')}><Sparkles size={18} /> Open the library</Button>
                  <Button variant="secondary" onClick={openNewProgram}><Plus size={18} /> New program</Button>
                </div>
              ) : newButton('New program')}
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

  // A ready-made program (someone else's) is view only: assign it, or copy it to change it.
  const readOnly = selectedProgram.created_by !== user.id
  const single = isSingleWorkout(selectedProgram)
  const weeks = builtWeeks(workoutDays)
  const shownWeek = Math.min(week, weeks)
  const weekDays = single ? workoutDays.slice(0, 1) : workoutDays.filter(d => (d.week_number || 1) === shownWeek)
  const exerciseCount = workoutDays.reduce((t, d) => t + (exercisesByDay[d.id]?.length ?? 0), 0)

  // The workout editor takes over the page while a day is open.
  const editingDay = editingDayId ? workoutDays.find(d => d.id === editingDayId) : null
  if (editingDay) {
    return (
      <>
        <WorkoutEditor
          key={editingDay.id}
          day={editingDay}
          dayLabel={single ? 'Single workout' : weeks > 1 ? `Week ${editingDay.week_number || 1} · Day ${editingDay.day_number}` : `Day ${editingDay.day_number}`}
          title={single ? selectedProgram.name : editingDay.name}
          rows={exercisesByDay[editingDay.id] ?? []}
          library={allExercises}
          readOnly={readOnly}
          showToast={showToast}
          onBack={() => setEditingDayId(null)}
          onSaved={() => fetchDayExercises(editingDay.id)}
        />
        <Toast toast={toast} />
      </>
    )
  }

  const programActions = (cls) => (
    <div className={`flex gap-2 shrink-0 ${cls}`}>
      {readOnly ? (
        <Button variant="secondary" onClick={handleCopyProgram} disabled={copying || loadingDays}>
          <Copy size={18} /> {copying ? 'Copying' : 'Copy to edit'}
        </Button>
      ) : (
        <Button variant="secondary" onClick={openEditProgram}>
          <Pencil size={18} /> Edit
        </Button>
      )}
      <Button onClick={openAssign} disabled={loadingDays}>
        <UserPlus size={18} /> Assign
      </Button>
    </div>
  )

  // One day as a card: every exercise with its sets written out, tap to open the editor.
  const dayCard = (day) => {
    const list = exercisesByDay[day.id] ?? []
    const marks = supersets(list)
    return (
      <Card key={day.id} padded={false} className="overflow-hidden">
        <div className="px-4 pt-4 pb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            {!single && <p className="text-[13px] font-semibold text-accent">Day {day.day_number}</p>}
            <h2 className="text-[17px] font-bold text-ink truncate">{single ? 'Exercises' : day.name}</h2>
          </div>
          <span className="flex items-center gap-1 shrink-0">
            {list.length > 0 && <span className="text-[13px] text-muted">{plural(list.length, 'exercise')} · about {estMinutes(list)} min</span>}
            {!readOnly && !single && (
              <button onClick={() => openEditDay(day)} aria-label={`Rename or delete ${day.name}`} className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2">
                <Pencil size={16} />
              </button>
            )}
          </span>
        </div>
        {list.length > 0 && (
          <ul className="divide-y divide-line border-t border-line">
            {list.map((ex, index) => {
              const mark = marks[ex.id]
              return (
                <li key={ex.id} className="px-4 py-2.5 flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 tabular-nums ${mark ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted'}`}>
                    {mark ? `${mark.letter}${list.slice(0, index + 1).filter(x => marks[x.id]?.letter === mark.letter).length}` : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-ink">{ex.exercises?.name || 'Exercise'}</span>
                    <span className="block text-[13px] text-muted">{prescriptionText(ex) || 'No sets yet'}</span>
                    {ex.notes && <span className="block text-[13px] text-faint truncate">{ex.notes}</span>}
                  </span>
                  {mark?.first && <Link2 size={16} className="text-accent shrink-0 mt-1" aria-label={`Superset ${mark.letter}`} />}
                </li>
              )
            })}
          </ul>
        )}
        <div className={list.length > 0 ? 'border-t border-line' : ''}>
          <button
            type="button"
            onClick={() => setEditingDayId(day.id)}
            className="w-full h-12 px-4 flex items-center gap-2 text-[15px] font-bold text-accent hover:bg-surface-2"
          >
            {readOnly ? <><ChevronRight size={18} /> See sets and client view</> : list.length ? <><Pencil size={17} /> Edit sets and exercises</> : <><Plus size={18} /> Add exercises</>}
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <BackLink onClick={closeProgram}>Programs</BackLink>
        <PageTitle
          className="mt-1 items-start [&_h1]:whitespace-normal [&_h1]:break-words"
          title={selectedProgram.name}
          action={programActions('max-md:hidden')}
        />
        {/* On a phone the buttons sit under the name, so a long name keeps whole words. */}
        {programActions('md:hidden mt-3')}
        {selectedProgram.description && <p className="text-[15px] text-muted mt-1.5">{selectedProgram.description}</p>}
        {!loadingDays && workoutDays.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {single ? <Chip>Single workout</Chip> : <Chip>{daysLine(selectedProgram)}</Chip>}
            <Chip>{plural(exerciseCount, 'exercise')}</Chip>
          </div>
        )}
      </div>

      {readOnly && (
        <Card className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-ink">From the UNFNSHD library</span>
            <span className="block text-[13px] text-muted">Assign it as it is, or copy it to change weeks, days, exercises and sets.</span>
          </span>
        </Card>
      )}

      {canPublish && !readOnly && (
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
            action={<Button onClick={addToSingleWorkout}><Plus size={18} /> Add exercises</Button>}
          />
        </Card>
      ) : workoutDays.length === 0 ? (
        <Card>
          <EmptyState
            icon={Dumbbell}
            title="No workout days yet"
            body="Add the first day, then fill it with exercises and sets."
            action={<Button onClick={openNewDay}><Plus size={18} /> Add workout day</Button>}
          />
        </Card>
      ) : (
        <>
          {!single && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1" role="tablist" aria-label="Weeks">
                {Array.from({ length: weeks }, (_, i) => i + 1).map(w => (
                  <button
                    key={w} role="tab" aria-selected={w === shownWeek} onClick={() => setWeek(w)}
                    className={`h-10 px-4 rounded-full text-sm font-bold whitespace-nowrap shrink-0 transition-colors ${w === shownWeek ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted hover:text-ink'}`}
                  >
                    Week {w}
                  </button>
                ))}
                {!readOnly && (
                  <button
                    onClick={() => { setProgression('same'); setSheet('week') }}
                    className="h-10 px-4 rounded-full text-sm font-bold whitespace-nowrap shrink-0 border border-dashed border-line-strong text-ink hover:bg-surface-2 inline-flex items-center gap-1.5"
                  >
                    <Plus size={16} /> Add week
                  </button>
                )}
              </div>
              <p className="text-[13px] text-muted">
                {weeks === 1
                  ? `This week repeats for all ${plural(planWeeks(selectedProgram, workoutDays), 'week')} on the client's calendar.${readOnly ? '' : ' Add a week to change sets, weights or reps week by week.'}`
                  : `Week ${shownWeek} of ${weeks}. Clients do each week once, in order.`}
              </p>
            </div>
          )}
          <div className={`grid gap-3 items-start ${single ? 'max-w-[720px]' : 'lg:grid-cols-2'}`}>
            {weekDays.map(dayCard)}
          </div>
          {!single && !readOnly && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={openNewDay}>
                <Plus size={18} /> Add day to week {shownWeek}
              </Button>
              {weeks > 1 && shownWeek === weeks && (
                <Button variant="ghost" onClick={handleRemoveWeek} disabled={savingEdits}>
                  <Trash2 size={18} /> Remove week {weeks}
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {newDaySheet}
      {editProgramSheet}
      {editDaySheet}
      {weekSheet}
      {assignSheet}
      <Toast toast={toast} />
    </div>
  )
}

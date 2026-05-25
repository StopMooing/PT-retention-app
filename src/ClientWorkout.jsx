import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { Calendar, Dumbbell, ChevronRight, CheckCircle2, Clock, Target, ArrowLeft, Check, RotateCcw } from 'lucide-react'

const MUSCLE_CHIP = {
  Chest:        'bg-blue-50 text-blue-700',
  Back:         'bg-purple-50 text-purple-700',
  Shoulders:    'bg-amber-50 text-amber-700',
  Biceps:       'bg-pink-50 text-pink-700',
  Triceps:      'bg-orange-50 text-orange-700',
  Legs:         'bg-indigo-50 text-indigo-700',
  Glutes:       'bg-rose-50 text-rose-700',
  Core:         'bg-teal-50 text-teal-700',
  Cardio:       'bg-red-50 text-red-700',
  'Full Body':  'bg-emerald-50 text-emerald-700',
  Other:        'bg-gray-100 text-gray-600',
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

function isToday(dateStr) {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

function isPast(dateStr) {
  const today = new Date().toISOString().split('T')[0]
  return dateStr < today
}

export default function ClientWorkout() {
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [scheduledWorkouts, setScheduledWorkouts] = useState([])
  const [workoutExercises, setWorkoutExercises] = useState({})
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [view, setView] = useState('home')
  const [selectedScheduled, setSelectedScheduled] = useState(null)

  // Logging state
  const [setInputs, setSetInputs] = useState({})
  const [savingSet, setSavingSet] = useState(null)
  const [workoutLogId, setWorkoutLogId] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [workoutCompleted, setWorkoutCompleted] = useState(false)
  const workoutLogIdRef = useRef(null)

  // Weight logging
  const [weightInput, setWeightInput] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)
  const [todayWeight, setTodayWeight] = useState(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: clientRow } = await supabase
        .from('clients')
        .select('id, full_name, goal')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!clientRow) { setLoading(false); return }
      setClient(clientRow)

      const today = new Date().toISOString().split('T')[0]

      // Check today's weight
      const { data: weightData } = await supabase
        .from('body_weight_logs')
        .select('weight_kg')
        .eq('client_id', clientRow.id)
        .eq('logged_date', today)
        .maybeSingle()
      if (weightData) setTodayWeight(weightData.weight_kg)

      // Get active program assignment
      const { data: asgn } = await supabase
        .from('program_assignments')
        .select('id, start_date, programs(id, name)')
        .eq('client_id', clientRow.id)
        .eq('is_active', true)
        .maybeSingle()
      setAssignment(asgn)

      // Get scheduled workouts — 4 weeks back, 8 weeks ahead
      const from = new Date()
      from.setDate(from.getDate() - 28)
      const to = new Date()
      to.setDate(to.getDate() + 56)

      const { data: swData } = await supabase
        .from('scheduled_workouts')
        .select('id, scheduled_date, program_workout_id, program_workouts(id, name, day_number)')
        .eq('client_id', clientRow.id)
        .gte('scheduled_date', from.toISOString().split('T')[0])
        .lte('scheduled_date', to.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })

      const fetchedSW = swData ?? []
      setScheduledWorkouts(fetchedSW)

      // Fetch exercises for each scheduled workout's program_workout_id
      const pwIds = [...new Set(fetchedSW.map(sw => sw.program_workout_id).filter(Boolean))]
      if (pwIds.length > 0) {
        const exMap = {}
        await Promise.all(
          pwIds.map(async (pwId) => {
            const { data: exData } = await supabase
              .from('workout_exercises')
              .select('id, sets, reps, rest_seconds, notes, order_index, exercises(id, name, muscle_group)')
              .eq('program_workout_id', pwId)
              .order('order_index', { ascending: true })
            exMap[pwId] = exData ?? []
          })
        )
        setWorkoutExercises(exMap)
      }

      // Fetch workout logs for completion status
      const swIds = fetchedSW.map(sw => sw.id)
      if (swIds.length > 0) {
        const { data: logsData } = await supabase
          .from('workout_logs')
          .select('id, completed, workout_id, logged_at')
          .eq('client_id', clientRow.id)
        setWorkoutLogs(logsData ?? [])
      }

      setLoading(false)
    }
    init()
  }, [])

  // Reset logging state when selected workout changes
  useEffect(() => {
    if (selectedScheduled) {
      setSetInputs({})
      setWorkoutLogId(null)
      workoutLogIdRef.current = null
      setWorkoutCompleted(false)
    }
  }, [selectedScheduled?.id])

  async function handleLogWeight() {
    const w = parseFloat(weightInput)
    if (!w || w <= 0 || w > 500) return
    setSavingWeight(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('body_weight_logs').insert({
        client_id: client.id,
        logged_by: user.id,
        weight_kg: w,
        logged_date: today,
      })
      setTodayWeight(w)
      setWeightInput('')
    } catch (e) { console.error(e) }
    finally { setSavingWeight(false) }
  }

  async function ensureWorkoutLog(scheduledWorkoutId) {
    if (workoutLogIdRef.current) return workoutLogIdRef.current
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        client_id: client.id,
        workout_id: scheduledWorkoutId,
        logged_by: user.id,
        completed: false,
      })
      .select('id')
      .single()
    if (error || !data) return null
    workoutLogIdRef.current = data.id
    setWorkoutLogId(data.id)
    return data.id
  }

  async function handleSaveSet(exerciseId, exerciseDbId, setIndex) {
    const key = `${exerciseId}_${setIndex}`
    const input = setInputs[key] ?? {}
    const reps = parseInt(input.reps, 10)
    if (!reps || reps <= 0) return
    setSavingSet(key)
    const logId = await ensureWorkoutLog(selectedScheduled.id)
    if (!logId) { setSavingSet(null); return }
    const { error } = await supabase.from('exercise_logs').insert({
      workout_log_id: logId,
      exercise_id: exerciseDbId,
      set_number: setIndex + 1,
      reps_completed: reps,
      weight_kg: parseFloat(input.weight) || null,
    })
    setSavingSet(null)
    if (!error) {
      setSetInputs(prev => ({ ...prev, [key]: { ...prev[key], saved: true } }))
    }
  }

  async function handleCompleteWorkout() {
    const logId = workoutLogIdRef.current
    if (!logId) return
    setCompleting(true)
    await supabase.from('workout_logs').update({ completed: true }).eq('id', logId)
    setWorkoutLogs(prev => [...prev, { id: logId, completed: true, workout_id: selectedScheduled.id }])
    setCompleting(false)
    setWorkoutCompleted(true)
  }

  function setInput(key, field, value) {
    setSetInputs(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? {}), [field]: value, saved: false },
    }))
  }

  function isWorkoutCompleted(scheduledWorkoutId) {
    return workoutLogs.some(l => l.workout_id === scheduledWorkoutId && l.completed)
  }

  // Group scheduled workouts by date
  const groupedByDate = scheduledWorkouts.reduce((acc, sw) => {
    const d = sw.scheduled_date
    if (!acc[d]) acc[d] = []
    acc[d].push(sw)
    return acc
  }, {})

  const sortedDates = Object.keys(groupedByDate).sort()
  const todayStr = new Date().toISOString().split('T')[0]

  // Find today's or next upcoming workout for home screen
  const todayWorkouts = groupedByDate[todayStr] ?? []
  const nextWorkoutDate = sortedDates.find(d => d >= todayStr)
  const nextWorkouts = nextWorkoutDate ? groupedByDate[nextWorkoutDate] : []

  // Get exercises for a scheduled workout
  function getExercises(sw) {
    return workoutExercises[sw.program_workout_id] ?? []
  }

  function getEstMinutes(sw) {
    const exercises = getExercises(sw)
    const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0)
    return Math.round(totalSets * 2.5)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  if (!client) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Dumbbell size={24} className="text-gray-300" />
        </div>
        <p className="text-gray-900 font-semibold">Account not linked</p>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">Your account is not connected to a client profile yet. Contact your trainer.</p>
      </div>
    </div>
  )

  // ─── SCREEN 3: WORKOUT LOGGING ────────────────────────────────────────────
  if (view === 'logging' && selectedScheduled) {
    const exercises = getExercises(selectedScheduled)
    const estMin = getEstMinutes(selectedScheduled)
    const allSaved = exercises.length > 0 && exercises.every(ex =>
      Array.from({ length: ex.sets || 3 }).some((_, i) => setInputs[`${ex.id}_${i}`]?.saved)
    )

    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => { setView('home'); setSelectedScheduled(null) }}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">{formatDateLabel(selectedScheduled.scheduled_date)}</p>
              <h1 className="text-base font-bold text-gray-900 truncate">{selectedScheduled.program_workouts?.name || 'Workout'}</h1>
            </div>
            {estMin > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                <Clock size={13} />
                <span>~{estMin} min</span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

          {/* Completed banner */}
          {workoutCompleted && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Check size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">Workout complete!</p>
                <p className="text-xs text-emerald-600 mt-0.5">Great work — this session has been saved.</p>
              </div>
            </div>
          )}

          {/* Exercise cards */}
          {exercises.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <Dumbbell size={28} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No exercises in this workout yet.</p>
            </div>
          ) : exercises.map((ex, idx) => {
            const exName = ex.exercises?.name || 'Exercise'
            const muscle = ex.exercises?.muscle_group
            const chipClass = MUSCLE_CHIP[muscle] ?? MUSCLE_CHIP.Other
            const setCount = ex.sets || 3

            return (
              <div key={ex.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Exercise header */}
                <div className="px-4 py-4 border-b border-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{exName}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {muscle && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${chipClass}`}>{muscle}</span>}
                        <span className="text-xs text-gray-400">{setCount} sets × {ex.reps || '—'} reps</span>
                        {ex.rest_seconds && <span className="text-xs text-gray-400">· {ex.rest_seconds}s rest</span>}
                      </div>
                      {ex.notes && <p className="text-xs text-gray-400 mt-1 italic">{ex.notes}</p>}
                    </div>
                  </div>
                </div>

                {/* Set rows */}
                <div className="px-4 py-3 space-y-2">
                  <div className="grid grid-cols-[36px_1fr_1fr_36px] gap-2 px-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Set</span>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Weight kg</span>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Reps</span>
                    <span />
                  </div>
                  {Array.from({ length: setCount }).map((_, i) => {
                    const key = `${ex.id}_${i}`
                    const inp = setInputs[key] ?? {}
                    const isSaved = !!inp.saved
                    const isSaving = savingSet === key
                    return (
                      <div key={i} className={`grid grid-cols-[36px_1fr_1fr_36px] gap-2 items-center px-1 py-1 rounded-xl transition-colors ${isSaved ? 'bg-emerald-50' : ''}`}>
                        <span className="text-xs font-semibold text-gray-400 text-center">{i + 1}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="—"
                          disabled={isSaved}
                          value={inp.weight ?? ''}
                          onChange={e => setInput(key, 'weight', e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 text-center placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 w-full"
                        />
                        <input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="—"
                          disabled={isSaved}
                          value={inp.reps ?? ''}
                          onChange={e => setInput(key, 'reps', e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 text-center placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 w-full"
                        />
                        <button
                          onClick={() => handleSaveSet(ex.id, ex.exercises?.id, i)}
                          disabled={isSaved || isSaving || !inp.reps}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                            isSaved
                              ? 'bg-emerald-500 text-white'
                              : 'border border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed'
                          }`}
                        >
                          {isSaving
                            ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            : <Check size={14} />
                          }
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Complete button */}
          {!workoutCompleted && allSaved && (
            <button
              onClick={handleCompleteWorkout}
              disabled={completing}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-bold rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              {completing
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                : <><CheckCircle2 size={18} /> Complete Workout</>
              }
            </button>
          )}

          <div className="h-8" />
        </div>
      </div>
    )
  }

  // ─── SCREEN 2: CALENDAR ───────────────────────────────────────────────────
  if (view === 'calendar') {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('home')}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
              <h1 className="text-base font-bold text-gray-900">Schedule</h1>
            </div>
            <button
              onClick={() => {
                document.getElementById('calendar-today')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg"
            >
              Today
            </button>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-4 space-y-1">
          {sortedDates.length === 0 ? (
            <div className="text-center py-16">
              <Calendar size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No workouts scheduled yet.</p>
              <p className="text-xs text-gray-300 mt-1">Your trainer will schedule workouts here.</p>
            </div>
          ) : sortedDates.map(dateStr => {
            const workoutsOnDay = groupedByDate[dateStr]
            const todaySection = isToday(dateStr)
            const pastSection = isPast(dateStr)

            return (
              <div key={dateStr} id={todaySection ? 'calendar-today' : undefined} className="mb-2">
                {/* Date header */}
                <div className="px-1 py-2 flex items-center gap-2">
                  <span className={`text-sm font-bold ${todaySection ? 'text-emerald-600' : pastSection ? 'text-gray-400' : 'text-gray-800'}`}>
                    {formatDateLabel(dateStr)}
                  </span>
                  {todaySection && (
                    <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">TODAY</span>
                  )}
                </div>

                {/* Workout rows for this date */}
                <div className="space-y-2">
                  {workoutsOnDay.map(sw => {
                    const completed = isWorkoutCompleted(sw.id)
                    const exercises = getExercises(sw)
                    const estMin = getEstMinutes(sw)

                    return (
                      <button
                        key={sw.id}
                        onClick={() => { setSelectedScheduled(sw); setView('logging') }}
                        className={`w-full text-left bg-white border rounded-2xl px-4 py-4 flex items-center gap-4 hover:border-gray-300 hover:shadow-sm transition-all ${
                          completed ? 'border-emerald-200 bg-emerald-50/30' : todaySection ? 'border-emerald-200' : 'border-gray-200'
                        }`}
                      >
                        {/* Status dot */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          completed
                            ? 'bg-emerald-500'
                            : todaySection
                            ? 'border-2 border-emerald-400'
                            : pastSection
                            ? 'border-2 border-gray-200'
                            : 'border-2 border-gray-200'
                        }`}>
                          {completed && <Check size={14} className="text-white" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${completed ? 'text-gray-500' : 'text-gray-900'}`}>
                            {sw.program_workouts?.name || 'Workout'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {completed ? (
                              <span className="text-xs text-emerald-600 font-medium">Completed</span>
                            ) : todaySection ? (
                              <span className="text-xs text-emerald-600 font-medium">Ready to start</span>
                            ) : pastSection ? (
                              <span className="text-xs text-gray-400">Missed</span>
                            ) : (
                              <span className="text-xs text-gray-400">Upcoming</span>
                            )}
                            {exercises.length > 0 && (
                              <>
                                <span className="text-gray-300 text-xs">·</span>
                                <span className="text-xs text-gray-400">{exercises.length} exercises</span>
                              </>
                            )}
                            {estMin > 0 && (
                              <>
                                <span className="text-gray-300 text-xs">·</span>
                                <span className="text-xs text-gray-400">~{estMin} min</span>
                              </>
                            )}
                          </div>
                        </div>

                        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <div className="h-8" />
        </div>
      </div>
    )
  }

  // ─── SCREEN 1: HOME ───────────────────────────────────────────────────────
  const recentCompleted = scheduledWorkouts
    .filter(sw => isWorkoutCompleted(sw.id) && isPast(sw.scheduled_date))
    .slice(-3)
    .reverse()

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-5">
          <p className="text-sm text-gray-400">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{client.full_name.split(' ')[0]}</h1>
          {assignment && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-500 font-medium">{assignment.programs?.name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* Weight log */}
        {!todayWeight ? (
          <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Today's Weight</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="20"
                max="500"
                placeholder="Enter weight..."
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleLogWeight() }}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
              <span className="text-xs text-gray-400 flex-shrink-0">kg</span>
              <button
                onClick={handleLogWeight}
                disabled={savingWeight || !weightInput}
                className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {savingWeight ? '...' : 'Log'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Today's weight</p>
                <p className="text-sm font-bold text-gray-900">{todayWeight} kg</p>
              </div>
            </div>
            <button
              onClick={() => setTodayWeight(null)}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Update
            </button>
          </div>
        )}

        {/* Today's workout / next workout */}
        {!assignment ? (
          <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl px-5 py-8 text-center">
            <Dumbbell size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">No program assigned</p>
            <p className="text-xs text-gray-400 mt-1">Your trainer hasn't assigned a program yet.</p>
          </div>
        ) : nextWorkouts.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl px-5 py-8 text-center">
            <Calendar size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">No upcoming workouts</p>
            <p className="text-xs text-gray-400 mt-1">Your trainer will schedule sessions here.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {isToday(nextWorkoutDate) ? "Today's Workout" : formatShortDate(nextWorkoutDate)}
              </p>
              <button
                onClick={() => setView('calendar')}
                className="text-xs text-emerald-600 font-semibold"
              >
                View schedule →
              </button>
            </div>
            <div className="space-y-3">
              {nextWorkouts.map(sw => {
                const exercises = getExercises(sw)
                const estMin = getEstMinutes(sw)
                const completed = isWorkoutCompleted(sw.id)

                return (
                  <div key={sw.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${completed ? 'border-emerald-200' : 'border-gray-200'}`}>
                    {/* Workout header */}
                    <div className={`px-4 py-4 ${completed ? 'bg-emerald-50/50' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {completed && <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />}
                            <h2 className="text-base font-bold text-gray-900 truncate">
                              {sw.program_workouts?.name || 'Workout'}
                            </h2>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {estMin > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock size={12} />
                                <span>~{estMin} min</span>
                              </div>
                            )}
                            {exercises.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Dumbbell size={12} />
                                <span>{exercises.length} exercises</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {completed ? (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex-shrink-0">
                            Done ✓
                          </span>
                        ) : null}
                      </div>

                      {/* Exercise preview list */}
                      {exercises.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {exercises.slice(0, 4).map((ex, idx) => (
                            <div key={ex.id} className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-xs text-gray-700 font-medium truncate flex-1">
                                {ex.exercises?.name || 'Exercise'}
                              </span>
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {ex.sets}×{ex.reps}
                              </span>
                            </div>
                          ))}
                          {exercises.length > 4 && (
                            <p className="text-xs text-gray-400 pl-7">+ {exercises.length - 4} more exercises</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Start button */}
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => { setSelectedScheduled(sw); setView('logging') }}
                        className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                          completed
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-black hover:bg-gray-800 text-white shadow-sm'
                        }`}
                      >
                        {completed ? 'View Workout' : 'Start Workout'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent activity */}
        {recentCompleted.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent Activity</p>
            <div className="space-y-2">
              {recentCompleted.map(sw => (
                <button
                  key={sw.id}
                  onClick={() => { setSelectedScheduled(sw); setView('logging') }}
                  className="w-full text-left bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-gray-300 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Check size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{sw.program_workouts?.name || 'Workout'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatShortDate(sw.scheduled_date)} · Completed</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setView('home')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${view === 'home' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <Target size={20} />
            <span className="text-[10px] font-semibold">Home</span>
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${view === 'calendar' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <Calendar size={20} />
            <span className="text-[10px] font-semibold">Schedule</span>
          </button>
        </div>
      </div>
    </div>
  )
}

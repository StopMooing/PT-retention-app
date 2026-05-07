import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

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

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function ClientWorkout() {
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [workoutDays, setWorkoutDays] = useState([])
  const [selectedDayId, setSelectedDayId] = useState(null)
  const [exercises, setExercises] = useState([])
  const [exercisesLoading, setExercisesLoading] = useState(false)
  const [setInputs, setSetInputs] = useState({})
  const [savingSet, setSavingSet] = useState(null)
  const [workoutLogId, setWorkoutLogId] = useState(null)
  const [completed, setCompleted] = useState(false)
  const [completing, setCompleting] = useState(false)
  const workoutLogIdRef = useRef(null)

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

      const { data: asgn } = await supabase
        .from('program_assignments')
        .select('id, start_date, programs(id, name)')
        .eq('client_id', clientRow.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!asgn) { setLoading(false); return }
      setAssignment(asgn)

      const { data: days } = await supabase
        .from('program_workouts')
        .select('id, name, day_number')
        .eq('program_id', asgn.programs.id)
        .order('day_number', { ascending: true })

      const sortedDays = days ?? []
      setWorkoutDays(sortedDays)
      if (sortedDays.length > 0) setSelectedDayId(sortedDays[0].id)

      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedDayId) return
    setExercisesLoading(true)
    setSetInputs({})
    setWorkoutLogId(null)
    workoutLogIdRef.current = null
    setCompleted(false)

    supabase
      .from('workout_exercises')
      .select('id, sets, reps, rest_seconds, notes, order_index, exercises(id, name, muscle_group)')
      .eq('workout_id', selectedDayId)
      .order('order_index', { ascending: true })
      .then(({ data }) => {
        setExercises(data ?? [])
        setExercisesLoading(false)
      })
  }, [selectedDayId])

  async function ensureWorkoutLog() {
    if (workoutLogIdRef.current) return workoutLogIdRef.current

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        client_id: client.id,
        workout_id: selectedDayId,
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

  async function handleSaveSet(exerciseEntry, setIndex) {
    const key = `${exerciseEntry.id}_${setIndex}`
    const input = setInputs[key] ?? {}
    const reps = parseInt(input.reps, 10)
    const weight = parseFloat(input.weight)
    if (!reps || reps <= 0) return

    setSavingSet(key)
    const logId = await ensureWorkoutLog()
    if (!logId) { setSavingSet(null); return }

    const { error } = await supabase.from('exercise_logs').insert({
      workout_log_id: logId,
      exercise_id: exerciseEntry.exercises.id,
      set_number: setIndex + 1,
      reps_completed: reps,
      weight_kg: isNaN(weight) ? null : weight,
    })

    setSavingSet(null)
    if (!error) {
      setSetInputs(prev => ({
        ...prev,
        [key]: { ...prev[key], saved: true },
      }))
    }
  }

  async function handleCompleteWorkout() {
    const logId = workoutLogIdRef.current
    if (!logId) return
    setCompleting(true)
    await supabase.from('workout_logs').update({ completed: true }).eq('id', logId)
    setCompleting(false)
    setCompleted(true)
  }

  function setInput(key, field, value) {
    setSetInputs(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? {}), [field]: value, saved: false },
    }))
  }

  const allExercisesLogged = exercises.length > 0 && exercises.every(we =>
    Object.entries(setInputs).some(([k, v]) => k.startsWith(`${we.id}_`) && v.saved)
  )

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">Account not linked</p>
          <p className="text-xs text-gray-400 mt-1">Your account isn't connected to a client profile yet. Contact your trainer.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">

      <main className="max-w-2xl mx-auto px-4 py-6">

        <div className="mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Welcome back</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{client.full_name}</h1>
        </div>

        {!assignment ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-8 text-center">
            <p className="text-sm font-semibold text-gray-900 m-0">No program assigned yet</p>
            <p className="text-xs text-gray-500 mt-1">Your trainer hasn't assigned a workout program yet. Check back soon.</p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-xs text-gray-400 mb-0.5">Current program</p>
              <p className="text-sm font-semibold text-gray-900">{assignment.programs.name}</p>
            </div>

            {/* Day selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
              {workoutDays.map(day => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    selectedDayId === day.id
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700'
                  }`}
                >
                  {day.name || `Day ${day.day_number}`}
                </button>
              ))}
            </div>

            {/* Exercises */}
            {exercisesLoading ? (
              <div className="py-12 flex justify-center"><Spinner /></div>
            ) : exercises.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400">No exercises in this day yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {exercises.map((we, idx) => {
                  const chip = MUSCLE_CHIP[we.exercises?.muscle_group] ?? 'bg-gray-100 text-gray-600'
                  const setCount = we.sets ?? 3

                  return (
                    <div key={we.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                      {/* Exercise header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 m-0">{we.exercises?.name}</p>
                            {we.exercises?.muscle_group && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${chip}`}>
                                {we.exercises.muscle_group}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500">{setCount} sets × {we.reps ?? '—'} reps</span>
                            {we.rest_seconds && (
                              <span className="text-xs text-gray-400">{we.rest_seconds}s rest</span>
                            )}
                          </div>
                          {we.notes && (
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{we.notes}</p>
                          )}
                        </div>
                      </div>

                      {/* Set rows */}
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 px-1">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Set</span>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Weight (kg)</span>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Reps</span>
                          <span />
                        </div>

                        {Array.from({ length: setCount }).map((_, i) => {
                          const key = `${we.id}_${i}`
                          const inp = setInputs[key] ?? {}
                          const isSaved = !!inp.saved
                          const isSaving = savingSet === key

                          return (
                            <div key={i} className={`grid grid-cols-[40px_1fr_1fr_40px] gap-2 items-center px-1 py-1 rounded-lg transition-colors ${isSaved ? 'bg-green-50' : ''}`}>
                              <span className="text-xs font-semibold text-gray-400">{i + 1}</span>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="—"
                                disabled={isSaved}
                                value={inp.weight ?? ''}
                                onChange={e => setInput(key, 'weight', e.target.value)}
                                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 text-center placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 w-full"
                              />
                              <input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="—"
                                disabled={isSaved}
                                value={inp.reps ?? ''}
                                onChange={e => setInput(key, 'reps', e.target.value)}
                                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 text-center placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 w-full"
                              />
                              <button
                                onClick={() => handleSaveSet(we, i)}
                                disabled={isSaved || isSaving || !inp.reps}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                                  isSaved
                                    ? 'bg-green-600 text-white'
                                    : 'border border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed'
                                }`}
                              >
                                {isSaving ? <Spinner /> : <CheckIcon />}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Complete workout */}
                {completed ? (
                  <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-6 py-5 text-green-700">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span className="text-sm font-semibold">Workout complete — great work!</span>
                  </div>
                ) : allExercisesLogged ? (
                  <button
                    onClick={handleCompleteWorkout}
                    disabled={completing}
                    className="w-full py-4 bg-green-600 text-white text-sm font-semibold rounded-2xl hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {completing ? <><Spinner /> Saving...</> : 'Complete Workout'}
                  </button>
                ) : null}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

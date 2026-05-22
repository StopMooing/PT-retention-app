import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

// ─── Shared input class ───────────────────────────────────────────────────────

const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:outline-none transition-all duration-150 placeholder-gray-400 bg-white'

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
    </div>
  )
}

// ─── Feedback banner (replaces toast) ────────────────────────────────────────

function Banner({ id, message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [id, onDismiss])

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium mb-4 transition-all duration-150
      ${type === 'error' ? 'bg-red-100 text-red-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}
    >
      <div className="flex items-center gap-2">
        {type === 'error' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        )}
        {message}
      </div>
      <button onClick={onDismiss} className="ml-4 text-base leading-none opacity-50 hover:opacity-100 transition-opacity">
        &times;
      </button>
    </div>
  )
}

// ─── Field label wrapper ──────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

// ─── Italic placeholder for empty panels ─────────────────────────────────────

function Placeholder({ text }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <p className="text-sm text-gray-400 italic text-center">{text}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgramBuilder({ user }) {
  // ── Programs ──
  const [programs, setPrograms]               = useState([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [showNewProgram, setShowNewProgram]   = useState(false)
  const [newProgram, setNewProgram]           = useState({ name: '', description: '' })
  const [savingProgram, setSavingProgram]     = useState(false)

  // ── Workout days ──
  const [workoutDays, setWorkoutDays]   = useState([])
  const [loadingDays, setLoadingDays]   = useState(false)
  const [selectedDay, setSelectedDay]   = useState(null)
  const [showNewDay, setShowNewDay]     = useState(false)
  const [newDay, setNewDay]             = useState({ name: '', day_number: '' })
  const [savingDay, setSavingDay]       = useState(false)

  // ── Exercises ──
  const [dayExercises, setDayExercises]         = useState([])
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [allExercises, setAllExercises]         = useState([])
  const [showNewExercise, setShowNewExercise]   = useState(false)
  const [newExercise, setNewExercise]           = useState({ exercise_id: '', sets: '', reps: '', rest_seconds: '', notes: '' })
  const [exerciseSearch, setExerciseSearch]     = useState('')
  const [savingExercise, setSavingExercise]     = useState(false)
  const [deletingId, setDeletingId]             = useState(null)

  // ── Assign program ──
  const [clients, setClients]               = useState([])
  const [assignClientId, setAssignClientId] = useState('')
  const [assignStartDate, setAssignStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [assignLoading, setAssignLoading]   = useState(false)
  const [assignBanner, setAssignBanner]     = useState(null)

  // ── Feedback ──
  const [banner, setBanner] = useState(null)

  const showBanner = useCallback((message, type = 'success') => {
    setBanner({ message, type, id: Date.now() })
  }, [])

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

  // ── Fetch all exercises for the search dropdown ──
  const fetchAllExercises = useCallback(async () => {
    const { data } = await supabase
      .from('exercises')
      .select('id, name, muscle_group')
      .or(`is_global.eq.true,created_by.eq.${user.id}`)
      .order('name')
    if (data) setAllExercises(data)
  }, [user.id])

  useEffect(() => {
    fetchPrograms()
    fetchAllExercises()
    supabase.from('clients').select('id, full_name').eq('pt_id', user.id).order('full_name')
      .then(({ data }) => { if (data) setClients(data) })
  }, [fetchPrograms, fetchAllExercises])

  async function handleAssignProgram() {
    if (!assignClientId) return
    setAssignLoading(true)
    setAssignBanner(null)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { error } = await supabase.from('program_assignments').insert({
      program_id:  selectedProgram.id,
      client_id:   assignClientId,
      assigned_by: authUser.id,
      start_date:  assignStartDate,
      is_active:   true,
    })
    setAssignLoading(false)
    if (error) {
      setAssignBanner({ type: 'error', text: 'Something went wrong. Please try again.' })
    } else {
      setAssignBanner({ type: 'success', text: 'Program assigned successfully!' })
      setTimeout(() => setAssignBanner(null), 3000)
    }
  }

  async function fetchWorkoutDays(programId) {
    setLoadingDays(true)
    const { data, error } = await supabase
      .from('program_workouts')
      .select('*')
      .eq('program_id', programId)
      .order('day_number')
    if (!error && data) setWorkoutDays(data)
    setLoadingDays(false)
  }

  async function fetchDayExercises(workoutId) {
    setLoadingExercises(true)
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*, exercises(id, name, muscle_group)')
      .eq('program_workout_id', workoutId)
      .order('created_at')
    if (!error && data) setDayExercises(data)
    setLoadingExercises(false)
  }

  function openProgram(program) {
    if (selectedProgram?.id === program.id) return
    setSelectedProgram(program)
    setSelectedDay(null)
    setDayExercises([])
    setShowNewDay(false)
    setShowNewExercise(false)
    setBanner(null)
    fetchWorkoutDays(program.id)
  }

  function openDay(day) {
    if (selectedDay?.id === day.id) return
    setSelectedDay(day)
    setShowNewExercise(false)
    setBanner(null)
    fetchDayExercises(day.id)
  }

  async function handleSaveProgram(e) {
    e.preventDefault()
    if (!newProgram.name.trim()) return
    setSavingProgram(true)
    const { data, error } = await supabase
      .from('programs')
      .insert({ name: newProgram.name.trim(), description: newProgram.description.trim() || null, created_by: user.id })
      .select()
      .single()
    setSavingProgram(false)
    if (error) { showBanner('Could not save program.', 'error'); return }
    const withMeta = { ...data, program_workouts: [] }
    setPrograms(prev => [withMeta, ...prev])
    setNewProgram({ name: '', description: '' })
    setShowNewProgram(false)
    showBanner('Program created successfully.')
    openProgram(withMeta)
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
    if (error) { showBanner('Could not save day.', 'error'); return }
    setWorkoutDays(prev => [...prev, data].sort((a, b) => a.day_number - b.day_number))
    setPrograms(prev => prev.map(p =>
      p.id === selectedProgram.id
        ? { ...p, program_workouts: [...(p.program_workouts ?? []), { id: data.id }] }
        : p
    ))
    setNewDay({ name: '', day_number: '' })
    setShowNewDay(false)
    showBanner('Workout day added.')
    openDay(data)
  }

  async function handleSaveExercise(e) {
    e.preventDefault()
    if (!newExercise.exercise_id) return
    setSavingExercise(true)
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert({
        program_workout_id: selectedDay.id,
        exercise_id: newExercise.exercise_id,
        sets: newExercise.sets ? parseInt(newExercise.sets, 10) : null,
        reps: newExercise.reps.trim() || null,
        rest_seconds: newExercise.rest_seconds ? parseInt(newExercise.rest_seconds, 10) : null,
        notes: newExercise.notes.trim() || null,
      })
      .select('*, exercises(id, name, muscle_group)')
      .single()
    setSavingExercise(false)
    if (error) { showBanner('Could not add exercise.', 'error'); return }
    setDayExercises(prev => [...prev, data])
    setNewExercise({ exercise_id: '', sets: '', reps: '', rest_seconds: '', notes: '' })
    setExerciseSearch('')
    setShowNewExercise(false)
    showBanner('Exercise added.')
  }

  async function handleDeleteExercise(id) {
    setDeletingId(id)
    const { error } = await supabase.from('workout_exercises').delete().eq('id', id)
    if (error) { showBanner('Could not delete exercise.', 'error') }
    else setDayExercises(prev => prev.filter(e => e.id !== id))
    setDeletingId(null)
  }

  function dayCount(program) {
    if (selectedProgram?.id === program.id) return workoutDays.length
    return program.program_workouts?.length ?? 0
  }

  function resetExerciseForm() {
    setShowNewExercise(false)
    setExerciseSearch('')
    setNewExercise({ exercise_id: '', sets: '', reps: '', rest_seconds: '', notes: '' })
  }

  const filteredExercises = allExercises.filter(e =>
    e.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">

      {/* ── 3-panel layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ════════════════════════════════════════════════════
            PANEL 1 — Programs
        ════════════════════════════════════════════════════ */}
        <div className="w-[260px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">

          <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-900 m-0">Programs</h2>
            <button
              onClick={() => { setShowNewProgram(v => !v); setNewProgram({ name: '', description: '' }) }}
              className="bg-black hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* New program form */}
            {showNewProgram && (
              <div className="m-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <form onSubmit={handleSaveProgram} className="flex flex-col gap-3">
                  <input
                    autoFocus
                    type="text"
                    required
                    placeholder="e.g. 12 Week Strength"
                    value={newProgram.name}
                    onChange={e => setNewProgram(p => ({ ...p, name: e.target.value }))}
                    className={inputCls}
                  />
                  <textarea
                    rows={2}
                    placeholder="What is this program for?"
                    value={newProgram.description}
                    onChange={e => setNewProgram(p => ({ ...p, description: e.target.value }))}
                    className={`${inputCls} resize-none`}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingProgram}
                      className="flex-1 py-2 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {savingProgram ? 'Saving...' : 'Create Program'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewProgram(false)}
                      className="flex-1 py-2 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-150"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingPrograms ? (
              <Spinner />
            ) : programs.length === 0 && !showNewProgram ? (
              <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 m-0">No programs yet</p>
                <p className="text-xs text-gray-400 mt-1">Click + New to create your first program</p>
              </div>
            ) : (
              <ul className="p-3 flex flex-col gap-2 list-none m-0">
                {programs.map(program => {
                  const active = selectedProgram?.id === program.id
                  const count = dayCount(program)
                  return (
                    <li key={program.id}>
                      <button
                        onClick={() => openProgram(program)}
                        className={`w-full text-left p-4 rounded-xl border transition-all
                          ${active
                            ? 'border-2 border-black bg-gray-50'
                            : 'border border-gray-200 hover:border-gray-300 bg-white'}`}
                      >
                        <p className="font-semibold text-gray-900 text-sm m-0 truncate leading-snug">
                          {program.name}
                        </p>
                        {program.description && (
                          <p className="text-xs text-gray-400 m-0 mt-1 truncate">{program.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5 m-0">{count} {count === 1 ? 'day' : 'days'}</p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            PANEL 2 — Workout Days
        ════════════════════════════════════════════════════ */}
        <div className="w-[240px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">

          {!selectedProgram ? (
            <Placeholder text="Select a program first" />
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                <h2 className="text-sm font-bold text-gray-900 m-0">Workout Days</h2>
                <button
                  onClick={() => { setShowNewDay(v => !v); setNewDay({ name: '', day_number: '' }) }}
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add Day
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">

                {/* New day form */}
                {showNewDay && (
                  <div className="m-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <form onSubmit={handleSaveDay} className="flex flex-col gap-3">
                      <input
                        autoFocus
                        type="number"
                        required
                        min="1"
                        placeholder="Day number (e.g. 1)"
                        value={newDay.day_number}
                        onChange={e => setNewDay(d => ({ ...d, day_number: e.target.value }))}
                        className={inputCls}
                      />
                      <input
                        type="text"
                        required
                        placeholder="Day name (e.g. Push Day)"
                        value={newDay.name}
                        onChange={e => setNewDay(d => ({ ...d, name: e.target.value }))}
                        className={inputCls}
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={savingDay}
                          className="flex-1 py-2 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {savingDay ? 'Saving...' : 'Add Day'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewDay(false)}
                          className="flex-1 py-2 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-150"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {loadingDays ? (
                  <Spinner />
                ) : workoutDays.length === 0 && !showNewDay ? (
                  <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
                    <p className="text-sm font-medium text-gray-600 m-0">No days yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add your first workout day</p>
                  </div>
                ) : (
                  <ul className="p-3 flex flex-col gap-2 list-none m-0">
                    {workoutDays.map(day => {
                      const active = selectedDay?.id === day.id
                      return (
                        <li key={day.id}>
                          <button
                            onClick={() => openDay(day)}
                            className={`w-full text-left p-3 rounded-lg border transition-all
                              ${active
                                ? 'border-2 border-black bg-gray-50'
                                : 'border border-gray-200 hover:border-gray-300 bg-white'}`}
                          >
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0">
                              Day {day.day_number}
                            </p>
                            <p className="font-semibold text-gray-900 text-sm mt-0.5 m-0 leading-snug">
                              {day.name}
                            </p>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        {/* ════════════════════════════════════════════════════
            PANEL 3 — Exercises
        ════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 min-w-0">

          {!selectedProgram ? (
            <Placeholder text="Select a program to get started" />
          ) : !selectedDay ? (
            <div className="flex-1 overflow-y-auto">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 mx-6 mt-6 max-w-md">
                <h3 className="font-semibold text-gray-900 mb-1">Assign to Client</h3>
                <p className="text-xs text-gray-500 mb-4">Assign this program to one of your clients</p>

                <select
                  value={assignClientId}
                  onChange={e => setAssignClientId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 mb-3"
                >
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>

                <label className="block text-sm text-gray-600 font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={assignStartDate}
                  onChange={e => setAssignStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 mb-4"
                />

                <button
                  onClick={handleAssignProgram}
                  disabled={assignLoading || !assignClientId}
                  className="bg-black hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assignLoading ? 'Assigning...' : 'Assign Program'}
                </button>

                {assignBanner && (
                  <div className={`mt-3 p-3 text-sm rounded-lg ${assignBanner.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                    {assignBanner.text}
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-400 italic text-center mt-8">Select a workout day to see exercises</p>
            </div>
          ) : (
            <>
              {/* Day header */}
              <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{selectedProgram?.name} · Day {selectedDay?.day_number}</p>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedDay?.name}</h2>
                  </div>
                  <button
                    onClick={() => setShowNewExercise(v => !v)}
                    className="bg-black hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>+</span> Add Exercise
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">

                {/* Feedback banner */}
                {banner && (
                  <Banner
                    key={banner.id}
                    id={banner.id}
                    message={banner.message}
                    type={banner.type}
                    onDismiss={() => setBanner(null)}
                  />
                )}

                {/* ── Add exercise form ── */}
                {showNewExercise && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Add Exercise to {selectedDay?.name}</h3>
                    <form onSubmit={handleSaveExercise} className="flex flex-col gap-4">

                      <Field label="Exercise">
                        <div className="relative">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search exercises..."
                            value={exerciseSearch}
                            onChange={e => {
                              setExerciseSearch(e.target.value)
                              if (newExercise.exercise_id) setNewExercise(ex => ({ ...ex, exercise_id: '' }))
                            }}
                            className={inputCls}
                          />
                          {newExercise.exercise_id && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        {/* Dropdown results */}
                        {exerciseSearch && !newExercise.exercise_id && (
                          <ul className="border border-gray-200 rounded-lg overflow-hidden max-h-44 overflow-y-auto bg-white shadow-sm list-none m-0 p-0">
                            {filteredExercises.length === 0 ? (
                              <li className="px-4 py-3 text-xs text-gray-400">
                                No exercises match "{exerciseSearch}"
                              </li>
                            ) : filteredExercises.slice(0, 10).map(ex => (
                              <li key={ex.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewExercise(e => ({ ...e, exercise_id: ex.id }))
                                    setExerciseSearch(ex.name)
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
                                >
                                  <span className="font-medium text-gray-700 truncate">{ex.name}</span>
                                  {ex.muscle_group && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-gray-100 text-gray-600">
                                      {ex.muscle_group}
                                    </span>
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </Field>

                      <div className="grid grid-cols-3 gap-3">
                        <Field label="Sets">
                          <input
                            type="number"
                            min="1"
                            placeholder="e.g. 4"
                            value={newExercise.sets}
                            onChange={e => setNewExercise(ex => ({ ...ex, sets: e.target.value }))}
                            className={inputCls}
                          />
                        </Field>
                        <Field label="Reps">
                          <input
                            type="text"
                            placeholder="e.g. 8-12 or AMRAP"
                            value={newExercise.reps}
                            onChange={e => setNewExercise(ex => ({ ...ex, reps: e.target.value }))}
                            className={inputCls}
                          />
                        </Field>
                        <Field label="Rest (seconds)">
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 90"
                            value={newExercise.rest_seconds}
                            onChange={e => setNewExercise(ex => ({ ...ex, rest_seconds: e.target.value }))}
                            className={inputCls}
                          />
                        </Field>
                      </div>

                      <Field label="Notes (optional)">
                        <textarea
                          rows={2}
                          placeholder="e.g. Controlled eccentric, pause at bottom"
                          value={newExercise.notes}
                          onChange={e => setNewExercise(ex => ({ ...ex, notes: e.target.value }))}
                          className={`${inputCls} resize-none`}
                        />
                      </Field>

                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={resetExerciseForm}
                          className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-150"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-black hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          {savingExercise ? 'Adding...' : 'Add to Workout'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ── Exercise list ── */}
                {loadingExercises ? (
                  <Spinner />
                ) : dayExercises.length === 0 && !showNewExercise ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-10 py-10 text-center max-w-xs">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 4v16M18 4v16M3 8h4M17 8h4M3 16h4M17 16h4"/>
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-600 m-0">No exercises added yet</p>
                      <p className="text-xs text-gray-400 mt-1.5">Click + Add Exercise to build this workout</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {dayExercises.map((exercise, index) => (
                      <div key={exercise.id} className={`bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all ${deletingId === exercise.id ? 'opacity-30 pointer-events-none' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">{index + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm">{exercise.exercises?.name || exercise.name}</span>
                                {(exercise.exercises?.muscle_group || exercise.muscle_group) && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                                    {exercise.exercises?.muscle_group || exercise.muscle_group}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-gray-700 font-medium">
                                  <span className="text-gray-400">Sets</span> {exercise.sets}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-gray-700 font-medium">
                                  <span className="text-gray-400">Reps</span> {exercise.reps}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-gray-700 font-medium">
                                  <span className="text-gray-400">Rest</span> {exercise.rest_seconds}s
                                </span>
                              </div>
                              {exercise.notes && (
                                <p className="text-xs text-gray-500 mt-2 italic">{exercise.notes}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteExercise(exercise.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors ml-2 flex-shrink-0 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

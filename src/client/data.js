// Reads for the client app. Each returns plain data; ClientApp keeps it in state.
// Same tables, columns and filters as before the redesign.
import { supabase } from '../supabase'
import { toLocalDateStr, addDays } from './dates'

const SW_SELECT = 'id, scheduled_date, program_workout_id, custom_workout_id, created_by, program_workouts(id, name, day_number), saved_workouts(id, name, content)'
const EX_SELECT = 'id, sets, reps, rest_seconds, notes, order_index, exercises(id, name, muscle_group)'

// Scheduled sessions from 4 weeks back to 13 weeks ahead (an 8-week program started next
// Monday fits).
export async function fetchScheduled(clientId) {
  const today = toLocalDateStr()
  const { data } = await supabase
    .from('scheduled_workouts')
    .select(SW_SELECT)
    .eq('client_id', clientId)
    .gte('scheduled_date', addDays(today, -28))
    .lte('scheduled_date', addDays(today, 91))
    .order('scheduled_date', { ascending: true })
  return (data ?? []).map((sw) => ({
    ...sw,
    program_workouts: sw.program_workouts ?? (sw.saved_workouts ? { name: sw.saved_workouts.name, day_number: 0 } : null),
    _isCustom: !!sw.custom_workout_id,
    _customWorkout: sw.saved_workouts ?? null,
  }))
}

// Exercises for each program workout id: { [id]: rows }
export async function fetchExercisesFor(programWorkoutIds) {
  const exMap = {}
  await Promise.all(programWorkoutIds.map(async (id) => {
    const { data } = await supabase.from('workout_exercises').select(EX_SELECT).eq('program_workout_id', id).order('order_index', { ascending: true })
    exMap[id] = data ?? []
  }))
  return exMap
}

export async function fetchWorkoutLogs(clientId) {
  const { data } = await supabase
    .from('workout_logs')
    .select('id, completed, program_workout_id, scheduled_workout_id, logged_at, completed_at')
    .eq('client_id', clientId)
    .eq('completed', true)
  return data ?? []
}

export async function fetchFoodLogs(clientId) {
  const { data } = await supabase.from('food_logs').select('*').eq('client_id', clientId).order('logged_at', { ascending: false })
  return data ?? []
}

export async function fetchWeightLogs(clientId) {
  const { data } = await supabase.from('body_weight_logs').select('id, weight_kg, logged_date, logged_by, created_at').eq('client_id', clientId).order('logged_date', { ascending: false })
  return data ?? []
}

// Personal bests (estimated 1RM etc.) and the heaviest sets, for the Strength section.
export async function fetchStrength(clientId) {
  const [{ data: pbs }, { data: sets }] = await Promise.all([
    supabase.from('personal_bests').select('id, exercise_id, pb_type, value, achieved_at, exercises(name)').eq('client_id', clientId),
    supabase.from('workout_set_logs').select('exercise_id, weight_kg, exercises(name)').eq('client_id', clientId).gt('weight_kg', 0).order('weight_kg', { ascending: false }).limit(1000),
  ])
  return { personalBests: pbs ?? [], heavySets: sets ?? [] }
}

export async function fetchResources(ptId) {
  // pt_id is nullable (solo clients have no coach), so the created_by filter is only added
  // when a pt_id exists. A null pt_id would make the invalid filter "created_by.eq.undefined".
  const filter = ptId ? `is_global.eq.true,created_by.eq.${ptId}` : 'is_global.eq.true'
  const { data, error } = await supabase.from('resources').select('*').or(filter).order('created_at', { ascending: false })
  if (error) console.error('Failed to load resources:', error.message, '| filter:', filter)
  return data ?? []
}

// The client's active program (if any), its days and each day's exercises.
// assigned_by tells a coach's program apart from one the client started themselves.
export async function fetchAssignment(clientId) {
  const { data: assignment } = await supabase
    .from('program_assignments')
    .select('id, start_date, assigned_by, programs(id, name, description)')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .maybeSingle()
  if (!assignment?.programs) return { assignment: assignment ?? null, programWorkouts: [], exercises: {} }
  const { data: pwData } = await supabase.from('program_workouts').select('id, name, day_number').eq('program_id', assignment.programs.id).order('day_number', { ascending: true })
  const programWorkouts = pwData ?? []
  const exercises = programWorkouts.length > 0 ? await fetchExercisesFor(programWorkouts.map((pw) => pw.id)) : {}
  return { assignment, programWorkouts, exercises }
}

// The on-demand library: single workouts and multi-day programs any member can use.
// Before the on_demand_library migration is applied the is_on_demand column does not
// exist and this errors. Any error means "no library": the sections stay hidden.
export async function fetchOnDemand() {
  const empty = { workouts: [], programs: [], exercises: {} }
  try {
    const { data, error } = await supabase
      .from('programs')
      .select(`id, name, description, kind, program_workouts(id, name, day_number, workout_exercises(${EX_SELECT}))`)
      .eq('is_on_demand', true)
      .order('name', { ascending: true })
    if (error) { console.warn('On-demand library not available:', error.message); return empty }
    const exercises = {}
    const rows = (data ?? []).map((p) => {
      const days = [...(p.program_workouts ?? [])].sort((a, b) => a.day_number - b.day_number)
      for (const d of days) exercises[d.id] = [...(d.workout_exercises ?? [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      return { id: p.id, name: p.name, description: p.description, kind: p.kind, days: days.map(({ id, name, day_number }) => ({ id, name, day_number })) }
    })
    return {
      workouts: rows.filter((p) => p.kind === 'workout' && p.days.length > 0),
      programs: rows.filter((p) => p.kind === 'program' && p.days.length > 0),
      exercises,
    }
  } catch (e) {
    console.warn('On-demand library not available:', e)
    return empty
  }
}

// The coach's first name for Home. Clients can read it once the on_demand_library
// migration is applied; until then no row comes back and Home says "your coach".
export async function fetchCoachName(ptId) {
  if (!ptId) return null
  try {
    const { data, error } = await supabase.from('profiles').select('full_name').eq('id', ptId).maybeSingle()
    if (error) { console.warn('Coach name not available:', error.message); return null }
    return data?.full_name?.trim().split(/\s+/)[0] || null
  } catch (e) {
    console.warn('Coach name not available:', e)
    return null
  }
}

export async function fetchByClient(table, clientId, orderCol) {
  const { data } = await supabase.from(table).select('*').eq('client_id', clientId).order(orderCol, { ascending: false })
  return data ?? []
}

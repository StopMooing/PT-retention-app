// Reads for the client app. Each returns plain data; ClientApp keeps it in state.
// Same tables, columns and filters as before the redesign.
import { supabase } from '../supabase'
import { toLocalDateStr, addDays } from './dates'

const SW_SELECT = 'id, scheduled_date, program_workout_id, custom_workout_id, program_workouts(id, name, day_number), saved_workouts(id, name, content)'
const EX_SELECT = 'id, sets, reps, rest_seconds, notes, order_index, exercises(id, name, muscle_group)'

// Scheduled sessions from 4 weeks back to 8 weeks ahead.
export async function fetchScheduled(clientId) {
  const today = toLocalDateStr()
  const { data } = await supabase
    .from('scheduled_workouts')
    .select(SW_SELECT)
    .eq('client_id', clientId)
    .gte('scheduled_date', addDays(today, -28))
    .lte('scheduled_date', addDays(today, 56))
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
    .select('id, completed, program_workout_id, scheduled_workout_id, logged_at')
    .eq('client_id', clientId)
    .eq('completed', true)
  return data ?? []
}

export async function fetchFoodLogs(clientId) {
  const { data } = await supabase.from('food_logs').select('*').eq('client_id', clientId).order('logged_at', { ascending: false })
  return data ?? []
}

export async function fetchWeightLogs(clientId) {
  const { data } = await supabase.from('body_weight_logs').select('id, weight_kg, logged_date').eq('client_id', clientId).order('logged_date', { ascending: false })
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

export async function fetchByClient(table, clientId, orderCol) {
  const { data } = await supabase.from(table).select('*').eq('client_id', clientId).order(orderCol, { ascending: false })
  return data ?? []
}

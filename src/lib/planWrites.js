// Puts a calendar plan (from programPlan in schedule.js) on a client's calendar. Shared by
// the client app and the coach side. Same scheduled_workouts columns as everywhere else.
import { supabase } from '../supabase'

// One read to find sessions already there (same workout on the same day, which are
// skipped), then one insert for the rest. select: columns to return for the new rows.
// Returns { data, error, count }.
export async function insertPlannedSessions({ clientId, createdBy, plan, select }) {
  if (!plan?.length) return { data: [], error: null, count: 0 }
  const dates = plan.map((p) => p.scheduled_date).sort()
  const ids = [...new Set(plan.map((p) => p.program_workout_id))]
  const { data: existing, error: readError } = await supabase
    .from('scheduled_workouts')
    .select('program_workout_id, scheduled_date')
    .eq('client_id', clientId)
    .in('program_workout_id', ids)
    .gte('scheduled_date', dates[0])
    .lte('scheduled_date', dates[dates.length - 1])
  if (readError) {
    console.error('Read schedule error:', readError)
    return { data: [], error: readError, count: 0 }
  }
  const taken = new Set((existing ?? []).map((r) => `${r.program_workout_id}_${r.scheduled_date}`))
  const rows = plan
    .filter((p) => !taken.has(`${p.program_workout_id}_${p.scheduled_date}`))
    .map((p) => ({ client_id: clientId, program_workout_id: p.program_workout_id, custom_workout_id: null, scheduled_date: p.scheduled_date, created_by: createdBy }))
  if (rows.length === 0) return { data: [], error: null, count: 0 }
  const query = supabase.from('scheduled_workouts').insert(rows)
  const { data, error } = select ? await query.select(select) : await query
  if (error) {
    console.error('Schedule program error:', error)
    return { data: [], error, count: 0 }
  }
  return { data: data ?? [], error: null, count: rows.length }
}

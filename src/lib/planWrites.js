// Puts a calendar plan (from programPlan in schedule.js) on a client's calendar. Shared by
// the client app and the coach side. Same scheduled_workouts columns as everywhere else.
import { supabase } from '../supabase'
import { toLocalDateStr } from '../client/dates.js'

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

// Takes a program's upcoming sessions off one client's calendar when the program is stopped,
// swapped or removed (client app and coach side alike). Removes that client's sessions of
// the program's workouts dated fromDate or later that haven't been done (a completed log
// for the session). Done and earlier sessions stay. keep: plan rows
// ({ program_workout_id, scheduled_date }) to leave alone, for when the same program goes
// straight back on. Returns { error, ids } (ids: the sessions removed).
export async function clearUpcoming({ clientId, programId, fromDate = toLocalDateStr(), keep = [] }) {
  const none = { error: null, ids: [] }
  if (!clientId || !programId) return none
  const fail = (what, error) => { console.error(`Clear upcoming sessions (${what}) error:`, error); return { error, ids: [] } }

  const { data: days, error: dayError } = await supabase.from('program_workouts').select('id').eq('program_id', programId)
  if (dayError) return fail('program days', dayError)
  const pwIds = (days ?? []).map((d) => d.id)
  if (pwIds.length === 0) return none

  const { data: sessions, error: swError } = await supabase
    .from('scheduled_workouts')
    .select('id, program_workout_id, scheduled_date')
    .eq('client_id', clientId)
    .in('program_workout_id', pwIds)
    .gte('scheduled_date', fromDate)
  if (swError) return fail('sessions', swError)
  if (!sessions?.length) return none

  const { data: logs, error: logError } = await supabase
    .from('workout_logs')
    .select('scheduled_workout_id')
    .eq('client_id', clientId)
    .eq('completed', true)
    .in('scheduled_workout_id', sessions.map((s) => s.id))
  if (logError) return fail('logs', logError)
  const done = new Set((logs ?? []).map((l) => l.scheduled_workout_id))
  const kept = new Set(keep.map((p) => `${p.program_workout_id}_${p.scheduled_date}`))
  const ids = sessions
    .filter((s) => !done.has(s.id) && !kept.has(`${s.program_workout_id}_${s.scheduled_date}`))
    .map((s) => s.id)
  if (ids.length === 0) return none

  const { error } = await supabase.from('scheduled_workouts').delete().eq('client_id', clientId).in('id', ids)
  if (error) return fail('delete', error)
  return { error: null, ids }
}

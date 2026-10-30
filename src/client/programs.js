// Writes for starting and stopping a program and putting workouts on the calendar.
// Same scheduled_workouts shape the coach's calendar reads (program_workout_id or
// custom_workout_id, created_by = the client's own user id).
import { supabase } from '../supabase'
import { toLocalDateStr, addDays } from './dates'

// One pass through a program's days from startDate, with rest days spread between them
// (3 days: today, +2, +4). Seven or more days run one a day.
const SPREAD = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] }
export function spreadDates(count, startDate) {
  const offsets = SPREAD[count] ?? Array.from({ length: count }, (_, i) => i)
  return offsets.map((o) => addDays(startDate, o))
}

// Put a program's days on the calendar once, from startDate. A day already scheduled on
// that date is skipped. Returns { error, count }.
export async function scheduleProgramDays({ client, days, startDate, scheduledWorkouts }) {
  const dates = spreadDates(days.length, startDate)
  const rows = days
    .map((d, i) => ({ client_id: client.id, program_workout_id: d.id, custom_workout_id: null, scheduled_date: dates[i], created_by: client.user_id }))
    .filter((r) => !(scheduledWorkouts ?? []).some((sw) => sw.program_workout_id === r.program_workout_id && sw.scheduled_date === r.scheduled_date))
  if (rows.length === 0) return { error: null, count: 0 }
  const { error } = await supabase.from('scheduled_workouts').insert(rows)
  if (error) console.error('Schedule program error:', error)
  return { error, count: error ? 0 : rows.length }
}

// Stop a program the client started themselves. upcomingIds: that program's sessions from
// today on that haven't been done; they come off the calendar. Done sessions stay.
export async function stopProgram(assignment, client, upcomingIds = []) {
  const { error } = await supabase
    .from('program_assignments')
    .update({ is_active: false })
    .eq('id', assignment.id)
    .eq('assigned_by', client.user_id)
  if (error) {
    console.error('Stop program error:', error)
    return { error }
  }
  if (upcomingIds.length > 0) {
    const { error: clearError } = await supabase.from('scheduled_workouts').delete().eq('client_id', client.id).in('id', upcomingIds)
    // The program is already stopped; leftover sessions are harmless, so only log this.
    if (clearError) console.error('Clear upcoming sessions error:', clearError)
  }
  return { error: null }
}

// Start an on-demand program: one active assignment at a time, so a program the client
// started earlier is stopped first (and switched back on if the new one fails).
// assigned_by is the client's own user id: that is how the coach side labels it.
export async function startProgram({ client, program, current, scheduledWorkouts }) {
  if (current) {
    const { error } = await stopProgram(current, client)
    if (error) return { error }
  }
  const today = toLocalDateStr()
  const { error } = await supabase.from('program_assignments').insert({
    client_id: client.id, program_id: program.id, assigned_by: client.user_id, start_date: today, is_active: true,
  })
  if (error) {
    console.error('Start program error:', error)
    if (current) await supabase.from('program_assignments').update({ is_active: true }).eq('id', current.id).eq('assigned_by', client.user_id)
    return { error }
  }
  return scheduleProgramDays({ client, days: program.days, startDate: today, scheduledWorkouts })
}

// Put one workout on one day. item: { type: 'program' | 'saved', id }. Returns the new row.
export async function scheduleOne({ client, item, date }) {
  const { data, error } = await supabase
    .from('scheduled_workouts')
    .insert({
      client_id: client.id,
      program_workout_id: item.type === 'program' ? item.id : null,
      custom_workout_id: item.type === 'saved' ? item.id : null,
      scheduled_date: date,
      created_by: client.user_id,
    })
    .select('id, scheduled_date, program_workout_id, custom_workout_id')
    .single()
  if (error) console.error('Schedule workout error:', error)
  return { data, error }
}

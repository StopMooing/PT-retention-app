// Writes for starting and stopping a program and putting workouts on the calendar.
// Same scheduled_workouts shape the coach's calendar reads (program_workout_id or
// custom_workout_id, created_by = the client's own user id).
import { supabase } from '../supabase'
import { programPlan, planWeeks } from '../lib/schedule.js'
import { insertPlannedSessions } from '../lib/planWrites'

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

// Start an on-demand program from startDate on the chosen weekdays (Mon = 1 .. Sun = 7):
// one active assignment at a time, so a program the client started earlier is stopped
// first, then every planned session goes on the calendar in one insert (sessions already
// there are skipped). If any step fails, the new assignment is switched off and the old
// one switched back on. Only once it all worked do the old program's upcoming sessions
// (currentUpcomingIds) come off the calendar. assigned_by is the client's own user id:
// that is how the coach side labels it. Returns { error, count }.
export async function startProgram({ client, program, current, currentUpcomingIds = [], startDate, trainingDays }) {
  const restore = () => current && supabase.from('program_assignments').update({ is_active: true }).eq('id', current.id).eq('assigned_by', client.user_id)
  if (current) {
    const { error } = await stopProgram(current, client)
    if (error) return { error }
  }
  const { data: created, error } = await supabase
    .from('program_assignments')
    .insert({ client_id: client.id, program_id: program.id, assigned_by: client.user_id, start_date: startDate, is_active: true })
    .select('id')
    .single()
  if (error) {
    console.error('Start program error:', error)
    await restore()
    return { error }
  }
  const plan = programPlan({ days: program.days, weeks: planWeeks(program), startDate, trainingDays })
  const res = await insertPlannedSessions({ clientId: client.id, createdBy: client.user_id, plan })
  if (res.error) {
    await supabase.from('program_assignments').update({ is_active: false }).eq('id', created.id).eq('assigned_by', client.user_id)
    await restore()
    return { error: res.error }
  }
  if (current && currentUpcomingIds.length > 0) {
    const { error: clearError } = await supabase.from('scheduled_workouts').delete().eq('client_id', client.id).in('id', currentUpcomingIds)
    // The new program is on; leftover old sessions are harmless, so only log this.
    if (clearError) console.error('Clear old program sessions error:', clearError)
  }
  return { error: null, count: res.count }
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

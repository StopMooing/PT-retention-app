// How a program goes on the calendar. Pure functions, shared by the client app (Start
// program) and the coach side (assign, change program, fill schedule) so both lay out a
// program the same way. Weekdays are numbered Monday = 1 to Sunday = 7. Day logic only
// through the local-day helpers in client/dates.js (never toISOString).
import { toLocalDateStr, addDays, parseDay, dayMonth } from '../client/dates.js'

// Weeks to plan when a program's name and description don't say how long it is.
export const DEFAULT_WEEKS = 4

const DEFAULT_DAYS = { 1: [1], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6] }
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7]

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

// Monday = 1 ... Sunday = 7 for a 'YYYY-MM-DD'.
export function isoWeekday(dateStr) {
  const d = parseDay(dateStr).getDay()
  return d === 0 ? 7 : d
}

// Training days a program needs each week: one per program day, at most seven.
export function requiredDays(dayCount) {
  return Math.max(0, Math.min(dayCount || 0, 7))
}

// The usual weekdays for a program with dayCount days.
export function defaultTrainingDays(dayCount) {
  const n = requiredDays(dayCount)
  if (n === 0) return []
  return DEFAULT_DAYS[n] ?? ALL_DAYS
}

// Next Monday, or today when today is a Monday.
export function defaultStartDate(today = toLocalDateStr()) {
  const wd = isoWeekday(today)
  return wd === 1 ? today : addDays(today, 8 - wd)
}

// Program length in weeks, read from its name or description ("4-Week Beginner
// Strength", "12 week full body build"). null when neither says.
export function programWeeks(program) {
  const m = `${program?.name ?? ''} ${program?.description ?? ''}`.match(/(\d{1,2})\s*-?\s*weeks?\b/i)
  const n = m ? parseInt(m[1], 10) : 0
  return n > 0 && n <= 52 ? n : null
}

// Weeks the calendar plan covers: the program's length, or DEFAULT_WEEKS when unknown.
export function planWeeks(program) {
  return programWeeks(program) ?? DEFAULT_WEEKS
}

// Sessions in a full plan. The Start sheet summary and the client's "x of y sessions done"
// both use this, so they agree.
export function planSessionCount(dayCount, weeks) {
  return requiredDays(dayCount) * (weeks || 0)
}

// Last day the plan covers (start plus whole weeks, minus one day).
export function planEndDate(startDate, weeks) {
  return addDays(startDate, weeks * 7 - 1)
}

// The calendar plan: for `weeks` weeks from startDate, each date whose weekday is in
// trainingDays gets the next program day in order (D1, D2, ... then D1 again), so every
// week runs the days in order. days: the program's workouts, ordered by day_number.
// Returns [{ program_workout_id, scheduled_date }].
export function programPlan({ days, weeks, startDate, trainingDays }) {
  if (!days?.length || !startDate || !weeks || !trainingDays?.length) return []
  const on = new Set(trainingDays)
  const out = []
  let next = 0
  for (let i = 0; i < weeks * 7; i++) {
    const date = addDays(startDate, i)
    if (!on.has(isoWeekday(date))) continue
    out.push({ program_workout_id: days[next % days.length].id, scheduled_date: date })
    next++
  }
  return out
}

// Ready to start: a start date from today on and exactly the training days needed.
export function planReady({ dayCount, startDate, trainingDays, today = toLocalDateStr() }) {
  return !!startDate && startDate >= today && requiredDays(dayCount) > 0 && (trainingDays?.length ?? 0) === requiredDays(dayCount)
}

// "6 weeks, 24 sessions, 2 Nov to 13 Dec".
export function planSummary({ dayCount, weeks, startDate }) {
  return `${plural(weeks, 'week')}, ${plural(planSessionCount(dayCount, weeks), 'session')}, ${dayMonth(startDate)} to ${dayMonth(planEndDate(startDate, weeks))}`
}

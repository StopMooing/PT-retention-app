// How a program goes on the calendar. Pure functions, shared by the client app (Start
// program) and the coach side (assign, change program, fill schedule) so both lay out a
// program the same way. Weekdays are numbered Monday = 1 to Sunday = 7. Day logic only
// through the local-day helpers in client/dates.js (never toISOString).
import { toLocalDateStr, addDays, parseDay, dayMonth, mondayOf } from '../client/dates.js'

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

// Earliest start a client can pick: the Monday of this week, so a program started midweek
// can still begin on Monday. Days already gone show as not logged yet. The coach side has
// no earliest date.
export function clientEarliestStart(today = toLocalDateStr()) {
  return mondayOf(today)
}

// Coach side, under the start date when it is before today.
export const PAST_START_NOTE = "Sessions before today go on the calendar as not done. They won't count against anyone."

// Program length in weeks, read from its name or description ("4-Week Beginner
// Strength", "12 week full body build"). null when neither says.
export function programWeeks(program) {
  const m = `${program?.name ?? ''} ${program?.description ?? ''}`.match(/(\d{1,2})\s*-?\s*weeks?\b/i)
  const n = m ? parseInt(m[1], 10) : 0
  return n > 0 && n <= 52 ? n : null
}

// Programs built in weeks: each workout has a week_number (1 when the program has a single
// week that repeats). Weeks built is the highest week number.
export function builtWeeks(days) {
  return Math.max(1, ...(days ?? []).map((d) => d.week_number || 1))
}

// Workouts a week: the most any one week has (all of them for a one-week program).
export function daysPerWeek(days) {
  const counts = {}
  for (const d of days ?? []) counts[d.week_number || 1] = (counts[d.week_number || 1] || 0) + 1
  return Math.max(0, ...Object.values(counts))
}

// Weeks the calendar plan covers: a program built week by week runs for the weeks built;
// otherwise its length from the name or description, or DEFAULT_WEEKS when unknown.
// days: the program's workouts when known (they carry week_number).
export function planWeeks(program, days = program?.days) {
  const built = builtWeeks(days)
  if (built > 1) return built
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
// trainingDays gets that week's next workout in order (D1, D2, ...), so every week runs
// its days in order. days: the program's workouts (with week_number and day_number).
// Returns [{ program_workout_id, scheduled_date }].
export function programPlan({ days, weeks, startDate, trainingDays }) {
  if (!days?.length || !startDate || !weeks || !trainingDays?.length) return []
  const on = new Set(trainingDays)
  // Week by week: week w uses that week's workouts in order (a one-week program repeats
  // week 1). A week with fewer workouts than training days leaves the extra days free.
  const byWeek = {}
  for (const d of days) (byWeek[d.week_number || 1] ||= []).push(d)
  for (const list of Object.values(byWeek)) list.sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
  const multi = builtWeeks(days) > 1
  const out = []
  for (let w = 0; w < weeks; w++) {
    const list = multi ? (byWeek[w + 1] ?? []) : byWeek[1] ?? days
    let next = 0
    for (let i = 0; i < 7 && next < list.length; i++) {
      const date = addDays(startDate, w * 7 + i)
      if (!on.has(isoWeekday(date))) continue
      out.push({ program_workout_id: list[next].id, scheduled_date: date })
      next++
    }
  }
  return out
}

// Ready to start: a start date (from minDate on, when given) and exactly the training days
// needed. minDate null: any date, past ones included (coach side).
export function planReady({ dayCount, startDate, trainingDays, minDate = toLocalDateStr() }) {
  return !!startDate && (!minDate || startDate >= minDate) && requiredDays(dayCount) > 0 && (trainingDays?.length ?? 0) === requiredDays(dayCount)
}

// "6 weeks, 24 sessions, 2 Nov to 13 Dec".
export function planSummary({ dayCount, weeks, startDate }) {
  return `${plural(weeks, 'week')}, ${plural(planSessionCount(dayCount, weeks), 'session')}, ${dayMonth(startDate)} to ${dayMonth(planEndDate(startDate, weeks))}`
}

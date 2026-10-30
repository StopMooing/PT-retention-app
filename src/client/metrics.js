// One source of truth for every number the client sees. If a number appears on more
// than one screen, it is worked out here so the screens always agree.
import { toLocalDateStr, mondayOf, addDays, weekDays, daysBetween, weekdayName } from './dates'
import { parseAiJson } from './foods'

// "1 exercise", "3 exercises".
export function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`
}

/* ---------- Workouts ---------- */

// Key used to match a completed log to a scheduled session.
export function workoutKey(programWorkoutId, scheduledWorkoutId, dateStr) {
  if (scheduledWorkoutId) return `sw_${scheduledWorkoutId}`
  const base = programWorkoutId || 'unknown'
  return `${base}_${dateStr}`
}

export function completedKeys(workoutLogs) {
  return new Set(
    (workoutLogs ?? [])
      .filter((l) => l.program_workout_id || l.scheduled_workout_id)
      .map((l) => workoutKey(l.program_workout_id, l.scheduled_workout_id, toLocalDateStr(new Date(l.logged_at)))),
  )
}

export function isDone(sw, completedIds) {
  return completedIds.has(workoutKey(sw.program_workout_id, sw.id, sw.scheduled_date))
}

export function workoutName(sw) {
  return sw?.program_workouts?.name || sw?._customWorkout?.name || sw?.saved_workouts?.name || 'Workout'
}

// The exercises in a scheduled session: the program day's rows, or the exercises in a
// saved (AI) workout. exMap is { [program_workout_id]: rows }.
export function sessionExercises(sw, exMap) {
  if (sw?.program_workout_id) return exMap?.[sw.program_workout_id] ?? []
  const parsed = parseAiJson(sw?._customWorkout?.content || sw?.saved_workouts?.content || '')
  return Array.isArray(parsed?.exercises) ? parsed.exercises : []
}

export function groupByDate(scheduledWorkouts) {
  return (scheduledWorkouts ?? []).reduce((acc, sw) => {
    ;(acc[sw.scheduled_date] ||= []).push(sw)
    return acc
  }, {})
}

// Rough session length: 2.5 minutes per set.
export function estMinutes(exercises) {
  return Math.round((exercises ?? []).reduce((sum, ex) => sum + (ex.sets || 0), 0) * 2.5)
}

export function totalSets(exercises) {
  return (exercises ?? []).reduce((sum, ex) => sum + (ex.sets || 0), 0)
}

// Sessions in the week starting on monday ('YYYY-MM-DD'), Monday to Sunday, in date order.
export function sessionsInWeek(scheduledWorkouts, monday) {
  const sunday = addDays(monday, 6)
  return (scheduledWorkouts ?? [])
    .filter((sw) => sw.scheduled_date >= monday && sw.scheduled_date <= sunday)
    .sort((a, b) => (a.scheduled_date < b.scheduled_date ? -1 : a.scheduled_date > b.scheduled_date ? 1 : 0))
}

// The completed log for a scheduled session, or null.
export function sessionLog(sw, workoutLogs) {
  return (workoutLogs ?? []).find((l) => l.scheduled_workout_id === sw.id && l.completed !== false) ?? null
}

// How long a logged session took, in minutes: logged_at to completed_at. null unless both
// are there and the result is sensible (1 to 240 minutes).
export function sessionMinutes(log) {
  if (!log?.logged_at || !log?.completed_at) return null
  const m = Math.round((new Date(log.completed_at).getTime() - new Date(log.logged_at).getTime()) / 60000)
  return m >= 1 && m <= 240 ? m : null
}

// The planned size of a session: "6 exercises · about 45 min" (short: "6 exercises · 45 min").
export function plannedLine(exercises, short) {
  const mins = estMinutes(exercises)
  return [exercises?.length ? plural(exercises.length, 'exercise') : null, mins ? `${short ? '' : 'about '}${mins} min` : null].filter(Boolean).join(' · ')
}

// The status line under a scheduled session: "Completed · 6 exercises · 48 min" when done
// (minutes only when the log has a sensible length), "Not logged yet" for a past day, else null.
export function sessionStatusLine(sw, { completedIds, workoutLogs, exMap, today = toLocalDateStr() }) {
  if (isDone(sw, completedIds)) {
    const count = sessionExercises(sw, exMap).length
    const mins = sessionMinutes(sessionLog(sw, workoutLogs))
    return ['Completed', count ? plural(count, 'exercise') : null, mins ? `${mins} min` : null].filter(Boolean).join(' · ')
  }
  return sw.scheduled_date < today ? 'Not logged yet' : null
}

// This week (Monday to Sunday): sessions scheduled and sessions done.
export function sessionsThisWeek(scheduledWorkouts, completedIds, today = toLocalDateStr()) {
  const inWeek = sessionsInWeek(scheduledWorkouts, mondayOf(today))
  return { scheduled: inWeek.length, done: inWeek.filter((sw) => isDone(sw, completedIds)).length }
}

// Next scheduled session after today that is not done yet.
export function nextSession(scheduledWorkouts, completedIds, today = toLocalDateStr()) {
  return (scheduledWorkouts ?? [])
    .filter((sw) => sw.scheduled_date > today && !isDone(sw, completedIds))
    .sort((a, b) => (a.scheduled_date < b.scheduled_date ? -1 : 1))[0] ?? null
}

function sessionDays(workoutLogs) {
  return (workoutLogs ?? []).filter((l) => l.completed !== false && l.logged_at).map((l) => toLocalDateStr(new Date(l.logged_at)))
}

// Streak = weeks in a row with at least one session. The current week counts once it has
// a session, and does not break the streak while it is still in progress.
export function weekStreak(workoutLogs, today = toLocalDateStr()) {
  const weeks = new Set(sessionDays(workoutLogs).map(mondayOf))
  let week = mondayOf(today)
  if (!weeks.has(week)) week = addDays(week, -7)
  let streak = 0
  while (weeks.has(week)) {
    streak++
    week = addDays(week, -7)
  }
  return streak
}

export function bestWeekStreak(workoutLogs) {
  const weeks = [...new Set(sessionDays(workoutLogs).map(mondayOf))].sort()
  let best = 0
  let run = 0
  weeks.forEach((w, i) => {
    run = i > 0 && addDays(weeks[i - 1], 7) === w ? run + 1 : 1
    best = Math.max(best, run)
  })
  return best
}

export function sessionsThisMonth(workoutLogs, today = toLocalDateStr()) {
  const month = today.slice(0, 7)
  return sessionDays(workoutLogs).filter((d) => d.slice(0, 7) === month).length
}

/* ---------- Check-ins ---------- */

// A check-in is due 7 calendar days after the last one (or straight away if there is
// none). Counted in whole local days, so it ticks over at midnight, not 24 hours later.
export function checkinStatus(checkins, today = toLocalDateStr()) {
  const latest = checkins?.[0] ?? null
  const lastDay = latest ? toLocalDateStr(new Date(latest.submitted_at)) : null
  const daysSince = lastDay ? daysBetween(lastDay, today) : null
  const nextDate = lastDay ? addDays(lastDay, 7) : null
  const due = !latest || daysSince >= 7
  const daysToNext = due ? 0 : 7 - daysSince
  const lastReply = (checkins ?? []).find((c) => c.coach_reply) ?? null
  return { latest, daysSince, due, daysToNext, nextDate, lastReply }
}

/* ---------- Body weight ---------- */

const kg = (w) => parseFloat(w.weight_kg)
const newer = (a, b) => String(a.created_at ?? '') > String(b.created_at ?? '')

// One weigh-in per day: when a day has more than one row, the latest created_at wins.
// Oldest day first.
function dailyWeights(weightLogs) {
  const byDay = {}
  for (const w of weightLogs ?? []) {
    if (isNaN(kg(w)) || !w.logged_date) continue
    const cur = byDay[w.logged_date]
    if (!cur || newer(w, cur)) byDay[w.logged_date] = w
  }
  return Object.values(byDay).sort((a, b) => (a.logged_date < b.logged_date ? -1 : 1))
}

// The weigh-in that counts for one day (latest created_at), or null.
export function weightForDay(weightLogs, dateStr) {
  return dailyWeights(weightLogs).find((w) => w.logged_date === dateStr) ?? null
}

// Oldest first, each point with its 7-day rolling average (that day and the six before).
export function weightSeries(weightLogs) {
  const asc = dailyWeights(weightLogs)
  return asc.map((w) => {
    const from = addDays(w.logged_date, -6)
    const window = asc.filter((x) => x.logged_date >= from && x.logged_date <= w.logged_date)
    const avg = window.reduce((s, x) => s + kg(x), 0) / window.length
    return { date: w.logged_date, weight: kg(w), avg: Math.round(avg * 10) / 10 }
  })
}

export function currentWeight(weightLogs) {
  const s = weightSeries(weightLogs)
  return s.length ? s[s.length - 1].weight : null
}

// Average of the weigh-ins in the 7 days ending today, or null when there are none.
export function weightAverage7(weightLogs, today = toLocalDateStr()) {
  const from = addDays(today, -6)
  const recent = dailyWeights(weightLogs).filter((w) => w.logged_date >= from && w.logged_date <= today)
  if (!recent.length) return null
  return Math.round((recent.reduce((s, w) => s + kg(w), 0) / recent.length) * 10) / 10
}

/* ---------- Food ---------- */

export function logsForDate(foodLogs, dateStr) {
  return (foodLogs ?? []).filter((f) => f.logged_at && toLocalDateStr(new Date(f.logged_at)) === dateStr)
}

export function foodTotals(logs) {
  const sum = (k) => Math.round((logs ?? []).reduce((s, f) => s + (parseFloat(f[k]) || 0), 0))
  return { kcal: sum('calories'), protein: sum('protein_g'), carbs: sum('carbs_g'), fats: sum('fats_g') }
}

export function nutritionTargetsFor(client, targets) {
  return {
    kcal: targets?.calories || client?.calorie_target || 0,
    protein: targets?.protein || client?.protein_target_g || 0,
    carbs: targets?.carbs || client?.carbs_target_g || 0,
    fats: targets?.fats || client?.fats_target_g || 0,
  }
}

/* ---------- Strength ---------- */

// Per lift: heaviest weight lifted (from set logs) and estimated 1RM (from personal bests).
export function liftBests(setRows, personalBests) {
  const map = {}
  for (const s of setRows ?? []) {
    const w = parseFloat(s.weight_kg) || 0
    if (!s.exercise_id || w <= 0) continue
    const m = (map[s.exercise_id] ||= { exerciseId: s.exercise_id, name: s.exercises?.name || 'Exercise', bestKg: 0, e1rm: 0 })
    if (w > m.bestKg) m.bestKg = w
  }
  for (const pb of personalBests ?? []) {
    if (pb.pb_type !== '1rm' || !pb.exercise_id) continue
    const m = (map[pb.exercise_id] ||= { exerciseId: pb.exercise_id, name: pb.exercises?.name || 'Exercise', bestKg: 0, e1rm: 0 })
    m.e1rm = Math.max(m.e1rm, parseFloat(pb.value) || 0)
    if (pb.exercises?.name) m.name = pb.exercises.name
  }
  return Object.values(map).sort((a, b) => (b.e1rm || b.bestKg) - (a.e1rm || a.bestKg))
}

// Most recent estimated-1RM best set in the last `days` days, or null.
export function latestPB(personalBests, days = 14, today = toLocalDateStr()) {
  const from = addDays(today, -days)
  return (personalBests ?? [])
    .filter((pb) => pb.pb_type === '1rm' && pb.achieved_at && toLocalDateStr(new Date(pb.achieved_at)) >= from)
    .sort((a, b) => (a.achieved_at < b.achieved_at ? 1 : -1))[0] ?? null
}

export const fmtKg = (n) => (n == null ? '' : `${Math.round(n * 10) / 10}`)

/* ---------- This week (the Home ring) ---------- */

// Days with food logged that make a full week: 5, so the ring can close without
// logging every single day.
export const FOOD_DAYS_GOAL = 5

// This week's three commitments (Monday to Sunday, local days), each 0..1:
//   sessions: scheduled sessions this week that are done (left out when none are scheduled)
//   checkin:  a check-in sent this week (Monday onwards)
//   food:     days this week with any food logged, up to FOOD_DAYS_GOAL
// Returns { parts: [{ key, value, done, label, hint }], complete, started }.
export function weekCommitments({ scheduledWorkouts, completedIds, checkins, foodLogs, today = toLocalDateStr() }) {
  const days = weekDays(today)
  const parts = []

  const s = sessionsThisWeek(scheduledWorkouts, completedIds, today)
  if (s.scheduled > 0) {
    const done = Math.min(s.done, s.scheduled)
    parts.push({ key: 'sessions', value: done / s.scheduled, done: done >= s.scheduled, label: `${done} of ${plural(s.scheduled, 'session')}` })
  }

  const ci = checkinStatus(checkins, today)
  const sent = !!ci.latest && toLocalDateStr(new Date(ci.latest.submitted_at)) >= days[0]
  parts.push({
    key: 'checkin',
    value: sent ? 1 : 0,
    done: sent,
    label: sent ? 'Check-in sent' : 'Check-in',
    hint: sent ? null : ci.due || !ci.nextDate || ci.nextDate <= today ? 'Due today' : `Due ${weekdayName(ci.nextDate)}`,
  })

  const foodDays = Math.min(days.filter((d) => d <= today && logsForDate(foodLogs, d).length > 0).length, FOOD_DAYS_GOAL)
  parts.push({ key: 'food', value: foodDays / FOOD_DAYS_GOAL, done: foodDays >= FOOD_DAYS_GOAL, label: `${foodDays} of ${FOOD_DAYS_GOAL} days logged` })

  return { parts, complete: parts.every((p) => p.done), started: parts.some((p) => p.value > 0) }
}

/* ---------- Programs ---------- */

// Program length in weeks, read from its name or description ("4-Week Beginner
// Strength", "12 week full body build"). null when neither says.
export function programWeeks(program) {
  const m = `${program?.name ?? ''} ${program?.description ?? ''}`.match(/(\d{1,2})\s*-?\s*weeks?\b/i)
  const n = m ? parseInt(m[1], 10) : 0
  return n > 0 && n <= 52 ? n : null
}

// Where the client is in their active program: week (of weeks, when known), sessions a
// week, and sessions done since it started out of the sessions in it (total is the
// program length when known, otherwise the sessions scheduled since the start), plus its
// start and end days (end only when the length is known).
export function programProgress({ assignment, programWorkouts, scheduledWorkouts, workoutLogs, today = toLocalDateStr() }) {
  const perWeek = programWorkouts?.length ?? 0
  const weeks = programWeeks(assignment?.programs)
  const start = assignment?.start_date || null
  const ids = new Set((programWorkouts ?? []).map((pw) => pw.id))
  const since = (d) => !start || d >= start
  const rawWeek = start ? Math.max(1, Math.floor(daysBetween(start, today) / 7) + 1) : null
  const done = (workoutLogs ?? []).filter((l) => ids.has(l.program_workout_id) && l.logged_at && since(toLocalDateStr(new Date(l.logged_at)))).length
  const total = weeks ? weeks * perWeek : (scheduledWorkouts ?? []).filter((sw) => ids.has(sw.program_workout_id) && since(sw.scheduled_date)).length
  const end = start && weeks ? addDays(start, weeks * 7 - 1) : null
  return { perWeek, weeks, week: weeks && rawWeek ? Math.min(rawWeek, weeks) : rawWeek, done: total ? Math.min(done, total) : done, total, start, end }
}

// Muscle groups worked by a list of exercise rows, in order, no repeats.
export function muscleGroups(exercises) {
  return [...new Set((exercises ?? []).map((ex) => ex.exercises?.muscle_group || ex.muscle_group).filter(Boolean))]
}

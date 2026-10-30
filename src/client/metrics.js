// One source of truth for every number the client sees. If a number appears on more
// than one screen, it is worked out here so the screens always agree.
import { toLocalDateStr, mondayOf, addDays, weekDays, daysBetween } from './dates'
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

// This week (Monday to Sunday): sessions scheduled and sessions done.
export function sessionsThisWeek(scheduledWorkouts, completedIds, today = toLocalDateStr()) {
  const days = new Set(weekDays(today))
  const inWeek = (scheduledWorkouts ?? []).filter((sw) => days.has(sw.scheduled_date))
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

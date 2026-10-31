// Shared coach-side helpers. Any number shown on more than one coach screen (status,
// sessions this month, check-ins this week) is worked out here, so screens agree.

// Day logic is always local time (Adelaide), never toISOString().
export function toLocalDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// The local calendar day of a stored value. Plain dates ("2026-10-30") are already a day.
export function dayOf(value) {
  if (!value) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return toLocalDateStr(new Date(value))
}

function dayToDate(day) {
  return new Date(day + 'T00:00:00')
}

// Whole calendar days between a stored value and today. 0 = today.
export function daysSince(value) {
  const d = dayOf(value)
  if (!d) return null
  return Math.round((dayToDate(toLocalDateStr()) - dayToDate(d)) / 86400000)
}

export function relativeDay(value) {
  const n = daysSince(value)
  if (n === null) return 'Never'
  if (n <= 0) return 'Today'
  if (n === 1) return 'Yesterday'
  if (n < 14) return `${n} days ago`
  if (n < 60) return `${Math.floor(n / 7)} weeks ago`
  return `${Math.floor(n / 30)} months ago`
}

export function formatDate(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return ''
  const d = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? dayToDate(value) : new Date(value)
  return d.toLocaleDateString('en-AU', opts)
}

export function startOfWeekStr(date = new Date()) {
  const d = new Date(date)
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return toLocalDateStr(d)
}

export function addDays(dayStr, n) {
  const d = dayToDate(dayStr)
  d.setDate(d.getDate() + n)
  return toLocalDateStr(d)
}

/* ---------- Client status: one rule for the dashboard and the profile ---------- */
export function clientStatus(lastCheckin) {
  if (!lastCheckin) return 'New'
  const days = daysSince(lastCheckin)
  if (days >= 14) return 'At Risk'
  if (days >= 7) return 'Drifting'
  return 'Engaged'
}

export const STATUS = {
  Engaged: { tone: 'accent', label: 'Engaged' },
  Drifting: { tone: 'warn', label: 'Drifting' },
  'At Risk': { tone: 'bad', label: 'At risk' },
  New: { tone: 'neutral', label: 'No check-ins' },
}

/* ---------- Counts ---------- */
export function sessionsThisMonth(workoutLogs) {
  const month = toLocalDateStr().slice(0, 7)
  return (workoutLogs ?? []).filter((w) => w.completed && dayOf(w.logged_at)?.slice(0, 7) === month).length
}

export function checkinsThisWeek(checkins) {
  const start = startOfWeekStr()
  return (checkins ?? []).filter((c) => dayOf(c.submitted_at) >= start).length
}

// The client's words from a check-in. The app writes `blocker`; older rows used `notes`.
const EMPTY_NOTE = ['none', 'n/a', 'na', 'nil', 'no', '-', 'nothing']
export function checkinNote(ci) {
  const text = (ci?.blocker || ci?.notes || '').trim()
  return text && !EMPTY_NOTE.includes(text.toLowerCase()) ? text : ''
}

// True when the client started this program themselves from the on-demand library,
// rather than the coach assigning it. Used by the profile header and the Training tab.
export function startedByClient(assignment, client) {
  return !!assignment?.assigned_by && !!client?.user_id && assignment.assigned_by === client.user_id
}

export function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || name
}

export function formatMl(ml) {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)} L` : `${ml} ml`
}

// Food and water totals for one local day. Used by the profile Overview and Nutrition tabs.
export function dayNutrition(foodLogs, waterLogs, day = toLocalDateStr()) {
  const food = (foodLogs ?? []).filter((f) => dayOf(f.logged_at) === day)
  const sum = (k) => Math.round(food.reduce((s, l) => s + (parseFloat(l[k]) || 0), 0))
  const water = (waterLogs ?? []).filter((w) => w.logged_date === day)
  return {
    food,
    water,
    calories: sum('calories'),
    protein: sum('protein_g'),
    carbs: sum('carbs_g'),
    fats: sum('fats_g'),
    waterMl: water.reduce((s, w) => s + (w.amount_ml || 0), 0),
  }
}

// Seven-day rolling average of body weight, one value per log (logs sorted oldest first).
export function weightAverages(logs) {
  return logs.map((w) => {
    const from = addDays(w.logged_date, -6)
    const win = logs.filter((x) => x.logged_date >= from && x.logged_date <= w.logged_date)
    return Math.round((win.reduce((s, x) => s + parseFloat(x.weight_kg), 0) / win.length) * 10) / 10
  })
}

/* ---------- Messages ---------- */
// Total unread messages from fetchUnreadCounts. The nav badge and the dashboard both use it.
export function totalUnread(counts) {
  return Object.values(counts ?? {}).reduce((s, n) => s + n, 0)
}

// Short time for a message list: "9:41 am" today, "Yesterday", "Mon" this week, else "12 Oct".
export function messageTime(value) {
  if (!value) return ''
  const n = daysSince(value)
  if (n <= 0) return new Date(value).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
  if (n === 1) return 'Yesterday'
  if (n < 7) return formatDate(value, { weekday: 'short' })
  return formatDate(value, { day: 'numeric', month: 'short' })
}

// Clock time of one message, "9:41 am".
export function clockTime(value) {
  return value ? new Date(value).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }) : ''
}

// Day separator label inside a thread.
export function messageDayLabel(value) {
  const n = daysSince(value)
  if (n <= 0) return 'Today'
  if (n === 1) return 'Yesterday'
  return formatDate(value, n < 300 ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' })
}

/* ---------- Daily check-ins (energy, sleep, soreness, 1 to 5) ---------- */
export const DAILY_SCORES = [
  { key: 'energy', label: 'Energy' },
  { key: 'sleep', label: 'Sleep' },
  // Assumed: 5 = very sore, so a high soreness score is graded like a low energy score.
  { key: 'soreness', label: 'Soreness', invert: true },
]

// Token classes for a 1 to 5 score. Higher is better unless invert.
const SCORE_TONE = {
  1: 'bg-bad-soft text-bad',
  2: 'bg-warn-soft text-warn',
  3: 'bg-surface-2 text-ink',
  4: 'bg-accent-soft text-accent',
  5: 'bg-accent text-on-accent',
}
export function scoreTone(value, invert = false) {
  if (value == null) return ''
  const v = Math.max(1, Math.min(5, Math.round(value)))
  return SCORE_TONE[invert ? 6 - v : v]
}

// The last n local days, oldest first, as "YYYY-MM-DD".
export function lastDays(n, today = toLocalDateStr()) {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)))
}

// A gentle flag when energy or sleep is 2 or lower on 3 of the last 4 days.
// Returns e.g. "Sleep has been low this week", or null.
export function feelingFlag(daily, today = toLocalDateStr()) {
  const days = new Set(lastDays(4, today))
  const recent = (daily ?? []).filter((d) => days.has(d.checkin_date))
  const low = ['energy', 'sleep'].filter((k) => recent.filter((d) => d[k] != null && d[k] <= 2).length >= 3)
  if (low.length === 2) return 'Energy and sleep have been low this week'
  if (low[0] === 'energy') return 'Energy has been low this week'
  if (low[0] === 'sleep') return 'Sleep has been low this week'
  return null
}

/* ---------- Session rating (workout_logs.session_rating, 1 to 5) ---------- */
const RATING_LABEL = { 1: 'Very easy', 2: 'Easy', 3: 'Moderate', 4: 'Hard', 5: 'Very hard' }
export function sessionFelt(rating) {
  return rating ? `Felt: ${RATING_LABEL[rating] ?? ''} ${rating}/5` : ''
}

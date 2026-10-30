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

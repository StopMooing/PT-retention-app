// Shared coach-side helpers. Any number shown on more than one coach screen (status,
// sessions, check-ins this week) is worked out here, so screens agree.

import { logsForDate, foodTotals } from '../client/metrics'

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
// Showing up counts, not just the weekly check-in: the latest check-in OR finished
// session is their last activity.
//   New       nothing yet
//   At Risk   nothing for 14+ days
//   Drifting  nothing for 7+ days, or the last 2 planned sessions were both missed
//   Engaged   otherwise
// Sessions put on a day that had already passed (a backdated start) are never "missed".
export function lastActivity({ lastCheckIn, workoutLogs }) {
  const days = [dayOf(lastCheckIn), ...(workoutLogs ?? []).filter((w) => w.completed).map((w) => dayOf(w.logged_at))].filter(Boolean)
  return days.length ? days.sort().at(-1) : null
}

export function missedInARow({ scheduledWorkouts, workoutLogs, today = toLocalDateStr() }) {
  const done = new Set((workoutLogs ?? []).filter((w) => w.completed && w.scheduled_workout_id).map((w) => w.scheduled_workout_id))
  const past = (scheduledWorkouts ?? [])
    .filter((sw) => sw.scheduled_date < today && sw.scheduled_date >= addDays(today, -14))
    .filter((sw) => done.has(sw.id) || !sw.created_at || dayOf(sw.created_at) <= sw.scheduled_date)
    .sort((a, b) => (a.scheduled_date < b.scheduled_date ? 1 : -1))
  let n = 0
  for (const sw of past) { if (done.has(sw.id)) break; n++ }
  return n
}

export function clientStatus({ lastCheckIn, workoutLogs, scheduledWorkouts } = {}) {
  const last = lastActivity({ lastCheckIn, workoutLogs })
  if (!last) return 'New'
  const days = daysSince(last)
  if (days >= 14) return 'At Risk'
  if (days >= 7) return 'Drifting'
  if (missedInARow({ scheduledWorkouts, workoutLogs }) >= 2) return 'Drifting'
  return 'Engaged'
}

// Finished sessions in the last 7 days: the same function the client app uses.
export { sessionsLast7 } from '../client/metrics'

export const STATUS = {
  Engaged: { tone: 'accent', label: 'Engaged' },
  Drifting: { tone: 'warn', label: 'Drifting' },
  'At Risk': { tone: 'bad', label: 'At risk' },
  New: { tone: 'neutral', label: 'New' },
}

/* ---------- Nudges: helping a slipping client back ---------- */
// Why a client is slipping, in one line, and which ready-made messages fit. The
// dashboard and the profile both use this, so the reason reads the same everywhere.
//   missed  planned sessions not logged, but they were around this week
//   quiet   nothing for 7 to 13 days
//   away    nothing for 14+ days
//   general everyone else (a group message, a shout-out)
export function nudgeKind({ status, lastActive, missed }) {
  if (status === 'At Risk') return 'away'
  if (status === 'Drifting') return missed >= 2 && daysSince(lastActive) < 7 ? 'missed' : 'quiet'
  return 'general'
}

export function nudgeReason({ status, lastActive, missed }) {
  const kind = nudgeKind({ status, lastActive, missed })
  if (kind === 'missed') return `Last ${missed} planned sessions not logged`
  if (kind === 'quiet' || kind === 'away') return lastActive ? `Last active ${relativeDay(lastActive).toLowerCase()}` : 'Not active yet'
  return null
}

// {first name} is swapped for each client's first name when it is sent.
export const NAME_TOKEN = '{first name}'
export const NUDGES = {
  missed: [
    { label: 'Move the days', body: "Hey {first name}, noticed the last couple of sessions didn't happen. No stress, life gets busy. Want me to move this week's sessions to days that suit you better?" },
    { label: 'Check the plan fits', body: 'Hey {first name}, quick one: are your session days still working for you? Happy to shuffle things around so it fits your week.' },
    { label: 'Lock in one', body: 'Hey {first name}, even one session this week keeps the momentum going. Which day can you lock in?' },
  ],
  quiet: [
    { label: 'Simple check-in', body: "Hey {first name}, haven't heard from you this week. How are you going?" },
    { label: 'Offer something short', body: "Hey {first name}, how's the week treating you? Even a short session counts. Want me to set up something quick for you?" },
    { label: 'Ask what is in the way', body: 'Hey {first name}, checking in. Is anything getting in the way that I can help with?' },
  ],
  away: [
    { label: 'Easy restart', body: "Hey {first name}, it's been a little while and I just wanted to check in. No pressure at all. Want to start back with something short and easy this week?" },
    { label: 'Lighter week', body: "Hey {first name}, I've been thinking about your goal. I can set up a lighter week to ease you back into it. Keen?" },
    { label: 'Door is open', body: "Hey {first name}, life happens. Whenever you're ready, I'm here and your program is ready to go." },
  ],
  general: [
    { label: 'Check-in reminder', body: 'Hey {first name}, quick reminder to send your weekly check-in. I read every one.' },
    { label: 'Shout-out', body: "Hey {first name}, proud of the work you've been putting in. Keep it rolling this week." },
    { label: 'How are you going', body: 'Hey {first name}, how are you feeling about training at the moment? Anything you want to change?' },
  ],
}

export function personalise(body, fullName) {
  return body.split(NAME_TOKEN).join(firstName(fullName) || 'there')
}

// When the coach last reached out with no reply since: the coach's latest message is
// newer than anything the client did. Returns that message's time, or null.
export function nudgedAt(latestMessage, coachId, lastActive) {
  if (!latestMessage || latestMessage.sender_id !== coachId) return null
  if (lastActive && dayOf(latestMessage.created_at) < lastActive) return null
  return latestMessage.created_at
}

/* ---------- Counts ---------- */
// Same functions the client app uses, so coach and client see the same numbers.
export { sessionsThisMonth, sessionsThisWeek, completedKeys } from '../client/metrics'

// The check-in owed a reply: the client's latest one, if it has no reply yet. A newer
// check-in replaces older ones. Dashboard, profile badge and Overview all use this.
export function awaitingReply(checkins) {
  const latest = (checkins ?? []).reduce((a, c) => (!a || c.submitted_at > a.submitted_at ? c : a), null)
  return latest && !latest.coach_reply ? latest : null
}

export function checkinsThisWeek(checkins) {
  const start = startOfWeekStr()
  return (checkins ?? []).filter((c) => dayOf(c.submitted_at) >= start).length
}

// The client's words from a check-in (shared with the chat, so both agree).
export { checkinNote } from '../lib/messages'

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
// The food part is the client app's own logsForDate and foodTotals, so both sides agree.
export function dayNutrition(foodLogs, waterLogs, day = toLocalDateStr()) {
  const food = logsForDate(foodLogs, day)
  const t = foodTotals(food)
  const water = (waterLogs ?? []).filter((w) => w.logged_date === day)
  return {
    food,
    water,
    calories: t.kcal,
    protein: t.protein,
    carbs: t.carbs,
    fats: t.fats,
    waterMl: water.reduce((s, w) => s + (w.amount_ml || 0), 0),
  }
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
const RATING_LABEL = { 1: 'Easy', 2: 'Steady', 3: 'Solid', 4: 'Hard', 5: 'All out' } // same words as the client's completion screen
export function sessionFelt(rating) {
  return rating ? `Felt: ${RATING_LABEL[rating] ?? ''} ${rating}/5` : ''
}

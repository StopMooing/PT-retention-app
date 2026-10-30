// Day logic for the client app. Adelaide is UTC+10:30 / +9:30, so a "day" is always the
// phone's local calendar day. Use toLocalDateStr() for every day comparison, never
// toISOString() (that gives the UTC day, which is wrong for half the morning here).

export function toLocalDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 'YYYY-MM-DD' to a local Date at midnight.
export function parseDay(dateStr) {
  return new Date(dateStr + 'T00:00:00')
}

export function addDays(dateStr, n) {
  const d = parseDay(dateStr)
  d.setDate(d.getDate() + n)
  return toLocalDateStr(d)
}

// Monday of the week that dateStr falls in, as 'YYYY-MM-DD'.
export function mondayOf(dateStr) {
  const d = parseDay(dateStr)
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return toLocalDateStr(d)
}

// Seven 'YYYY-MM-DD' strings, Monday to Sunday, for the week containing dateStr.
export function weekDays(dateStr) {
  const mon = mondayOf(dateStr)
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i))
}

export function getGreeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatDateLabel(dateStr) {
  const today = toLocalDateStr()
  if (dateStr === today) return 'Today'
  if (dateStr === addDays(today, 1)) return 'Tomorrow'
  if (dateStr === addDays(today, -1)) return 'Yesterday'
  return parseDay(dateStr).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatShortDate(dateStr) {
  return parseDay(dateStr).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function weekdayName(dateStr) {
  return parseDay(dateStr).toLocaleDateString('en-AU', { weekday: 'long' })
}

export function isToday(dateStr) {
  return dateStr === toLocalDateStr()
}

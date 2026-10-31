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

// Whole calendar days from one 'YYYY-MM-DD' to another (b minus a). Rounded, so a
// daylight saving change in between does not knock it off by one.
export function daysBetween(a, b) {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86400000)
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

// "26 Oct".
export function dayMonth(dateStr) {
  return parseDay(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

// "Yesterday", "Today", "Tomorrow", else "Monday 2 Nov".
export function shortDayLabel(dateStr, today = toLocalDateStr()) {
  if (dateStr === today) return 'Today'
  if (dateStr === addDays(today, 1)) return 'Tomorrow'
  if (dateStr === addDays(today, -1)) return 'Yesterday'
  return `${weekdayName(dateStr)} ${dayMonth(dateStr)}`
}

// A Monday-to-Sunday week by its Monday: "This week", "Last week", "Next week", else
// "26 Oct to 1 Nov".
export function weekLabel(monday, today = toLocalDateStr()) {
  const diff = daysBetween(mondayOf(today), monday) / 7
  if (diff === 0) return 'This week'
  if (diff === -1) return 'Last week'
  if (diff === 1) return 'Next week'
  return `${dayMonth(monday)} to ${dayMonth(addDays(monday, 6))}`
}

// "Today", "Yesterday", else "Mon 26 Oct". Day separators in the message thread.
export function chatDayLabel(dateStr, today = toLocalDateStr()) {
  if (dateStr === today) return 'Today'
  if (dateStr === addDays(today, -1)) return 'Yesterday'
  return `${parseDay(dateStr).toLocaleDateString('en-AU', { weekday: 'short' })} ${dayMonth(dateStr)}`
}

// "9:15 am".
export function clockTime(date) {
  return new Date(date).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
}

export function weekdayName(dateStr) {
  return parseDay(dateStr).toLocaleDateString('en-AU', { weekday: 'long' })
}

export function isToday(dateStr) {
  return dateStr === toLocalDateStr()
}

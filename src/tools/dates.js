// Local calendar dates as YYYY-MM-DD. Never toISOString(): that is UTC, and in Adelaide
// (UTC+10:30 / +9:30) it gives yesterday's date every morning. Same logic as
// toLocalDateStr() in ClientApp.jsx.
export function toLocalDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function daysAgoStr(n, from = new Date()) {
  const d = new Date(from)
  d.setDate(d.getDate() - n)
  return toLocalDateStr(d)
}

function prevDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  return toLocalDateStr(d)
}

// Current run of completed days ending today. logs: habit_logs rows.
export function habitStreak(logs, habitId, today = toLocalDateStr()) {
  const dates = logs
    .filter((l) => l.habit_id === habitId && l.completed)
    .map((l) => l.completed_date)
    .sort()
    .reverse()
  let streak = 0
  let check = today
  for (const date of dates) {
    if (date === check) {
      streak++
      check = prevDay(check)
    } else if (date < check) break
  }
  return streak
}

// Longest run of consecutive completed days in the logs given.
export function habitBestStreak(logs, habitId) {
  const dates = [...new Set(logs.filter((l) => l.habit_id === habitId && l.completed).map((l) => l.completed_date))].sort()
  if (dates.length === 0) return 0
  let best = 1
  let current = 1
  for (let i = 1; i < dates.length; i++) {
    if (prevDay(dates[i]) === dates[i - 1]) {
      current++
      if (current > best) best = current
    } else current = 1
  }
  return best
}

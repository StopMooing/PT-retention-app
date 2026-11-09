// The in-app notification list (the bell). Messages and reminders go to the phone only:
// messages already have their own badge, and reminders are about today, so they are not
// kept in the list.
import { supabase } from '../supabase'

const PHONE_ONLY = ['message', 'workout_reminder', 'checkin_reminder', 'daily_summary']
const COLS = 'id, kind, title, body, link, created_at, read_at'

export async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select(COLS)
    .not('kind', 'in', `(${PHONE_ONLY.join(',')})`)
    .order('created_at', { ascending: false })
    .limit(40)
  if (error) { console.error('Notifications load error:', error); return [] }
  return data ?? []
}

export async function markAllRead(ids) {
  if (!ids.length) return
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids)
  if (error) console.error('Mark notifications read error:', error)
}

// Turns a stored link into somewhere to go inside the app: { path, tab } for the client
// app (it lives at /my-workout with tabs), or { path } for the coach.
export function linkTarget(link) {
  if (!link) return null
  const url = new URL(link, window.location.origin)
  return { path: url.pathname, tab: url.searchParams.get('tab') }
}

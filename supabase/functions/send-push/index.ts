// Delivers one notification to every phone or browser its person turned notifications on
// for. Called by the database (private.push_notification, through pg_net) with the
// notification id and the shared x-push-secret header; the keys come from the vault through
// public.push_config(), which only the service role can read. Devices that the push service
// says are gone (404 or 410) are removed.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

// Which setting turns each kind of notification off. No settings row means all on.
const SETTING: Record<string, string> = {
  reply: 'coach_updates', program: 'coach_updates', mealplan: 'coach_updates', habit: 'coach_updates',
  message: 'messages',
  workout_reminder: 'workout_reminders', checkin_reminder: 'checkin_reminders',
  checkin: 'client_activity', session: 'client_activity',
  daily_summary: 'daily_summary',
}

let config: Record<string, string> | null = null
async function loadConfig() {
  if (config) return config
  const { data, error } = await db.rpc('push_config')
  if (error || !data?.vapid_private) throw new Error('push keys missing')
  config = data
  webpush.setVapidDetails('https://unfnshd.app', data.vapid_public, data.vapid_private)
  return config
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  let cfg
  try { cfg = await loadConfig() } catch (e) { console.error(e); return json({ error: 'not set up' }, 503) }
  if (req.headers.get('x-push-secret') !== cfg.push_hook_secret) return json({ error: 'forbidden' }, 403)

  const { id } = await req.json().catch(() => ({}))
  if (!id) return json({ error: 'id' }, 400)
  const { data: n } = await db.from('notifications').select('*').eq('id', id).maybeSingle()
  if (!n) return json({ skipped: 'missing' })

  const { data: settings } = await db.from('notification_settings').select('*').eq('user_id', n.user_id).maybeSingle()
  const key = SETTING[n.kind]
  if (key && settings && settings[key] === false) return json({ skipped: 'turned off' })

  const { data: subs } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', n.user_id)
  const payload = JSON.stringify({ title: n.title, body: n.body ?? '', url: n.link ?? '/', tag: `${n.kind}:${n.dedupe_key ?? n.id}` })
  let sent = 0
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 12, urgency: 'normal' })
      sent++
      await db.from('push_subscriptions').update({ last_used_at: new Date().toISOString() }).eq('id', s.id)
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('id', s.id)
      else console.error('push failed', code, (e as { body?: string }).body)
    }
  }
  return json({ sent })
})

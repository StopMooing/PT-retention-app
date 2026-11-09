// Phone notifications (web push). A device turns them on once: the browser asks permission,
// we save its push address in push_subscriptions, and the send-push function delivers to
// it. On iPhone this only works once the app is added to the Home Screen (iOS 16.4 or later).
import { supabase } from '../supabase'

// Public half of the key pair. The private half is in the Supabase vault.
export const VAPID_PUBLIC = 'BFw-HOB0gql0NPp0kgqONgKblbZmZjylFUvCBQJsU-1GKKfLQJCOFShK0MDDe4iOBcNCV3ZHoK4BOwCFEl3j4m4'

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isInstalled = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return
  navigator.serviceWorker.register('/sw.js').catch((e) => console.error('Service worker error:', e))
}

// 'needs-install' (iPhone in Safari), 'unsupported', 'denied', 'off' or 'on'.
export async function pushState() {
  if (isIos() && !isInstalled()) return 'needs-install'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub ? 'on' : 'off'
}

function keyBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

// Asks permission and saves this device. Returns the new state, or { error }.
export async function enablePush() {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return { state: permission === 'denied' ? 'denied' : 'off' }
    const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register('/sw.js'))
    await navigator.serviceWorker.ready
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC) }))
    const j = sub.toJSON()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent.slice(0, 400),
    }, { onConflict: 'endpoint' })
    if (error) throw error
    // Their time zone, so reminders come at 7 am where they are.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Adelaide'
    await supabase.from('notification_settings').upsert({ user_id: user.id, tz }, { onConflict: 'user_id' })
    return { state: 'on' }
  } catch (e) {
    console.error('Turn on notifications error:', e)
    return { error: e }
  }
}

export async function disablePush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      await sub.unsubscribe()
    }
    return { state: 'off' }
  } catch (e) {
    console.error('Turn off notifications error:', e)
    return { error: e }
  }
}

// Which kinds of notification are on. Missing row means all on.
export const DEFAULT_SETTINGS = { workout_reminders: true, checkin_reminders: true, coach_updates: true, messages: true, client_activity: true, daily_summary: true }

export async function fetchSettings() {
  const { data } = await supabase.from('notification_settings').select('*').maybeSingle()
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) }
}

export async function saveSetting(key, value) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('notification_settings').upsert({ user_id: user.id, [key]: value, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  return { error }
}

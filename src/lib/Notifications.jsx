// The bell, the list behind it, and the notification settings (phone on or off, and which
// kinds). Shared by the client app (role "client") and the coach (role "coach").
import { useCallback, useEffect, useState } from 'react'
import { Bell, BellRing, Settings2, ChevronLeft, ChevronRight, Smartphone, Share, PlusSquare } from 'lucide-react'
import { Sheet, Button } from '../ui'
import { fetchNotifications, markAllRead, linkTarget } from './notifications'
import { pushState, enablePush, disablePush, fetchSettings, saveSetting } from './push'

const KINDS = {
  client: [
    { key: 'workout_reminders', label: 'Workout reminders', hint: '7 am on days with a session planned' },
    { key: 'checkin_reminders', label: 'Check-in reminders', hint: '6 pm when your weekly check-in is due' },
    { key: 'coach_updates', label: 'From your coach', hint: 'Replies, new programs, meal plans and habits' },
    { key: 'messages', label: 'Messages', hint: 'When your coach messages you' },
  ],
  coach: [
    { key: 'client_activity', label: 'Client activity', hint: 'Check-ins and finished sessions' },
    { key: 'messages', label: 'Messages', hint: 'When a client messages you' },
    { key: 'daily_summary', label: 'Morning summary', hint: '8 am: check-ins and messages waiting' },
  ],
}

function ago(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const h = Math.round(mins / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  return d === 1 ? 'Yesterday' : `${d} days ago`
}

function Toggle({ on, onChange, label, hint, disabled }) {
  return (
    <button onClick={() => onChange(!on)} disabled={disabled} aria-pressed={on} className="w-full flex items-center gap-3 py-3 text-left disabled:opacity-50">
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-ink">{label}</span>
        {hint && <span className="block text-[13px] text-muted">{hint}</span>}
      </span>
      <span className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition-colors ${on ? 'bg-accent' : 'bg-line-strong'}`}>
        <span className={`block w-5 h-5 rounded-full bg-surface transition-transform ${on ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  )
}

// This device: on, off, blocked, or (iPhone in Safari) add it to the Home Screen first.
function DeviceCard({ role }) {
  const [state, setState] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => { pushState().then(setState).catch(() => setState('unsupported')) }, [])

  async function turnOn() {
    setBusy(true); setError(null)
    const res = await enablePush()
    setBusy(false)
    if (res.error) { setError("Couldn't turn them on. Try again."); return }
    setState(res.state)
  }
  async function turnOff() {
    setBusy(true); setError(null)
    const res = await disablePush()
    setBusy(false)
    if (!res.error) setState('off')
  }

  if (state === null) return <div className="h-24 rounded-[16px] bg-surface-2 animate-pulse" />
  return (
    <div className="rounded-[16px] bg-surface-2 p-4">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0"><Smartphone size={18} className="text-ink" /></span>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-ink">{state === 'on' ? 'On for this device' : 'Notifications on this device'}</p>
          {state === 'on' && <p className="text-[13px] text-muted">{role === 'coach' ? "You'll hear when clients check in, finish a session or message you." : "You'll get reminders and hear from your coach here."}</p>}
          {state === 'off' && <p className="text-[13px] text-muted">{role === 'coach' ? 'Know the moment a client checks in or messages, without opening the app.' : 'Reminders for workouts and check-ins, and a ping when your coach replies.'}</p>}
          {state === 'denied' && <p className="text-[13px] text-muted">They are blocked for this site. Allow notifications for unfnshd.app in your browser or phone settings, then come back here.</p>}
          {state === 'unsupported' && <p className="text-[13px] text-muted">This browser can't show notifications. On a phone, open unfnshd.app in Safari (iPhone) or Chrome (Android).</p>}
          {state === 'needs-install' && (
            <div className="text-[13px] text-muted space-y-1.5 mt-0.5">
              <p>On iPhone, add UNFNSHD to your Home Screen first, then open it from there:</p>
              <p className="flex items-center gap-1.5 text-ink"><Share size={15} /> Tap Share in Safari</p>
              <p className="flex items-center gap-1.5 text-ink"><PlusSquare size={15} /> Choose Add to Home Screen</p>
            </div>
          )}
        </div>
      </div>
      {state === 'off' && <Button block className="mt-3" onClick={turnOn} disabled={busy}><BellRing size={16} /> {busy ? 'Turning on' : 'Turn on notifications'}</Button>}
      {state === 'on' && <Button variant="secondary" size="sm" className="mt-3" onClick={turnOff} disabled={busy}>Turn off for this device</Button>}
      {error && <p className="text-[13px] text-bad mt-2">{error}</p>}
    </div>
  )
}

function SettingsView({ role }) {
  const [settings, setSettings] = useState(null)
  useEffect(() => { fetchSettings().then(setSettings) }, [])
  async function change(key, value) {
    setSettings((s) => ({ ...s, [key]: value }))
    const { error } = await saveSetting(key, value)
    if (error) { console.error('Notification setting error:', error); setSettings((s) => ({ ...s, [key]: !value })) }
  }
  return (
    <div className="space-y-4">
      <DeviceCard role={role} />
      <div>
        <p className="text-[13px] font-semibold text-muted mb-1">What to send</p>
        <div className="divide-y divide-line">
          {KINDS[role].map((k) => (
            <Toggle key={k.key} label={k.label} hint={k.hint} on={settings ? settings[k.key] : true} disabled={!settings} onChange={(v) => change(k.key, v)} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function NotificationsSheet({ open, onClose, role, items, onOpenItem, startOnSettings }) {
  const [view, setView] = useState(startOnSettings ? 'settings' : 'list')
  if (!open) return null
  return (
    <Sheet
      open
      onClose={onClose}
      title={view === 'settings' ? 'Notification settings' : 'Notifications'}
      actions={view === 'list'
        ? <button onClick={() => setView('settings')} aria-label="Notification settings" className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:bg-surface-2"><Settings2 size={18} /></button>
        : <button onClick={() => setView('list')} aria-label="Back to notifications" className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:bg-surface-2"><ChevronLeft size={20} /></button>}
    >
      {view === 'settings' ? <SettingsView role={role} /> : (
        items.length === 0 ? (
          <div className="text-center py-8">
            <Bell size={28} className="mx-auto text-faint" />
            <p className="text-[15px] font-bold text-ink mt-2">Nothing new</p>
            <p className="text-[14px] text-muted mt-1">{role === 'coach' ? 'Check-ins and finished sessions show here.' : 'Replies, new programs and plans from your coach show here.'}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => setView('settings')}><BellRing size={16} /> Phone notifications</Button>
          </div>
        ) : (
          <ul className="-mx-1">
            {items.map((n) => (
              <li key={n.id}>
                <button onClick={() => onOpenItem(n)} className="w-full flex items-start gap-3 px-1 py-3 text-left rounded-[12px] hover:bg-surface-2">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read_at ? 'bg-transparent' : 'bg-accent'}`} />
                  <span className="flex-1 min-w-0">
                    <span className={`block text-[15px] text-ink ${n.read_at ? 'font-semibold' : 'font-bold'}`}>{n.title}</span>
                    {n.body && <span className="block text-[14px] text-muted line-clamp-2">{n.body}</span>}
                    <span className="block text-[12px] text-faint mt-0.5">{ago(n.created_at)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </Sheet>
  )
}

// The bell with a dot for anything unread. onNavigate(target) goes where a notification
// points; target is { path, tab }.
export default function NotificationBell({ role, onNavigate, className = '', tone = 'plain' }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)

  const load = useCallback(() => { fetchNotifications().then(setItems) }, [])
  useEffect(() => {
    load()
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [load])

  const unread = items.filter((n) => !n.read_at)
  function show() {
    setOpen(true)
    if (unread.length) {
      const ids = unread.map((n) => n.id)
      markAllRead(ids).then(() => setItems((list) => list.map((n) => (ids.includes(n.id) ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n))))
    }
  }

  return (
    <>
      <button
        onClick={show}
        aria-label={unread.length ? `Notifications, ${unread.length} new` : 'Notifications'}
        className={`relative w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tone === 'chip' ? 'bg-surface border border-line hover:bg-surface-2' : 'hover:bg-surface-2'} text-ink ${className}`}
      >
        <Bell size={20} />
        {unread.length > 0 && <span className="absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full bg-tan ring-2 ring-bg" />}
      </button>
      <NotificationsSheet
        open={open}
        onClose={() => setOpen(false)}
        role={role}
        items={items}
        onOpenItem={(n) => { setOpen(false); const t = linkTarget(n.link); if (t) onNavigate(t) }}
      />
    </>
  )
}

// A settings row for the profile sheets ("You"), opening the same settings.
export function NotificationSettingsRow({ role }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] bg-surface-2 text-left hover:brightness-95">
        <BellRing size={18} className="text-muted shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-bold text-ink">Notifications</span>
          <span className="block text-[13px] text-muted">{role === 'coach' ? 'Check-ins, sessions, messages and a morning summary' : 'Workout and check-in reminders, and your coach'}</span>
        </span>
        <ChevronRight size={18} className="text-faint shrink-0" />
      </button>
      <NotificationsSheet open={open} onClose={() => setOpen(false)} role={role} items={[]} onOpenItem={() => {}} startOnSettings />
    </>
  )
}

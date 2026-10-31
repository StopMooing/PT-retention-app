// The frame around every coach page: a slim sidebar on desktop, a top bar and a bottom
// tab bar on phones. Pages render their own PageTitle inside the frame.
// Phone tabs: Clients, Programs, Messages, Nutrition, More (Exercises, Habits, settings).
import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Users, ClipboardList, Dumbbell, Utensils, Heart, LogOut, Settings, MessageSquare, Menu, ChevronRight } from 'lucide-react'
import { supabase } from '../supabase'
import { fetchUnreadCounts } from '../lib/messages'
import { Logo, Mark, Avatar, Sheet, ThemeSwitch, Button } from '../ui'
import { totalUnread } from './lib'
import { emit, useMessageEvent, READ, INCOMING } from './messages/events'

const CLIENTS = { label: 'Clients', icon: Users, path: '/dashboard', also: ['/clients'] }
const MESSAGES = { label: 'Messages', icon: MessageSquare, path: '/messages', also: ['/messages'], badge: true }
const PROGRAMS = { label: 'Programs', icon: ClipboardList, path: '/program-builder' }
const EXERCISES = { label: 'Exercises', icon: Dumbbell, path: '/exercise-library' }
const NUTRITION = { label: 'Nutrition', icon: Utensils, path: '/nutrition' }
const HABITS = { label: 'Habits', icon: Heart, path: '/habits' }

const SIDEBAR = [CLIENTS, MESSAGES, PROGRAMS, EXERCISES, NUTRITION, HABITS]
const TABS = [CLIENTS, PROGRAMS, MESSAGES, NUTRITION]
const MORE = [EXERCISES, HABITS]

function isActive(item, pathname) {
  return pathname === item.path || (item.also ?? []).some((p) => pathname.startsWith(p + '/'))
}

function Badge({ count, className = '' }) {
  if (!count) return null
  return (
    <span className={`min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-on-accent text-[11px] font-bold leading-none inline-flex items-center justify-center tabular-nums ${className}`} aria-label={`${count} unread`}>
      {count > 9 ? '9+' : count}
    </span>
  )
}

// Settings on desktop; on a phone the same sheet is "More" and also lists Exercises and Habits.
function SettingsSheet({ open, onClose, name, email, onSignOut, links }) {
  return (
    <Sheet open={open} onClose={onClose} title={links ? 'More' : 'Settings'}>
      {links && (
        <ul className="-mx-5 mb-4 divide-y divide-line border-y border-line">
          {MORE.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <NavLink to={item.path} onClick={onClose} className="flex items-center gap-3 px-5 min-h-[56px] text-[15px] font-semibold text-ink hover:bg-surface-2">
                  <Icon size={20} className="text-muted" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight size={18} className="text-faint" />
                </NavLink>
              </li>
            )
          })}
        </ul>
      )}
      <div className="flex items-center gap-3 py-2">
        <Avatar name={name || email} size={44} />
        <div className="min-w-0">
          {name && <p className="font-bold text-ink truncate">{name}</p>}
          <p className="text-[13px] text-muted truncate">{email}</p>
        </div>
      </div>
      <p className="text-sm font-semibold text-ink mt-5 mb-2">Appearance</p>
      <ThemeSwitch />
      <Button variant="secondary" block className="mt-6" onClick={onSignOut}>
        <LogOut size={18} /> Sign out
      </Button>
    </Sheet>
  )
}

export default function CoachShell({ user }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState(null) // 'settings' | 'more' | null
  const [unread, setUnread] = useState(0)
  const email = user?.email ?? ''
  const name = user?.user_metadata?.full_name ?? ''
  const userId = user?.id

  const refreshUnread = useCallback(() => {
    if (!userId) return
    fetchUnreadCounts({ readerId: userId }).then((c) => setUnread(totalUnread(c)))
  }, [userId])

  // Unread badge: on load, on every page change, when a thread is read, and live.
  useEffect(() => { refreshUnread() }, [refreshUnread, pathname])
  useMessageEvent(READ, refreshUnread)
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('coach-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'coach_messages' }, (payload) => {
        if (payload.new) emit(INCOMING, payload.new)
        refreshUnread()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, refreshUnread])

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const moreActive = MORE.some((i) => isActive(i, pathname))

  return (
    <div className="flex h-dvh bg-bg text-ink overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-surface border-r border-line">
        <div className="h-16 flex items-center px-5">
          <Logo size={22} />
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto" aria-label="Main">
          {SIDEBAR.map((item) => {
            const active = isActive(item, pathname)
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 h-11 px-3 rounded-full text-[15px] font-semibold transition-colors ${active ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink hover:bg-surface-2'}`}
              >
                <Icon size={20} strokeWidth={2} />
                <span className="flex-1">{item.label}</span>
                {item.badge && <Badge count={unread} />}
              </NavLink>
            )
          })}
        </nav>
        <div className="p-3 border-t border-line space-y-0.5">
          <button
            onClick={() => setSheet('settings')}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-[14px] hover:bg-surface-2 text-left transition-colors"
          >
            <Avatar name={name || email} size={36} />
            <span className="min-w-0 flex-1">
              {name && <span className="block text-sm font-bold text-ink truncate">{name}</span>}
              <span className="block text-xs text-muted truncate">{email}</span>
            </span>
            <Settings size={18} className="text-muted shrink-0" />
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 h-10 px-3 rounded-full text-sm font-semibold text-muted hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Phone top bar */}
        <header className="md:hidden h-14 shrink-0 flex items-center justify-between px-4 bg-bg border-b border-line">
          <NavLink to="/dashboard" aria-label="Clients" className="text-ink">
            <Mark size={28} />
          </NavLink>
          <button
            onClick={() => setSheet('settings')}
            aria-label="Settings"
            className="w-11 h-11 -mr-1.5 rounded-full flex items-center justify-center hover:bg-surface-2"
          >
            <Avatar name={name || email} size={32} />
          </button>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1200px] h-full px-4 md:px-6 pt-5 md:pt-8 pb-6">
            <Outlet />
          </div>
        </main>

        {/* Phone tab bar */}
        <nav
          className="md:hidden shrink-0 bg-surface border-t border-line shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Main"
        >
          <div className="grid grid-cols-5">
            {TABS.map((item) => {
              const active = isActive(item, pathname)
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${active ? 'text-accent' : 'text-muted'}`}
                >
                  <span className={`relative w-12 h-7 rounded-full flex items-center justify-center ${active ? 'bg-accent-soft' : ''}`}>
                    <Icon size={22} strokeWidth={2} />
                    {item.badge && <Badge count={unread} className="absolute -top-1 right-0 ring-2 ring-surface" />}
                  </span>
                  {item.label}
                </NavLink>
              )
            })}
            <button
              onClick={() => setSheet('more')}
              aria-label="More: exercises, habits and settings"
              className={`h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${moreActive ? 'text-accent' : 'text-muted'}`}
            >
              <span className={`w-12 h-7 rounded-full flex items-center justify-center ${moreActive ? 'bg-accent-soft' : ''}`}>
                <Menu size={22} strokeWidth={2} />
              </span>
              More
            </button>
          </div>
        </nav>
      </div>

      <SettingsSheet open={!!sheet} onClose={() => setSheet(null)} name={name} email={email} onSignOut={signOut} links={sheet === 'more'} />
    </div>
  )
}

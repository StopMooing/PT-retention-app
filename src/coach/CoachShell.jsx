// The frame around every coach page: a slim sidebar on desktop, a floating tab bar on
// phones. Pages render their own PageTitle inside the frame.
// Phone tabs follow what a coach does daily: Clients, Messages, Library (Programs,
// Exercises, Nutrition, Habits, with a switcher on top), You (account and appearance).
import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Users, ClipboardList, Dumbbell, Utensils, Heart, LogOut, Settings, MessageSquare, LibraryBig, CircleUser, ListChecks, ChevronRight } from 'lucide-react'
import CheckinQuestionsSheet from './CheckinQuestionsSheet'
import { NotificationSettingsRow } from '../lib/Notifications'
import { supabase } from '../supabase'
import { fetchUnreadCounts } from '../lib/messages'
import { Logo, Avatar, Sheet, ThemeSwitch, Button, TabBar, StatusBarCover } from '../ui'
import { totalUnread } from './lib'
import { emit, useMessageEvent, READ, INCOMING } from './messages/events'

const CLIENTS = { label: 'Clients', icon: Users, path: '/dashboard', also: ['/clients'] }
const MESSAGES = { label: 'Messages', icon: MessageSquare, path: '/messages', also: ['/messages'], badge: true }
const PROGRAMS = { label: 'Programs', icon: ClipboardList, path: '/program-builder' }
const EXERCISES = { label: 'Exercises', icon: Dumbbell, path: '/exercise-library' }
const NUTRITION = { label: 'Nutrition', icon: Utensils, path: '/nutrition' }
const HABITS = { label: 'Habits', icon: Heart, path: '/habits' }

const SIDEBAR = [CLIENTS, MESSAGES, PROGRAMS, EXERCISES, NUTRITION, HABITS]
const LIBRARY = [PROGRAMS, EXERCISES, NUTRITION, HABITS]

function isActive(item, pathname) {
  return pathname === item.path || (item.also ?? []).some((p) => pathname.startsWith(p + '/'))
}

function Badge({ count, className = '' }) {
  if (!count) return null
  return (
    <span className={`min-w-[18px] h-[18px] px-1 rounded-full bg-tan text-on-tan text-[11px] font-bold leading-none inline-flex items-center justify-center tabular-nums ${className}`} aria-label={`${count} unread`}>
      {count > 9 ? '9+' : count}
    </span>
  )
}

// Account, appearance and sign out. Desktop opens it from the sidebar, phones from "You".
function SettingsSheet({ open, onClose, name, email, onSignOut }) {
  const [questionsOpen, setQuestionsOpen] = useState(false)
  if (questionsOpen) return <CheckinQuestionsSheet open onClose={() => setQuestionsOpen(false)} />
  return (
    <Sheet open={open} onClose={onClose} title="You">
      <div className="flex items-center gap-3 py-2">
        <Avatar name={name || email} size={44} />
        <div className="min-w-0">
          {name && <p className="font-bold text-ink truncate">{name}</p>}
          <p className="text-[13px] text-muted truncate">{email}</p>
        </div>
      </div>
      <p className="text-sm font-semibold text-ink mt-5 mb-2">Coaching</p>
      <button onClick={() => setQuestionsOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] bg-surface-2 text-left hover:brightness-95">
        <ListChecks size={18} className="text-muted shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-bold text-ink">Check-in questions</span>
          <span className="block text-[13px] text-muted">Add your own to every client's weekly check-in</span>
        </span>
        <ChevronRight size={18} className="text-faint shrink-0" />
      </button>
      <div className="mt-2"><NotificationSettingsRow role="coach" /></div>
      <p className="text-sm font-semibold text-ink mt-5 mb-2">Appearance</p>
      <ThemeSwitch />
      <Button variant="secondary" block className="mt-6" onClick={onSignOut}>
        <LogOut size={18} /> Sign out
      </Button>
    </Sheet>
  )
}

// Phone only: the four parts of the Library, one tap apart.
function LibrarySwitch({ pathname, navigate }) {
  return (
    <div className="md:hidden flex p-1 rounded-full bg-surface-2 mb-5" role="tablist" aria-label="Library">
      {LIBRARY.map((item) => {
        const active = isActive(item, pathname)
        return (
          <button
            key={item.path}
            role="tab"
            aria-selected={active}
            onClick={() => navigate(item.path)}
            className={`flex-1 min-w-0 h-9 px-1 rounded-full text-[13px] font-bold truncate transition-colors ${active ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export default function CoachShell({ user }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
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

  const inLibrary = LIBRARY.some((i) => isActive(i, pathname))

  return (
    <div className="flex h-dvh bg-bg text-ink overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-surface-2">
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
                className={`flex items-center gap-3 h-11 px-3 rounded-full text-[15px] font-semibold transition-colors ${active ? 'bg-accent text-on-accent' : 'text-ink hover:bg-surface'}`}
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
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-[14px] hover:bg-surface text-left transition-colors"
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
            className="w-full flex items-center gap-3 h-10 px-3 rounded-full text-sm font-semibold text-muted hover:text-ink hover:bg-surface transition-colors"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <StatusBarCover />
        <main className="flex-1 min-h-0 overflow-y-auto max-md:pb-[var(--tabbar-space)]">
          <div className="mx-auto w-full max-w-[1200px] h-full px-4 md:px-6 pt-[max(env(safe-area-inset-top),20px)] md:pt-8 pb-6">
            {inLibrary && <LibrarySwitch pathname={pathname} navigate={navigate} />}
            <Outlet />
          </div>
        </main>

        {/* Phone tab bar */}
        <TabBar
          className="md:hidden"
          items={[
            { key: 'clients', label: CLIENTS.label, icon: Users, active: !settingsOpen && isActive(CLIENTS, pathname), onClick: () => navigate(CLIENTS.path) },
            { key: 'messages', label: MESSAGES.label, icon: MessageSquare, active: !settingsOpen && isActive(MESSAGES, pathname), badge: unread, onClick: () => navigate(MESSAGES.path) },
            { key: 'library', label: 'Tools', icon: LibraryBig, active: !settingsOpen && inLibrary, onClick: () => navigate(inLibrary ? pathname : PROGRAMS.path) },
            { key: 'you', label: 'You', icon: CircleUser, active: settingsOpen, onClick: () => setSettingsOpen(true) },
          ]}
        />
      </div>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} name={name} email={email} onSignOut={signOut} />
    </div>
  )
}

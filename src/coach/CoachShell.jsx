// The frame around every coach page: a slim sidebar on desktop, a top bar and a bottom
// tab bar on phones. Pages render their own PageTitle inside the frame.
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Users, ClipboardList, Dumbbell, Utensils, Heart, LogOut, Settings } from 'lucide-react'
import { supabase } from '../supabase'
import { Logo, Mark, Avatar, Sheet, ThemeSwitch, Button } from '../ui'

const NAV = [
  { label: 'Clients', short: 'Clients', icon: Users, path: '/dashboard', also: ['/clients'] },
  { label: 'Programs', short: 'Programs', icon: ClipboardList, path: '/program-builder' },
  { label: 'Exercises', short: 'Exercises', icon: Dumbbell, path: '/exercise-library' },
  { label: 'Nutrition', short: 'Nutrition', icon: Utensils, path: '/nutrition' },
  { label: 'Habits', short: 'Habits', icon: Heart, path: '/habits' },
]

function isActive(item, pathname) {
  return pathname === item.path || (item.also ?? []).some((p) => pathname.startsWith(p + '/'))
}

function SettingsSheet({ open, onClose, name, email, onSignOut }) {
  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div className="flex items-center gap-3 py-2">
        <Avatar name={name || email} size={44} />
        <div className="min-w-0">
          {name && <p className="font-bold text-ink truncate">{name}</p>}
          <p className="text-[13px] text-muted truncate">{email}</p>
        </div>
      </div>
      <p className="text-sm font-semibold text-ink mt-5 mb-2">Appearance</p>
      <ThemeSwitch />
      <Button
        variant="secondary"
        block
        className="mt-6"
        onClick={onSignOut}
      >
        <LogOut size={18} /> Sign out
      </Button>
    </Sheet>
  )
}

export default function CoachShell({ user }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const email = user?.email ?? ''
  const name = user?.user_metadata?.full_name ?? ''

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="flex h-dvh bg-bg text-ink overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-surface border-r border-line">
        <div className="h-16 flex items-center px-5">
          <Logo size={22} />
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto" aria-label="Main">
          {NAV.map((item) => {
            const active = isActive(item, pathname)
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 h-11 px-3 rounded-full text-[15px] font-semibold transition-colors ${active ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink hover:bg-surface-2'}`}
              >
                <Icon size={20} strokeWidth={2} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="p-3 border-t border-line space-y-0.5">
          <button
            onClick={() => setSettingsOpen(true)}
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
            onClick={() => setSettingsOpen(true)}
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
            {NAV.map((item) => {
              const active = isActive(item, pathname)
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${active ? 'text-accent' : 'text-muted'}`}
                >
                  <span className={`w-12 h-7 rounded-full flex items-center justify-center ${active ? 'bg-accent-soft' : ''}`}>
                    <Icon size={22} strokeWidth={2} />
                  </span>
                  {item.short}
                </NavLink>
              )
            })}
          </div>
        </nav>
      </div>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} name={name} email={email} onSignOut={signOut} />
    </div>
  )
}

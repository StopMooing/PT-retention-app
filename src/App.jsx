import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Dumbbell, ClipboardList, Utensils, Heart, CreditCard, Settings, LogOut, ChevronRight, Users, Menu, X } from 'lucide-react'
import { supabase } from './supabase'
import AuthPage from './AuthPage'
import CheckInPage from './CheckInPage'
import LandingPage from './LandingPage'
import ExerciseLibrary from './ExerciseLibrary'
import ProgramBuilder from './ProgramBuilder'
import NutritionPlanner from './NutritionPlanner'
import HabitTracker from './HabitTracker'
import ClientProfile from './ClientProfile'
import ClientWorkout from './ClientWorkout'

const statusConfig = {
  Engaged: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    bar: "bg-emerald-500",
  },
  Drifting: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    bar: "bg-amber-400",
  },
  "At Risk": {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 ring-1 ring-red-200",
    bar: "bg-red-500",
  },
}

function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

function computeStatus(lastCheckIn) {
  if (!lastCheckIn) return 'Engaged'
  const d = new Date(lastCheckIn)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  const days = Math.floor((now - d) / 86400000)
  if (days >= 14) return 'At Risk'
  if (days >= 7) return 'Drifting'
  return 'Engaged'
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysSince(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.floor((now - d) / 86400000)
}

function StatusBadge({ status }) {
  const cfg = statusConfig[status] ?? statusConfig.Engaged
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  )
}

function Avatar({ name, size = 'sm' }) {
  const dim = size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'
  return (
    <div className={`${dim} rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-semibold select-none flex-shrink-0`}>
      {getInitials(name)}
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-1 shadow-sm">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function ScoreDots({ score }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className={`w-4 h-4 rounded-sm ${n <= score ? 'bg-gray-900' : 'bg-gray-100'}`} />
      ))}
    </div>
  )
}

function CopyLinkButton({ clientId }) {
  const [copied, setCopied] = useState(false)

  function handleCopy(e) {
    e.stopPropagation()
    const url = `${window.location.origin}/checkin/${clientId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy check-in link"
      className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-600">Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Copy link</span>
        </>
      )}
    </button>
  )
}

function ClientPanel({ client, onClose }) {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Let the DOM paint first, then slide in
    const raf = requestAnimationFrame(() => setVisible(true))

    async function fetchCheckins() {
      const { data } = await supabase
        .from('checkins')
        .select('*')
        .eq('client_id', client.id)
        .order('submitted_at', { ascending: false })
      setCheckins(data ?? [])
      setLoading(false)
    }
    fetchCheckins()

    return () => cancelAnimationFrame(raf)
  }, [client.id])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)', opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={client.full_name} size="lg" />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 m-0 truncate">{client.full_name}</h2>
              <p className="text-xs text-gray-400 m-0 mt-0.5 truncate">{client.goal}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-3 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Client meta */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-400 m-0">Phone</p>
            <p className="text-sm font-medium text-gray-800 m-0 mt-0.5">{client.phone || '—'}</p>
          </div>
          <StatusBadge status={client.status} />
        </div>

        {/* Check-in history */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider m-0">Check-in History</h3>
          {!loading && <span className="text-xs text-gray-400">{checkins.length} total</span>}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">Loading…</div>
          ) : checkins.length === 0 ? (
            <div className="px-6 py-12 text-center flex flex-col items-center gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 m-0">No check-ins yet</p>
                <p className="text-xs text-gray-400 mt-1">Send this client their check-in link to get started.</p>
              </div>
              <CopyLinkButton clientId={client.id} />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 list-none m-0 p-0">
              {checkins.map((checkin) => (
                <li key={checkin.id} className="px-6 py-5">
                  <p className="text-xs font-semibold text-gray-900 m-0 mb-4">
                    {formatDate(checkin.submitted_at)}
                  </p>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0">Training</span>
                      <ScoreDots score={checkin.training_score} />
                      <span className="text-xs text-gray-400 tabular-nums">{checkin.training_score}/5</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0">Energy</span>
                      <ScoreDots score={checkin.energy_score} />
                      <span className="text-xs text-gray-400 tabular-nums">{checkin.energy_score}/5</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    {checkin.blocker ? (
                      <div className="bg-gray-50 rounded-lg px-3.5 py-2.5">
                        <p className="text-xs text-gray-500 m-0 leading-relaxed">{checkin.blocker}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300 m-0">Nothing reported</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

function AddClientModal({ onClose, onSave }) {
  const [fullName, setFullName] = useState('')
  const [goal, setGoal] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await onSave({ full_name: fullName, goal, phone })
    if (err) { setError(err); setLoading(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-gray-900 m-0">Add Client</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Full name</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-black transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Goal</label>
            <input type="text" required value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Weight loss, Marathon training"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-black transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone number</label>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 900000"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-black transition-colors" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">{error}</p>}
          <div className="flex gap-3 mt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Saving…' : 'Add client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProtectedLayout({ user, userRole }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [expandedSection, setExpandedSection] = useState(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
    })
  }, [])

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', children: null },
    { id: 'clients',   label: 'Clients',   icon: Users,          path: '/dashboard', children: null },
    {
      id: 'library', label: 'Library', icon: Dumbbell, path: null,
      children: [
        { label: 'Exercise Library', path: '/exercise-library' },
        { label: 'Program Builder',  path: '/program-builder'  },
      ]
    },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils,    path: '/nutrition', children: null },
    { id: 'habits',    label: 'Habits',    icon: Heart,       path: '/habits',    children: null },
    { id: 'payments',  label: 'Payments',  icon: CreditCard,  path: '/payments',  children: null, comingSoon: true },
  ]

  const pageNames = {
    '/dashboard':       'Dashboard',
    '/exercise-library':'Exercise Library',
    '/program-builder': 'Program Builder',
    '/nutrition':       'Nutrition Planner',
    '/habits':          'Habits',
    '/my-workout':      'My Workout',
    '/clients':         'Client Profile',
  }

  const isExpanded = sidebarExpanded || mobileSidebarOpen

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0 flex flex-col bg-[#0f0f0f] border-r border-white/10 transition-all duration-300 ease-in-out shrink-0 ${isExpanded ? 'w-60' : 'w-16'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => { setSidebarExpanded(false); setExpandedSection(null) }}
      >
        {/* Logo */}
        <div className="flex items-center h-16 border-b border-white/10 px-4 shrink-0 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm">S</span>
          </div>
          <span className={`ml-3 text-white font-bold text-base whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
            StopMooing
          </span>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const ItemIcon = item.icon
            return (
              <div key={item.id} className="relative group">
                {item.comingSoon ? (
                  <div className={`flex items-center rounded-xl px-2 py-2.5 cursor-not-allowed opacity-40 ${isExpanded ? 'gap-3' : 'justify-center'}`}>
                    <ItemIcon size={20} className="text-zinc-500 shrink-0" />
                    {isExpanded && (
                      <>
                        <span className="text-zinc-500 text-sm font-medium whitespace-nowrap">{item.label}</span>
                        <span className="ml-auto text-[10px] bg-white/10 text-zinc-400 px-1.5 py-0.5 rounded-full shrink-0">Soon</span>
                      </>
                    )}
                  </div>
                ) : item.children ? (
                  <div>
                    <button
                      className={`w-full flex items-center rounded-xl px-2 py-2.5 transition-all duration-150 hover:bg-white/10 ${expandedSection === item.id ? 'bg-white/10' : ''} ${isExpanded ? 'gap-3' : 'justify-center'}`}
                      onClick={() => { if (isExpanded) setExpandedSection(expandedSection === item.id ? null : item.id) }}
                    >
                      <ItemIcon size={20} className="text-zinc-400 shrink-0" />
                      {isExpanded && (
                        <>
                          <span className="text-zinc-300 text-sm font-medium whitespace-nowrap flex-1 text-left">{item.label}</span>
                          <ChevronRight size={14} className={`text-zinc-500 shrink-0 transition-transform duration-200 ${expandedSection === item.id ? 'rotate-90' : ''}`} />
                        </>
                      )}
                    </button>
                    {expandedSection === item.id && isExpanded && (
                      <div className="mt-1 ml-2 space-y-0.5 border-l border-white/10 pl-3">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) => `block px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${isActive ? 'text-green-400 bg-green-600/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `flex items-center rounded-xl px-2 py-2.5 transition-all duration-150 ${isExpanded ? 'gap-3' : 'justify-center'} ${isActive ? 'bg-green-600/20 text-green-400' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                  >
                    <ItemIcon size={20} className="shrink-0" />
                    {isExpanded && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                  </NavLink>
                )}

                {/* Tooltip (collapsed only) */}
                {!isExpanded && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-zinc-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 shadow-lg">
                    {item.label}
                    {item.comingSoon && <span className="ml-1.5 text-zinc-400">(Soon)</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom — settings, sign out, user */}
        <div className="border-t border-white/10 p-2 space-y-1 shrink-0">
          <div className={`flex items-center rounded-xl px-2 py-2.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all duration-150 cursor-pointer ${isExpanded ? 'gap-3' : 'justify-center'}`}>
            <Settings size={20} className="shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Settings</span>}
          </div>

          <button
            onClick={async () => { await supabase.auth.signOut(); navigate('/') }}
            className={`w-full flex items-center rounded-xl px-2 py-2.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 ${isExpanded ? 'gap-3' : 'justify-center'}`}
          >
            <LogOut size={20} className="shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Sign Out</span>}
          </button>

          <div className={`flex items-center rounded-xl px-2 py-2 ${isExpanded ? 'gap-3' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">
              {(currentUser?.email || user.email || '?')[0].toUpperCase()}
            </div>
            {isExpanded && (
              <span className="text-zinc-400 text-xs truncate max-w-[140px]">{currentUser?.email || user.email}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center">
            <button
              className="md:hidden mr-3 text-gray-500 hover:text-gray-700"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-gray-900 font-semibold text-base">{pageNames[location.pathname] || pageNames[location.pathname.split('/').slice(0, 2).join('/')] || 'StopMooing'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Live
            </span>
            <span className="text-xs text-gray-500 hidden sm:block">{currentUser?.email || user.email}</span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

function Dashboard({ user }) {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [checkinsMap, setCheckinsMap] = useState({})
  const [loadingClients, setLoadingClients] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [activityFeed, setActivityFeed] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  async function fetchData() {
    const { data: clientData, error } = await supabase
      .from('clients')
      .select('*')
      .eq('pt_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !clientData) { setLoadingClients(false); return }
    setClients(clientData)
    if (clientData.length === 0) { setLoadingClients(false); return }

    const clientIds = clientData.map((c) => c.id)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: checkins } = await supabase
      .from('checkins')
      .select('client_id, submitted_at, training_score, energy_score')
      .in('client_id', clientIds)
      .order('submitted_at', { ascending: false })

    const map = {}
    ;(checkins ?? []).forEach((c) => {
      if (!map[c.client_id]) {
        map[c.client_id] = { lastCheckIn: c.submitted_at, sessionsThisMonth: 0, recentScores: [] }
      }
      if (new Date(c.submitted_at) >= startOfMonth) {
        map[c.client_id].sessionsThisMonth++
      }
      if (map[c.client_id].recentScores.length < 3) {
        map[c.client_id].recentScores.push({
          training: c.training_score,
          energy: c.energy_score,
          date: c.submitted_at,
        })
      }
    })
    setCheckinsMap(map)

    // Build activity feed from recent checkins across all clients
    const feed = (checkins ?? [])
      .slice(0, 20)
      .map(c => {
        const client = clientData.find(cl => cl.id === c.client_id)
        return {
          clientName: client?.full_name ?? "Unknown",
          clientInitials: client?.full_name?.split(' ').filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('') ?? '?',
          type: 'checkin',
          training: c.training_score,
          energy: c.energy_score,
          date: c.submitted_at,
        }
      })
    setActivityFeed(feed)
    setLoadingClients(false)
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('checkins-watch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checkins' }, () => fetchData())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user.id])

  async function handleAddClient(fields) {
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...fields, pt_id: user.id, status: 'Engaged' })
      .select()
      .single()
    if (error) return error.message
    setClients((prev) => [data, ...prev])
    setShowModal(false)
    return null
  }

  const enrichedClients = clients.map((c) => {
    const stats = checkinsMap[c.id]
    const lastCheckIn = stats?.lastCheckIn ?? null
    return {
      ...c,
      lastCheckIn,
      sessionsThisMonth: stats?.sessionsThisMonth ?? 0,
      recentScores: stats?.recentScores ?? [],
      status: computeStatus(lastCheckIn),
    }
  })

  const engaged = enrichedClients.filter((c) => c.status === 'Engaged').length
  const drifting = enrichedClients.filter((c) => c.status === 'Drifting').length
  const atRisk = enrichedClients.filter((c) => c.status === 'At Risk').length
  const needsAttention = enrichedClients.filter((c) => c.status === 'At Risk' || c.status === 'Drifting')
  const engagementRate = enrichedClients.length > 0 ? Math.round((engaged / enrichedClients.length) * 100) : 0

  const filteredClients = enrichedClients
    .filter(c => statusFilter === 'All' || c.status === statusFilter)
    .filter(c => c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.goal?.toLowerCase().includes(searchQuery.toLowerCase()))

  const selectedEnriched = selectedClient
    ? enrichedClients.find((c) => c.id === selectedClient.id) ?? selectedClient
    : null

  function timeAgo(dateStr) {
    if (!dateStr) return 'Never'
    const days = Math.floor((new Date() - new Date(dateStr)) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days}d ago`
  }

  function formatDate(dateStr) {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc]">
      {showModal && <AddClientModal onClose={() => setShowModal(false)} onSave={handleAddClient} />}
      {selectedEnriched && <ClientPanel client={selectedEnriched} onClose={() => setSelectedClient(null)} />}

      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Monitor engagement and retention across your roster.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-black hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Add Client
          </button>
        </div>

        {/* ── STAT CARDS ROW ── */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Total Clients</p>
            <p className="text-3xl font-bold text-gray-900">{enrichedClients.length}</p>
            <p className="text-xs text-gray-400 mt-1">Active roster</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Engagement</p>
            <p className="text-3xl font-bold text-gray-900">{engagementRate}<span className="text-lg font-semibold text-gray-400">%</span></p>
            <p className="text-xs text-gray-400 mt-1">Of roster active</p>
          </div>
          <div
            onClick={() => setStatusFilter(statusFilter === 'Engaged' ? 'All' : 'Engaged')}
            className="rounded-2xl p-5 cursor-pointer transition-all"
            style={{ border: statusFilter === 'Engaged' ? '2px solid #10b981' : '1px solid #e5e7eb', backgroundColor: statusFilter === 'Engaged' ? '#ecfdf5' : 'white' }}
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Engaged</p>
            <p className="text-3xl font-bold text-emerald-500">{engaged}</p>
            <p className="text-xs text-gray-400 mt-1">On track</p>
          </div>
          <div
            onClick={() => setStatusFilter(statusFilter === 'Drifting' ? 'All' : 'Drifting')}
            className="rounded-2xl p-5 cursor-pointer transition-all"
            style={{ border: statusFilter === 'Drifting' ? '2px solid #f59e0b' : '1px solid #e5e7eb', backgroundColor: statusFilter === 'Drifting' ? '#fffbeb' : 'white' }}
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Drifting</p>
            <p className="text-3xl font-bold text-amber-500">{drifting}</p>
            <p className="text-xs text-gray-400 mt-1">Needs attention</p>
          </div>
          <div
            onClick={() => setStatusFilter(statusFilter === 'At Risk' ? 'All' : 'At Risk')}
            className="rounded-2xl p-5 cursor-pointer transition-all"
            style={{ border: statusFilter === 'At Risk' ? '2px solid #ef4444' : '1px solid #e5e7eb', backgroundColor: statusFilter === 'At Risk' ? '#fef2f2' : 'white' }}
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">At Risk</p>
            <p className="text-3xl font-bold text-red-500">{atRisk}</p>
            <p className="text-xs text-gray-400 mt-1">Action required</p>
          </div>
        </div>

        {/* ── NEEDS ATTENTION BANNER ── */}
        {needsAttention.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <p className="text-sm font-semibold text-red-700">
                Needs Your Attention — {needsAttention.length} {needsAttention.length === 1 ? 'client' : 'clients'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {needsAttention.map(c => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/clients/${c.id}`)}
                  className="flex items-center gap-2 bg-white border border-red-200 rounded-xl px-3 py-1.5 hover:border-red-300 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.status === 'At Risk' ? '#ef4444' : '#f59e0b' }} />
                  <span className="text-sm font-medium text-gray-800">{c.full_name}</span>
                  <span className="text-xs text-gray-400">{c.status}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN TWO-COLUMN LAYOUT ── */}
        <div className="flex gap-6 items-start">

          {/* ── LEFT: CLIENT LIST ── */}
          <div className="flex-1 min-w-0">

            {/* Search + filter row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search clients by name or goal..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
                />
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                {['All', 'Engaged', 'Drifting', 'At Risk'].map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Client list header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                {statusFilter === 'All' ? 'All Clients' : statusFilter} <span className="text-gray-400 font-normal ml-1">{filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}</span>
              </h3>
            </div>

            {/* Client rows */}
            {loadingClients ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">Loading clients…</div>
            ) : filteredClients.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                <p className="text-sm font-semibold text-gray-900">
                  {searchQuery || statusFilter !== 'All' ? 'No clients match your filters' : 'No clients yet'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery || statusFilter !== 'All' ? 'Try adjusting your search or filter' : 'Click "Add Client" to add your first client.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {client.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900 text-sm">{client.full_name}</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: client.status === 'Engaged' ? '#d1fae5' : client.status === 'Drifting' ? '#fef3c7' : '#fee2e2',
                              color: client.status === 'Engaged' ? '#065f46' : client.status === 'Drifting' ? '#92400e' : '#991b1b'
                            }}
                          >
                            {client.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{client.goal || 'No goal set'}</p>
                      </div>
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-0.5">Last check-in</p>
                          <p className="text-sm font-medium text-gray-700">{client.lastCheckIn ? timeAgo(client.lastCheckIn) : 'Never'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-0.5">This month</p>
                          <p className="text-sm font-medium text-gray-700">{client.sessionsThisMonth || 0}/4</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <CopyLinkButton clientId={client.id} />
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/clients/${client.id}`) }}
                            className="text-xs font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg px-2.5 py-1.5 transition-colors"
                          >
                            View →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: STATS + ACTIVITY ── */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-4">

            {/* This Month card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">This Month</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Check-ins received</span>
                  <span className="text-sm font-semibold text-gray-900">{enrichedClients.reduce((sum, c) => sum + c.sessionsThisMonth, 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Clients checked in</span>
                  <span className="text-sm font-semibold text-gray-900">{enrichedClients.filter(c => c.sessionsThisMonth > 0).length} <span className="text-gray-400 font-normal">/ {enrichedClients.length}</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Engagement rate</span>
                  <span className="text-sm font-semibold" style={{ color: engagementRate >= 70 ? '#10b981' : engagementRate >= 40 ? '#f59e0b' : '#ef4444' }}>
                    {engagementRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Need attention</span>
                  <span className="text-sm font-semibold text-red-500">{needsAttention.length}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
                {activityFeed.length > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">{activityFeed.length}</span>
                )}
              </div>
              {activityFeed.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {activityFeed.slice(0, 5).map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {activity.clientName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">{activity.clientName}</span> submitted a check-in
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                            Training {activity.training}/5
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                            Energy {activity.energy}/5
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(activity.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [userRole, setUserRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return
    async function fetchRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          setUserRole(data?.role ?? null)
        } else {
          setUserRole(null)
        }
      } finally {
        setRoleLoading(false)
      }
    }
    fetchRole()
  }, [session])

  if (session === undefined || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  const loggedInRedirect = userRole === 'pt'
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/my-workout" replace />

  return (
    <Routes>
      <Route path="/checkin/:clientId" element={<CheckInPage />} />
      <Route path="/" element={session ? loggedInRedirect : <LandingPage />} />
      <Route path="/auth" element={session ? loggedInRedirect : <AuthPage />} />
      <Route path="/login" element={session ? loggedInRedirect : <AuthPage defaultMode="login" />} />
      <Route path="/signup" element={session ? loggedInRedirect : <AuthPage defaultMode="signup" />} />
      {session && (
        <Route element={<ProtectedLayout user={session.user} userRole={userRole} />}>
          <Route path="/dashboard" element={
            userRole === 'pt' ? <Dashboard user={session.user} /> : <Navigate to="/my-workout" replace />
          } />
          <Route path="/exercise-library" element={
            userRole === 'pt' ? <ExerciseLibrary user={session.user} /> : <Navigate to="/my-workout" replace />
          } />
          <Route path="/program-builder" element={
            userRole === 'pt' ? <ProgramBuilder user={session.user} /> : <Navigate to="/my-workout" replace />
          } />
          <Route path="/nutrition" element={
            userRole === 'pt' ? <NutritionPlanner /> : <Navigate to="/my-workout" replace />
          } />
          <Route path="/habits" element={
            userRole === 'pt' ? <HabitTracker /> : <Navigate to="/my-workout" replace />
          } />
          <Route path="/clients/:clientId" element={
            userRole === 'pt' ? <ClientProfile /> : <Navigate to="/my-workout" replace />
          } />
          <Route path="/my-workout" element={<ClientWorkout />} />
        </Route>
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

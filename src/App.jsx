import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom'
import { supabase } from './supabase'
import AuthPage from './AuthPage'
import CheckInPage from './CheckInPage'
import LandingPage from './LandingPage'
import ExerciseLibrary from './ExerciseLibrary'
import ProgramBuilder from './ProgramBuilder'
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
  const initials = (user.email || '?').split('@')[0].slice(0, 2).toUpperCase()
  const activeLink = 'text-sm text-green-600 font-semibold border-b-2 border-green-600 pb-0.5'
  const inactiveLink = 'text-sm text-gray-600 hover:text-green-600 font-medium transition-colors duration-150'

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-black font-bold text-lg tracking-tight">StopMooing</span>
            <span className="text-gray-200 select-none">|</span>
            {userRole === 'pt' && (
              <>
                <NavLink to="/dashboard"        className={({ isActive }) => isActive ? activeLink : inactiveLink}>Dashboard</NavLink>
                <NavLink to="/exercise-library" className={({ isActive }) => isActive ? activeLink : inactiveLink}>Exercise Library</NavLink>
                <NavLink to="/program-builder"  className={({ isActive }) => isActive ? activeLink : inactiveLink}>Program Builder</NavLink>
              </>
            )}
            {userRole === 'client' && (
              <NavLink to="/my-workout" className={({ isActive }) => isActive ? activeLink : inactiveLink}>My Workout</NavLink>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.email}</span>
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}

function Dashboard({ user }) {
  const [clients, setClients] = useState([])
  const [checkinsMap, setCheckinsMap] = useState({})
  const [loadingClients, setLoadingClients] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

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
      .select('client_id, submitted_at')
      .in('client_id', clientIds)
      .order('submitted_at', { ascending: false })

    const map = {}
    ;(checkins ?? []).forEach((c) => {
      if (!map[c.client_id]) {
        map[c.client_id] = { lastCheckIn: c.submitted_at, sessionsThisMonth: 0 }
      }
      if (new Date(c.submitted_at) >= startOfMonth) {
        map[c.client_id].sessionsThisMonth++
      }
    })
    setCheckinsMap(map)
    setLoadingClients(false)
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('checkins-watch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checkins' }, () => {
        fetchData()
      })
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
      status: computeStatus(lastCheckIn),
    }
  })

  const engaged = enrichedClients.filter((c) => c.status === 'Engaged').length
  const drifting = enrichedClients.filter((c) => c.status === 'Drifting').length
  const atRisk = enrichedClients.filter((c) => c.status === 'At Risk').length

  // Keep selectedClient in sync when enrichedClients refreshes
  const selectedEnriched = selectedClient
    ? enrichedClients.find((c) => c.id === selectedClient.id) ?? selectedClient
    : null

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {showModal && <AddClientModal onClose={() => setShowModal(false)} onSave={handleAddClient} />}
      {selectedEnriched && <ClientPanel client={selectedEnriched} onClose={() => setSelectedClient(null)} />}

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0">Client Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Monitor engagement and retention across your client roster.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-black text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-800 active:bg-gray-900 transition-colors">
            + Add Client
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Clients" value={enrichedClients.length} sub="Active roster" />
          <StatCard label="Engaged" value={engaged} sub="On track" />
          <StatCard label="Drifting" value={drifting} sub="Needs attention" />
          <StatCard label="At Risk" value={atRisk} sub="Action required" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 m-0">All Clients</h2>
            <span className="text-xs text-gray-400">{enrichedClients.length} clients</span>
          </div>

          {loadingClients ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">Loading clients…</div>
          ) : enrichedClients.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-gray-900 m-0">No clients yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "Add Client" to add your first client.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 list-none m-0 p-0">
              {enrichedClients.map((client) => {
                const cfg = statusConfig[client.status]
                const days = daysSince(client.lastCheckIn)
                return (
                  <li
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className="px-6 py-5 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Avatar name={client.full_name} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate m-0">{client.full_name}</p>
                      <p className="text-xs text-gray-400 m-0 mt-0.5">{client.goal}</p>
                    </div>

                    <div className="hidden sm:flex flex-col items-end gap-0.5 min-w-[130px]">
                      {client.lastCheckIn ? (
                        <>
                          <p className="text-xs font-medium text-gray-600 m-0">Last check-in</p>
                          <p className="text-xs text-gray-400 m-0">{formatDate(client.lastCheckIn)}</p>
                          <p className="text-xs text-gray-300 m-0">
                            {days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-300 m-0">No check-in yet</p>
                      )}
                    </div>

                    <div className="hidden sm:flex flex-col items-end gap-1.5 min-w-[100px]">
                      <p className="text-xs font-medium text-gray-600 m-0">{client.sessionsThisMonth} sessions</p>
                      <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cfg.bar}`}
                          style={{ width: `${Math.min(100, (client.sessionsThisMonth / 12) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <StatusBadge status={client.status} />

                    <CopyLinkButton clientId={client.id} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
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

  const roleRedirect = userRole === 'pt'
    ? <Navigate to="/dashboard" replace />
    : userRole === 'client'
    ? <Navigate to="/my-workout" replace />
    : <Navigate to="/login" replace />

  return (
    <Routes>
      <Route path="/checkin/:clientId" element={<CheckInPage />} />
      <Route path="/" element={session ? roleRedirect : <LandingPage />} />
      <Route path="/login" element={session ? roleRedirect : <AuthPage defaultMode="login" />} />
      <Route path="/signup" element={session ? roleRedirect : <AuthPage defaultMode="signup" />} />
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
          <Route path="/my-workout" element={<ClientWorkout />} />
        </Route>
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

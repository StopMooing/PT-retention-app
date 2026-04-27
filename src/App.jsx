import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import AuthPage from './AuthPage'

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

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function daysSince(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + "T00:00:00")
  const now = new Date()
  now.setHours(0, 0, 0, 0)
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

function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-semibold text-sm select-none flex-shrink-0">
      {initials(name)}
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
    if (err) {
      setError(err)
      setLoading(false)
    }
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
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Full name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Goal</label>
            <input
              type="text"
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Weight loss, Marathon training"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+44 7700 900000"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-black transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 active:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving…' : 'Add client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Dashboard({ user }) {
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const ptInitials = (user.email || '?').split('@')[0].slice(0, 2).toUpperCase()

  useEffect(() => {
    async function fetchClients() {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('pt_id', user.id)
        .order('created_at', { ascending: false })
      if (!error) setClients(data)
      setLoadingClients(false)
    }
    fetchClients()
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

  const engaged = clients.filter((c) => c.status === 'Engaged').length
  const drifting = clients.filter((c) => c.status === 'Drifting').length
  const atRisk = clients.filter((c) => c.status === 'At Risk').length

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {showModal && (
        <AddClientModal
          onClose={() => setShowModal(false)}
          onSave={handleAddClient}
        />
      )}

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-black font-bold text-lg tracking-tight">StopMooing</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.email}</span>
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
              {ptInitials}
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

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0">Client Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Monitor engagement and retention across your client roster.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-800 active:bg-gray-900 transition-colors"
          >
            + Add Client
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Clients" value={clients.length} sub="Active roster" />
          <StatCard label="Engaged" value={engaged} sub="On track" />
          <StatCard label="Drifting" value={drifting} sub="Needs attention" />
          <StatCard label="At Risk" value={atRisk} sub="Action required" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 m-0">All Clients</h2>
            <span className="text-xs text-gray-400">{clients.length} clients</span>
          </div>

          {loadingClients ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">Loading clients…</div>
          ) : clients.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-gray-900">No clients yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "Add Client" to add your first client.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 list-none m-0 p-0">
              {clients.map((client) => {
                const cfg = statusConfig[client.status] ?? statusConfig.Engaged
                const days = daysSince(client.last_check_in)
                const sessions = client.sessions_this_month ?? 0
                return (
                  <li key={client.id} className="px-6 py-5 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <Avatar name={client.full_name} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate m-0">{client.full_name}</p>
                      <p className="text-xs text-gray-400 m-0 mt-0.5">{client.goal}</p>
                    </div>

                    <div className="hidden sm:flex flex-col items-end gap-0.5 min-w-[130px]">
                      {client.last_check_in ? (
                        <>
                          <p className="text-xs font-medium text-gray-600 m-0">Last check-in</p>
                          <p className="text-xs text-gray-400 m-0">{formatDate(client.last_check_in)}</p>
                          <p className="text-xs text-gray-300 m-0">
                            {days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-300 m-0">No check-in yet</p>
                      )}
                    </div>

                    <div className="hidden sm:flex flex-col items-end gap-1.5 min-w-[100px]">
                      <p className="text-xs font-medium text-gray-600 m-0">{sessions} sessions</p>
                      <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cfg.bar}`}
                          style={{ width: `${Math.min(100, (sessions / 12) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <StatusBadge status={client.status ?? 'Engaged'} />
                    </div>
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) return <AuthPage />
  return <Dashboard user={session.user} />
}

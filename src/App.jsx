import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import AuthPage from './AuthPage'

const clients = [
  {
    id: 1,
    name: "Sarah Mitchell",
    avatar: "SM",
    goal: "Weight Loss",
    lastCheckIn: "2026-04-22",
    sessionsThisMonth: 8,
    status: "Engaged",
  },
  {
    id: 2,
    name: "James Okafor",
    avatar: "JO",
    goal: "Muscle Gain",
    lastCheckIn: "2026-04-18",
    sessionsThisMonth: 5,
    status: "Drifting",
  },
  {
    id: 3,
    name: "Priya Nair",
    avatar: "PN",
    goal: "Marathon Training",
    lastCheckIn: "2026-04-23",
    sessionsThisMonth: 12,
    status: "Engaged",
  },
  {
    id: 4,
    name: "Tom Bergström",
    avatar: "TB",
    goal: "General Fitness",
    lastCheckIn: "2026-04-05",
    sessionsThisMonth: 1,
    status: "At Risk",
  },
]

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

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function daysSince(dateStr) {
  const d = new Date(dateStr + "T00:00:00")
  const now = new Date("2026-04-23T00:00:00")
  return Math.floor((now - d) / 86400000)
}

function StatusBadge({ status }) {
  const cfg = statusConfig[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  )
}

function Avatar({ initials }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-semibold text-sm select-none flex-shrink-0">
      {initials}
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

function Dashboard({ user }) {
  const engaged = clients.filter((c) => c.status === "Engaged").length
  const atRisk = clients.filter((c) => c.status === "At Risk").length
  const drifting = clients.filter((c) => c.status === "Drifting").length

  const initials = (user.email || '?')
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-black font-bold text-lg tracking-tight">StopMooing</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.email}</span>
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 m-0">Client Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor engagement and retention across your client roster.</p>
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

          <ul className="divide-y divide-gray-100 list-none m-0 p-0">
            {clients.map((client) => {
              const cfg = statusConfig[client.status]
              const days = daysSince(client.lastCheckIn)
              return (
                <li key={client.id} className="px-6 py-5 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <Avatar initials={client.avatar} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate m-0">{client.name}</p>
                    <p className="text-xs text-gray-400 m-0 mt-0.5">{client.goal}</p>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-0.5 min-w-[130px]">
                    <p className="text-xs font-medium text-gray-600 m-0">Last check-in</p>
                    <p className="text-xs text-gray-400 m-0">{formatDate(client.lastCheckIn)}</p>
                    <p className="text-xs text-gray-300 m-0">
                      {days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`}
                    </p>
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

                  <div className="flex-shrink-0">
                    <StatusBadge status={client.status} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Still resolving session — render nothing to avoid flash
  if (session === undefined) return null

  if (!session) return <AuthPage />

  return <Dashboard user={session.user} />
}

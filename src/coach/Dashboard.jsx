// Coach home: who needs me today, then the full client list.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Plus, Link2, Check, MessageSquare, Users } from 'lucide-react'
import { supabase } from '../supabase'
import { PageTitle, SectionLabel, Card, Button, Chip, Segmented, Avatar, Sheet, Field, EmptyState, Mark } from '../ui'
import { clientStatus, STATUS, relativeDay, sessionsThisMonth, checkinsThisWeek, checkinNote, firstName } from './lib'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

// A client who has not claimed an account needs their invite link. Once they have one
// they check in inside the app, so there is nothing to hand them.
function InviteButton({ client, compact }) {
  const [copied, setCopied] = useState(false)
  if (client.user_id) return null
  if (!client.email) {
    return (
      <span title="Add an email to this client before you can invite them" className="text-xs font-semibold text-faint whitespace-nowrap">
        Needs email
      </span>
    )
  }
  function handleCopy(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(`${window.location.origin}/claim/${client.claim_token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="secondary" size="sm" onClick={handleCopy} title="Copy account invite link" className="shrink-0">
      {copied ? <Check size={16} className="text-accent" /> : <Link2 size={16} />}
      {compact ? (copied ? 'Copied' : 'Invite') : copied ? 'Copied' : 'Copy invite'}
    </Button>
  )
}

function AddClientSheet({ open, onClose, onSave }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [goal, setGoal] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function reset() {
    setFullName(''); setEmail(''); setGoal(''); setPhone(''); setError(null); setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await onSave({ full_name: fullName, email: email.trim(), goal, phone })
    if (err) { setError(err); setLoading(false) } else reset()
  }

  return (
    <Sheet open={open} onClose={() => { reset(); onClose() }} title="Add client">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
        <Field label="Full name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" autoComplete="off" />
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" hint="Their invite link is tied to this email." autoComplete="off" />
        <Field label="Goal" type="text" required value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="For example, get strong for summer" />
        <Field label="Phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0400 000 000" />
        {error && <p className="text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3">{error}</p>}
        <Button type="submit" size="lg" block disabled={loading} className="mt-1">
          {loading ? 'Saving' : 'Add client'}
        </Button>
      </form>
    </Sheet>
  )
}

function Scores({ ci }) {
  return (
    <span className="text-[13px] text-muted tabular-nums whitespace-nowrap">
      Training {ci.training_score ?? '-'}/5 · Energy {ci.energy_score ?? '-'}/5
    </span>
  )
}

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [checkins, setCheckins] = useState([])
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  async function fetchData() {
    const { data: clientData, error } = await supabase
      .from('clients')
      .select('*')
      .eq('pt_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !clientData) { setLoading(false); return }
    setClients(clientData)
    if (clientData.length === 0) { setLoading(false); return }

    const clientIds = clientData.map((c) => c.id)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [{ data: checkinRows }, { data: logRows }] = await Promise.all([
      supabase
        .from('checkins')
        .select('id, client_id, submitted_at, training_score, energy_score, blocker, notes, coach_reply')
        .in('client_id', clientIds)
        .order('submitted_at', { ascending: false }),
      supabase
        .from('workout_logs')
        .select('client_id, logged_at, completed')
        .in('client_id', clientIds)
        .eq('completed', true)
        .gte('logged_at', startOfMonth.toISOString()),
    ])
    setCheckins(checkinRows ?? [])
    setWorkoutLogs(logRows ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('checkins-watch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checkins' }, () => fetchData())
      .subscribe()
    return () => supabase.removeChannel(channel)
    // fetchData only depends on user.id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  async function handleAddClient(fields) {
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...fields, pt_id: user.id, status: 'Engaged' })
      .select()
      .single()
    if (error) return error.message
    setClients((prev) => [data, ...prev])
    setShowAdd(false)
    return null
  }

  const byId = Object.fromEntries(clients.map((c) => [c.id, c]))

  const enriched = clients.map((c) => {
    const own = checkins.filter((ci) => ci.client_id === c.id)
    const lastCheckIn = own[0]?.submitted_at ?? null
    return {
      ...c,
      lastCheckIn,
      awaitingReply: own.filter((ci) => !ci.coach_reply).length,
      sessions: sessionsThisMonth(workoutLogs.filter((w) => w.client_id === c.id)),
      status: clientStatus(lastCheckIn),
    }
  })

  // Newest first. Counted across all time: an unanswered one from three weeks ago is still owed a reply.
  const awaiting = checkins.filter((ci) => !ci.coach_reply && byId[ci.client_id])
  const awaitingIds = new Set(awaiting.map((ci) => ci.client_id))
  const slipping = enriched
    .filter((c) => (c.status === 'Drifting' || c.status === 'At Risk') && !awaitingIds.has(c.id))
    .sort((a, b) => new Date(a.lastCheckIn) - new Date(b.lastCheckIn))
  const notStarted = enriched.filter((c) => c.status === 'New' && !c.user_id)

  const q = search.trim().toLowerCase()
  const filtered = enriched
    .filter((c) => filter === 'All' || c.status === filter)
    .filter((c) => !q || c.full_name?.toLowerCase().includes(q) || c.goal?.toLowerCase().includes(q))

  const coachFirst = firstName(user?.user_metadata?.full_name ?? '')
  const needsCount = awaiting.length + slipping.length + notStarted.length

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Mark size={40} className="text-ink animate-pulse" />
      </div>
    )
  }

  return (
    <div className="pb-8">
      <AddClientSheet open={showAdd} onClose={() => setShowAdd(false)} onSave={handleAddClient} />

      <PageTitle
        eyebrow={coachFirst ? `${greeting()}, ${coachFirst}` : greeting()}
        title="Clients"
        action={
          <Button onClick={() => setShowAdd(true)} size="md" className="max-sm:h-10 max-sm:px-4">
            <Plus size={18} /> <span className="max-sm:hidden">Add client</span><span className="sm:hidden">Add</span>
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        {[
          { label: 'Clients', value: enriched.length },
          { label: 'Check-ins this week', short: 'This week', value: checkinsThisWeek(checkins) },
          { label: 'Awaiting reply', short: 'To reply', value: awaiting.length, warn: awaiting.length > 0 },
        ].map((s) => (
          <Card key={s.label} className="!p-3.5 md:!p-4">
            <p className="text-[13px] text-muted truncate">
              {s.short ? <><span className="md:hidden">{s.short}</span><span className="max-md:hidden">{s.label}</span></> : s.label}
            </p>
            <p className={`font-display text-[28px] leading-tight tabular-nums ${s.warn ? 'text-warn' : 'text-ink'}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Needs you */}
      <section className="mt-7">
        <SectionLabel action={needsCount > 0 && <span className="text-[13px] font-bold text-muted">{needsCount}</span>}>Needs you</SectionLabel>
        {needsCount === 0 ? (
          <Card>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0"><Check size={20} /></span>
              <div>
                <p className="font-bold text-ink">All caught up</p>
                <p className="text-[13px] text-muted">Every check-in has a reply and everyone checked in this week.</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card padded={false} className="divide-y divide-line overflow-hidden">
            {awaiting.map((ci) => {
              const c = byId[ci.client_id]
              const note = checkinNote(ci)
              const st = clientStatus(checkins.find((x) => x.client_id === c.id)?.submitted_at)
              return (
                <div key={ci.id} className="flex items-center gap-3 px-4 py-3.5">
                  <Avatar name={c.full_name} size={40} />
                  <button className="min-w-0 flex-1 text-left" onClick={() => navigate(`/clients/${c.id}`)}>
                    <p className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-ink truncate">{c.full_name}</span>
                      <span className="text-[13px] text-muted whitespace-nowrap">{relativeDay(ci.submitted_at)}</span>
                    </p>
                    <span className="flex items-center gap-2 flex-wrap">
                      <Scores ci={ci} />
                      {st !== 'Engaged' && <Chip tone={STATUS[st].tone}>{STATUS[st].label}</Chip>}
                    </span>
                    {note && <p className="text-[13px] text-ink truncate mt-0.5">"{note}"</p>}
                  </button>
                  <Button variant="soft" size="sm" onClick={() => navigate(`/clients/${c.id}`, { state: { reply: ci.id } })}>
                    <MessageSquare size={16} /> Reply
                  </Button>
                </div>
              )
            })}
            {slipping.map((c) => (
              <button key={c.id} onClick={() => navigate(`/clients/${c.id}`)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2 transition-colors">
                <Avatar name={c.full_name} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-ink truncate">{c.full_name}</span>
                    <Chip tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Chip>
                  </span>
                  <span className="block text-[13px] text-muted">Last check-in {relativeDay(c.lastCheckIn).toLowerCase()}</span>
                </span>
                <ChevronRight size={20} className="text-faint shrink-0" />
              </button>
            ))}
            {notStarted.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3.5">
                <Avatar name={c.full_name} size={40} />
                <button className="min-w-0 flex-1 text-left" onClick={() => navigate(`/clients/${c.id}`)}>
                  <span className="block font-bold text-ink truncate">{c.full_name}</span>
                  <span className="block text-[13px] text-muted">Has not set up their account yet</span>
                </button>
                <InviteButton client={c} compact />
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* All clients */}
      <section className="mt-7">
        <SectionLabel>All clients</SectionLabel>
        <div className="flex flex-col md:flex-row gap-2.5 md:items-center mb-3">
          <label className="relative flex-1 min-w-0">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            <input
              type="search"
              placeholder="Search by name or goal"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-full border border-line-strong bg-surface text-ink placeholder:text-faint outline-none focus:border-accent transition-colors"
            />
          </label>
          <Segmented
            className="md:w-[380px] shrink-0"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'All', label: 'All' },
              { value: 'Engaged', label: 'Engaged' },
              { value: 'Drifting', label: 'Drifting' },
              { value: 'At Risk', label: 'At risk' },
            ]}
          />
        </div>

        <Card padded={false} className="overflow-hidden">
          {filtered.length === 0 ? (
            enriched.length === 0 ? (
              <EmptyState icon={Users} title="No clients yet" body="Add your first client and send them their invite link." action={<Button onClick={() => setShowAdd(true)}><Plus size={18} /> Add client</Button>} />
            ) : (
              <EmptyState icon={Search} title="No clients match" body="Try another name, or switch the filter back to All." />
            )
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[minmax(0,1fr)_120px_130px_110px_120px_20px] gap-4 px-4 h-10 items-center border-b border-line text-xs font-bold uppercase tracking-[0.06em] text-muted">
                <span>Client</span><span>Status</span><span>Last check-in</span><span className="text-right">Sessions (month)</span><span /><span />
              </div>
              <ul className="divide-y divide-line">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <div
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(`/clients/${c.id}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/clients/${c.id}`) }}
                      className="flex md:grid md:grid-cols-[minmax(0,1fr)_120px_130px_110px_120px_20px] gap-3 md:gap-4 items-center px-4 py-3 min-h-[64px] cursor-pointer hover:bg-surface-2 transition-colors"
                    >
                      <span className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar name={c.full_name} size={40} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="font-bold text-ink truncate">{c.full_name}</span>
                            {c.awaitingReply > 0 && <span className="w-2 h-2 rounded-full bg-warn shrink-0" title={`${c.awaitingReply} awaiting reply`} />}
                            <Chip tone={STATUS[c.status].tone} className="md:hidden">{STATUS[c.status].label}</Chip>
                          </span>
                          <span className="block text-[13px] text-muted truncate">{c.goal || 'No goal set'}</span>
                          <span className="md:hidden block text-[13px] text-muted">
                            {c.lastCheckIn ? `Checked in ${relativeDay(c.lastCheckIn).toLowerCase()}` : 'No check-ins yet'} · {c.sessions} {c.sessions === 1 ? 'session' : 'sessions'} this month
                          </span>
                        </span>
                      </span>
                      <span className="hidden md:block"><Chip tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Chip></span>
                      <span className="hidden md:block text-sm text-ink">{c.lastCheckIn ? relativeDay(c.lastCheckIn) : 'Never'}</span>
                      <span className="hidden md:block text-sm text-ink text-right tabular-nums">{c.sessions}</span>
                      <span className="hidden md:flex justify-end"><InviteButton client={c} /></span>
                      <ChevronRight size={20} className="text-faint shrink-0" />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </section>
    </div>
  )
}

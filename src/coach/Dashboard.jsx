// Coach home: who needs me today, then the full client list.
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, ChevronLeft, Plus, Link2, Check, MessageSquare, MessageCircle, Users, Send, MessageCircleHeart, Flame } from 'lucide-react'
import { supabase } from '../supabase'
import { fetchUnreadCounts, fetchLatestPerThread } from '../lib/messages'
import { SectionLabel, Card, Button, Chip, Segmented, Avatar, Sheet, Field, EmptyState, Mark, Hero } from '../ui'
import { clientStatus, STATUS, relativeDay, sessionsLast7, checkinsThisWeek, checkinNote, firstName, messageTime, toLocalDateStr, addDays, awaitingReply, lastActivity, missedInARow, nudgeReason, nudgedAt } from './lib'
import { useMessageEvent, READ, INCOMING } from './messages/events'
import NudgeSheet from './NudgeSheet'

// Where everyone sits, as one bar: tap a part to filter the list below.
const HEALTH = [
  { value: 'Engaged', label: 'Engaged', bar: 'bg-good' },
  { value: 'Drifting', label: 'Drifting', bar: 'bg-warn' },
  { value: 'At Risk', label: 'At risk', bar: 'bg-bad' },
  { value: 'New', label: 'New', bar: 'bg-faint' },
]

function ClientHealth({ clients, onPick }) {
  const total = clients.length
  if (total === 0) return null
  // Every status is always listed (0 included), so the card reads the same for every coach.
  const counts = HEALTH.map((h) => ({ ...h, n: clients.filter((c) => c.status === h.value).length }))
  const parts = counts.filter((h) => h.n > 0)
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[15px] font-bold text-ink">Client health</p>
        <p className="text-[13px] text-muted">Last 7 days</p>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden gap-1 mt-3" role="img" aria-label={counts.map((h) => `${h.n} ${h.label.toLowerCase()}`).join(', ')}>
        {parts.map((h) => <div key={h.value} className={`${h.bar} rounded-full`} style={{ flexGrow: h.n }} />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-x-4 gap-y-2 mt-3">
        {counts.map((h) => (
          <button key={h.value} onClick={() => onPick(h.value)} disabled={h.n === 0} className="inline-flex items-center gap-2 text-[14px] text-ink hover:underline underline-offset-2 disabled:no-underline disabled:text-muted">
            <span className={`w-2.5 h-2.5 rounded-full ${h.bar}`} />
            <span className="font-bold tabular-nums">{h.n}</span> {h.label.toLowerCase()}
          </button>
        ))}
      </div>
    </Card>
  )
}

// This week's sessions across every client, and who has trained the most: people worth a
// well done. Fills the right column so the page reads as one piece next to Needs you.
function ShowingUp({ clients, onOpen }) {
  const rows = clients.map((c) => ({ c, n: c.sessions })).filter((r) => r.n > 0).sort((a, b) => b.n - a.n)
  const total = rows.reduce((s, r) => s + r.n, 0)
  if (clients.length === 0) return null
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[15px] font-bold text-ink">Showing up</p>
        <p className="text-[13px] text-muted">Last 7 days</p>
      </div>
      <p className="mt-2"><span className="font-display text-[36px] leading-none text-ink tabular-nums">{total}</span> <span className="text-[14px] text-muted">{total === 1 ? 'session' : 'sessions'} by {rows.length} of {clients.length} clients</span></p>
      {rows.length > 0 ? (
        <ul className="mt-3 border-t border-line">
          {rows.slice(0, 3).map(({ c, n }) => (
            <li key={c.id}>
              <button onClick={() => onOpen(c)} className="w-full flex items-center gap-2.5 py-2 text-left hover:opacity-80">
                <Avatar name={c.full_name} src={c.profile_photo_url} size={28} />
                <span className="flex-1 min-w-0 text-[14px] font-semibold text-ink truncate">{c.full_name}</span>
                <span className="inline-flex items-center gap-1 text-[13px] font-bold text-ink tabular-nums"><Flame size={14} className="text-accent" />{n}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-muted mt-2">Sessions show here as clients finish them, with the most consistent first.</p>
      )}
    </Card>
  )
}

// "1 of 3" with back and forward buttons, for lists shown a page at a time.
function Pager({ page, pages, onPage, tone }) {
  const btn = tone === 'hero'
    ? 'w-9 h-9 rounded-full flex items-center justify-center text-on-hero hover:bg-hero-track disabled:opacity-30'
    : 'w-9 h-9 rounded-full flex items-center justify-center text-ink hover:bg-surface-2 disabled:opacity-30'
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button className={btn} onClick={() => onPage(page - 1)} disabled={page === 0} aria-label="Previous page"><ChevronLeft size={18} /></button>
      <span className={`text-[13px] font-semibold tabular-nums ${tone === 'hero' ? 'text-hero-muted' : 'text-muted'}`}>{page + 1} of {pages}</span>
      <button className={btn} onClick={() => onPage(page + 1)} disabled={page >= pages - 1} aria-label="Next page"><ChevronRight size={18} /></button>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'
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
  async function handleCopy(e) {
    e.stopPropagation()
    const link = `${window.location.origin}/claim/${client.claim_token}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this invite link:', link)
    }
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
    <span className="text-[13px] text-hero-muted tabular-nums whitespace-nowrap">
      Training {ci.training_score ?? '-'}/5 · Energy {ci.energy_score ?? '-'}/5
    </span>
  )
}

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [checkins, setCheckins] = useState([])
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [scheduled, setScheduled] = useState([])
  const [unread, setUnread] = useState({})
  const [latestMsg, setLatestMsg] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [showArchived, setShowArchived] = useState(false)
  const [nudge, setNudge] = useState(null) // clients to reach out to
  const [needPage, setNeedPage] = useState(0)
  const [listPage, setListPage] = useState(0)
  // Needs you keeps the height of its tallest page, so paging never moves the page below.
  const [needMinH, setNeedMinH] = useState({ key: '', h: 0 })

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
    // 30 days of sessions is enough for the status rule (14 days) and the 7-day count.
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const today = toLocalDateStr()

    // Each client's most recent session, asked for alongside everything else (not after):
    // a client with no session in the 30-day window still has a last session further
    // back, and the status rule needs it (the profile sees it too, so both screens agree).
    const lastLogs = Promise.all(clientIds.map((id) => supabase
      .from('workout_logs')
      .select('client_id, logged_at, completed, scheduled_workout_id')
      .eq('client_id', id)
      .eq('completed', true)
      .order('logged_at', { ascending: false })
      .limit(1)
      .then(({ data }) => data?.[0] ?? null)))
    const [{ data: checkinRows }, { data: logRows }, { data: swRows }, unreadCounts, latest, lastLog] = await Promise.all([
      supabase
        .from('checkins')
        .select('id, client_id, submitted_at, training_score, energy_score, blocker, notes, coach_reply')
        .in('client_id', clientIds)
        .order('submitted_at', { ascending: false }),
      supabase
        .from('workout_logs')
        .select('client_id, logged_at, completed, scheduled_workout_id')
        .in('client_id', clientIds)
        .eq('completed', true)
        .gte('logged_at', since.toISOString()),
      supabase
        .from('scheduled_workouts')
        .select('id, client_id, scheduled_date, created_at')
        .in('client_id', clientIds)
        .gte('scheduled_date', addDays(today, -14))
        .lt('scheduled_date', today),
      fetchUnreadCounts({ readerId: user.id }),
      fetchLatestPerThread(clientIds),
      lastLogs,
    ])
    const older = lastLog.filter((l) => l && !(logRows ?? []).some((r) => r.client_id === l.client_id))
    setCheckins(checkinRows ?? [])
    setWorkoutLogs([...(logRows ?? []), ...older])
    setScheduled(swRows ?? [])
    setUnread(unreadCounts)
    setLatestMsg(latest)
    setLoading(false)
  }

  // Keep message rows current while the dashboard is open.
  const refreshMessages = useCallback(async () => {
    const ids = clients.map((c) => c.id)
    const [u, l] = await Promise.all([fetchUnreadCounts({ readerId: user.id }), fetchLatestPerThread(ids)])
    setUnread(u)
    setLatestMsg(l)
  }, [clients, user.id])
  useMessageEvent(INCOMING, refreshMessages)
  useMessageEvent(READ, refreshMessages)

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


  const enriched = clients.map((c) => {
    const own = checkins.filter((ci) => ci.client_id === c.id)
    const lastCheckIn = own[0]?.submitted_at ?? null
    const logs = workoutLogs.filter((w) => w.client_id === c.id)
    return {
      ...c,
      lastCheckIn,
      // Only their latest check-in is owed a reply (shared rule with the profile).
      awaitingCheckin: awaitingReply(own),
      lastActive: lastActivity({ lastCheckIn, workoutLogs: logs }),
      missed: missedInARow({ scheduledWorkouts: scheduled.filter((sw) => sw.client_id === c.id), workoutLogs: logs }),
      unreadMessages: unread[c.id] || 0,
      sessions: sessionsLast7(logs),
      status: clientStatus({ lastCheckIn, workoutLogs: logs, scheduledWorkouts: scheduled.filter((sw) => sw.client_id === c.id) }),
    }
  })
  // Archived clients leave every count and list here, and only show under the Archived filter.
  const active = enriched.filter((c) => !c.archived_at)
  const archived = enriched.filter((c) => c.archived_at)

  // One row per client who is owed a reply (their latest check-in, new messages or
  // both), newest first. Reply opens their chat, where check-ins and messages live.
  const replyItems = active
    .filter((c) => c.awaitingCheckin || c.unreadMessages > 0)
    .map((c) => {
      const m = latestMsg[c.id]
      const msgAt = c.unreadMessages > 0 ? m?.created_at ?? '' : ''
      const ciAt = c.awaitingCheckin?.submitted_at ?? ''
      return {
        id: c.id, client: c, ci: c.awaitingCheckin, count: c.unreadMessages,
        preview: c.unreadMessages > 0 && m && m.sender_id !== user.id ? m.body : '',
        at: new Date(msgAt || 0) > new Date(ciAt || 0) ? msgAt : ciAt,
      }
    })
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
  const awaitingCount = active.filter((c) => c.awaitingCheckin).length
  const awaitingIds = new Set(replyItems.map((i) => i.id))
  const slipping = active
    .filter((c) => (c.status === 'Drifting' || c.status === 'At Risk') && !awaitingIds.has(c.id))
    .sort((a, b) => ((a.lastActive ?? '') < (b.lastActive ?? '') ? -1 : 1))
  const notStarted = active.filter((c) => c.status === 'New' && !c.user_id)

  const q = search.trim().toLowerCase()
  const filtered = (showArchived ? archived : active)
    .filter((c) => showArchived || filter === 'All' || c.status === filter)
    .filter((c) => !q || c.full_name?.toLowerCase().includes(q) || c.goal?.toLowerCase().includes(q))
  // Ten to a page so the page stays a sensible length with a big client list.
  const LIST_PER_PAGE = 10
  const listPages = Math.max(1, Math.ceil(filtered.length / LIST_PER_PAGE))
  const listPageSafe = Math.min(listPage, listPages - 1)
  const pageOfClients = filtered.slice(listPageSafe * LIST_PER_PAGE, listPageSafe * LIST_PER_PAGE + LIST_PER_PAGE)

  const coachFirst = firstName(user?.user_metadata?.full_name ?? '')
  const needsCount = replyItems.length + slipping.length + notStarted.length

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Mark size={40} className="text-ink animate-pulse" />
      </div>
    )
  }

  // Everyone who needs the coach, replies first, five to a page so the card stays short.
  const needRows = [
    ...replyItems.map((item) => {
                const c = item.client
                const ci = item.ci
                const note = ci ? checkinNote(ci) : ''
                return (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    <Avatar name={c.full_name} src={c.profile_photo_url} size={40} />
                    <button className="min-w-0 flex-1 text-left" onClick={() => navigate(`/clients/${c.id}`)}>
                      <p className="flex flex-wrap items-baseline gap-x-2 min-w-0">
                        <span className="font-bold">{c.full_name}</span>
                        {item.at && <span className="text-[13px] text-hero-muted whitespace-nowrap">{ci && item.at === ci.submitted_at ? relativeDay(item.at) : messageTime(item.at)}</span>}
                      </p>
                      {ci && (
                        <span className="flex items-center gap-2 flex-wrap">
                          <Scores ci={ci} />
                          {c.status !== 'Engaged' && <Chip tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Chip>}
                        </span>
                      )}
                      {item.count > 0 && (
                        <span className="flex items-center gap-1.5 text-[13px] font-bold">
                          <MessageCircle size={14} /> {item.count === 1 ? 'New message' : `${item.count} new messages`}
                        </span>
                      )}
                      {(item.preview || note) && <p className="text-[14px] text-hero-muted truncate mt-0.5">"{item.preview || note}"</p>}
                    </button>
                    <button
                      onClick={() => navigate(`/messages/${c.id}`, ci ? { state: { replyCheckin: ci.id } } : undefined)}
                      aria-label={`Reply to ${c.full_name}`}
                      className="h-[38px] max-sm:w-[38px] sm:px-4 rounded-full bg-on-hero text-hero text-[13px] font-bold flex items-center justify-center gap-1.5 shrink-0 hover:opacity-90"
                    >
                      <MessageSquare size={15} /> <span className="max-sm:hidden">Reply</span>
                    </button>
                  </div>
                )
              }),
    ...slipping.map((c) => {
                const nudged = nudgedAt(latestMsg[c.id], user.id, c.lastActive)
                return (
                  <div key={c.id} className="flex items-center gap-3 py-3">
                    <Avatar name={c.full_name} src={c.profile_photo_url} size={40} />
                    <button className="min-w-0 flex-1 text-left" onClick={() => navigate(`/clients/${c.id}`)}>
                      <span className="flex items-center gap-2">
                        <span className="font-bold truncate">{c.full_name}</span>
                        <Chip tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Chip>
                      </span>
                      <span className="block text-[14px] text-hero-muted">{nudgeReason(c)}</span>
                      {nudged && <span className="block text-[13px] text-hero-muted">You reached out {relativeDay(nudged).toLowerCase()}, waiting to hear back</span>}
                    </button>
                    <button
                      onClick={() => setNudge([c])}
                      aria-label={`${nudged ? 'Follow up with' : 'Reach out to'} ${c.full_name}`}
                      className={`h-[38px] max-sm:w-[38px] sm:px-4 rounded-full text-[13px] font-bold flex items-center justify-center gap-1.5 shrink-0 hover:opacity-90 ${nudged ? 'border border-hero-track text-on-hero' : 'bg-on-hero text-hero'}`}
                    >
                      <MessageCircleHeart size={15} /> <span className="max-sm:hidden">{nudged ? 'Follow up' : 'Reach out'}</span>
                    </button>
                  </div>
                )
              }),
    ...notStarted.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-3">
                  <Avatar name={c.full_name} src={c.profile_photo_url} size={40} />
                  <button className="min-w-0 flex-1 text-left" onClick={() => navigate(`/clients/${c.id}`)}>
                    <span className="block font-bold truncate">{c.full_name}</span>
                    <span className="block text-[14px] text-hero-muted">Has not set up their account yet</span>
                  </button>
                  <InviteButton client={c} compact />
                </div>
              )),
  ]
  const NEEDS_PER_PAGE = 5
  const needPages = Math.max(1, Math.ceil(needRows.length / NEEDS_PER_PAGE))
  const needPageSafe = Math.min(needPage, needPages - 1)
  const needKey = `${needRows.length}`

  return (
    <div className="pb-8">
      <AddClientSheet open={showAdd} onClose={() => setShowAdd(false)} onSave={handleAddClient} />

      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-muted">{new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="font-display text-[clamp(34px,8vw,44px)] leading-none text-ink mt-1">{greeting()}{coachFirst ? `, ${coachFirst}` : ''}.</h1>
        </div>
        <Button onClick={() => setShowAdd(true)} size="md" className="shrink-0 max-sm:h-10 max-sm:px-4">
          <Plus size={18} /> <span className="max-sm:hidden">Add client</span><span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
        {/* Needs you */}
        <Hero className="min-w-0 !px-5 md:!px-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-[clamp(24px,5vw,30px)] leading-none">
              {needsCount === 0 ? 'All caught up' : needsCount === 1 ? '1 client needs you' : `${needsCount} clients need you`}
            </p>
            {needPages > 1 && <Pager page={needPageSafe} pages={needPages} onPage={setNeedPage} tone="hero" />}
          </div>
          {needsCount === 0 ? (
            <p className="text-[14px] text-hero-muted mt-2">Every check-in and message has a reply, and everyone is showing up.</p>
          ) : (
            <div
              className="mt-3 divide-y divide-hero-track"
              style={needPages > 1 && needMinH.key === needKey ? { minHeight: needMinH.h } : undefined}
              ref={(el) => {
                if (!el || needPages < 2) return
                const h = el.offsetHeight
                if (needMinH.key !== needKey || h > needMinH.h) setNeedMinH({ key: needKey, h })
              }}
            >
              {needRows.slice(needPageSafe * NEEDS_PER_PAGE, needPageSafe * NEEDS_PER_PAGE + NEEDS_PER_PAGE)}
            </div>
          )}
        </Hero>

        {/* Summary, then client health under it */}
        <div className="flex flex-col gap-4 min-w-0">
        <Card className="!py-2 !px-5 grid grid-cols-4 lg:grid-cols-1 gap-x-3">
          {[
            { label: 'Clients', value: active.length },
            // Share of current clients showing up: the number a retention business lives by.
            ...(active.length > 0 ? [{ label: 'Engaged', value: `${Math.round((active.filter((c) => c.status === 'Engaged').length / active.length) * 100)}%` }] : []),
            { label: 'Check-ins this week', short: 'This week', value: checkinsThisWeek(checkins) },
            { label: 'Awaiting reply', short: 'To reply', value: awaitingCount },
          ].map((s, i) => (
            <div key={s.label} className={`py-2.5 lg:flex lg:items-baseline lg:justify-between ${i > 0 ? 'lg:border-t lg:border-line' : ''}`}>
              <p className="text-[13px] lg:text-[14px] font-semibold text-muted truncate">
                {s.short ? <><span className="lg:hidden">{s.short}</span><span className="max-lg:hidden">{s.label}</span></> : s.label}
              </p>
              <p className="font-display text-[30px] lg:text-[36px] leading-none tabular-nums text-ink mt-1 lg:mt-0">{s.value}</p>
            </div>
          ))}
        </Card>
        {!showArchived && <ClientHealth clients={active} onPick={(v) => { setFilter(v); setListPage(0); document.getElementById('all-clients')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} />}
        {!showArchived && <ShowingUp clients={active} onOpen={(c) => navigate(`/clients/${c.id}`)} />}
        </div>
      </div>

      <NudgeSheet
        open={!!nudge}
        clients={nudge ?? []}
        coachId={user.id}
        onClose={() => setNudge(null)}
        onSent={(msgs) => setLatestMsg((prev) => ({ ...prev, ...Object.fromEntries(msgs.map((m) => [m.client_id, m])) }))}
      />

      {/* All clients */}
      <section className="mt-7 scroll-mt-4" id="all-clients">
        <SectionLabel
          action={!showArchived && filtered.length > 1 && (
            <button onClick={() => setNudge(filtered)} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink hover:underline underline-offset-2">
              <Send size={14} /> Message {filter === 'All' && !q ? `all ${filtered.length}` : `these ${filtered.length}`}
            </button>
          )}
        >
          {showArchived ? 'Archived clients' : 'All clients'}
        </SectionLabel>
        <div className="flex flex-col md:flex-row gap-2.5 md:items-center mb-3">
          <label className="relative flex-1 min-w-0">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            <input
              type="search"
              placeholder="Search by name or goal"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setListPage(0) }}
              className="w-full h-11 pl-11 pr-4 rounded-full border border-line-strong bg-surface text-ink placeholder:text-faint outline-none focus:border-accent transition-colors"
            />
          </label>
          {!showArchived && (
            <Segmented
              className="md:w-[460px] shrink-0"
              value={filter}
              onChange={(v) => { setFilter(v); setListPage(0) }}
              options={[
                { value: 'All', label: 'All' },
                { value: 'Engaged', label: 'Engaged' },
                { value: 'Drifting', label: 'Drifting' },
                { value: 'At Risk', label: 'At risk' },
                { value: 'New', label: 'New' },
              ]}
            />
          )}
        </div>

        <Card padded={false} className="overflow-hidden">
          {filtered.length === 0 ? (
            enriched.length === 0 ? (
              <EmptyState icon={Users} title="No clients yet" body="Add your first client and send them their invite link." action={<Button onClick={() => setShowAdd(true)}><Plus size={18} /> Add client</Button>} />
            ) : (
              active.length === 0 && !showArchived && !q ? (
                <EmptyState icon={Users} title="No current clients" body="Add a client, or open your archived clients below." action={<Button onClick={() => setShowAdd(true)}><Plus size={18} /> Add client</Button>} />
              ) : (
                <EmptyState icon={Search} title="No clients match" body={showArchived ? 'Try another name.' : 'Try another name, or switch the filter back to All.'} />
              )
            )
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[minmax(0,1fr)_120px_130px_110px_120px_20px] gap-4 px-4 h-10 items-center border-b border-line text-xs font-semibold text-muted">
                <span>Client</span><span>Status</span><span>Last check-in</span><span className="text-right">Sessions (7 days)</span><span /><span />
              </div>
              <ul className="divide-y divide-line">
                {pageOfClients.map((c) => (
                  <li key={c.id}>
                    <div
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(`/clients/${c.id}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/clients/${c.id}`) }}
                      className="flex md:grid md:grid-cols-[minmax(0,1fr)_120px_130px_110px_120px_20px] gap-3 md:gap-4 items-center px-4 py-3 min-h-[64px] cursor-pointer hover:bg-surface-2 transition-colors"
                    >
                      <span className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar name={c.full_name} src={c.profile_photo_url} size={40} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="font-bold text-ink truncate">{c.full_name}</span>
                            {c.unreadMessages > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full bg-accent-soft text-accent text-[11px] font-bold shrink-0 tabular-nums"
                                title={`${c.unreadMessages} unread ${c.unreadMessages === 1 ? 'message' : 'messages'}`}
                                aria-label={`${c.unreadMessages} unread ${c.unreadMessages === 1 ? 'message' : 'messages'}`}
                              >
                                <MessageCircle size={12} strokeWidth={2.5} />{c.unreadMessages}
                              </span>
                            )}
                            {c.archived_at ? <Chip className="md:hidden">Archived</Chip> : <Chip tone={STATUS[c.status].tone} className="md:hidden">{STATUS[c.status].label}</Chip>}
                          </span>
                          <span className="block text-[13px] text-muted truncate">{c.goal || 'No goal set'}</span>
                          <span className="md:hidden block text-[13px] text-muted">
                            {c.archived_at
                              ? `Archived ${relativeDay(c.archived_at).toLowerCase()}`
                              : c.awaitingCheckin
                              ? <span className="font-bold text-warn">Check-in to reply</span>
                              : c.lastCheckIn ? `Checked in ${relativeDay(c.lastCheckIn).toLowerCase()}` : 'No check-ins yet'} · {c.sessions} {c.sessions === 1 ? 'session' : 'sessions'} in 7 days
                          </span>
                        </span>
                      </span>
                      <span className="hidden md:block">{c.archived_at ? <Chip>Archived</Chip> : <Chip tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Chip>}</span>
                      <span className={`hidden md:block text-sm ${c.awaitingCheckin && !c.archived_at ? 'font-bold text-warn' : 'text-ink'}`}>{c.awaitingCheckin && !c.archived_at ? 'To reply' : c.lastCheckIn ? relativeDay(c.lastCheckIn) : 'Never'}</span>
                      <span className="hidden md:block text-sm text-ink text-right tabular-nums">{c.sessions}</span>
                      <span className="hidden md:flex justify-end"><InviteButton client={c} /></span>
                      <ChevronRight size={20} className="text-faint shrink-0" />
                    </div>
                  </li>
                ))}
              </ul>
              {listPages > 1 && (
                <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-line">
                  <span className="text-[13px] text-muted tabular-nums">{listPageSafe * LIST_PER_PAGE + 1} to {Math.min(filtered.length, (listPageSafe + 1) * LIST_PER_PAGE)} of {filtered.length}</span>
                  <Pager page={listPageSafe} pages={listPages} onPage={setListPage} />
                </div>
              )}
            </>
          )}
        </Card>
        {(archived.length > 0 || showArchived) && (
          <button onClick={() => { setShowArchived((v) => !v); setListPage(0) }} className="mt-3 px-1 text-[13px] font-semibold text-ink underline underline-offset-2">
            {showArchived ? 'Back to current clients' : `Archived clients (${archived.length})`}
          </button>
        )}
      </section>
    </div>
  )
}

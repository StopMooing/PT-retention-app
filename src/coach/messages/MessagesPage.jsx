// Coach inbox: one row per client with messages, newest first. Desktop shows the list and
// the open thread side by side; on a phone the thread opens full screen with a back button.
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, MessageSquare, Search, UserRound } from 'lucide-react'
import { supabase } from '../../supabase'
import { fetchLatestActivity, fetchUnreadCounts } from '../../lib/messages'
import { PageTitle, Card, Avatar, EmptyState, Mark, SectionLabel } from '../../ui'
import { messageTime, firstName } from '../lib'
import Thread from './Thread'
import { useMessageEvent, useIsDesktop, READ, INCOMING } from './events'

const cx = (...c) => c.filter(Boolean).join(' ')

function Row({ client, latest, unread, active, userId, onOpen }) {
  const mine = latest?.sender_id === userId
  return (
    <button
      onClick={onOpen}
      aria-current={active ? 'true' : undefined}
      className={cx(
        'w-full flex items-center gap-3 px-4 py-3 min-h-[68px] text-left transition-colors',
        active ? 'bg-surface-2 shadow-[inset_3px_0_0_var(--accent)]' : 'hover:bg-surface-2',
      )}
    >
      <Avatar name={client.full_name} src={client.profile_photo_url} size={44} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cx('truncate text-ink', unread ? 'font-extrabold' : 'font-bold')}>{client.full_name}</span>
          {latest && <span className={cx('text-xs shrink-0 tabular-nums', unread ? 'text-accent font-bold' : 'text-muted')}>{messageTime(latest.created_at)}</span>}
        </span>
        <span className="flex items-center justify-between gap-2 mt-0.5">
          <span className={cx('text-[13px] truncate', unread ? 'text-ink font-semibold' : 'text-muted')}>
            {latest ? `${mine ? 'You: ' : ''}${latest.body}` : `Send ${firstName(client.full_name)} a message`}
          </span>
          {unread > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-accent text-on-accent text-[11px] font-bold inline-flex items-center justify-center shrink-0 tabular-nums" aria-label={`${unread} unread`}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
      </span>
    </button>
  )
}

function ThreadHeader({ client, onBack }) {
  return (
    <div className="shrink-0 h-14 md:h-16 flex items-center gap-3 px-2 md:px-4 border-b border-line bg-surface">
      {onBack && (
        <button onClick={onBack} aria-label="Back to messages" className="w-11 h-11 rounded-full flex items-center justify-center text-ink hover:bg-surface-2">
          <ChevronLeft size={24} />
        </button>
      )}
      <Avatar name={client.full_name} src={client.profile_photo_url} size={36} />
      <p className="flex-1 min-w-0 font-bold text-ink truncate">{client.full_name}</p>
      <Link to={`/clients/${client.id}`} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-bold text-accent hover:bg-accent-soft">
        <UserRound size={16} /> Profile
      </Link>
    </div>
  )
}

export default function MessagesPage({ user }) {
  const { clientId } = useParams()
  const navigate = useNavigate()
  // "Reply" on a check-in in Needs you opens the thread in reply mode for that check-in.
  const replyCheckinId = useLocation().state?.replyCheckin ?? null
  const desktop = useIsDesktop()
  const [clients, setClients] = useState([])
  const [latest, setLatest] = useState({})
  const [unread, setUnread] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('clients')
        .select('id, full_name, profile_photo_url, user_id')
        .eq('pt_id', user.id)
        .order('full_name', { ascending: true })
      const list = data ?? []
      const [l, u] = await Promise.all([fetchLatestActivity(list.map((c) => c.id), user.id), fetchUnreadCounts({ readerId: user.id })])
      if (cancelled) return
      setClients(list)
      setLatest(l)
      setUnread(u)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [user.id])

  // The open thread keeps its row's preview current and clears its unread count.
  const onThreadChange = useCallback((msgs) => {
    const m = msgs[msgs.length - 1]
    if (m) setLatest((prev) => (prev[m.client_id]?.id === m.id ? prev : { ...prev, [m.client_id]: m }))
  }, [])
  useMessageEvent(READ, useCallback(({ clientId: id }) => setUnread((prev) => ({ ...prev, [id]: 0 })), []))
  useMessageEvent(INCOMING, useCallback((m) => {
    setLatest((prev) => ({ ...prev, [m.client_id]: m }))
    if (m.sender_id !== user.id && m.client_id !== clientId) setUnread((prev) => ({ ...prev, [m.client_id]: (prev[m.client_id] || 0) + 1 }))
  }, [user.id, clientId]))

  const q = search.trim().toLowerCase()
  const threads = clients
    .filter((c) => latest[c.id])
    .sort((a, b) => (latest[a.id].created_at < latest[b.id].created_at ? 1 : -1))
  const shown = q ? threads.filter((c) => c.full_name?.toLowerCase().includes(q)) : threads
  // Searching also finds clients with no messages yet, so the coach can start one.
  const fresh = q ? clients.filter((c) => !latest[c.id] && c.full_name?.toLowerCase().includes(q)) : []
  const open = clients.find((c) => c.id === clientId) ?? null
  const openThread = (id) => navigate(`/messages/${id}`)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Mark size={40} className="text-ink animate-pulse" />
      </div>
    )
  }

  const list = (
    <>
      <label className="relative block">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
        <input
          type="search"
          placeholder="Search clients"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-11 pr-4 rounded-full border border-line-strong bg-surface text-ink text-base md:text-[15px] placeholder:text-faint outline-none focus:border-accent transition-colors"
        />
      </label>
      <div className="mt-3 md:flex-1 md:min-h-0 md:overflow-y-auto md:-mx-1 md:px-1">
        {threads.length === 0 && !q ? (
          <Card>
            <EmptyState icon={MessageSquare} title="No messages yet" body="When a client messages you it shows here. Search for a client to send the first one." />
          </Card>
        ) : (
          <>
            {shown.length > 0 && (
              <Card padded={false} className="overflow-hidden divide-y divide-line">
                {shown.map((c) => (
                  <Row key={c.id} client={c} latest={latest[c.id]} unread={unread[c.id] || 0} active={desktop && c.id === clientId} userId={user.id} onOpen={() => openThread(c.id)} />
                ))}
              </Card>
            )}
            {fresh.length > 0 && (
              <div className={shown.length ? 'mt-5' : ''}>
                <SectionLabel>Start a conversation</SectionLabel>
                <Card padded={false} className="overflow-hidden divide-y divide-line">
                  {fresh.map((c) => (
                    <Row key={c.id} client={c} active={desktop && c.id === clientId} userId={user.id} onOpen={() => openThread(c.id)} />
                  ))}
                </Card>
              </div>
            )}
            {q && shown.length === 0 && fresh.length === 0 && (
              <Card><EmptyState icon={Search} title="No clients match" body="Try another name." /></Card>
            )}
          </>
        )}
      </div>
    </>
  )

  if (!desktop) {
    return (
      <div className="pb-6">
        <PageTitle title="Messages" />
        <div className="mt-5">{list}</div>
        {open && (
          <div className="fixed inset-0 z-40 flex flex-col bg-bg pt-[env(safe-area-inset-top)]">
            <ThreadHeader client={open} onBack={() => navigate('/messages')} />
            <Thread key={open.id} clientId={open.id} userId={user.id} clientName={open.full_name} onChange={onThreadChange} className="flex-1" replyCheckinId={replyCheckinId} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <PageTitle title="Messages" />
      <div className="mt-6 flex-1 min-h-0 grid grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[380px_minmax(0,1fr)] gap-4">
        <div className="min-h-0 flex flex-col">{list}</div>
        <Card padded={false} className="min-h-0 overflow-hidden flex flex-col">
          {open ? (
            <>
              <ThreadHeader client={open} />
              <Thread key={open.id} clientId={open.id} userId={user.id} clientName={open.full_name} onChange={onThreadChange} className="flex-1" autoFocus replyCheckinId={replyCheckinId} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={MessageSquare} title="Pick a conversation" body="Choose a client on the left to read and reply." />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// Private messages between a client and their coach. One thread per client
// (coach_messages.client_id). Used by both the client app and the coach side so they
// behave the same. Row level security limits every read and write to the client and
// their coach; only read_at can be changed after sending.
//
// The chat also shows the client's check-ins: useConversation merges messages, weekly
// check-ins (with the coach's reply) and every daily check-in into one
// timeline (mergeTimeline), so the client and the coach see the same conversation.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabase'

const COLS = 'id, client_id, sender_id, body, created_at, read_at'

export async function fetchThread(clientId, limit = 200) {
  const { data, error } = await supabase
    .from('coach_messages')
    .select(COLS)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) console.error('Load messages error:', error)
  return { data: (data ?? []).reverse(), error }
}

export async function sendMessage({ clientId, senderId, body }) {
  const text = (body ?? '').trim()
  if (!text) return { data: null, error: new Error('empty') }
  const { data, error } = await supabase
    .from('coach_messages')
    .insert({ client_id: clientId, sender_id: senderId, body: text.slice(0, 4000) })
    .select(COLS)
    .single()
  if (error) console.error('Send message error:', error)
  return { data, error }
}

// Mark everything the other person sent in this thread as read.
export async function markThreadRead({ clientId, readerId }) {
  const { error } = await supabase
    .from('coach_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('client_id', clientId)
    .neq('sender_id', readerId)
    .is('read_at', null)
  if (error) console.error('Mark read error:', error)
  return { error }
}

// Unread messages sent to this user, per client thread: { [clientId]: count }.
// Coaches pass no clientId (all their clients); a client passes their own client id.
export async function fetchUnreadCounts({ readerId, clientId } = {}) {
  let q = supabase.from('coach_messages').select('client_id').neq('sender_id', readerId).is('read_at', null)
  if (clientId) q = q.eq('client_id', clientId)
  const { data, error } = await q
  if (error) {
    console.error('Unread count error:', error)
    return {}
  }
  return (data ?? []).reduce((acc, m) => ({ ...acc, [m.client_id]: (acc[m.client_id] || 0) + 1 }), {})
}

// Latest message per thread for an inbox list: { [clientId]: message }.
export async function fetchLatestPerThread(clientIds) {
  if (!clientIds?.length) return {}
  const { data, error } = await supabase
    .from('coach_messages')
    .select(COLS)
    .in('client_id', clientIds)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) {
    console.error('Inbox load error:', error)
    return {}
  }
  const latest = {}
  for (const m of data ?? []) if (!latest[m.client_id]) latest[m.client_id] = m
  return latest
}

// Latest thing that happened in each conversation, for the coach's inbox preview: a
// message, a weekly check-in (or the coach's reply to one), or a daily check-in. Same shape as a message: { client_id, body, created_at, sender_id }.
// sender_id is the coach's id for things the coach sent, otherwise null.
export async function fetchLatestActivity(clientIds, coachId) {
  if (!clientIds?.length) return {}
  const [latestMsgs, weekly, daily] = await Promise.all([
    fetchLatestPerThread(clientIds),
    supabase.from('checkins').select('client_id, submitted_at, notes, training_score, energy_score, coach_reply, replied_at')
      .in('client_id', clientIds).order('submitted_at', { ascending: false }).limit(300),
    supabase.from('daily_checkins').select('client_id, created_at, note, energy, sleep, soreness')
      .in('client_id', clientIds).order('created_at', { ascending: false }).limit(300),
  ])
  if (weekly.error) console.error('Inbox check-ins error:', weekly.error)
  if (daily.error) console.error('Inbox daily check-ins error:', daily.error)

  const latest = { ...latestMsgs }
  const consider = (item) => {
    if (!item.created_at) return
    const cur = latest[item.client_id]
    if (!cur || new Date(item.created_at) > new Date(cur.created_at)) latest[item.client_id] = item
  }
  for (const c of weekly.data ?? []) {
    const scores = [c.training_score && `Training ${c.training_score}/5`, c.energy_score && `Energy ${c.energy_score}/5`].filter(Boolean).join(' · ')
    consider({ client_id: c.client_id, created_at: c.submitted_at, sender_id: null, body: `Weekly check-in: ${c.notes?.trim() || scores || 'sent'}` })
    if (c.coach_reply?.trim() && c.replied_at) consider({ client_id: c.client_id, created_at: c.replied_at, sender_id: coachId, body: c.coach_reply.trim() })
  }
  for (const d of daily.data ?? []) {
    consider({ client_id: d.client_id, created_at: d.created_at, sender_id: null, body: `Daily check-in: ${d.note?.trim() || dailyLine(d) || 'sent'}` })
  }
  return latest
}

// Live thread for one client: loads it, keeps it updated in real time, and marks the
// other person's messages read while it's open. Returns { messages, loading, send, error }.
export function useThread({ clientId, userId, active = true }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const seen = useRef(new Set())

  const add = useCallback((m) => {
    if (!m || seen.current.has(m.id)) return
    seen.current.add(m.id)
    setMessages((prev) => [...prev, m].sort((a, b) => (a.created_at < b.created_at ? -1 : 1)))
  }, [])

  useEffect(() => {
    if (!clientId || !userId || !active) return
    let cancelled = false
    seen.current = new Set()
    fetchThread(clientId).then(({ data, error: e }) => {
      if (cancelled) return
      data.forEach((m) => seen.current.add(m.id))
      setMessages(data)
      setError(e ? "Couldn't load messages." : null)
      setLoading(false)
      markThreadRead({ clientId, readerId: userId })
    })
    const channel = supabase
      .channel(`coach-messages-${clientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'coach_messages', filter: `client_id=eq.${clientId}` }, (payload) => {
        add(payload.new)
        if (payload.new?.sender_id !== userId) markThreadRead({ clientId, readerId: userId })
      })
      .subscribe()
    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [clientId, userId, active, add])

  const send = useCallback(async (body) => {
    const { data, error: e } = await sendMessage({ clientId, senderId: userId, body })
    if (data) add(data)
    return { ok: !e, error: e }
  }, [clientId, userId, add])

  return { messages, loading, error, send }
}

/* ---------- Check-ins in the chat ---------- */

const CHECKIN_COLS = 'id, client_id, submitted_at, training_score, energy_score, mood_score, notes, blocker, coach_reply, replied_at'
const DAILY_COLS = 'id, client_id, checkin_date, energy, sleep, soreness, note, created_at'
const EMPTY_NOTE = ['none', 'n/a', 'na', 'nil', 'no', '-', 'nothing']

// What the client wrote on a weekly check-in (blocker, else notes), or '' when they
// wrote nothing real ("none", "n/a"...). Shared by the coach screens and the chat.
export function checkinNote(ci) {
  const text = (ci?.blocker || ci?.notes || '').trim()
  return text && !EMPTY_NOTE.includes(text.toLowerCase()) ? text : ''
}

// The weekly check-in's scores, in the order they're shown. Mood only on older rows.
export const CHECKIN_SCORES = [
  { key: 'training_score', label: 'Training' },
  { key: 'energy_score', label: 'Energy' },
  { key: 'mood_score', label: 'Mood' },
]

// The daily check-in's scores as one line: "Energy 4 · Sleep 2 · Soreness 3".
export function dailyLine(d) {
  return [['energy', 'Energy'], ['sleep', 'Sleep'], ['soreness', 'Soreness']]
    .filter(([k]) => d?.[k] != null)
    .map(([k, label]) => `${label} ${d[k]}`)
    .join(' · ')
}

export async function fetchThreadCheckins(clientId) {
  const { data, error } = await supabase
    .from('checkins')
    .select(CHECKIN_COLS)
    .eq('client_id', clientId)
    .order('submitted_at', { ascending: false })
    .limit(100)
  if (error) console.error('Load check-ins for chat error:', error)
  return data ?? []
}

// Every daily check-in, with or without a note.
export async function fetchThreadDailyNotes(clientId) {
  const { data, error } = await supabase
    .from('daily_checkins')
    .select(DAILY_COLS)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) console.error('Load daily check-ins for chat error:', error)
  return data ?? []
}

// The coach's reply to a weekly check-in. Coaches may only write coach_reply and
// replied_at on checkins (column GRANT); anything else is rejected by Postgres.
// Used by the client profile and the chat.
export async function saveCheckinReply({ checkinId, text }) {
  const body = (text ?? '').trim()
  if (!body) return { data: null, error: new Error('empty') }
  const { data, error } = await supabase
    .from('checkins')
    .update({ coach_reply: body, replied_at: new Date().toISOString() })
    .eq('id', checkinId)
    .select(CHECKIN_COLS)
    .single()
  if (error) console.error('Check-in reply error:', error)
  return { data, error }
}

// One timeline, oldest first. viewer is 'client' or 'coach'; mine is true for what the
// viewer sent. Items:
//   { kind: 'message', m }            a coach_messages row
//   { kind: 'checkin', ci }           a weekly check-in, from the client at submitted_at
//   { kind: 'reply', ci }             the coach's reply to it, at replied_at
//   { kind: 'daily', d }              a daily check-in, at created_at
export function mergeTimeline({ messages = [], checkins = [], dailyCheckins = [], userId, viewer }) {
  const fromClient = viewer === 'client'
  const items = []
  for (const m of messages) items.push({ kind: 'message', key: m.id, at: m.created_at, mine: m.sender_id === userId, m })
  for (const ci of checkins) {
    if (!ci.submitted_at) continue
    items.push({ kind: 'checkin', key: `c${ci.id}`, at: ci.submitted_at, mine: fromClient, ci })
    if (ci.coach_reply?.trim()) {
      // Older replies have no replied_at: show them just after the check-in.
      const at = ci.replied_at || new Date(new Date(ci.submitted_at).getTime() + 1000).toISOString()
      items.push({ kind: 'reply', key: `r${ci.id}`, at, mine: !fromClient, ci })
    }
  }
  for (const d of dailyCheckins) {
    if (d.created_at) items.push({ kind: 'daily', key: `d${d.id}`, at: d.created_at, mine: fromClient, d })
  }
  return items.sort((a, b) => new Date(a.at) - new Date(b.at))
}

// The whole conversation for one client: live messages (useThread) plus check-ins,
// loaded once when it opens. replyToCheckin is for the coach. Returns
// { items, messages, checkins, loading, error, send, replyToCheckin }.
export function useConversation({ clientId, userId, viewer, active = true }) {
  const thread = useThread({ clientId, userId, active })
  const [checkins, setCheckins] = useState([])
  const [dailies, setDailies] = useState([])
  const [extrasFor, setExtrasFor] = useState(null) // clientId the check-ins were loaded for

  useEffect(() => {
    if (!clientId || !userId || !active) return
    let cancelled = false
    Promise.all([fetchThreadCheckins(clientId), fetchThreadDailyNotes(clientId)]).then(([c, d]) => {
      if (cancelled) return
      setCheckins(c)
      setDailies(d)
      setExtrasFor(clientId)
    })
    return () => { cancelled = true }
  }, [clientId, userId, active])

  const replyToCheckin = useCallback(async (checkinId, text) => {
    const { data, error } = await saveCheckinReply({ checkinId, text })
    if (data) setCheckins((prev) => prev.map((c) => (c.id === checkinId ? { ...c, ...data } : c)))
    return { ok: !error && !!data, error }
  }, [])

  const items = useMemo(
    () => mergeTimeline({ messages: thread.messages, checkins, dailyCheckins: dailies, userId, viewer }),
    [thread.messages, checkins, dailies, userId, viewer],
  )
  return { ...thread, items, checkins, loading: thread.loading || extrasFor !== clientId, replyToCheckin }
}

/* ---------- Client: unread check-in replies ---------- */

// When the client last opened Messages, per client, in this browser. A coach reply to a
// check-in newer than this counts as unread. Missing (new phone, cleared data): only replies
// from the last 7 days count, so a first open never shows a pile of old replies.
const openedKey = (clientId) => `unfnshd-messages-opened-${clientId}`
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function markConversationOpened(clientId) {
  try { localStorage.setItem(openedKey(clientId), new Date().toISOString()) } catch { /* storage blocked */ }
}

export function unseenReplyCount(checkins, clientId) {
  let opened = null
  try { opened = localStorage.getItem(openedKey(clientId)) } catch { /* storage blocked */ }
  const since = opened ? new Date(opened).getTime() : Date.now() - WEEK_MS
  return (checkins ?? []).filter((c) => c.coach_reply?.trim() && new Date(c.replied_at || c.submitted_at || 0).getTime() > since).length
}

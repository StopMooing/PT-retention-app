// Private messages between a client and their coach. One thread per client
// (coach_messages.client_id). Used by both the client app and the coach side so they
// behave the same. Row level security limits every read and write to the client and
// their coach; only read_at can be changed after sending.
import { useCallback, useEffect, useRef, useState } from 'react'
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

// One coach to client conversation. Used by the Messages inbox and the client profile so
// both behave the same. The timeline (messages plus the client's check-ins) comes from
// useConversation, the same one the client app uses. On a weekly check-in without a
// reply, "Reply to check-in" puts the composer in reply mode: sending then saves the
// check-in reply (checkins.coach_reply) instead of a message.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Send, MessageSquare, CornerDownRight, X } from 'lucide-react'
import { useConversation, markThreadRead, checkinNote } from '../../lib/messages'
import { CheckinChatCard, DailyChatCard, ReplyLabel } from '../../lib/CheckinChatCards'
import { Mark, Button } from '../../ui'
import { dayOf, messageDayLabel, clockTime, firstName, formatDate } from '../lib'
import { emit, READ } from './events'

const cx = (...c) => c.filter(Boolean).join(' ')
const GROUP_MS = 5 * 60 * 1000
const isCard = (it) => it?.kind === 'checkin' || it?.kind === 'daily'

// Split into days, and mark the last bubble of each run from one side (it shows the
// time). Check-in cards always stand on their own.
function layout(items) {
  const out = []
  let lastDay = null
  items.forEach((it, i) => {
    const d = dayOf(it.at)
    if (d !== lastDay) { out.push({ type: 'day', key: `day${d}`, label: messageDayLabel(it.at) }); lastDay = d }
    const next = items[i + 1]
    const prev = items[i - 1]
    const apart = (a, b) => !a || !b || a.mine !== b.mine || isCard(a) || isCard(b) || dayOf(a.at) !== dayOf(b.at) || Math.abs(new Date(a.at) - new Date(b.at)) > GROUP_MS
    out.push({ type: 'item', key: it.key, it, endsRun: apart(it, next), startsRun: apart(prev, it) })
  })
  return out
}

export default function Thread({ clientId, userId, clientName = '', onChange, className, autoFocus = false, replyCheckinId = null }) {
  const { items, messages, checkins, loading, error, send, replyToCheckin } = useConversation({ clientId, userId, viewer: 'coach' })
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [replyTo, setReplyTo] = useState(replyCheckinId) // check-in id while in reply mode
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const first = firstName(clientName) || 'your client'
  // Reply mode only for a check-in that still has no reply.
  const replyCi = replyTo ? checkins.find((c) => c.id === replyTo && !c.coach_reply?.trim()) ?? null : null

  // Keep the newest item in view. Opened from "Reply" on the dashboard: show that check-in.
  const shownReplyCard = useRef(false)
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || loading) return
    if (replyCheckinId && !shownReplyCard.current) {
      shownReplyCard.current = true
      const card = el.querySelector(`[data-item="c${replyCheckinId}"]`)
      if (card) { card.scrollIntoView({ block: 'center' }); return }
    }
    el.scrollTop = el.scrollHeight
  }, [items.length, loading, replyCheckinId])

  // Tell the rest of the coach app when this thread is read, so badges clear. useThread
  // marks read too; this second call is awaited so the badge refresh sees the change.
  const last = messages[messages.length - 1]
  const markedOnce = useRef(false)
  useEffect(() => {
    if (loading || !clientId || !userId) return
    onChange?.(messages)
    // After the first load, only the other person's new messages need marking.
    if (markedOnce.current && (!last || last.sender_id === userId)) return
    markedOnce.current = true
    markThreadRead({ clientId, readerId: userId }).then(() => emit(READ, { clientId }))
    // onChange is a callback from the parent; re-running on its identity is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, last?.id, clientId, userId])

  useEffect(() => {
    // Computers only: on a phone it would throw the keyboard up over the thread.
    if ((autoFocus || replyCheckinId) && !loading && window.matchMedia('(hover: hover)').matches) inputRef.current?.focus({ preventScroll: true })
  }, [autoFocus, replyCheckinId, loading])

  // Grow the box with the text, up to about five lines.
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }, [draft])

  function startReply(id) {
    setReplyTo(id)
    setSendError(null)
    inputRef.current?.focus({ preventScroll: true })
  }

  function cancelReply() {
    setReplyTo(null)
    setSendError(null)
  }

  async function submit() {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setSendError(null)
    const { ok } = replyCi ? await replyToCheckin(replyCi.id, text) : await send(text)
    setSending(false)
    if (ok) {
      setDraft('')
      setReplyTo(null)
    } else {
      setSendError(replyCi ? "Couldn't send your reply. Check your connection and try again." : "Couldn't send. Check your connection and try again.")
    }
    inputRef.current?.focus({ preventScroll: true })
  }

  function onKeyDown(e) {
    // Enter sends on a computer. On a phone Enter adds a new line and the button sends.
    const touch = window.matchMedia('(hover: none)').matches
    if (e.key === 'Enter' && !e.shiftKey && !touch && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
    if (e.key === 'Escape' && replyCi) cancelReply()
  }

  const rows = layout(items)
  const lastMine = [...messages].reverse().find((m) => m.sender_id === userId)

  function renderItem(it, endsRun) {
    if (it.kind === 'checkin') {
      const open = !it.ci.coach_reply?.trim()
      const replying = replyCi?.id === it.ci.id
      return (
        <CheckinChatCard
          ci={it.ci}
          mine={it.mine}
          footer={open && (
            replying
              ? <p className="text-[13px] font-bold text-accent inline-flex items-center gap-1.5"><CornerDownRight size={15} /> Replying below</p>
              : <Button variant="soft" size="sm" onClick={() => startReply(it.ci.id)}><CornerDownRight size={16} /> Reply to check-in</Button>
          )}
        />
      )
    }
    if (it.kind === 'daily') return <DailyChatCard d={it.d} mine={it.mine} />
    const text = it.kind === 'reply' ? it.ci.coach_reply : it.m.body
    return (
      <p
        className={cx(
          'max-w-[82%] md:max-w-[70%] px-3.5 py-2 text-[15px] leading-snug whitespace-pre-wrap break-words rounded-[18px]',
          it.mine ? 'bg-accent text-on-accent' : 'bg-surface text-ink border border-line',
          it.mine && endsRun && 'rounded-br-[6px]',
          !it.mine && endsRun && 'rounded-bl-[6px]',
        )}
      >
        {it.kind === 'reply' && <ReplyLabel />}
        {text}
      </p>
    )
  }

  const replySummary = replyCi ? [formatDate(replyCi.submitted_at, { weekday: 'short', day: 'numeric', month: 'short' }), checkinNote(replyCi)].filter(Boolean).join(' · ') : ''

  return (
    <div className={cx('flex flex-col min-h-0 bg-bg', className)}>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 md:px-5 py-4" aria-live="polite">
        {loading ? (
          <div className="h-full flex items-center justify-center" role="status" aria-label="Loading messages">
            <Mark size={32} className="text-ink animate-pulse" />
          </div>
        ) : error && items.length === 0 ? (
          <p className="text-[15px] text-bad text-center py-10">{error}</p>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <span className="w-12 h-12 rounded-full bg-surface-2 text-muted flex items-center justify-center mb-3">
              <MessageSquare size={22} />
            </span>
            <p className="font-bold text-ink">Start the conversation</p>
            <p className="text-sm text-muted mt-1 max-w-xs">Messages you send here show up in {first}'s app.</p>
          </div>
        ) : (
          <ol className="flex flex-col">
            {rows.map((r) => {
              if (r.type === 'day') {
                return (
                  <li key={r.key} className="flex justify-center my-3 first:mt-0">
                    <span className="px-3 h-6 inline-flex items-center rounded-full bg-surface-2 text-xs font-bold text-muted">{r.label}</span>
                  </li>
                )
              }
              const { it } = r
              return (
                <li key={r.key} data-item={it.key} className={cx('flex flex-col', it.mine ? 'items-end' : 'items-start', r.startsRun ? 'mt-2' : 'mt-0.5')}>
                  {renderItem(it, r.endsRun)}
                  {r.endsRun && (
                    <span className="text-[11px] text-faint mt-1 px-1 tabular-nums">
                      {clockTime(it.at)}
                      {it.kind === 'message' && it.mine && lastMine?.id === it.m.id && it.m.read_at ? ' · Seen' : ''}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); submit() }}
        className="shrink-0 border-t border-line bg-surface px-3 md:px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),10px)]"
      >
        {replyCi && (
          <div className="flex items-center gap-2.5 mb-2.5 pl-3.5 pr-1 py-1.5 rounded-[16px] bg-accent-soft">
            <CornerDownRight size={17} className="text-accent shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-accent leading-tight">Replying to {first}'s weekly check-in</p>
              {replySummary && <p className="text-[12px] text-muted truncate mt-0.5">{replySummary}</p>}
            </div>
            <button type="button" onClick={cancelReply} aria-label="Cancel reply" className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-accent hover:bg-surface-2">
              <X size={18} />
            </button>
          </div>
        )}
        {sendError && <p className="text-[13px] text-bad mb-2 px-1">{sendError}</p>}
        <div className="flex items-end gap-2">
          <label className="flex-1 min-w-0">
            <span className="sr-only">{replyCi ? `Reply to ${first}'s check-in` : `Message ${first}`}</span>
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={4000}
              placeholder={replyCi ? `Reply to ${first}'s check-in` : `Message ${first}`}
              className="block w-full min-h-[44px] max-h-[132px] px-4 py-[10px] rounded-[22px] border border-line-strong bg-surface text-ink text-base md:text-[15px] leading-snug placeholder:text-faint outline-none focus:border-accent transition-colors resize-none"
            />
          </label>
          <button
            type="submit"
            disabled={!draft.trim() || sending || loading}
            aria-label={replyCi ? 'Send reply' : 'Send'}
            className="w-11 h-11 shrink-0 rounded-full bg-accent text-on-accent flex items-center justify-center transition-opacity disabled:opacity-40 hover:bg-accent-strong"
          >
            <Send size={19} />
          </button>
        </div>
      </form>
    </div>
  )
}

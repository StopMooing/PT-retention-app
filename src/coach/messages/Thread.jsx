// One coach to client conversation. Used by the Messages inbox and the client profile so
// both behave the same. Loading, live updates and "mark read" come from useThread.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { useThread, markThreadRead } from '../../lib/messages'
import { Mark } from '../../ui'
import { dayOf, messageDayLabel, clockTime, firstName } from '../lib'
import { emit, READ } from './events'

const cx = (...c) => c.filter(Boolean).join(' ')
const GROUP_MS = 5 * 60 * 1000

// Split into days, and mark the last bubble of each run from one sender (it shows the time).
function layout(messages) {
  const out = []
  let lastDay = null
  messages.forEach((m, i) => {
    const d = dayOf(m.created_at)
    if (d !== lastDay) { out.push({ type: 'day', key: `d${d}`, label: messageDayLabel(m.created_at) }); lastDay = d }
    const next = messages[i + 1]
    const prev = messages[i - 1]
    const endsRun = !next || next.sender_id !== m.sender_id || dayOf(next.created_at) !== d || new Date(next.created_at) - new Date(m.created_at) > GROUP_MS
    const startsRun = !prev || prev.sender_id !== m.sender_id || dayOf(prev.created_at) !== d || new Date(m.created_at) - new Date(prev.created_at) > GROUP_MS
    out.push({ type: 'msg', key: m.id, m, endsRun, startsRun })
  })
  return out
}

export default function Thread({ clientId, userId, clientName = '', onChange, className, autoFocus = false }) {
  const { messages, loading, error, send } = useThread({ clientId, userId })
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const first = firstName(clientName) || 'your client'

  // Keep the newest message in view.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, loading])

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
    if (autoFocus && !loading && window.matchMedia('(hover: hover)').matches) inputRef.current?.focus({ preventScroll: true })
  }, [autoFocus, loading])

  // Grow the box with the text, up to about five lines.
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }, [draft])

  async function submit() {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setSendError(null)
    const { ok } = await send(text)
    setSending(false)
    if (ok) setDraft('')
    else setSendError("Couldn't send. Check your connection and try again.")
    inputRef.current?.focus({ preventScroll: true })
  }

  function onKeyDown(e) {
    // Enter sends on a computer. On a phone Enter adds a new line and the button sends.
    const touch = window.matchMedia('(hover: none)').matches
    if (e.key === 'Enter' && !e.shiftKey && !touch && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  const rows = layout(messages)
  const lastMine = [...messages].reverse().find((m) => m.sender_id === userId)

  return (
    <div className={cx('flex flex-col min-h-0 bg-bg', className)}>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 md:px-5 py-4" aria-live="polite">
        {loading ? (
          <div className="h-full flex items-center justify-center" role="status" aria-label="Loading messages">
            <Mark size={32} className="text-ink animate-pulse" />
          </div>
        ) : error && messages.length === 0 ? (
          <p className="text-[15px] text-bad text-center py-10">{error}</p>
        ) : messages.length === 0 ? (
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
              const mine = r.m.sender_id === userId
              return (
                <li key={r.key} className={cx('flex flex-col', mine ? 'items-end' : 'items-start', r.startsRun ? 'mt-2' : 'mt-0.5')}>
                  <p
                    className={cx(
                      'max-w-[82%] md:max-w-[70%] px-3.5 py-2 text-[15px] leading-snug whitespace-pre-wrap break-words rounded-[18px]',
                      mine ? 'bg-accent text-on-accent' : 'bg-surface text-ink border border-line',
                      mine && r.endsRun && 'rounded-br-[6px]',
                      !mine && r.endsRun && 'rounded-bl-[6px]',
                    )}
                  >
                    {r.m.body}
                  </p>
                  {r.endsRun && (
                    <span className="text-[11px] text-faint mt-1 px-1 tabular-nums">
                      {clockTime(r.m.created_at)}
                      {mine && lastMine?.id === r.m.id && r.m.read_at ? ' · Seen' : ''}
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
        {sendError && <p className="text-[13px] text-bad mb-2 px-1">{sendError}</p>}
        <div className="flex items-end gap-2">
          <label className="flex-1 min-w-0">
            <span className="sr-only">Message {first}</span>
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={4000}
              placeholder={`Message ${first}`}
              className="block w-full min-h-[44px] max-h-[132px] px-4 py-[10px] rounded-[22px] border border-line-strong bg-surface text-ink text-base md:text-[15px] leading-snug placeholder:text-faint outline-none focus:border-accent transition-colors resize-none"
            />
          </label>
          <button
            type="submit"
            disabled={!draft.trim() || sending || loading}
            aria-label="Send"
            className="w-11 h-11 shrink-0 rounded-full bg-accent text-on-accent flex items-center justify-center transition-opacity disabled:opacity-40 hover:bg-accent-strong"
          >
            <Send size={19} />
          </button>
        </div>
      </form>
    </div>
  )
}

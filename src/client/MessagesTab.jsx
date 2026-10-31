// Messages: the private thread between the client and their coach. Uses the shared
// useThread (src/lib/messages.js), which loads it, keeps it live and marks the coach's
// messages read while this screen is open. Only shown to clients with a coach.
import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useThread } from '../lib/messages'
import { CoachAvatar, Loading } from './common'
import { toLocalDateStr, chatDayLabel, clockTime } from './dates'

const cx = (...c) => c.filter(Boolean).join(' ')

// Messages grouped by local day, oldest first: [{ day, items }].
function byDay(messages) {
  const out = []
  for (const m of messages) {
    const day = toLocalDateStr(new Date(m.created_at))
    if (out[out.length - 1]?.day !== day) out.push({ day, items: [] })
    out[out.length - 1].items.push(m)
  }
  return out
}

export default function MessagesTab({ clientId, userId, coachName, onLatestCoachMessage }) {
  const { messages, loading, error, send } = useThread({ clientId, userId })
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const endRef = useRef(null)
  const name = coachName || 'your coach'

  // Newest at the bottom, in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, loading])

  // Keep Home's "Your coach" card up to date with what arrives here.
  useEffect(() => {
    const latest = [...messages].reverse().find((m) => m.sender_id !== userId)
    if (latest) onLatestCoachMessage?.(latest)
  }, [messages, userId, onLatestCoachMessage])

  async function submit() {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setSendError(null)
    const { ok } = await send(body)
    setSending(false)
    if (ok) setDraft('')
    else setSendError("Couldn't send. Check your signal and try again.")
  }

  // Enter sends on a keyboard; on a phone Enter is a new line and the button sends.
  function onKeyDown(e) {
    const finePointer = typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches
    if (e.key === 'Enter' && !e.shiftKey && finePointer) {
      e.preventDefault()
      submit()
    }
  }

  const today = toLocalDateStr()
  return (
    <div className="min-h-[calc(100vh-128px)] flex flex-col">
      <header className="sticky top-0 z-20 bg-bg border-b border-line px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3 flex items-center gap-3">
        <CoachAvatar name={coachName} size={44} />
        <div className="min-w-0">
          <h1 className="text-[19px] font-bold text-ink leading-tight truncate">{coachName || 'Your coach'}</h1>
          <p className="text-[13px] text-muted">Your coach</p>
        </div>
      </header>

      <div className="flex-1 px-4 pt-4 pb-6">
        {loading ? (
          <Loading />
        ) : error && messages.length === 0 ? (
          <p className="text-[15px] text-muted text-center py-16">{error} Try again in a moment.</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 px-6">
            <span className="inline-flex mb-3"><CoachAvatar name={coachName} size={56} /></span>
            <p className="text-[17px] font-bold text-ink">Say hi to {name}.</p>
            <p className="text-[15px] text-muted mt-1">Questions, wins, form checks, anything.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {byDay(messages).map((g) => (
              <section key={g.day} className="space-y-1.5">
                <p className="text-center text-[12px] font-bold text-faint py-1">{chatDayLabel(g.day, today)}</p>
                {g.items.map((m, i) => {
                  const mine = m.sender_id === userId
                  const nextSame = g.items[i + 1]?.sender_id === m.sender_id
                  return (
                    <div key={m.id} className={cx('flex flex-col', mine ? 'items-end' : 'items-start')}>
                      <p
                        className={cx(
                          'max-w-[80%] px-3.5 py-2.5 text-[15px] leading-snug whitespace-pre-wrap break-words rounded-[20px]',
                          mine ? 'bg-accent text-on-accent rounded-br-[6px]' : 'bg-surface text-ink border border-line rounded-bl-[6px]',
                        )}
                      >
                        {m.body}
                      </p>
                      {!nextSame && <span className="text-[11px] text-faint mt-1 px-1">{clockTime(m.created_at)}</span>}
                    </div>
                  )
                })}
              </section>
            ))}
          </div>
        )}
        <div ref={endRef} style={{ scrollMarginBottom: 150 }} />
      </div>

      {/* Composer, just above the tab bar. */}
      <div className="fixed inset-x-0 z-20 bg-bg border-t border-line" style={{ bottom: 'calc(57px + env(safe-area-inset-bottom))' }}>
        <div className="max-w-[480px] mx-auto px-4 py-2.5">
          {sendError && <p role="alert" className="text-[13px] font-semibold text-bad mb-1.5">{sendError}</p>}
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              maxLength={4000}
              aria-label={`Message ${name}`}
              placeholder={`Message ${name}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              className="flex-1 min-h-[44px] max-h-32 rounded-[22px] border border-line-strong bg-surface text-ink placeholder:text-faint px-4 py-2.5 text-[15px] outline-none focus:border-accent resize-none field-sizing-content"
            />
            <button
              onClick={submit}
              disabled={!draft.trim() || sending}
              aria-label="Send"
              className="w-11 h-11 rounded-full bg-accent text-on-accent flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
            >
              <ArrowUp size={20} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

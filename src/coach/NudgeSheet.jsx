// Reach out to one client, or a whole group, with a ready-made message that fits why
// they are slipping. Messages land in each client's chat in the app; a single client
// can be texted instead. Clients who have not set up their account can only be texted.
import { useMemo, useState } from 'react'
import { Send, MessageCircle, Check } from 'lucide-react'
import { Sheet, Button, Avatar } from '../ui'
import { sendMessage } from '../lib/messages'
import { NUDGES, NAME_TOKEN, nudgeKind, nudgeReason, personalise, firstName } from './lib'

// Fresh state each time it opens (keyed by who it is for).
export default function NudgeSheet(props) {
  if (!props.open) return null
  return <NudgeBody key={(props.clients ?? []).map((c) => c.id).join()} {...props} />
}

function NudgeBody({ onClose, clients, coachId, onSent }) {
  const list = useMemo(() => clients ?? [], [clients])
  const single = list.length === 1 ? list[0] : null
  // A group gets the templates for the most common situation in it.
  const kind = useMemo(() => {
    const counts = {}
    for (const c of list) { const k = nudgeKind(c); counts[k] = (counts[k] || 0) + 1 }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'general'
  }, [list])
  const templates = NUDGES[kind]
  const [pick, setPick] = useState(0)
  const [text, setText] = useState(() => (single ? personalise(templates[0].body, single.full_name) : templates[0].body))
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const reachable = list.filter((c) => c.user_id)
  const unreachable = list.filter((c) => !c.user_id)
  const phone = single?.phone?.replace(/\s+/g, '')

  function choose(i) {
    setPick(i)
    setText(single ? personalise(templates[i].body, single.full_name) : templates[i].body)
  }

  async function send() {
    if (!text.trim() || reachable.length === 0) return
    setSending(true)
    setError(null)
    const sent = []
    for (const c of reachable) {
      const { data, error: err } = await sendMessage({ clientId: c.id, senderId: coachId, body: personalise(text, c.full_name) })
      if (err) { setError(`Could not send to ${firstName(c.full_name)}. Try again.`); break }
      sent.push(data)
    }
    setSending(false)
    if (sent.length) onSent?.(sent)
    if (sent.length === reachable.length) onClose()
  }

  const title = single ? `Reach out to ${firstName(single.full_name)}` : `Message ${list.length} clients`
  const reason = single ? nudgeReason(single) : null

  return (
    <Sheet open onClose={onClose} title={title}>
      <div className="space-y-4">
        {single ? (
          reason && <p className="text-[14px] text-muted -mt-1">{reason}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {list.slice(0, 6).map((c) => <Avatar key={c.id} name={c.full_name} src={c.profile_photo_url} size={32} />)}
            {list.length > 6 && <span className="pl-1 text-[13px] font-bold text-muted">+{list.length - 6}</span>}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {templates.map((t, i) => (
            <button
              key={t.label}
              onClick={() => choose(i)}
              aria-pressed={pick === i}
              className={`h-9 px-3.5 rounded-full text-[13px] font-bold inline-flex items-center gap-1.5 transition-colors ${pick === i ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted hover:text-ink'}`}
            >
              {pick === i && <Check size={14} />}{t.label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="sr-only">Message</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full rounded-[16px] border border-line-strong bg-surface px-4 py-3 text-[15px] text-ink leading-relaxed outline-none focus:border-accent resize-none"
          />
        </label>
        {!single && text.includes(NAME_TOKEN) && (
          <p className="text-[13px] text-muted -mt-2">{NAME_TOKEN} becomes each client's first name.</p>
        )}

        {unreachable.length > 0 && (
          <p className="text-[13px] text-muted bg-surface-2 rounded-[14px] px-4 py-3">
            {single
              ? `${firstName(single.full_name)} hasn't set up their account yet, so a text is the way to reach them.`
              : `Not set up in the app yet, so they won't get this: ${unreachable.map((c) => firstName(c.full_name)).join(', ')}. Text them their invite link instead.`}
          </p>
        )}
        {error && <p className="text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-2.5">
          {reachable.length > 0 && (
            <Button size="lg" block onClick={send} disabled={sending || !text.trim()}>
              <Send size={18} /> {sending ? 'Sending' : single ? 'Send in the app' : `Send to ${reachable.length}`}
            </Button>
          )}
          {single && phone && (
            <a
              href={`sms:${phone}?&body=${encodeURIComponent(text)}`}
              className="h-12 px-5 rounded-full border border-line-strong text-ink text-[15px] font-bold inline-flex items-center justify-center gap-2 hover:bg-surface-2 w-full"
            >
              <MessageCircle size={18} /> Text instead
            </a>
          )}
        </div>
      </div>
    </Sheet>
  )
}

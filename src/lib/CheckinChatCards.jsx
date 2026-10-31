// Check-ins as they appear in the chat, on both the client and the coach side, so the
// two always look the same. The timeline itself comes from useConversation
// (src/lib/messages.js). mine: the viewer sent it (right side), else left.
import { ClipboardCheck, Sun } from 'lucide-react'
import { CHECKIN_SCORES, checkinNote, dailyLine } from './messages'

const cx = (...c) => c.filter(Boolean).join(' ')

function ScoreRow({ label, score }) {
  const s = Number(score) || 0
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[62px] text-[13px] text-muted shrink-0">{label}</span>
      <span className="flex gap-1 flex-1 min-w-[80px]" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={cx('h-2 flex-1 rounded-full', n <= s ? 'bg-accent' : 'bg-surface-2')} />
        ))}
      </span>
      <span className="text-[13px] font-bold text-ink tabular-nums w-7 text-right" aria-label={`${label} ${s} out of 5`}>{s || '-'}/5</span>
    </div>
  )
}

/* A weekly check-in: title, the scores as small bars, the client's note. footer: the
   coach's "Reply to check-in" button, when there is one. */
export function CheckinChatCard({ ci, mine, footer }) {
  const note = checkinNote(ci)
  return (
    <div
      className={cx(
        'w-[82%] max-w-[340px] rounded-[18px] border border-line bg-surface px-3.5 pt-3 pb-3.5',
        mine ? 'rounded-br-[6px]' : 'rounded-bl-[6px]',
      )}
    >
      <p className="flex items-center gap-1.5 text-[13px] font-bold text-accent">
        <ClipboardCheck size={15} strokeWidth={2.4} /> Weekly check-in
      </p>
      <div className="mt-2.5 space-y-1.5">
        {CHECKIN_SCORES.filter((s) => ci[s.key] != null).map((s) => (
          <ScoreRow key={s.key} label={s.label} score={ci[s.key]} />
        ))}
      </div>
      {note && <p className="mt-3 text-[15px] text-ink leading-snug whitespace-pre-wrap break-words">{note}</p>}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  )
}

/* A daily check-in with a note: the three scores in one line, then the note. */
export function DailyChatCard({ d, mine }) {
  return (
    <div
      className={cx(
        'max-w-[82%] rounded-[18px] border border-line bg-surface px-3.5 py-2.5',
        mine ? 'rounded-br-[6px]' : 'rounded-bl-[6px]',
      )}
    >
      <p className="flex items-center gap-1.5 text-[12px] font-bold text-muted tabular-nums">
        <Sun size={13} strokeWidth={2.4} className="shrink-0" /> Today: {dailyLine(d)}
      </p>
      <p className="mt-1 text-[15px] text-ink leading-snug whitespace-pre-wrap break-words">{d.note}</p>
    </div>
  )
}

/* The small label at the top of a coach reply bubble. */
export function ReplyLabel() {
  return <span className="block text-[11px] font-bold opacity-75 mb-0.5">Re: weekly check-in</span>
}

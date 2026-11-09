// The coach's own weekly check-in questions. Every client of this coach sees them in their
// weekly check-in, after the built-in ones; answers show on the check-in, next to the reply.
import { useEffect, useState } from 'react'
import { Trash2, Plus, Check } from 'lucide-react'
import { supabase } from '../supabase'
import { Sheet, Button, Segmented, Chip } from '../ui'
import { MAX_QUESTIONS, BUILT_IN, KINDS, fetchQuestions, addQuestion, removeQuestion } from '../lib/checkinQuestions'

function Editor({ onClose }) {
  const [coachId, setCoachId] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [text, setText] = useState('')
  const [kind, setKind] = useState('text')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let live = true
    supabase.auth.getUser()
      .then(({ data }) => { const id = data?.user?.id ?? null; if (live) setCoachId(id); return fetchQuestions(id) })
      .then((q) => live && setQuestions(q))
      .catch((e) => { console.error('Check-in questions load error:', e); if (live) { setQuestions([]); setError("Couldn't load your questions. Close this and try again.") } })
    return () => { live = false }
  }, [])

  async function add() {
    if (!text.trim() || !coachId) return
    setBusy(true)
    setError(null)
    const last = questions.length ? questions[questions.length - 1].position : 0
    const res = await addQuestion(coachId, text, kind, last + 1)
    setBusy(false)
    if (res.error) { console.error('Add question error:', res.error); setError("Couldn't add that question. Try again."); return }
    setQuestions((q) => [...q, res.row])
    setText('')
    setKind('text')
  }

  async function remove(q) {
    setBusy(true)
    setError(null)
    const res = await removeQuestion(q.id)
    setBusy(false)
    if (res.error) { console.error('Remove question error:', res.error); setError("Couldn't remove that question. Try again."); return }
    setQuestions((list) => list.filter((x) => x.id !== q.id))
  }

  const full = questions && questions.length >= MAX_QUESTIONS

  return (
    <Sheet open onClose={onClose} title="Check-in questions">
      <p className="text-[14px] text-muted -mt-1 mb-4">Add your own questions to every client's weekly check-in. Their answers show on the check-in, right where you reply. Past check-ins keep the questions they were asked.</p>

      <p className="text-[13px] font-semibold text-muted mb-1.5">Always asked</p>
      <ul className="rounded-[16px] bg-surface-2 px-4 py-2.5 mb-5 space-y-1">
        {BUILT_IN.map((q) => (
          <li key={q} className="flex items-center gap-2 text-[14px] text-ink"><Check size={14} className="text-muted shrink-0" />{q}</li>
        ))}
      </ul>

      <p className="text-[13px] font-semibold text-muted mb-1.5">Your questions{questions ? ` (${questions.length} of ${MAX_QUESTIONS})` : ''}</p>
      {questions === null ? (
        <div className="h-16 rounded-[16px] bg-surface-2 animate-pulse" />
      ) : (
        <>
          {questions.length > 0 && (
            <ul className="rounded-[16px] border border-line divide-y divide-line mb-4">
              {questions.map((q) => (
                <li key={q.id} className="flex items-center gap-3 pl-4 pr-1.5 py-2">
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-semibold text-ink">{q.question}</span>
                    <Chip className="mt-1">{KINDS.find((k) => k.value === q.kind)?.label}</Chip>
                  </span>
                  <button onClick={() => remove(q)} disabled={busy} aria-label={`Remove "${q.question}"`} className="w-10 h-10 rounded-full flex items-center justify-center text-faint hover:text-bad hover:bg-surface-2 shrink-0">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {full ? (
            <p className="text-[14px] text-muted">That's the most questions a check-in can have. Remove one to add another. Short check-ins get answered.</p>
          ) : (
            <div className="space-y-2.5">
              <input
                value={text} maxLength={200} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') add() }}
                placeholder="For example: How was your sleep?"
                className="w-full h-12 px-4 rounded-[14px] border border-line-strong bg-surface text-[15px] text-ink placeholder:text-faint outline-none focus:border-accent"
              />
              <div className="flex items-center gap-2">
                <Segmented className="flex-1" value={kind} onChange={setKind} options={KINDS} />
                <Button onClick={add} disabled={busy || !text.trim()}><Plus size={16} /> Add</Button>
              </div>
            </div>
          )}
        </>
      )}
      {error && <p role="alert" className="text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3 mt-4">{error}</p>}
    </Sheet>
  )
}

export default function CheckinQuestionsSheet({ open, onClose }) {
  return open ? <Editor onClose={onClose} /> : null
}

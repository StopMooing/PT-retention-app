// The weekly check-in ("Your week in review"), in a sheet. Saves to checkins. After the
// built-in questions come the coach's own (if they added any); those answers are saved on
// the check-in as a snapshot. Scale is shared with the daily check-in.
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Sheet, Button } from '../ui'
import { fetchQuestions, toAnswers } from '../lib/checkinQuestions'

export function Scale({ label, low, high, value, onChange }) {
  return (
    <div>
      <p className="text-[15px] font-bold text-ink mb-2">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            aria-label={`${label} ${n} of 5`}
            className={`flex-1 h-12 rounded-[14px] border text-[17px] font-bold tabular-nums transition-colors ${value === n ? 'bg-ink text-bg border-ink' : 'border-line-strong text-ink hover:bg-surface-2'}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted mt-1.5 px-1">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

export default function CheckinSheet({ open, onClose, client, onSaved }) {
  const [training, setTraining] = useState(0)
  const [energy, setEnergy] = useState(0)
  const [blocker, setBlocker] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const coachId = client?.pt_id

  // The coach's questions, loaded once (a client without a coach has none).
  useEffect(() => {
    if (!coachId) return
    let live = true
    fetchQuestions(coachId).then((q) => live && setQuestions(q)).catch((e) => console.error('Check-in questions load error:', e))
    return () => { live = false }
  }, [coachId])

  async function submit() {
    if (!client || training === 0 || energy === 0) return
    setSaving(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('checkins')
      .insert({ client_id: client.id, training_score: training, energy_score: energy, blocker: blocker.trim() || null, answers: toAnswers(questions, answers) })
      .select()
      .single()
    setSaving(false)
    if (err) {
      // The 24h limit is enforced by checkin_rate_ok() inside the RLS policy, so a repeat
      // submission surfaces as a policy violation rather than a friendly message.
      console.error('Check-in error:', err)
      const isRateLimit = (err.message || '').toLowerCase().includes('row-level security')
      setError(isRateLimit ? "You've already checked in today. You can send another tomorrow." : "Couldn't send your check-in. Try again in a moment.")
      return
    }
    onSaved(data)
    setTraining(0)
    setEnergy(0)
    setBlocker('')
    setAnswers({})
  }

  return (
    <Sheet
      open={open}
      onClose={() => { setError(null); onClose() }}
      title="Your week in review"
      footer={
        <Button size="lg" block onClick={submit} disabled={saving || training === 0 || energy === 0}>
          {saving ? 'Sending...' : client?.pt_id ? 'Send to your coach' : 'Save check-in'}
        </Button>
      }
    >
      <div className="space-y-6 pt-1">
        <Scale label="How did training go?" low="Tough week" high="Great week" value={training} onChange={setTraining} />
        <Scale label="How was your energy?" low="Flat" high="Full of it" value={energy} onChange={setEnergy} />
        <label className="block">
          <span className="text-[15px] font-bold text-ink">Anything getting in the way?</span>
          <textarea
            rows={3}
            placeholder="Optional. Sleep, work, soreness, anything."
            value={blocker}
            onChange={(e) => setBlocker(e.target.value)}
            className="mt-2 w-full rounded-[14px] border border-line-strong bg-surface text-ink placeholder:text-faint px-4 py-3 outline-none focus:border-accent resize-none"
          />
        </label>
        {questions.map((q) => (
          q.kind === 'scale' ? (
            <Scale key={q.id} label={q.question} low="Low" high="High" value={answers[q.id] ?? 0} onChange={(n) => setAnswers((a) => ({ ...a, [q.id]: n }))} />
          ) : (
            <label key={q.id} className="block">
              <span className="text-[15px] font-bold text-ink">{q.question}</span>
              <textarea
                rows={2}
                maxLength={1000}
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                className="mt-2 w-full rounded-[14px] border border-line-strong bg-surface text-ink placeholder:text-faint px-4 py-3 outline-none focus:border-accent resize-none"
              />
            </label>
          )
        ))}
        {error && <p className="text-sm text-bad">{error}</p>}
      </div>
    </Sheet>
  )
}

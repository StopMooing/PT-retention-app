// The daily check-in ("How are you today?"): three taps and an optional note, about ten
// seconds. One row per client per local day in daily_checkins; saving again the same day
// updates that row. existing: today's row when editing.
import { useState } from 'react'
import { supabase } from '../supabase'
import { Sheet, Button } from '../ui'
import { Scale } from './CheckinSheet'
import { toLocalDateStr } from './dates'
import { DAILY_SCALES } from './metrics'

// The sheet's inner form. Keyed by the row it edits, so opening it fresh resets it.
function DailyForm({ client, existing, onSaved }) {
  const [scores, setScores] = useState({ energy: existing?.energy || 0, sleep: existing?.sleep || 0, soreness: existing?.soreness || 0 })
  const [note, setNote] = useState(existing?.note || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const ready = DAILY_SCALES.every((s) => scores[s.key] > 0)

  async function save() {
    if (!client || !ready) return
    setSaving(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('daily_checkins')
      .upsert(
        { client_id: client.id, checkin_date: toLocalDateStr(), ...scores, note: note.trim().slice(0, 1000) || null },
        { onConflict: 'client_id,checkin_date' },
      )
      .select('id, checkin_date, energy, sleep, soreness, note, created_at')
      .single()
    setSaving(false)
    if (err || !data) {
      console.error('Daily check-in error:', err)
      setError("Couldn't save that. Try again in a moment.")
      return
    }
    onSaved(data)
  }

  return (
    <>
      <div className="space-y-5 pt-1">
        {DAILY_SCALES.map((s) => (
          <Scale key={s.key} label={s.label} low={s.low} high={s.high} value={scores[s.key]} onChange={(n) => setScores((p) => ({ ...p, [s.key]: n }))} />
        ))}
        <label className="block">
          <span className="text-[15px] font-bold text-ink">Anything for your coach?</span>
          <textarea
            rows={2}
            maxLength={1000}
            placeholder="Optional"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 w-full rounded-[14px] border border-line-strong bg-surface text-ink placeholder:text-faint px-4 py-3 outline-none focus:border-accent resize-none"
          />
        </label>
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      </div>
      <div className="pt-4">
        <Button size="lg" block onClick={save} disabled={saving || !ready}>
          {saving ? 'Saving...' : existing ? 'Update' : 'Save'}
        </Button>
      </div>
    </>
  )
}

export default function DailyCheckinSheet({ open, onClose, client, existing, onSaved }) {
  return (
    <Sheet open={open} onClose={onClose} title="How are you today?">
      {open && <DailyForm key={existing?.id || 'new'} client={client} existing={existing} onSaved={onSaved} />}
    </Sheet>
  )
}

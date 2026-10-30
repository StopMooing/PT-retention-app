// Progress: body weight trend, consistency, strength, photos and past check-ins.
// Everything comes from data the app already saves. Empty sections are hidden.
import { useState, useRef } from 'react'
import { ChevronDown, X, Camera, MessageCircle } from 'lucide-react'
import { supabase } from '../supabase'
import { PageTitle, Card, Button, Segmented, SectionLabel, Stat } from '../ui'
import { toLocalDateStr, addDays, formatShortDate, parseDay } from './dates'
import {
  weightSeries, currentWeight, weightAverage7, sessionsThisMonth, bestWeekStreak, weekStreak, liftBests, fmtKg,
} from './metrics'
import WeightChart from './WeightChart'

function WeightCard({ client, weightLogs, setWeightLogs }) {
  const [period, setPeriod] = useState('90')
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const today = toLocalDateStr()

  const all = weightSeries(weightLogs)
  const from = period === 'all' ? '' : addDays(today, -parseInt(period, 10))
  const series = all.filter((p) => p.date >= from)
  const current = currentWeight(weightLogs)
  const avg = weightAverage7(weightLogs)
  const todayEntry = weightLogs.find((w) => w.logged_date === today)

  async function handleLogWeight() {
    const w = parseFloat(input)
    if (!w || w <= 0 || w > 500) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('body_weight_logs')
        .insert({ client_id: client.id, logged_by: user.id, weight_kg: w, logged_date: today })
        .select('id, weight_kg, logged_date')
        .single()
      if (error) throw error
      setWeightLogs((prev) => [data, ...prev])
      setInput('')
      setUpdating(false)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function handleDeleteWeight(id) {
    if (!window.confirm('Delete this weight entry? This cannot be undone.')) return
    try {
      const { error } = await supabase.from('body_weight_logs').delete().eq('id', id)
      if (error) { alert('Could not delete: ' + error.message); return }
      setWeightLogs((prev) => prev.filter((w) => w.id !== id))
    } catch (e) { alert('Could not delete: ' + e.message) }
  }

  return (
    <section>
      <SectionLabel>Body weight</SectionLabel>
      <Card padded={false}>
        <div className="p-4 space-y-4">
          {current !== null && (
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Latest" value={fmtKg(current)} unit="kg" />
              <Stat label="7-day average" value={fmtKg(avg)} unit="kg" />
            </div>
          )}
          {all.length >= 2 && (
            <>
              <Segmented value={period} onChange={setPeriod} options={[{ value: '30', label: '30 days' }, { value: '90', label: '90 days' }, { value: 'all', label: 'All' }]} />
              {series.length >= 2 ? <WeightChart series={series} /> : <p className="text-[13px] text-muted">One weigh-in in this range. Try a longer one.</p>}
            </>
          )}

          {todayEntry && !updating ? (
            <div className="flex items-center gap-2 text-[15px]">
              <span className="text-ink">Logged <b>{todayEntry.weight_kg} kg</b> today.</span>
              <button onClick={() => setUpdating(true)} className="text-accent font-bold ml-auto">Update</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text" inputMode="decimal" placeholder="Today's weight"
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogWeight() }}
                  className="w-full h-12 pl-4 pr-10 rounded-[14px] border border-line-strong bg-surface text-ink placeholder:text-faint outline-none focus:border-accent tabular-nums"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm">kg</span>
              </div>
              <Button onClick={handleLogWeight} disabled={saving || !input}>{saving ? 'Saving' : 'Log'}</Button>
            </div>
          )}
        </div>

        {weightLogs.length > 0 && (
          <div className="border-t border-line">
            <button onClick={() => setShowHistory((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 text-[15px] font-bold text-ink">
              <span>All weigh-ins <span className="text-muted font-semibold">({weightLogs.length})</span></span>
              <ChevronDown size={18} className={`text-muted transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>
            {showHistory && (
              <div className="divide-y divide-line max-h-80 overflow-y-auto border-t border-line">
                {weightLogs.map((w) => (
                  <div key={w.id} className="flex items-center gap-3 pl-4 pr-2 py-2">
                    <span className="flex-1 text-[15px] text-muted">{parseDay(w.logged_date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="text-[15px] font-bold text-ink tabular-nums">{w.weight_kg} kg</span>
                    <button onClick={() => handleDeleteWeight(w.id)} aria-label="Delete weigh-in" className="w-10 h-10 rounded-full flex items-center justify-center text-faint hover:text-bad hover:bg-surface-2">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </section>
  )
}

function PhotosCard({ client, progressPhotos, setProgressPhotos }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !client) return
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = file.name.split('.').pop()
      const path = `${user.id}/progress/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('progress-photos').upload(path, file, { upsert: false })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('progress-photos').getPublicUrl(path)
      const { data, error } = await supabase.from('progress_photos').insert({ client_id: client.id, photo_url: publicUrl, taken_date: toLocalDateStr() }).select().single()
      if (error) throw error
      setProgressPhotos((prev) => [data, ...prev])
    } catch (err) { console.error(err) }
    finally { setUploading(false) }
  }

  return (
    <section>
      <SectionLabel action={<Button variant="soft" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}><Camera size={16} /> {uploading ? 'Uploading' : 'Add'}</Button>}>
        Progress photos
      </SectionLabel>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
      {progressPhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {progressPhotos.map((p) => (
            <figure key={p.id} className="relative aspect-[3/4] rounded-[14px] overflow-hidden bg-surface-2">
              <img src={p.photo_url} alt={`Progress photo ${p.taken_date || ''}`} className="w-full h-full object-cover" />
              {p.taken_date && (
                <figcaption className="absolute bottom-1.5 left-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.95)' }}>
                  {parseDay(p.taken_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </section>
  )
}

export default function ProgressTab({ client, weightLogs, setWeightLogs, workoutLogs, checkins, strength, progressPhotos, setProgressPhotos }) {
  const [showAllLifts, setShowAllLifts] = useState(false)
  const [showAllCheckins, setShowAllCheckins] = useState(false)
  const lifts = liftBests(strength.heavySets, strength.personalBests)
  const shownLifts = showAllLifts ? lifts : lifts.slice(0, 6)
  const shownCheckins = showAllCheckins ? checkins : checkins.slice(0, 4)
  const best = bestWeekStreak(workoutLogs)
  const streak = weekStreak(workoutLogs)

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),24px)] space-y-7">
      <PageTitle title="Progress" />

      <WeightCard client={client} weightLogs={weightLogs} setWeightLogs={setWeightLogs} />

      {(workoutLogs.length > 0 || checkins.length > 0) && (
        <section>
          <SectionLabel>Showing up</SectionLabel>
          <Card className="grid grid-cols-3 gap-3">
            <Stat label="This month" value={sessionsThisMonth(workoutLogs)} hint="sessions" />
            <Stat label="Check-ins" value={checkins.length} hint="sent" />
            <Stat label="Best streak" value={best} hint={streak > 0 ? `${best === 1 ? 'week' : 'weeks'}, now ${streak}` : best === 1 ? 'week' : 'weeks'} />
          </Card>
        </section>
      )}

      {lifts.length > 0 && (
        <section>
          <SectionLabel>Strength</SectionLabel>
          <Card padded={false} className="divide-y divide-line">
            <div className="grid grid-cols-[1fr_72px_72px] gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-faint">
              <span>Lift</span><span className="text-right">Heaviest</span><span className="text-right">Est. 1RM</span>
            </div>
            {shownLifts.map((l) => (
              <div key={l.exerciseId} className="grid grid-cols-[1fr_72px_72px] gap-2 items-center px-4 py-3">
                <span className="text-[15px] font-bold text-ink truncate">{l.name}</span>
                <span className="text-right text-[15px] text-ink tabular-nums">{l.bestKg > 0 ? `${fmtKg(l.bestKg)} kg` : ''}</span>
                <span className="text-right text-[15px] font-bold text-accent tabular-nums">{l.e1rm > 0 ? `${fmtKg(l.e1rm)} kg` : ''}</span>
              </div>
            ))}
          </Card>
          {lifts.length > 6 && (
            <button onClick={() => setShowAllLifts((v) => !v)} className="w-full text-center text-[13px] font-bold text-accent pt-2.5">
              {showAllLifts ? 'Show fewer' : `Show all ${lifts.length} lifts`}
            </button>
          )}
        </section>
      )}

      <PhotosCard client={client} progressPhotos={progressPhotos} setProgressPhotos={setProgressPhotos} />

      {checkins.length > 0 && (
        <section>
          <SectionLabel>Check-ins</SectionLabel>
          <div className="space-y-3">
            {shownCheckins.map((c) => (
              <Card key={c.id} className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[15px] font-bold text-ink">{formatShortDate(toLocalDateStr(new Date(c.submitted_at)))}</p>
                  <p className="text-[13px] text-muted tabular-nums">Training {c.training_score}/5 · Energy {c.energy_score}/5</p>
                </div>
                {(c.blocker || c.notes) && <p className="text-[15px] text-muted whitespace-pre-wrap">{c.blocker || c.notes}</p>}
                {c.coach_reply && (
                  <div className="rounded-[16px] bg-accent-soft px-3.5 py-3 flex gap-2.5">
                    <MessageCircle size={17} className="text-accent shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-accent">Your coach</p>
                      <p className="text-[15px] text-ink whitespace-pre-wrap leading-relaxed">{c.coach_reply}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
          {checkins.length > 4 && (
            <button onClick={() => setShowAllCheckins((v) => !v)} className="w-full text-center text-[13px] font-bold text-accent pt-2.5">
              {showAllCheckins ? 'Show fewer' : `Show all ${checkins.length} check-ins`}
            </button>
          )}
        </section>
      )}
    </div>
  )
}

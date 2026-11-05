// Progress: body weight trend, consistency, past sessions, strength, photos and weekly check-ins.
// Everything comes from data the app already saves. Empty sections are hidden.
import { useState, useRef } from 'react'
import { ChevronDown, X, Camera, MessageCircle, Trash2 } from 'lucide-react'
import { supabase } from '../supabase'
import { Card, Button, SectionLabel, PhotoViewer, Hero, Ring } from '../ui'
import { photoPath, usePhotoUrls, PHOTO_BUCKET } from '../lib/photos'
import { toLocalDateStr, addDays, formatShortDate, parseDay } from './dates'
import {
  weightSeries, currentWeight, weightAverage7, weightForDay, plural, sessionsTotal, bestWeekStreak, weekStreak, liftBests, fmtKg, sessionsThisWeek,
} from './metrics'
import WeightChart from './WeightChart'
import SessionsList from './SessionsList'

function WeightCard({ client, weightLogs, setWeightLogs }) {
  const [period, setPeriod] = useState('90')
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState(null)
  const today = toLocalDateStr()

  const all = weightSeries(weightLogs)
  const from = period === 'all' ? '' : addDays(today, -parseInt(period, 10))
  const series = all.filter((p) => p.date >= from)
  const current = currentWeight(weightLogs)
  const avg = weightAverage7(weightLogs, today)
  const todayEntry = weightForDay(weightLogs, today)

  // One weigh-in a day: if the client already logged today, update that row instead of
  // adding a second one. A row the coach logged is left alone (a new row wins as latest).
  async function handleLogWeight() {
    const w = parseFloat(input)
    if (!w || w <= 0 || w > 500) { setError('Enter your weight in kg, for example 72.5.'); return }
    setSaving(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const mine = weightLogs
        .filter((x) => x.logged_date === today && x.logged_by === user.id)
        .sort((a, b) => (String(a.created_at ?? '') < String(b.created_at ?? '') ? 1 : -1))[0]
      const cols = 'id, weight_kg, logged_date, logged_by, created_at'
      const { data, error: err } = mine
        ? await supabase.from('body_weight_logs').update({ weight_kg: w }).eq('id', mine.id).select(cols).single()
        : await supabase.from('body_weight_logs').insert({ client_id: client.id, logged_by: user.id, weight_kg: w, logged_date: today }).select(cols).single()
      if (err) throw err
      setWeightLogs((prev) => (mine ? prev.map((x) => (x.id === mine.id ? { ...x, ...data } : x)) : [data, ...prev]))
      setInput('')
      setUpdating(false)
    } catch (e) {
      console.error('Log weight error:', e)
      setError("Couldn't save your weight. Try again.")
    } finally { setSaving(false) }
  }

  async function handleDeleteWeight(id) {
    if (!window.confirm("Delete this weigh-in? You can't undo this.")) return
    setError(null)
    try {
      const { data, error: err } = await supabase.from('body_weight_logs').delete().eq('id', id).select('id')
      if (err || !data?.length) throw err ?? new Error('no row deleted')
      setWeightLogs((prev) => prev.filter((w) => w.id !== id))
    } catch (e) {
      console.error('Delete weight error:', e)
      setError("Couldn't delete that weigh-in. Try again.")
    }
  }

  const first = series[0]
  const last = series[series.length - 1]
  const change = series.length >= 2 ? Math.round((last.avg - first.avg) * 10) / 10 : 0
  const PERIODS = [{ value: '30', label: '30 days' }, { value: '90', label: '90 days' }, { value: 'all', label: 'All' }]

  return (
    <section className="space-y-3">
      {current !== null && (
        <Hero>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-hero-muted">{avg !== null ? 'Body weight, 7 day average' : 'Body weight'}</p>
              <p className="font-display text-[48px] leading-none tabular-nums mt-1">{fmtKg(avg ?? current)}<span className="text-[20px]"> kg</span></p>
            </div>
            {change !== 0 && (
              <p className="text-[13px] font-semibold text-right text-hero-muted mb-1.5">
                {change < 0 ? 'Down' : 'Up'} {fmtKg(Math.abs(change))} kg<br />since {formatShortDate(first.date)}
              </p>
            )}
          </div>
          {all.length >= 2 && (
            <>
              <div className="flex gap-1.5 mt-3" role="radiogroup" aria-label="Range">
                {PERIODS.map((o) => (
                  <button key={o.value} role="radio" aria-checked={period === o.value} onClick={() => setPeriod(o.value)} className={`h-8 px-3 rounded-full text-[13px] font-semibold ${period === o.value ? 'bg-on-hero text-hero' : 'bg-hero-chip'}`}>{o.label}</button>
                ))}
              </div>
              <div className="mt-2">
                {series.length >= 2 ? <WeightChart series={series} onHero /> : <p className="text-[13px] text-hero-muted py-3">Only one weigh-in here. Try a longer range.</p>}
              </div>
            </>
          )}
        </Hero>
      )}
      <Card padded={false}>
        <div className="p-4 space-y-3">
          {current === null && <p className="text-[15px] font-semibold text-ink">Body weight</p>}
          {todayEntry && !updating ? (
            <div className="flex items-center gap-2 text-[15px]">
              <span className="text-ink">Logged <b>{todayEntry.weight_kg} kg</b> today.</span>
              <button onClick={() => { setInput(String(todayEntry.weight_kg)); setUpdating(true) }} className="text-ink underline underline-offset-2 font-semibold ml-auto">Update</button>
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
              <Button onClick={handleLogWeight} disabled={saving || !input}>{saving ? 'Saving' : todayEntry ? 'Update' : 'Log'}</Button>
            </div>
          )}
          {error && <p role="alert" className="text-[13px] font-semibold text-bad">{error}</p>}
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
                    {/* The client can remove their own weigh-ins; ones the coach logged stay. */}
                    {w.logged_by === client.user_id ? (
                      <button onClick={() => handleDeleteWeight(w.id)} aria-label="Delete weigh-in" className="w-10 h-10 rounded-full flex items-center justify-center text-faint hover:text-bad hover:bg-surface-2">
                        <X size={16} />
                      </button>
                    ) : (
                      <span className="w-10 text-center text-[11px] font-bold text-muted">Coach</span>
                    )}
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

const photoDate = (p, opts) => (p.taken_date ? parseDay(p.taken_date).toLocaleDateString('en-AU', opts) : '')

function PhotosCard({ client, progressPhotos, setProgressPhotos }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(null) // the photo row being viewed
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [viewError, setViewError] = useState(null)
  const urls = usePhotoUrls(progressPhotos)

  // Stores the bare storage path, never a public link: the bucket is private.
  async function handleUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !client) return
    setUploading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${user.id}/progress/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { upsert: false })
      if (uploadError) throw uploadError
      const { data, error: rowError } = await supabase.from('progress_photos').insert({ client_id: client.id, photo_url: path, taken_date: toLocalDateStr() }).select().single()
      if (rowError) {
        await supabase.storage.from(PHOTO_BUCKET).remove([path])
        throw rowError
      }
      setProgressPhotos((prev) => [data, ...prev])
    } catch (err) {
      console.error('Photo upload error:', err)
      setError("Couldn't upload that photo. Check your signal and try again.")
    } finally { setUploading(false) }
  }

  function view(p) {
    setOpen(p)
    setConfirmDelete(false)
    setViewError(null)
  }

  // The file first, then the row, so a row never points at a file that has gone.
  async function handleDelete() {
    if (!open) return
    setDeleting(true)
    setViewError(null)
    try {
      const path = photoPath(open.photo_url)
      if (path) {
        const { error: rmError } = await supabase.storage.from(PHOTO_BUCKET).remove([path])
        if (rmError) throw rmError
      }
      const { error: rowError } = await supabase.from('progress_photos').delete().eq('id', open.id)
      if (rowError) throw rowError
      setProgressPhotos((prev) => prev.filter((p) => p.id !== open.id))
      setOpen(null)
    } catch (err) {
      console.error('Photo delete error:', err)
      setViewError("Couldn't delete that photo. Try again.")
    } finally { setDeleting(false) }
  }

  return (
    <section>
      <SectionLabel action={<Button variant="soft" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}><Camera size={16} /> {uploading ? 'Uploading' : 'Add'}</Button>}>
        Progress photos
      </SectionLabel>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      {error && <p role="alert" className="text-[13px] font-semibold text-bad px-1 mb-2.5">{error}</p>}
      {progressPhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {progressPhotos.map((p) => (
            <button key={p.id} onClick={() => view(p)} aria-label={`View photo from ${photoDate(p, { day: 'numeric', month: 'long' })}`} className="relative aspect-[3/4] rounded-[14px] overflow-hidden bg-surface-2">
              {urls[p.id] && <img src={urls[p.id]} alt="" className="w-full h-full object-cover" />}
              {p.taken_date && (
                <span className="absolute bottom-1.5 left-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.95)' }}>
                  {photoDate(p, { day: 'numeric', month: 'short' })}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && (
        <PhotoViewer
          src={urls[open.id]}
          caption={photoDate(open, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
          onClose={() => setOpen(null)}
          footer={
            <div className="space-y-2.5">
              {viewError && <p role="alert" className="text-[13px] font-semibold text-center text-bad bg-bad-soft rounded-full px-4 py-2">{viewError}</p>}
              {confirmDelete ? (
                <>
                  <p className="text-[15px] text-center">Delete this photo? You can't undo this.</p>
                  <div className="flex gap-2.5">
                    <Button variant="secondary" size="lg" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={deleting}>Keep it</Button>
                    <Button variant="danger" size="lg" className="flex-1" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
                  </div>
                </>
              ) : (
                <Button variant="secondary" size="lg" block onClick={() => setConfirmDelete(true)}><Trash2 size={18} /> Delete photo</Button>
              )}
            </div>
          }
        />
      )}
    </section>
  )
}

export default function ProgressTab({ client, weightLogs, setWeightLogs, workoutLogs, checkins, strength, progressPhotos, setProgressPhotos, scheduledWorkouts, completedIds }) {
  const [showAllLifts, setShowAllLifts] = useState(false)
  const [showAllCheckins, setShowAllCheckins] = useState(false)
  const lifts = liftBests(strength.heavySets, strength.personalBests)
  const shownLifts = showAllLifts ? lifts : lifts.slice(0, 6)
  const shownCheckins = showAllCheckins ? checkins : checkins.slice(0, 4)
  const best = bestWeekStreak(workoutLogs)
  const streak = weekStreak(workoutLogs)
  const total = sessionsTotal(workoutLogs)
  const train = sessionsThisWeek(scheduledWorkouts, completedIds)
  // Only what there is to celebrate: no zeros, the streak only once there is one.
  const showingUp = [
    streak > 0 && `${plural(streak, 'week')} in a row${best > streak ? `, best ${best}` : ''}.`,
    train.scheduled > 0 && `${train.done} of ${train.scheduled} this week.`,
  ].filter(Boolean).join(' ')

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),24px)] space-y-5">
      <h1 className="font-display text-[40px] leading-none text-ink px-1">Progress</h1>

      <WeightCard client={client} weightLogs={weightLogs} setWeightLogs={setWeightLogs} />

      {total > 0 && (
        <Card className="flex items-center gap-4">
          <Ring value={train.scheduled > 0 ? train.done / train.scheduled : 1} size={76} stroke={9} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-muted">Showing up</p>
            <p className="font-display text-[30px] leading-tight text-ink tabular-nums">{plural(total, 'session')}</p>
            {showingUp && <p className="text-[13px] text-muted mt-0.5">{showingUp}</p>}
          </div>
        </Card>
      )}

      {lifts.length > 0 && (
        <section>
          <Card padded={false} className="px-4 py-1.5">
            <p className="text-[13px] font-semibold text-muted pt-2.5 pb-1">Best lifts</p>
            {shownLifts.map((l) => {
              const top = l.e1rm > 0 ? l.e1rm : l.bestKg
              return (
                <div key={l.exerciseId} className="flex items-center gap-2.5 py-2.5 border-t border-line">
                  <span className="flex-1 min-w-0 text-[15px] font-semibold text-ink truncate">{l.name}</span>
                  {l.e1rm > 0 && l.bestKg > 0 && <span className="text-[12px] font-semibold text-muted shrink-0">Heaviest {fmtKg(l.bestKg)} kg</span>}
                  <span className="font-display text-[22px] leading-none text-ink tabular-nums shrink-0">{top > 0 ? fmtKg(top) : ''}<span className="text-[13px]"> kg</span></span>
                </div>
              )
            })}
            {lifts.some((l) => l.e1rm > 0) && <p className="text-[12px] text-faint pb-2.5">Big number: estimated one rep max.</p>}
          </Card>
          {lifts.length > 6 && (
            <button onClick={() => setShowAllLifts((v) => !v)} className="w-full text-center text-[13px] font-semibold text-ink underline underline-offset-2 pt-2.5">
              {showAllLifts ? 'Show fewer' : `Show all ${plural(lifts.length, 'lift')}`}
            </button>
          )}
        </section>
      )}

      <SessionsList client={client} />

      <PhotosCard client={client} progressPhotos={progressPhotos} setProgressPhotos={setProgressPhotos} />

      {checkins.length > 0 && (
        <section>
          <SectionLabel>Weekly check-ins</SectionLabel>
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
              {showAllCheckins ? 'Show fewer' : `Show all ${plural(checkins.length, 'weekly check-in')}`}
            </button>
          )}
        </section>
      )}
    </div>
  )
}

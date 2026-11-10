// Logging a workout, one row per set (set, previous, kg, reps, tick), like Hevy.
// Saves the workout log first, then its set logs (stamped with workout_log_id), then
// personal bests. Nothing is celebrated until the save is confirmed. Editing a finished
// session updates it in place. AI workouts have their exercise names matched with
// resolve_exercise_ids. Ticked sets are kept as a draft on the phone until saved.
import { useState, useEffect } from 'react'
import { Check, Trophy, Timer, SkipForward, Share2, X, Plus, Minus, Info } from 'lucide-react'
import { supabase } from '../supabase'
import { Button, Card, Chip, Sheet, Hero, Ring } from '../ui'
import { ShareSheet } from './ShareStory'
import ExerciseInfoSheet from './ExerciseInfoSheet'
import { Overlay, Loading } from './common'
import { toLocalDateStr } from './dates'
import { workoutKey, workoutName as nameOf, plural } from './metrics'
import { plannedSets, prescriptionText, setTypeOf, setLabels, supersets, blocks } from '../lib/setTargets.js'

const EMPTY = []
const cx = (...c) => c.filter(Boolean).join(' ')
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const SAVE_FAILED = "Couldn't save your session. Check your signal and tap Finish again."

// The numbers saved for a ticked set. Saving and personal bests both use these, so they
// always agree. Blank reps fall back to the prescribed reps for that set: the first number
// in it, so "8-10" counts as 8 and "8 each leg" as 8. A timed target ("30s") has no rep
// count: 0.
function repsFor(set, ex, setNumber) {
  const typed = String(set?.reps ?? '').trim()
  const target = String(plannedSets(ex)[setNumber - 1]?.reps ?? ex?.reps ?? '').trim()
  const timed = /^\d+\s*(s|sec|secs|seconds?|min|mins|minutes?)\b/i.test(target)
  const reps = typed !== '' ? parseFloat(typed) || 0 : (!timed && parseInt(target.match(/\d+/)?.[0] ?? '', 10)) || 0
  return Math.min(100, Math.max(0, reps))
}
// An exercise can only be logged when it is in the exercise library (an AI workout can
// name one that isn't). Those show as plan only.
const loggable = (ex) => !!(ex.exercise_id || ex.exercises?.id)
// Sets on screen for an exercise: the plan's sets, or more if the client added some (or
// saved more last time, when editing).
function setsOf(ex, exSets) {
  const extra = Object.keys(exSets || {}).map(Number).filter((n) => n > 0)
  return Math.max(plannedSets(ex).length, extra.length ? Math.max(...extra) : 0)
}
// What the plan says for set n (1 based). An added set beyond the plan copies the last one.
function targetFor(ex, n) {
  const plan = plannedSets(ex)
  return plan[n - 1] ?? { ...plan[plan.length - 1], type: 'normal' }
}
const pureNumber = (r) => /^\d+$/.test(String(r ?? '').trim())
function weightFor(set) {
  return Math.min(500, Math.max(0, parseFloat(set?.weight) || 0))
}

// In-progress sets live in localStorage (per scheduled session) so leaving the screen or
// closing the app does not lose them. Storage can be blocked, so every call is guarded.
const draftKey = (swId) => `unfnshd-workout-draft-${swId}`
function readDraft(swId) {
  if (!swId) return null
  try {
    const raw = localStorage.getItem(draftKey(swId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function writeDraft(swId, data) {
  if (!swId) return
  try { localStorage.setItem(draftKey(swId), JSON.stringify(data)) } catch { /* storage unavailable */ }
}
function clearDraft(swId) {
  if (!swId) return
  try { localStorage.removeItem(draftKey(swId)) } catch { /* storage unavailable */ }
}

/* ---------- Finished screen ---------- */

const FEEL = ['Easy', 'Steady', 'Solid', 'Hard', 'All out']

/* "How did that feel?" Saves a 1 to 5 rating and an optional note onto the session that
   was just saved. Skip-able: leaving without it changes nothing. */
function SessionFeel({ logId, coachName, hasCoach }) {
  const [rating, setRating] = useState(0)
  const [note, setNote] = useState('')
  const [state, setState] = useState('idle') // idle | saving | saved | error
  if (!logId) return null
  const who = coachName || 'your coach'

  async function save() {
    setState('saving')
    const { error } = await supabase
      .from('workout_logs')
      .update({ session_rating: rating || null, notes: note.trim().slice(0, 1000) || null })
      .eq('id', logId)
    if (error) console.error('Session rating error:', error)
    setState(error ? 'error' : 'saved')
  }

  if (state === 'saved') {
    return (
      <div className="flex items-center gap-3 rounded-[20px] bg-surface px-4 py-3.5">
        <span className="w-9 h-9 rounded-full bg-accent text-on-accent flex items-center justify-center shrink-0"><Check size={18} strokeWidth={3} /></span>
        <p className="text-[15px] font-semibold text-ink">{hasCoach ? `Thanks, ${who} will see this.` : 'Thanks, saved with this session.'}</p>
      </div>
    )
  }
  return (
    <div>
      <p className="text-[15px] font-semibold text-ink">How did that feel?</p>
      <div className="grid grid-cols-5 gap-1.5 mt-2.5" role="radiogroup" aria-label="How did that feel?">
        {FEEL.map((label, i) => {
          const n = i + 1
          const on = rating === n
          return (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setRating(on ? 0 : n)}
              className={cx('h-11 rounded-[14px] border text-[13px] font-semibold whitespace-nowrap transition-colors', on ? 'bg-ink text-bg border-ink' : 'border-line-strong text-ink hover:bg-surface-2')}
            >
              {label}
            </button>
          )
        })}
      </div>
      {(rating > 0 || note) && (
        <textarea
          rows={2}
          maxLength={1000}
          placeholder={hasCoach ? `Anything for ${who}? Optional.` : 'Any notes? Optional.'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-2.5 w-full rounded-[14px] border border-line-strong bg-surface text-ink placeholder:text-faint px-4 py-3 outline-none focus:border-accent resize-none"
        />
      )}
      {state === 'error' && <p role="alert" className="text-[13px] font-semibold text-bad mt-2">Couldn't save that. Your session is still saved.</p>}
      {(rating > 0 || note.trim()) && (
        <Button variant="soft" block className="mt-2.5" onClick={save} disabled={state === 'saving'}>
          {state === 'saving' ? 'Saving...' : 'Save'}
        </Button>
      )}
    </div>
  )
}

// "6,240" kg reads better as "6.2t" once it passes a tonne.
function fmtLifted(kg) {
  const v = Math.round(kg)
  return v >= 1000 ? { value: `${(v / 1000).toFixed(1).replace(/\.0$/, '')}t`, label: 'lifted' } : { value: v.toLocaleString('en-AU'), label: 'kg lifted' }
}

function weekLine(week, streak) {
  const left = week.scheduled - week.done
  const streakBit = streak > 1 ? `That makes ${streak} weeks in a row. ` : ''
  if (week.scheduled > 0 && left > 0) return `${streakBit}${left === 1 ? 'One more' : `${left} more`} this week and the week is yours.`
  return `${streakBit}The ring stays open, there is always next week.`
}

export function WorkoutComplete({ workoutName, stats, week, streak = 0, onDone, coachName, hasCoach }) {
  const { newPBs = [], totalVolume = 0, setsCompleted = 0, exerciseCount = 0, logId = null } = stats || {}
  const [sharing, setSharing] = useState(null)
  const lifted = totalVolume > 0 ? fmtLifted(totalVolume) : null
  const tiles = [
    { label: setsCompleted === 1 ? 'set ticked' : 'sets ticked', value: setsCompleted },
    { label: exerciseCount === 1 ? 'exercise' : 'exercises', value: exerciseCount },
    lifted,
  ].filter(Boolean)
  const wk = week && week.scheduled > 0 ? week : null
  const firstPB = newPBs[0]
  return (
    <Overlay z="z-50">
      <div className="flex-1 overflow-y-auto px-5 pt-14 pb-6 space-y-5">
        <div>
          <p className="text-[14px] font-semibold text-muted">{workoutName}</p>
          <h1 className="font-display text-[clamp(56px,17vw,76px)] leading-[0.86] tracking-[-1px] text-ink mt-2">Done.<br />Not finished.</h1>
        </div>

        <Hero className="flex items-center gap-4">
          <Ring value={wk ? wk.done / wk.scheduled : 1} size={84} stroke={10} color="var(--on-hero)" track="var(--hero-track)" dot="var(--hero-dot)" />
          <div className="min-w-0">
            <p className="font-display text-[26px] leading-tight">{wk ? `${wk.done} of ${wk.scheduled} this week` : 'Another one in the bank'}</p>
            <p className="text-[14px] leading-snug text-hero-muted mt-0.5">{weekLine(wk || { scheduled: 0, done: 0 }, streak)}</p>
          </div>
        </Hero>

        <div className={`grid gap-3 ${tiles.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {tiles.map((t) => (
            <div key={t.label} className="border-l-2 border-line-strong pl-3">
              <p className="font-display text-[30px] leading-none text-ink tabular-nums">{t.value}</p>
              <p className="text-[13px] text-muted mt-1">{t.label}</p>
            </div>
          ))}
        </div>

        {newPBs.map((pb, i) => {
          return (
            <section key={i} className="flex items-center gap-3.5 rounded-[24px] bg-tan text-on-tan px-4 py-4">
              <Trophy size={28} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold opacity-80">{pb.type === '1rm' ? 'New best estimated 1RM' : pb.type === 'volume' ? 'New best volume on this lift' : pb.type === 'best_set' ? 'New best set' : 'New personal best'}</p>
                <p className="text-[16px] font-bold truncate">{pb.exerciseName}</p>
                {pb.previous > 0 && <p className="text-[13px] font-semibold opacity-80 tabular-nums">Up from {pb.previous} {pb.unit}</p>}
              </div>
              <p className="font-display text-[32px] leading-none tabular-nums shrink-0">
                {pb.value}<span className="text-[16px]"> {pb.unit}</span>
              </p>
            </section>
          )
        })}

        <SessionFeel logId={logId} coachName={coachName} hasCoach={hasCoach} />
      </div>
      <div className="shrink-0 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)] space-y-2.5">
        {firstPB && (
          <Button size="lg" block onClick={() => setSharing(firstPB)}><Share2 size={18} /> Share to my story</Button>
        )}
        <Button size="lg" block variant={firstPB ? 'secondary' : 'primary'} onClick={onDone}>Back to home</Button>
      </div>
      <ShareSheet pb={sharing} onClose={() => setSharing(null)} />
    </Overlay>
  )
}

/* ---------- Logging ---------- */

export default function WorkoutLogging({ scheduledWorkout, existingLog, exercises, client, onBack, onComplete }) {
  const isCustom = scheduledWorkout._isCustom || !scheduledWorkout.program_workout_id
  const customContent = scheduledWorkout._customWorkout?.content || scheduledWorkout.saved_workouts?.content || null
  const workoutName = nameOf(scheduledWorkout)

  const isEditing = !!existingLog?.id
  const [setData, setSetData] = useState(() => (isEditing ? {} : readDraft(scheduledWorkout.id) || {}))
  const [completing, setCompleting] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [infoFor, setInfoFor] = useState(null) // an exercises row: { id, name, muscle_group }
  const [previousSets, setPreviousSets] = useState({})
  const [restTimer, setRestTimer] = useState(null)
  const [restInterval, setRestInterval] = useState(null)
  const [aiExercises, setAiExercises] = useState(null)
  const [aiParseError, setAiParseError] = useState(false)

  const trackedExercises = isCustom ? (aiExercises || EMPTY) : exercises
  const loggableExercises = trackedExercises.filter(loggable)
  // An AI workout we can't read, or none of whose exercises are in the library, is just
  // marked as done.
  const planOnly = isCustom && (aiParseError || (aiExercises !== null && loggableExercises.length === 0))
  const hasSetTracking = !isCustom || (aiExercises !== null && !planOnly)

  // Last session's sets for each exercise, shown in the "Previous" column.
  useEffect(() => {
    if (!client?.id || !trackedExercises.length) return
    const wantedIds = trackedExercises.map((ex) => ex.exercise_id ?? ex.exercises?.id).filter(Boolean)
    if (!wantedIds.length) return
    let cancelled = false
    // When editing, "previous" means the session before this one, never this one itself.
    const before = existingLog?.logged_at || new Date().toISOString()
    ;(async () => {
      const { data: setRows } = await supabase
        .from('workout_set_logs')
        .select('exercise_id, set_number, weight_kg, reps_completed, logged_at, workout_log_id')
        .eq('client_id', client.id)
        .in('exercise_id', wantedIds)
        .lt('logged_at', before)
        .order('logged_at', { ascending: false })
        .order('set_number', { ascending: true })
      if (cancelled) return
      const latestSessionDate = {}
      const prev = {}
      for (const row of setRows ?? []) {
        if (existingLog?.id && row.workout_log_id === existingLog.id) continue
        const eid = row.exercise_id
        const dateStr = toLocalDateStr(new Date(row.logged_at))
        if (!latestSessionDate[eid]) latestSessionDate[eid] = dateStr
        if (dateStr !== latestSessionDate[eid]) continue
        ;(prev[eid] ||= []).push({ reps: row.reps_completed, weight_kg: row.weight_kg, set_number: row.set_number })
      }
      for (const eid of Object.keys(prev)) prev[eid].sort((a, b) => a.set_number - b.set_number)
      setPreviousSets(prev)
    })()
    return () => { cancelled = true }
  }, [trackedExercises, client?.id, existingLog?.id, existingLog?.logged_at])

  // Editing a finished session: fill the rows with what was saved.
  useEffect(() => {
    if (!existingLog?.id) return
    let cancelled = false
    ;(async () => {
      const { data: existingSetRows } = await supabase
        .from('workout_set_logs')
        .select('exercise_id, set_number, weight_kg, reps_completed')
        .eq('workout_log_id', existingLog.id)
      if (cancelled || !existingSetRows) return
      const seeded = {}
      for (const ex of trackedExercises) {
        const exerciseId = ex.exercise_id ?? ex.exercises?.id
        if (!exerciseId) continue
        const rowsForEx = existingSetRows.filter((r) => r.exercise_id === exerciseId)
        if (!rowsForEx.length) continue
        seeded[ex.id] = {}
        for (const r of rowsForEx) seeded[ex.id][r.set_number] = { weight: String(r.weight_kg ?? ''), reps: String(r.reps_completed ?? ''), done: true }
      }
      if (Object.keys(seeded).length > 0) setSetData(seeded)
    })()
    return () => { cancelled = true }
  }, [existingLog?.id, trackedExercises])

  // AI workouts: turn the saved JSON into trackable exercises with real exercise ids.
  useEffect(() => {
    if (!isCustom || !customContent) return
    let cancelled = false
    const failSafe = setTimeout(() => { if (!cancelled) setAiParseError(true) }, 10000)
    async function buildAiExercises() {
      try {
        let parsed = null
        try {
          const jsonMatch = customContent.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const p = JSON.parse(jsonMatch[0])
            if (p && Array.isArray(p.exercises) && p.exercises.length > 0) parsed = p
          }
        } catch (e) {
          console.warn('AI workout JSON parse failed:', e)
        }
        if (!parsed) {
          if (!cancelled) { clearTimeout(failSafe); setAiParseError(true) }
          return
        }
        const names = parsed.exercises.map((e) => (e?.name ?? '').trim()).filter(Boolean)
        const resolvedMap = {}
        try {
          const { data: resolved, error } = await supabase.rpc('resolve_exercise_ids', { p_names: names })
          if (error) console.error('resolve_exercise_ids error:', error)
          for (const row of resolved ?? []) {
            const key = (row?.input_name ?? '').trim().toLowerCase()
            if (key) resolvedMap[key] = row
          }
        } catch (e) {
          console.error('resolve_exercise_ids exception:', e)
        }
        const built = parsed.exercises.map((e, idx) => {
          const name = (e?.name ?? 'Exercise').trim()
          const match = resolvedMap[name.toLowerCase()] || {}
          const resolvedId = match.exercise_id || null
          return {
            id: `ai_${idx}`,
            exercise_id: resolvedId,
            exercises: { id: resolvedId, name, muscle_group: match.muscle_group || null },
            sets: parseInt(e?.sets, 10) || 1,
            reps: String(e?.reps ?? ''),
            rest_seconds: e?.rest_seconds || null,
            notes: e?.notes || null,
          }
        })
        if (!cancelled) { clearTimeout(failSafe); setAiExercises(built) }
      } catch (e) {
        console.error('buildAiExercises fatal error:', e)
        if (!cancelled) { clearTimeout(failSafe); setAiParseError(true) }
      }
    }
    buildAiExercises()
    return () => { cancelled = true; clearTimeout(failSafe) }
  }, [isCustom, customContent])

  useEffect(() => () => { if (restInterval) clearInterval(restInterval) }, [restInterval])

  // Keep a new session's sets on the phone as they are entered.
  useEffect(() => {
    if (isEditing || Object.keys(setData).length === 0) return
    writeDraft(scheduledWorkout.id, setData)
  }, [setData, isEditing, scheduledWorkout.id])

  function startRestTimer(seconds) {
    if (restInterval) clearInterval(restInterval)
    setRestTimer(seconds)
    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); setRestInterval(null); return null }
        return prev - 1
      })
    }, 1000)
    setRestInterval(interval)
  }

  function skipRest() {
    if (restInterval) clearInterval(restInterval)
    setRestTimer(null)
  }

  function updateSet(rowKey, setNumber, field, value) {
    setSetData((prev) => ({
      ...prev,
      [rowKey]: { ...(prev[rowKey] || {}), [setNumber]: { ...(prev[rowKey]?.[setNumber] || {}), [field]: value } },
    }))
  }

  // An extra set beyond the plan, and taking one back off (only an added, unticked one).
  function addSet(ex) {
    const n = setsOf(ex, setData[ex.id]) + 1
    setSetData((prev) => ({ ...prev, [ex.id]: { ...(prev[ex.id] || {}), [n]: {} } }))
  }
  function removeSet(ex) {
    const n = setsOf(ex, setData[ex.id])
    if (n <= plannedSets(ex).length || setData[ex.id]?.[n]?.done) return
    setSetData((prev) => {
      const next = { ...(prev[ex.id] || {}) }
      delete next[n]
      return { ...prev, [ex.id]: next }
    })
  }

  // Ticking a set with empty boxes fills in the coach's target for that set, or else last
  // session's numbers. Rest starts after the set, except inside a superset: there the next
  // exercise comes straight away and the rest waits for the end of the round.
  function markSetDone(ex, setNumber) {
    const rowKey = ex.id
    const exerciseId = ex.exercise_id ?? ex.exercises?.id ?? null
    const prevSet = (previousSets[exerciseId] || [])[setNumber - 1]
    const target = targetFor(ex, setNumber)
    const current = setData[rowKey]?.[setNumber] || {}
    if (current.weight === undefined || current.weight === '') {
      const w = target.weight_kg > 0 ? target.weight_kg : prevSet?.weight_kg > 0 ? prevSet.weight_kg : null
      if (w != null) updateSet(rowKey, setNumber, 'weight', String(w))
    }
    if (current.reps === undefined || current.reps === '') {
      const r = pureNumber(target.reps) ? target.reps : prevSet?.reps || null
      if (r) updateSet(rowKey, setNumber, 'reps', String(r))
    }
    updateSet(rowKey, setNumber, 'done', true)
    const mark = superMarks[ex.id]
    const rest = mark && !mark.last ? 0 : target.rest_seconds ?? ex.rest_seconds
    if (rest) startRestTimer(rest)
  }

  const totalSetsCount = loggableExercises.reduce((sum, ex) => sum + setsOf(ex, setData[ex.id]), 0)
  const doneSetsCount = loggableExercises.reduce((sum, ex) => sum + Object.values(setData[ex.id] || {}).filter((s) => s.done).length, 0)
  const allDone = hasSetTracking && totalSetsCount > 0 && doneSetsCount >= totalSetsCount

  // The first set not ticked yet, so the screen can say what is next. A superset goes
  // round its exercises: set 1 of each, then set 2 of each.
  const superMarks = supersets(trackedExercises)
  let nextUp = null
  for (const block of blocks(loggableExercises)) {
    const most = Math.max(...block.map((ex) => setsOf(ex, setData[ex.id])))
    for (let s = 1; s <= most && !nextUp; s++) {
      for (const ex of block) {
        if (s <= setsOf(ex, setData[ex.id]) && !setData[ex.id]?.[s]?.done) { nextUp = { ex, set: s }; break }
      }
    }
    if (nextUp) break
  }

  // Editing a finished session: work every best out again from all of the client's sets
  // for these lifts. One read for all lifts and one write, not a round trip per lift.
  async function reconcilePBsForExercises(exerciseIds) {
    const ids = [...new Set(exerciseIds.filter(Boolean))]
    if (!ids.length) return
    const { data: allSets, error } = await supabase
      .from('workout_set_logs')
      .select('exercise_id, weight_kg, reps_completed, logged_at, workout_log_id')
      .eq('client_id', client.id)
      .in('exercise_id', ids)
    if (error) { console.error('PB reconcile fetch error:', error); return }
    const setsByExercise = {}
    for (const s of allSets ?? []) (setsByExercise[s.exercise_id] ||= []).push(s)
    const upserts = []
    const toDelete = {} // pb_type -> exercise ids with nothing left to count
    for (const exerciseId of ids) {
      let best1RM = 0, best1RMAt = null, bestSet = 0, bestSetAt = null
      const volumeByLog = {}
      for (const s of setsByExercise[exerciseId] ?? []) {
        const weight = parseFloat(s.weight_kg) || 0
        const reps = parseFloat(s.reps_completed) || 0
        if (weight <= 0) continue
        const oneRM = reps === 1 ? weight : weight * (1 + reps / 30)
        if (oneRM > best1RM) { best1RM = oneRM; best1RMAt = s.logged_at }
        const setScore = weight * reps
        if (setScore > bestSet) { bestSet = setScore; bestSetAt = s.logged_at }
        if (!s.workout_log_id) continue
        const logKey = s.workout_log_id
        if (!volumeByLog[logKey]) volumeByLog[logKey] = { total: 0, at: s.logged_at }
        volumeByLog[logKey].total += weight * reps
        if (s.logged_at > volumeByLog[logKey].at) volumeByLog[logKey].at = s.logged_at
      }
      let bestVolume = 0, bestVolumeAt = null
      for (const k of Object.keys(volumeByLog)) {
        if (volumeByLog[k].total > bestVolume) { bestVolume = volumeByLog[k].total; bestVolumeAt = volumeByLog[k].at }
      }
      const recomputed = [
        { type: '1rm', value: Math.round(best1RM * 10) / 10, at: best1RMAt },
        { type: 'best_set', value: bestSet, at: bestSetAt },
        { type: 'volume', value: Math.round(bestVolume), at: bestVolumeAt },
      ]
      for (const pb of recomputed) {
        if (pb.value > 0) upserts.push({ client_id: client.id, exercise_id: exerciseId, pb_type: pb.type, value: pb.value, achieved_at: pb.at })
        else (toDelete[pb.type] ||= []).push(exerciseId)
      }
    }
    const writes = []
    if (upserts.length) writes.push(supabase.from('personal_bests').upsert(upserts, { onConflict: 'client_id,exercise_id,pb_type' }))
    for (const [type, exIds] of Object.entries(toDelete)) {
      writes.push(supabase.from('personal_bests').delete().eq('client_id', client.id).eq('pb_type', type).in('exercise_id', exIds))
    }
    for (const { error: wErr } of await Promise.all(writes)) if (wErr) console.error('PB reconcile write error:', wErr)
  }

  // Leaving with ticked sets asks first. The sets stay in the draft either way.
  function handleBack() {
    if (!isEditing && doneSetsCount > 0) setConfirmLeave(true)
    else onBack({ keptDraft: false })
  }

  async function insertWorkoutLog(totalVolume, at) {
    const { data, error } = await supabase.from('workout_logs').insert({
      client_id: client.id,
      program_workout_id: scheduledWorkout.program_workout_id ?? null,
      scheduled_workout_id: scheduledWorkout.id ?? null,
      logged_at: at,
      completed: true,
      total_volume_kg: totalVolume,
    }).select('id').single()
    if (error || !data) throw error || new Error('workout_logs insert returned no row')
    return data
  }

  // Personal bests for a new session. Saved for every lift, but only shown when they beat
  // a best that already existed (a first-ever session is not a list of "new" bests).
  // One read of the current bests and one write for all lifts, so finishing is quick.
  async function updatePBs(byExercise, currentBests) {
    // Best of each kind per lift. A lift done twice in one session counts its better effort.
    const checks = {} // `${exerciseId}_${type}` -> { exerciseId, exerciseName, type, value, unit }
    for (const { exerciseId, exerciseName, rows } of byExercise) {
      let best1RM = 0, bestSet = 0, sessionVolume = 0
      for (const r of rows) {
        if (r.weight_kg === 0) continue
        const estimated1RM = r.reps_completed === 1 ? r.weight_kg : r.weight_kg * (1 + r.reps_completed / 30)
        if (estimated1RM > best1RM) best1RM = estimated1RM
        const setScore = r.weight_kg * r.reps_completed
        if (setScore > bestSet) bestSet = setScore
        sessionVolume += setScore
      }
      const found = []
      if (best1RM > 0) found.push({ type: '1rm', value: Math.round(best1RM * 10) / 10, unit: 'kg' })
      if (bestSet > 0) found.push({ type: 'best_set', value: bestSet, unit: 'pts' })
      if (sessionVolume > 0) found.push({ type: 'volume', value: Math.round(sessionVolume), unit: 'kg' })
      for (const c of found) {
        const key = `${exerciseId}_${c.type}`
        if (!checks[key] || c.value > checks[key].value) checks[key] = { exerciseId, exerciseName, ...c }
      }
    }
    const list = Object.values(checks)
    if (!list.length) return []
    const { data: existingRows, error } = await currentBests
    if (error) { console.error('PB read error:', error); return [] }
    const existing = {}
    for (const r of existingRows ?? []) existing[`${r.exercise_id}_${r.pb_type}`] = r
    const achievedAt = new Date().toISOString()
    const upserts = []
    const newPBs = []
    for (const c of list) {
      const prev = existing[`${c.exerciseId}_${c.type}`]
      if (prev && c.value <= prev.value) continue
      upserts.push({ client_id: client.id, exercise_id: c.exerciseId, pb_type: c.type, value: c.value, achieved_at: achievedAt, scheduled_workout_id: scheduledWorkout.id })
      if (prev && ['1rm', 'volume'].includes(c.type)) {
        newPBs.push({ exerciseName: c.exerciseName, type: c.type, value: c.value, unit: c.unit, previous: prev.value })
      }
    }
    if (!upserts.length) return []
    const { error: upErr } = await supabase.from('personal_bests').upsert(upserts, { onConflict: 'client_id,exercise_id,pb_type' })
    if (upErr) { console.error('PB upsert error:', upErr); return [] }
    return newPBs
  }

  async function handleComplete() {
    setCompleting(true)
    setSaveError(null)
    const now = new Date().toISOString()
    // Build the rows once; saving and personal bests both use them.
    const byExercise = []
    let totalVolume = 0
    for (const ex of trackedExercises) {
      const exerciseId = ex.exercise_id || ex.exercises?.id
      if (!exerciseId) continue
      const exSets = setData[ex.id] || {}
      const rows = []
      // Only ticked sets are saved: a set the client skipped never counts.
      for (let s = 1; s <= setsOf(ex, exSets); s++) {
        if (!exSets[s]?.done) continue
        const reps = repsFor(exSets[s], ex, s)
        const weight = weightFor(exSets[s])
        totalVolume += reps * weight
        rows.push({ exercise_id: exerciseId, set_number: s, reps_completed: reps, weight_kg: weight })
      }
      if (rows.length) byExercise.push({ exerciseId, exerciseName: ex.exercises?.name || 'Exercise', rows })
    }
    const setRows = byExercise.flatMap((e) => e.rows)
    // The current bests are read while the session saves, not after it.
    const liftIds = [...new Set(byExercise.map((e) => e.exerciseId))]
    const currentBests = !isEditing && liftIds.length
      ? supabase.from('personal_bests').select('exercise_id, pb_type, value').eq('client_id', client.id).in('exercise_id', liftIds).then((r) => r)
      : null
    const base = { client_id: client.id, scheduled_workout_id: scheduledWorkout.id }
    let logId = existingLog?.id ?? null

    try {
      if (isEditing) {
        // Update in place by exercise + set number; insert any sets not saved before.
        const { data: existingRows, error: readErr } = await supabase
          .from('workout_set_logs')
          .select('id, exercise_id, set_number')
          .eq('workout_log_id', existingLog.id)
        if (readErr) throw readErr
        const existingByKey = {}
        for (const r of existingRows ?? []) existingByKey[`${r.exercise_id}_${r.set_number}`] = r.id
        // All the writes at once rather than one after another.
        const toInsert = []
        const writes = []
        for (const row of setRows) {
          const matchId = existingByKey[`${row.exercise_id}_${row.set_number}`]
          if (matchId) {
            writes.push(supabase.from('workout_set_logs')
              .update({ reps_completed: row.reps_completed, weight_kg: row.weight_kg })
              .eq('id', matchId))
          } else {
            toInsert.push({ ...base, ...row, logged_at: existingLog.logged_at || now, workout_log_id: existingLog.id })
          }
        }
        if (toInsert.length > 0) writes.push(supabase.from('workout_set_logs').insert(toInsert))
        writes.push(supabase.from('workout_logs').update({ total_volume_kg: totalVolume }).eq('id', existingLog.id))
        const failed = (await Promise.all(writes)).find((r) => r.error)
        if (failed) throw failed.error
      } else {
        // The workout log first, then its sets. If the sets fail, the log is removed again
        // so the session is not marked done without them.
        const log = await insertWorkoutLog(totalVolume, now)
        logId = log.id
        if (setRows.length > 0) {
          const { error: setsErr } = await supabase.from('workout_set_logs').insert(setRows.map((row) => ({ ...base, ...row, logged_at: now, workout_log_id: log.id })))
          if (setsErr) {
            const { error: undoErr } = await supabase.from('workout_logs').delete().eq('id', log.id)
            if (undoErr) console.error('workout_logs rollback error:', undoErr)
            throw setsErr
          }
        }
      }
    } catch (e) {
      console.error('Save session error:', e)
      setSaveError(SAVE_FAILED)
      setCompleting(false)
      return
    }

    // Saved. Personal bests are extra: a problem there is logged, never blocks the session.
    let newPBs = []
    try {
      if (isEditing) await reconcilePBsForExercises(byExercise.map((e) => e.exerciseId))
      else if (currentBests) newPBs = await updatePBs(byExercise, currentBests)
    } catch (e) {
      console.error('Personal bests error:', e)
    }
    clearDraft(scheduledWorkout.id)
    setCompleting(false)
    onComplete?.(workoutKey(scheduledWorkout.program_workout_id, scheduledWorkout.id, scheduledWorkout.scheduled_date), { newPBs, totalVolume, setsCompleted: setRows.length, exerciseCount: byExercise.length, workoutName, edited: isEditing, logId })
  }

  // AI workout whose plan could not be read: log it as done without sets.
  async function handleCompleteCustom() {
    // Already logged: nothing more to save, and never a second log for the same session.
    if (isEditing) {
      onComplete?.(workoutKey(scheduledWorkout.program_workout_id, scheduledWorkout.id, scheduledWorkout.scheduled_date), { newPBs: [], totalVolume: 0, setsCompleted: 0, exerciseCount: 0, workoutName, edited: true, logId: existingLog.id })
      return
    }
    setCompleting(true)
    setSaveError(null)
    let log
    try {
      log = await insertWorkoutLog(0, new Date().toISOString())
    } catch (e) {
      console.error('Save session error:', e)
      setSaveError(SAVE_FAILED)
      setCompleting(false)
      return
    }
    clearDraft(scheduledWorkout.id)
    setCompleting(false)
    onComplete?.(workoutKey(scheduledWorkout.program_workout_id, scheduledWorkout.id, scheduledWorkout.scheduled_date), { newPBs: [], totalVolume: 0, setsCompleted: 0, exerciseCount: 0, workoutName, logId: log.id })
  }

  const exDoneOf = (ex) => loggable(ex) && Array.from({ length: setsOf(ex, setData[ex.id]) }, (_, i) => setData[ex.id]?.[i + 1]?.done).every(Boolean)
  const segExercises = hasSetTracking ? trackedExercises.filter(loggable) : EMPTY
  const currentIdx = nextUp ? segExercises.findIndex((ex) => ex.id === nextUp.ex.id) : -1
  const subline = existingLog?.id
    ? 'Editing this session'
    : currentIdx >= 0
      ? `Exercise ${currentIdx + 1} of ${segExercises.length}`
      : segExercises.length > 0 && allDone ? 'Every set ticked' : 'Workout'

  const inputCls = (done) => cx(
    'w-full h-10 rounded-[12px] text-center text-[15px] font-bold tabular-nums outline-none transition-colors',
    done ? 'bg-transparent border border-transparent text-ink' : 'bg-bg border border-line-strong text-ink placeholder:text-faint placeholder:font-semibold focus:border-accent',
  )

  return (
    <Overlay>
      <div className="shrink-0 bg-bg px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} aria-label="Close workout" className="w-11 h-11 rounded-full border border-line-strong flex items-center justify-center text-ink hover:bg-surface-2 shrink-0">
            <X size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold text-ink truncate leading-tight">{workoutName}</h1>
            <p className="text-[13px] text-muted truncate">{subline}</p>
          </div>
          {hasSetTracking && totalSetsCount > 0 && (
            <p className="font-display text-[26px] leading-none text-ink tabular-nums shrink-0" aria-label={`${doneSetsCount} of ${plural(totalSetsCount, 'set')} done`}>
              {doneSetsCount}<span className="text-[16px] text-muted">/{totalSetsCount}</span>
            </p>
          )}
        </div>
        {segExercises.length > 0 && (
          <div className="grid gap-1 mt-3" style={{ gridTemplateColumns: `repeat(${segExercises.length}, minmax(0, 1fr))` }} aria-hidden="true">
            {segExercises.map((ex) => (
              <span key={ex.id} className={cx('h-1.5 rounded-full transition-colors', exDoneOf(ex) ? 'bg-ink' : nextUp?.ex.id === ex.id ? 'bg-tan' : 'bg-surface-2')} />
            ))}
          </div>
        )}
      </div>

      {restTimer !== null && (
        <div className="shrink-0 px-4 pb-2">
          <div className="flex items-center gap-2.5 rounded-full bg-surface-2 text-ink pl-4 pr-1.5 py-1.5">
            <Timer size={18} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold leading-tight">Rest <span className="tabular-nums">{fmtTime(restTimer)}</span></p>
              {nextUp && <p className="text-[12px] text-muted truncate">Next: {nextUp.ex.exercises?.name || 'Exercise'}, set {nextUp.set}</p>}
            </div>
            <button onClick={skipRest} className="h-9 px-3.5 rounded-full bg-surface text-ink text-[13px] font-bold flex items-center gap-1.5 shrink-0">
              <SkipForward size={15} /> Skip rest
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isCustom && aiParseError ? (
          <Card>
            <p className="text-[13px] font-semibold text-muted mb-2">Workout plan</p>
            <pre className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap font-sans">{customContent}</pre>
          </Card>
        ) : isCustom && aiExercises === null ? (
          <Loading />
        ) : (
          trackedExercises.map((ex, idx) => {
            const rowKey = ex.id
            const exerciseId = ex.exercise_id || ex.exercises?.id
            const exSetData = setData[rowKey] || {}
            const prevSets = previousSets[exerciseId] || []
            const muscle = ex.exercises?.muscle_group
            const exDone = exDoneOf(ex)
            const isCurrent = nextUp?.ex.id === rowKey
            const last = prevSets[0]
            return (
              <div key={rowKey} className="space-y-3">
              {isCurrent && (
                <Hero>
                  <button onClick={() => ex.exercises?.id && setInfoFor(ex.exercises)} className="text-left font-display text-[30px] leading-[1.05] inline-flex items-start gap-2" aria-label={`How to do ${ex.exercises?.name || 'this exercise'}`}>
                    <span>{ex.exercises?.name || 'Exercise'}</span>
                    {ex.exercises?.id && <Info size={20} className="shrink-0 mt-2 opacity-70" />}
                  </button>
                  {superMarks[rowKey] && <p className="text-[13px] font-bold text-hero-muted mt-1">Superset {superMarks[rowKey].letter}: {superMarks[rowKey].last ? 'rest after this one' : 'go straight to the next exercise'}</p>}
                  {prescriptionText(ex) && <p className="text-[15px] font-semibold mt-1.5">{prescriptionText(ex)}</p>}
                  {last && <p className="text-[14px] text-hero-muted mt-0.5">Last time {last.weight_kg > 0 ? `${last.weight_kg} kg for ${last.reps}` : plural(last.reps, 'rep')}</p>}
                  {ex.notes && <p className="mt-3.5 rounded-[16px] bg-hero-chip px-3.5 py-3 text-[14px] leading-snug">{ex.notes}</p>}
                </Hero>
              )}
              <Card padded={false} className="overflow-hidden">
                {!isCurrent && <div className="px-4 pt-3.5 pb-2.5 flex items-start gap-3">
                  <span className={cx('w-7 h-7 rounded-full text-[13px] font-bold flex items-center justify-center shrink-0 mt-0.5', exDone ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted')}>
                    {exDone ? <Check size={15} strokeWidth={3} /> : superMarks[rowKey] ? `${superMarks[rowKey].letter}${trackedExercises.slice(0, idx + 1).filter((x) => superMarks[x.id]?.letter === superMarks[rowKey].letter).length}` : idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => ex.exercises?.id && setInfoFor(ex.exercises)} className="text-left text-[17px] font-bold text-ink leading-snug inline-flex items-start gap-1.5">
                      <span>{ex.exercises?.name || 'Exercise'}</span>
                      {ex.exercises?.id && <Info size={15} className="shrink-0 mt-1 text-muted" />}
                    </button>
                    {superMarks[rowKey] && <p className="text-[12px] font-bold text-accent mt-0.5">Superset {superMarks[rowKey].letter}</p>}
                    {prescriptionText(ex) && <p className="text-[13px] text-muted mt-0.5">{prescriptionText(ex)}</p>}
                    {ex.notes && <p className="text-[13px] text-muted italic mt-1">{ex.notes}</p>}
                  </div>
                  {muscle && <Chip className="mt-0.5">{muscle}</Chip>}
                </div>}
                {isCurrent && <div className="h-2" />}

                {loggable(ex) && <div className="grid grid-cols-[28px_1fr_64px_56px_40px] gap-2 items-center px-3 pb-1 text-[11px] font-semibold text-faint">
                  <span className="text-center">Set</span>
                  <span>Previous</span>
                  <span className="text-center">kg</span>
                  <span className="text-center">Reps</span>
                  <span className="flex justify-center"><Check size={14} strokeWidth={3} /></span>
                </div>}

                {!loggable(ex) && (
                  <p className="px-4 pb-3 text-[13px] text-muted">Not in the exercise library yet, so this one isn't tracked.</p>
                )}
                {loggable(ex) && Array.from({ length: setsOf(ex, exSetData) }, (_, i) => {
                  const setNum = i + 1
                  const setInfo = exSetData[setNum] || {}
                  const isDone = !!setInfo.done
                  const prevSet = prevSets[i]
                  const isNext = nextUp?.ex.id === rowKey && nextUp.set === setNum
                  const prevText = prevSet ? (prevSet.weight_kg > 0 ? `${prevSet.weight_kg} x ${prevSet.reps}` : plural(prevSet.reps, 'rep')) : '-'
                  const target = targetFor(ex, setNum)
                  const label = setLabels(plannedSets(ex), setNum)[setNum - 1]
                  const typed = target.type !== 'normal' && setNum <= plannedSets(ex).length
                  return (
                    <div key={setNum} className={cx('grid grid-cols-[28px_1fr_64px_56px_40px] gap-2 items-center px-3 py-1.5 transition-colors', isDone && 'bg-accent-soft')}>
                      <span
                        aria-label={typed ? `${setTypeOf(target.type).label}` : `Set ${label}`}
                        title={typed ? setTypeOf(target.type).label : undefined}
                        className={cx('text-center text-[15px] font-bold tabular-nums', isDone ? 'text-accent' : typed ? 'text-muted' : 'text-ink')}
                      >{label}</span>
                      <span className="text-[13px] text-muted tabular-nums truncate">{prevText}</span>
                      <input
                        type="text" inputMode="decimal" aria-label={`Set ${setNum} kg`}
                        placeholder={target.weight_kg > 0 ? `${target.weight_kg}` : prevSet?.weight_kg > 0 ? `${prevSet.weight_kg}` : ''}
                        value={setInfo.weight || ''}
                        onChange={(e) => { const v = e.target.value; if (v === '' || (parseFloat(v) >= 0 && parseFloat(v) <= 500)) updateSet(rowKey, setNum, 'weight', v) }}
                        disabled={isDone}
                        className={inputCls(isDone)}
                      />
                      <input
                        type="text" inputMode="numeric" aria-label={`Set ${setNum} reps`}
                        placeholder={target.reps || (prevSet?.reps ? `${prevSet.reps}` : '')}
                        value={setInfo.reps || ''}
                        onChange={(e) => { const v = e.target.value; if (v === '' || (parseInt(v, 10) >= 0 && parseInt(v, 10) <= 100)) updateSet(rowKey, setNum, 'reps', v) }}
                        disabled={isDone}
                        className={inputCls(isDone)}
                      />
                      <button
                        onClick={() => (isDone ? updateSet(rowKey, setNum, 'done', false) : markSetDone(ex, setNum))}
                        aria-label={isDone ? `Undo set ${setNum}` : `Set ${setNum} done`}
                        className={cx(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                          isDone ? 'bg-accent text-on-accent' : isNext ? 'border-2 border-accent text-accent' : 'border-2 border-line-strong text-faint',
                        )}
                      >
                        <Check size={18} strokeWidth={3} />
                      </button>
                    </div>
                  )
                })}
                {loggable(ex) && (
                  <div className="flex items-center gap-2 px-3 pt-1.5 pb-2">
                    <button onClick={() => addSet(ex)} className="h-9 px-3.5 rounded-full bg-surface-2 text-ink text-[13px] font-bold inline-flex items-center gap-1.5">
                      <Plus size={15} /> Add set
                    </button>
                    {setsOf(ex, exSetData) > plannedSets(ex).length && !exSetData[setsOf(ex, exSetData)]?.done && (
                      <button onClick={() => removeSet(ex)} className="h-9 px-3.5 rounded-full text-muted text-[13px] font-bold inline-flex items-center gap-1.5 hover:bg-surface-2">
                        <Minus size={15} /> Remove set
                      </button>
                    )}
                  </div>
                )}
                <div className="h-1" />
              </Card>
              </div>
            )
          })
        )}
      </div>

      {planOnly ? (
        <div className="shrink-0 bg-bg px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
          {saveError && <p role="alert" className="text-[13px] font-semibold text-bad text-center mb-2.5">{saveError}</p>}
          <Button size="lg" block onClick={handleCompleteCustom} disabled={completing}>
            {completing ? 'Saving...' : 'Mark as done'}
          </Button>
        </div>
      ) : hasSetTracking && trackedExercises.length > 0 && (
        <div className="shrink-0 bg-bg px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
          {saveError && <p role="alert" className="text-[13px] font-semibold text-bad text-center mb-2.5">{saveError}</p>}
          <Button size="lg" block onClick={() => (allDone ? handleComplete() : setConfirmFinish(true))} disabled={doneSetsCount === 0 || completing}>
            {completing ? 'Saving your session...' : doneSetsCount === 0 ? 'Tick a set to start' : allDone ? 'Finish workout' : `Finish workout (${doneSetsCount} of ${totalSetsCount} sets)`}
          </Button>
        </div>
      )}

      <Sheet
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Leave this session?"
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => { setConfirmLeave(false); onBack({ keptDraft: true }) }}>Leave</Button>
            <Button size="lg" className="flex-1" onClick={() => setConfirmLeave(false)}>Keep going</Button>
          </div>
        }
      >
        <p className="text-[15px] text-muted">Your ticked sets will be kept for when you come back.</p>
      </Sheet>

      <Sheet
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="Finish now?"
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setConfirmFinish(false)}>Keep going</Button>
            <Button size="lg" className="flex-1" onClick={() => { setConfirmFinish(false); handleComplete() }}>Finish</Button>
          </div>
        }
      >
        <p className="text-[15px] text-muted">{plural(totalSetsCount - doneSetsCount, 'set')} not ticked. Only the sets you ticked are saved, so your history stays true to what you did.</p>
      </Sheet>
      {infoFor && <ExerciseInfoSheet exercise={infoFor} onClose={() => setInfoFor(null)} />}
    </Overlay>
  )
}

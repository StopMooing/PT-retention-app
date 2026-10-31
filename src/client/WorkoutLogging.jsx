// Logging a workout, one row per set (set, previous, kg, reps, tick), like Hevy.
// Saves the workout log first, then its set logs (stamped with workout_log_id), then
// personal bests. Nothing is celebrated until the save is confirmed. Editing a finished
// session updates it in place. AI workouts have their exercise names matched with
// resolve_exercise_ids. Ticked sets are kept as a draft on the phone until saved.
import { useState, useEffect } from 'react'
import { Check, Trophy, Timer, SkipForward } from 'lucide-react'
import { supabase } from '../supabase'
import { Button, Card, Chip, Mark, Sheet } from '../ui'
import { Overlay, BackHeader, Loading } from './common'
import { toLocalDateStr } from './dates'
import { workoutKey, workoutName as nameOf, plural } from './metrics'

const EMPTY = []
const cx = (...c) => c.filter(Boolean).join(' ')
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const SAVE_FAILED = "Couldn't save your session. Check your signal and tap Finish again."

// The numbers saved for a ticked set. Saving and personal bests both use these, so they
// always agree. Blank reps fall back to the prescribed reps when that is a plain number
// ("8"), otherwise 0 (ranges like "8-10" or "45s" are not a count).
function repsFor(set, ex) {
  const typed = String(set?.reps ?? '').trim()
  const reps = typed !== '' ? parseFloat(typed) || 0 : (/^\d+$/.test(String(ex?.reps ?? '').trim()) ? parseInt(ex.reps, 10) : 0)
  return Math.min(100, Math.max(0, reps))
}
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

const PB_LABELS = {
  '1rm': { label: 'Estimated 1RM', desc: 'Heaviest estimated single rep' },
  best_set: { label: 'Best set', desc: 'Highest weight x reps' },
  volume: { label: 'Session volume', desc: 'Total kg moved this session' },
}

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
      <Card className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-accent text-on-accent flex items-center justify-center shrink-0"><Check size={18} strokeWidth={3} /></span>
        <p className="text-[15px] font-bold text-ink">{hasCoach ? `Thanks, ${who} will see this.` : 'Thanks, saved with this session.'}</p>
      </Card>
    )
  }
  return (
    <Card>
      <p className="text-[17px] font-bold text-ink">How did that feel?</p>
      <div className="grid grid-cols-5 gap-1.5 mt-3" role="radiogroup" aria-label="How did that feel?">
        {FEEL.map((label, i) => {
          const n = i + 1
          const on = rating === n
          return (
            <button
              key={label}
              role="radio"
              aria-checked={on}
              onClick={() => setRating(on ? 0 : n)}
              className={cx('h-14 rounded-[14px] flex flex-col items-center justify-center transition-colors', on ? 'bg-accent text-on-accent' : 'bg-surface-2 text-ink hover:bg-line')}
            >
              <span className="text-[17px] font-bold leading-none tabular-nums">{n}</span>
              <span className={cx('text-[11px] font-bold mt-1 whitespace-nowrap', on ? 'text-on-accent' : 'text-muted')}>{label}</span>
            </button>
          )
        })}
      </div>
      <textarea
        rows={2}
        maxLength={1000}
        placeholder={hasCoach ? `Anything for ${who}? Optional.` : 'Any notes? Optional.'}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="mt-3 w-full rounded-[14px] border border-line-strong bg-surface text-ink placeholder:text-faint px-4 py-3 outline-none focus:border-accent resize-none"
      />
      {state === 'error' && <p role="alert" className="text-[13px] font-semibold text-bad mt-2">Couldn't save that. Your session is still saved.</p>}
      {(rating > 0 || note.trim()) && (
        <Button variant="soft" block className="mt-3" onClick={save} disabled={state === 'saving'}>
          {state === 'saving' ? 'Saving...' : 'Save'}
        </Button>
      )}
    </Card>
  )
}

export function WorkoutComplete({ workoutName, stats, onDone, coachName, hasCoach }) {
  const { newPBs = [], totalVolume = 0, setsCompleted = 0, exerciseCount = 0, logId = null } = stats || {}
  const tiles = [
    { label: setsCompleted === 1 ? 'Set' : 'Sets', value: setsCompleted },
    { label: exerciseCount === 1 ? 'Exercise' : 'Exercises', value: exerciseCount },
    totalVolume > 0 ? { label: 'kg moved', value: Math.round(totalVolume).toLocaleString('en-AU') } : null,
  ].filter(Boolean)
  return (
    <Overlay z="z-50">
      <div className="flex-1 overflow-y-auto px-4 pt-16 pb-6 space-y-6">
        <div className="text-center">
          <span className="inline-flex w-20 h-20 rounded-full bg-accent-soft text-ink items-center justify-center mb-4">
            <Mark size={44} />
          </span>
          <h1 className="font-display text-[32px] leading-tight text-ink">Session completed</h1>
          <p className="text-muted mt-1">{workoutName}. That's another one in the bank.</p>
        </div>

        <Card className={`grid divide-x divide-line ${tiles.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`} padded={false}>
          {tiles.map((t) => (
            <div key={t.label} className="py-4 text-center">
              <p className="font-display text-[28px] leading-none text-ink tabular-nums">{t.value}</p>
              <p className="text-xs text-muted mt-1.5">{t.label}</p>
            </div>
          ))}
        </Card>

        {newPBs.length > 0 && (
          <div>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted mb-2.5 px-1">New personal bests</h2>
            <Card padded={false} className="divide-y divide-line">
              {newPBs.map((pb, i) => {
                const meta = PB_LABELS[pb.type] || { label: pb.label, desc: '' }
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
                      <Trophy size={20} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-ink truncate">{pb.exerciseName}</p>
                      <p className="text-[13px] text-muted">
                        {meta.label} · up from {pb.previous} {pb.unit}
                      </p>
                    </div>
                    <p className="font-display text-[24px] text-accent tabular-nums shrink-0">
                      {pb.value}<span className="font-sans text-xs font-bold text-muted ml-0.5">{pb.unit}</span>
                    </p>
                  </div>
                )
              })}
            </Card>
          </div>
        )}

        <SessionFeel logId={logId} coachName={coachName} hasCoach={hasCoach} />
      </div>
      <div className="shrink-0 border-t border-line px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
        <Button size="lg" block onClick={onDone}>Back to home</Button>
      </div>
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
  const [previousSets, setPreviousSets] = useState({})
  const [restTimer, setRestTimer] = useState(null)
  const [restInterval, setRestInterval] = useState(null)
  const [aiExercises, setAiExercises] = useState(null)
  const [aiParseError, setAiParseError] = useState(false)

  const trackedExercises = isCustom ? (aiExercises || EMPTY) : exercises
  const hasSetTracking = !isCustom || (aiExercises !== null && !aiParseError)

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

  // Ticking a set with empty boxes copies last session's numbers in.
  function markSetDone(ex, setNumber, restSeconds) {
    const rowKey = ex.id
    const exerciseId = ex.exercise_id ?? ex.exercises?.id ?? null
    const prevSet = (previousSets[exerciseId] || [])[setNumber - 1]
    const current = setData[rowKey]?.[setNumber] || {}
    if ((current.weight === undefined || current.weight === '') && prevSet?.weight_kg > 0) updateSet(rowKey, setNumber, 'weight', String(prevSet.weight_kg))
    if ((current.reps === undefined || current.reps === '') && prevSet?.reps) updateSet(rowKey, setNumber, 'reps', String(prevSet.reps))
    updateSet(rowKey, setNumber, 'done', true)
    if (restSeconds) startRestTimer(restSeconds)
  }

  const totalSetsCount = trackedExercises.reduce((sum, ex) => sum + (ex.sets || 0), 0)
  const doneSetsCount = Object.values(setData).reduce((sum, ex) => sum + Object.values(ex).filter((s) => s.done).length, 0)
  const allDone = hasSetTracking && totalSetsCount > 0 && doneSetsCount >= totalSetsCount
  const progressPct = totalSetsCount > 0 ? Math.round((doneSetsCount / totalSetsCount) * 100) : 0

  // The first set not ticked yet, so the screen can say what is next.
  let nextUp = null
  for (const ex of trackedExercises) {
    for (let s = 1; s <= (ex.sets || 0); s++) {
      if (!setData[ex.id]?.[s]?.done) { nextUp = { ex, set: s }; break }
    }
    if (nextUp) break
  }

  async function reconcilePBsForExercises(exerciseIds) {
    for (const exerciseId of exerciseIds) {
      if (!exerciseId) continue
      const { data: allSets, error } = await supabase
        .from('workout_set_logs')
        .select('weight_kg, reps_completed, logged_at, workout_log_id')
        .eq('client_id', client.id)
        .eq('exercise_id', exerciseId)
      if (error) { console.error('PB reconcile fetch error:', error); continue }
      let best1RM = 0, best1RMAt = null, bestSet = 0, bestSetAt = null
      const volumeByLog = {}
      for (const s of allSets ?? []) {
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
        if (pb.value > 0) {
          const { error: upErr } = await supabase.from('personal_bests').upsert(
            { client_id: client.id, exercise_id: exerciseId, pb_type: pb.type, value: pb.value, achieved_at: pb.at },
            { onConflict: 'client_id,exercise_id,pb_type' },
          )
          if (upErr) console.error('PB reconcile upsert error:', upErr)
        } else {
          await supabase.from('personal_bests').delete().eq('client_id', client.id).eq('exercise_id', exerciseId).eq('pb_type', pb.type)
        }
      }
    }
  }

  // Leaving with ticked sets asks first. The sets stay in the draft either way.
  function handleBack() {
    if (!isEditing && doneSetsCount > 0) setConfirmLeave(true)
    else onBack()
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
  async function updatePBs(byExercise) {
    const newPBs = []
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
      const pbChecks = []
      if (best1RM > 0) pbChecks.push({ type: '1rm', value: Math.round(best1RM * 10) / 10, unit: 'kg' })
      if (bestSet > 0) pbChecks.push({ type: 'best_set', value: bestSet, unit: 'pts' })
      if (sessionVolume > 0) pbChecks.push({ type: 'volume', value: Math.round(sessionVolume), unit: 'kg' })
      for (const check of pbChecks) {
        const { data: existing, error } = await supabase.from('personal_bests').select('value').eq('client_id', client.id).eq('exercise_id', exerciseId).eq('pb_type', check.type).maybeSingle()
        if (error) { console.error('PB read error:', error); continue }
        if (existing && check.value <= existing.value) continue
        const { error: upErr } = await supabase.from('personal_bests').upsert({ client_id: client.id, exercise_id: exerciseId, pb_type: check.type, value: check.value, achieved_at: new Date().toISOString(), scheduled_workout_id: scheduledWorkout.id }, { onConflict: 'client_id,exercise_id,pb_type' })
        if (upErr) { console.error('PB upsert error:', upErr); continue }
        if (existing && ['1rm', 'volume'].includes(check.type)) {
          newPBs.push({ exerciseName, type: check.type, value: check.value, unit: check.unit, previous: existing.value })
        }
      }
    }
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
      for (let s = 1; s <= (ex.sets || 0); s++) {
        const reps = repsFor(exSets[s], ex)
        const weight = weightFor(exSets[s])
        totalVolume += reps * weight
        rows.push({ exercise_id: exerciseId, set_number: s, reps_completed: reps, weight_kg: weight })
      }
      byExercise.push({ exerciseId, exerciseName: ex.exercises?.name || 'Exercise', rows })
    }
    const setRows = byExercise.flatMap((e) => e.rows)
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
        const toInsert = []
        for (const row of setRows) {
          const matchId = existingByKey[`${row.exercise_id}_${row.set_number}`]
          if (matchId) {
            const { error: updErr } = await supabase.from('workout_set_logs')
              .update({ reps_completed: row.reps_completed, weight_kg: row.weight_kg })
              .eq('id', matchId)
            if (updErr) throw updErr
          } else {
            toInsert.push({ ...base, ...row, logged_at: existingLog.logged_at || now, workout_log_id: existingLog.id })
          }
        }
        if (toInsert.length > 0) {
          const { error: insErr } = await supabase.from('workout_set_logs').insert(toInsert)
          if (insErr) throw insErr
        }
        const { error: logErr } = await supabase.from('workout_logs').update({ total_volume_kg: totalVolume }).eq('id', existingLog.id)
        if (logErr) throw logErr
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
      else newPBs = await updatePBs(byExercise)
    } catch (e) {
      console.error('Personal bests error:', e)
    }
    clearDraft(scheduledWorkout.id)
    setCompleting(false)
    onComplete?.(workoutKey(scheduledWorkout.program_workout_id, scheduledWorkout.id, scheduledWorkout.scheduled_date), { newPBs, totalVolume, setsCompleted: doneSetsCount, exerciseCount: trackedExercises.length, workoutName, edited: isEditing, logId })
  }

  // AI workout whose plan could not be read: log it as done without sets.
  async function handleCompleteCustom() {
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

  const inputCls = (done) => cx(
    'w-full h-10 rounded-[12px] text-center text-[15px] font-bold tabular-nums outline-none transition-colors',
    done ? 'bg-transparent border border-transparent text-ink' : 'bg-bg border border-line-strong text-ink placeholder:text-faint placeholder:font-semibold focus:border-accent',
  )

  return (
    <Overlay>
      <BackHeader
        onBack={handleBack}
        eyebrow={hasSetTracking && totalSetsCount > 0 ? `${doneSetsCount} of ${plural(totalSetsCount, 'set')}` : existingLog?.id ? 'Editing' : 'Workout'}
        title={workoutName}
      >
        {hasSetTracking && totalSetsCount > 0 && (
          <div className="h-1.5 rounded-full bg-surface-2 mt-3 overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </BackHeader>

      {restTimer !== null && (
        <div className="shrink-0 bg-accent text-on-accent px-4 py-2.5 flex items-center gap-3">
          <Timer size={20} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-display text-[24px] leading-none tabular-nums">{fmtTime(restTimer)}</p>
            {nextUp && <p className="text-[13px] font-semibold truncate mt-0.5 opacity-90">Next: {nextUp.ex.exercises?.name || 'Exercise'}, set {nextUp.set}</p>}
          </div>
          <button onClick={skipRest} className="h-9 px-3.5 rounded-full text-sm font-bold flex items-center gap-1.5 shrink-0" style={{ backgroundColor: 'rgba(0,0,0,0.12)' }}>
            <SkipForward size={16} /> Skip
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isCustom && aiParseError ? (
          <Card>
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted mb-2">Workout plan</p>
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
            const exDone = Array.from({ length: ex.sets || 0 }, (_, i) => exSetData[i + 1]?.done).every(Boolean)
            return (
              <Card key={rowKey} padded={false} className="overflow-hidden">
                <div className="px-4 pt-3.5 pb-2.5 flex items-start gap-3">
                  <span className={cx('w-7 h-7 rounded-full text-[13px] font-bold flex items-center justify-center shrink-0 mt-0.5', exDone ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted')}>
                    {exDone ? <Check size={15} strokeWidth={3} /> : idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] font-bold text-ink leading-snug">{ex.exercises?.name || 'Exercise'}</p>
                    <p className="text-[13px] text-muted mt-0.5">
                      {ex.sets} x {ex.reps}{ex.rest_seconds ? ` · ${ex.rest_seconds}s rest` : ''}
                    </p>
                    {ex.notes && <p className="text-[13px] text-muted italic mt-1">{ex.notes}</p>}
                  </div>
                  {muscle && <Chip className="mt-0.5">{muscle}</Chip>}
                </div>

                <div className="grid grid-cols-[28px_1fr_64px_56px_40px] gap-2 items-center px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-faint">
                  <span className="text-center">Set</span>
                  <span>Previous</span>
                  <span className="text-center">kg</span>
                  <span className="text-center">Reps</span>
                  <span className="flex justify-center"><Check size={14} strokeWidth={3} /></span>
                </div>

                {Array.from({ length: ex.sets || 0 }, (_, i) => {
                  const setNum = i + 1
                  const setInfo = exSetData[setNum] || {}
                  const isDone = !!setInfo.done
                  const prevSet = prevSets[i]
                  const isNext = nextUp?.ex.id === rowKey && nextUp.set === setNum
                  const prevText = prevSet ? (prevSet.weight_kg > 0 ? `${prevSet.weight_kg} x ${prevSet.reps}` : plural(prevSet.reps, 'rep')) : '-'
                  return (
                    <div key={setNum} className={cx('grid grid-cols-[28px_1fr_64px_56px_40px] gap-2 items-center px-3 py-1.5 transition-colors', isDone && 'bg-accent-soft')}>
                      <span className={cx('text-center text-[15px] font-bold tabular-nums', isDone ? 'text-accent' : 'text-ink')}>{setNum}</span>
                      <span className="text-[13px] text-muted tabular-nums truncate">{prevText}</span>
                      <input
                        type="text" inputMode="decimal" aria-label={`Set ${setNum} kg`}
                        placeholder={prevSet?.weight_kg > 0 ? `${prevSet.weight_kg}` : ''}
                        value={setInfo.weight || ''}
                        onChange={(e) => { const v = e.target.value; if (v === '' || (parseFloat(v) >= 0 && parseFloat(v) <= 500)) updateSet(rowKey, setNum, 'weight', v) }}
                        disabled={isDone}
                        className={inputCls(isDone)}
                      />
                      <input
                        type="text" inputMode="numeric" aria-label={`Set ${setNum} reps`}
                        placeholder={prevSet?.reps ? `${prevSet.reps}` : ''}
                        value={setInfo.reps || ''}
                        onChange={(e) => { const v = e.target.value; if (v === '' || (parseInt(v, 10) >= 0 && parseInt(v, 10) <= 100)) updateSet(rowKey, setNum, 'reps', v) }}
                        disabled={isDone}
                        className={inputCls(isDone)}
                      />
                      <button
                        onClick={() => (isDone ? updateSet(rowKey, setNum, 'done', false) : markSetDone(ex, setNum, ex.rest_seconds))}
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
                <div className="h-2" />
              </Card>
            )
          })
        )}
      </div>

      {(isCustom && aiParseError) ? (
        <div className="shrink-0 border-t border-line bg-bg px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
          {saveError && <p role="alert" className="text-[13px] font-semibold text-bad text-center mb-2.5">{saveError}</p>}
          <Button size="lg" block onClick={handleCompleteCustom} disabled={completing}>
            {completing ? 'Saving...' : 'Mark as done'}
          </Button>
        </div>
      ) : hasSetTracking && trackedExercises.length > 0 && (
        <div className="shrink-0 border-t border-line bg-bg px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
          {saveError && <p role="alert" className="text-[13px] font-semibold text-bad text-center mb-2.5">{saveError}</p>}
          <Button size="lg" block onClick={handleComplete} disabled={!allDone || completing}>
            {completing ? 'Saving your session...' : allDone ? 'Finish workout' : `Tick ${plural(totalSetsCount - doneSetsCount, 'more set', 'more sets')} to finish`}
          </Button>
        </div>
      )}

      <Sheet
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Leave this session?"
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => { setConfirmLeave(false); onBack() }}>Leave</Button>
            <Button size="lg" className="flex-1" onClick={() => setConfirmLeave(false)}>Keep going</Button>
          </div>
        }
      >
        <p className="text-[15px] text-muted">Your ticked sets will be kept for when you come back.</p>
      </Sheet>
    </Overlay>
  )
}

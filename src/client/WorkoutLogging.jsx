// Logging a workout, one row per set (set, previous, kg, reps, tick), like Hevy.
// The saving logic is unchanged from the old ClientApp: set logs, the workout log,
// workout_log_id linkage, personal bests, editing a finished session, and AI workouts
// whose exercise names are matched with resolve_exercise_ids.
import { useState, useEffect } from 'react'
import { Check, Trophy, Timer, SkipForward } from 'lucide-react'
import { supabase } from '../supabase'
import { Button, Card, Chip, Mark } from '../ui'
import { Overlay, BackHeader, Loading } from './common'
import { toLocalDateStr } from './dates'
import { workoutKey, workoutName as nameOf } from './metrics'

const EMPTY = []
const cx = (...c) => c.filter(Boolean).join(' ')
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/* ---------- Finished screen ---------- */

const PB_LABELS = {
  '1rm': { label: 'Estimated 1RM', desc: 'Heaviest estimated single rep' },
  best_set: { label: 'Best set', desc: 'Highest weight x reps' },
  volume: { label: 'Session volume', desc: 'Total kg moved this session' },
}

export function WorkoutComplete({ workoutName, stats, onDone }) {
  const { newPBs = [], totalVolume = 0, setsCompleted = 0, exerciseCount = 0 } = stats || {}
  const tiles = [
    { label: 'Sets', value: setsCompleted },
    { label: 'Exercises', value: exerciseCount },
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
                        {meta.label} · {pb.isFirst ? 'first time logged' : `up from ${pb.previous} ${pb.unit}`}
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

  const [setData, setSetData] = useState({})
  const [completing, setCompleting] = useState(false)
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
    ;(async () => {
      const { data: setRows } = await supabase
        .from('workout_set_logs')
        .select('exercise_id, set_number, weight_kg, reps_completed, logged_at')
        .eq('client_id', client.id)
        .in('exercise_id', wantedIds)
        .lt('logged_at', new Date().toISOString())
        .order('logged_at', { ascending: false })
        .order('set_number', { ascending: true })
      if (cancelled) return
      const latestSessionDate = {}
      const prev = {}
      for (const row of setRows ?? []) {
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
  }, [trackedExercises, client?.id])

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

  async function handleComplete() {
    setCompleting(true)
    const isEditing = !!existingLog?.id
    try {
      let totalVolume = 0
      const setRows = []
      for (const ex of trackedExercises) {
        const exerciseId = ex.exercise_id || ex.exercises?.id
        if (!exerciseId) continue
        const exSets = setData[ex.id] || {}
        for (let s = 1; s <= (ex.sets || 0); s++) {
          const set = exSets[s] || {}
          let reps = parseFloat(set.reps) || 0
          let weight = parseFloat(set.weight) || 0
          if (reps < 0) reps = 0
          if (reps > 100) reps = 100
          if (weight < 0) weight = 0
          if (weight > 500) weight = 500
          totalVolume += reps * weight
          setRows.push({ exercise_id: exerciseId, set_number: s, reps_completed: reps, weight_kg: weight })
        }
      }

      let insertedSetIds = []
      if (isEditing) {
        // Update in place by exercise + set number; insert any sets that were not saved before.
        const { data: existingRows } = await supabase
          .from('workout_set_logs')
          .select('id, exercise_id, set_number')
          .eq('workout_log_id', existingLog.id)
        const existingByKey = {}
        for (const r of existingRows ?? []) existingByKey[`${r.exercise_id}_${r.set_number}`] = r.id
        const toInsert = []
        for (const row of setRows) {
          const matchId = existingByKey[`${row.exercise_id}_${row.set_number}`]
          if (matchId) {
            const { error: updErr } = await supabase.from('workout_set_logs')
              .update({ reps_completed: row.reps_completed, weight_kg: row.weight_kg })
              .eq('id', matchId)
            if (updErr) console.error('set update error:', updErr)
          } else {
            toInsert.push({ client_id: client.id, scheduled_workout_id: scheduledWorkout.id, exercise_id: row.exercise_id, set_number: row.set_number, reps_completed: row.reps_completed, weight_kg: row.weight_kg, logged_at: new Date().toISOString(), workout_log_id: existingLog.id })
          }
        }
        if (toInsert.length > 0) {
          const { error: insErr } = await supabase.from('workout_set_logs').insert(toInsert)
          if (insErr) console.error('set insert (edit) error:', insErr)
        }
      } else {
        const setLogsToInsert = setRows.map((row) => ({ client_id: client.id, scheduled_workout_id: scheduledWorkout.id, exercise_id: row.exercise_id, set_number: row.set_number, reps_completed: row.reps_completed, weight_kg: row.weight_kg, logged_at: new Date().toISOString() }))
        if (setLogsToInsert.length > 0) {
          try {
            const { data: insertedSets, error: setsError } = await supabase.from('workout_set_logs').insert(setLogsToInsert).select('id')
            if (setsError) console.error('workout_set_logs error:', setsError)
            else insertedSetIds = (insertedSets ?? []).map((r) => r.id)
          } catch (e) { console.error('workout_set_logs exception:', e) }
        }
      }

      const newPBs = []
      if (isEditing) {
        const editedExerciseIds = [...new Set(trackedExercises.map((ex) => ex.exercise_id || ex.exercises?.id).filter(Boolean))]
        await reconcilePBsForExercises(editedExerciseIds)
      } else {
        for (const ex of trackedExercises) {
          const exerciseId = ex.exercise_id || ex.exercises?.id
          if (!exerciseId) continue
          const exSets = setData[ex.id] || {}
          const exerciseName = ex.exercises?.name || 'Exercise'
          let best1RM = 0, bestSet = 0, sessionVolume = 0
          for (let s = 1; s <= (ex.sets || 0); s++) {
            const set = exSets[s] || {}
            const reps = parseFloat(set.reps) || parseFloat(ex.reps) || 0
            const weight = parseFloat(set.weight) || 0
            if (weight === 0) continue
            const estimated1RM = reps === 1 ? weight : weight * (1 + reps / 30)
            if (estimated1RM > best1RM) best1RM = estimated1RM
            const setScore = weight * reps
            if (setScore > bestSet) bestSet = setScore
            sessionVolume += reps * weight
          }
          const pbChecks = []
          if (best1RM > 0) pbChecks.push({ type: '1rm', value: Math.round(best1RM * 10) / 10, label: 'Estimated 1RM', unit: 'kg' })
          if (bestSet > 0) pbChecks.push({ type: 'best_set', value: bestSet, label: 'Best Set Score', unit: 'pts' })
          if (sessionVolume > 0) pbChecks.push({ type: 'volume', value: Math.round(sessionVolume), label: 'Session Volume', unit: 'kg' })
          for (const check of pbChecks) {
            const { data: existing } = await supabase.from('personal_bests').select('value').eq('client_id', client.id).eq('exercise_id', exerciseId).eq('pb_type', check.type).maybeSingle()
            if (!existing || check.value > existing.value) {
              await supabase.from('personal_bests').upsert({ client_id: client.id, exercise_id: exerciseId, pb_type: check.type, value: check.value, achieved_at: new Date().toISOString(), scheduled_workout_id: scheduledWorkout.id }, { onConflict: 'client_id,exercise_id,pb_type' })
              if (['1rm', 'volume'].includes(check.type)) {
                newPBs.push(existing
                  ? { exerciseName, type: check.type, value: check.value, unit: check.unit, label: check.label, previous: existing.value, isFirst: false }
                  : { exerciseName, type: check.type, value: check.value, unit: check.unit, label: check.label, isFirst: true })
              }
            }
          }
        }
      }

      if (isEditing) {
        const { error: logErr } = await supabase.from('workout_logs').update({ total_volume_kg: totalVolume }).eq('id', existingLog.id)
        if (logErr) console.error('workout_logs update error:', logErr)
      } else {
        try {
          const { data: newLog, error: logError } = await supabase.from('workout_logs').insert({
            client_id: client.id,
            program_workout_id: scheduledWorkout.program_workout_id ?? null,
            scheduled_workout_id: scheduledWorkout.id ?? null,
            logged_at: new Date().toISOString(),
            completed: true,
            total_volume_kg: totalVolume,
          }).select('id').single()
          if (logError) console.error('workout_logs insert error:', logError)
          if (newLog && insertedSetIds.length > 0) {
            const { error: stampError } = await supabase.from('workout_set_logs').update({ workout_log_id: newLog.id }).in('id', insertedSetIds)
            if (stampError) console.error('workout_log_id stamp error:', stampError)
          }
        } catch (logErr) {
          console.error('workout_logs insert exception:', logErr)
        }
      }
      onComplete && onComplete(workoutKey(scheduledWorkout.program_workout_id, scheduledWorkout.id, scheduledWorkout.scheduled_date), { newPBs, totalVolume, setsCompleted: doneSetsCount, exerciseCount: trackedExercises.length, workoutName })
    } catch (e) {
      console.error('Complete error:', e)
      alert('Something went wrong: ' + e.message)
    }
    setCompleting(false)
  }

  // AI workout whose plan could not be read: log it as done without sets.
  async function handleCompleteCustom() {
    setCompleting(true)
    try {
      try {
        const { error: logError } = await supabase.from('workout_logs').insert({
          client_id: client.id,
          program_workout_id: scheduledWorkout.program_workout_id ?? null,
          scheduled_workout_id: scheduledWorkout.id ?? null,
          logged_at: new Date().toISOString(),
          completed: true,
          total_volume_kg: 0,
        })
        if (logError) console.error('workout_logs insert error:', logError)
      } catch (logErr) {
        console.error('workout_logs insert exception:', logErr)
      }
      onComplete && onComplete(workoutKey(scheduledWorkout.program_workout_id, scheduledWorkout.id, scheduledWorkout.scheduled_date), { newPBs: [], totalVolume: 0, setsCompleted: 0, exerciseCount: 0, workoutName })
    } catch (e) {
      console.error('Complete error:', e)
      alert('Something went wrong: ' + e.message)
    }
    setCompleting(false)
  }

  const inputCls = (done) => cx(
    'w-full h-10 rounded-[12px] text-center text-[15px] font-bold tabular-nums outline-none transition-colors',
    done ? 'bg-transparent border border-transparent text-ink' : 'bg-bg border border-line-strong text-ink placeholder:text-faint placeholder:font-semibold focus:border-accent',
  )

  return (
    <Overlay>
      <BackHeader
        onBack={onBack}
        eyebrow={hasSetTracking && totalSetsCount > 0 ? `${doneSetsCount} of ${totalSetsCount} sets` : existingLog?.id ? 'Editing' : 'Workout'}
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
                  const prevText = prevSet ? (prevSet.weight_kg > 0 ? `${prevSet.weight_kg} x ${prevSet.reps}` : `${prevSet.reps} reps`) : '-'
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
          <Button size="lg" block onClick={handleCompleteCustom} disabled={completing}>
            {completing ? 'Saving...' : 'Mark as done'}
          </Button>
        </div>
      ) : hasSetTracking && trackedExercises.length > 0 && (
        <div className="shrink-0 border-t border-line bg-bg px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
          <Button size="lg" block onClick={handleComplete} disabled={!allDone || completing}>
            {completing ? 'Saving your session...' : allDone ? 'Finish workout' : `Tick ${totalSetsCount - doneSetsCount} more ${totalSetsCount - doneSetsCount === 1 ? 'set' : 'sets'} to finish`}
          </Button>
        </div>
      )}
    </Overlay>
  )
}

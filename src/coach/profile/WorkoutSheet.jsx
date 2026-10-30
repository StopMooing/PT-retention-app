// One scheduled workout: preview it, log it live for the client, or fix a logged session.
// The data logic here is unchanged from the original calendar day modal; only the look moved.
import { useEffect, useState } from 'react'
import { Clock, Dumbbell, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../supabase'
import { Sheet, Button, Chip, SectionLabel } from '../../ui'

const numCls = 'w-20 h-10 px-2 rounded-[12px] border border-line-strong bg-surface text-ink text-center font-semibold tabular-nums outline-none focus:border-accent'

function ExerciseLine({ idx, name, detail, note }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="w-7 h-7 rounded-full bg-accent-soft text-accent text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-ink leading-tight">{name}</p>
        <p className="text-[13px] text-muted mt-0.5">{detail}</p>
        {note && <p className="text-[13px] text-muted mt-0.5 italic">{note}</p>}
      </div>
    </div>
  )
}

function SetRow({ label, weight, reps, onWeight, onReps, placeholder }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] text-muted w-12 shrink-0">{label}</span>
      <input type="number" inputMode="decimal" min="0" max="500" step="0.5" value={weight} placeholder={placeholder} onChange={onWeight} className={numCls} aria-label={`${label} weight`} />
      <span className="text-[13px] text-muted">kg ×</span>
      <input type="number" inputMode="numeric" min="0" max="100" value={reps} placeholder={placeholder} onChange={onReps} className={numCls + ' !w-16'} aria-label={`${label} reps`} />
      <span className="text-[13px] text-muted">reps</span>
    </div>
  )
}

export default function WorkoutSheet({ selectedDay, onClose, clientId, onWorkoutDone }) {
  const [loggedSets, setLoggedSets] = useState([])
  const [editedSets, setEditedSets] = useState({})
  const [loadingSets, setLoadingSets] = useState(false)
  const [savingEdits, setSavingEdits] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [loggingMode, setLoggingMode] = useState(false)
  const [liveSetData, setLiveSetData] = useState({})
  const [coachAiExercises, setCoachAiExercises] = useState(null)
  const [aiParseError, setAiParseError] = useState(false)
  const [completing, setCompleting] = useState(false)

  const completedLog = selectedDay?.workout?.completedLog ?? null
  const workoutRef = selectedDay?.workout ?? null
  const isCustom = !!workoutRef?._isCustom

  useEffect(() => {
    setLoggedSets([]); setEditedSets({}); setLoggingMode(false); setLiveSetData({}); setCoachAiExercises(null); setAiParseError(false)
    if (!selectedDay || !completedLog || !clientId) return
    let cancelled = false
    async function fetchLoggedSets() {
      setLoadingSets(true)
      const { data } = await supabase
        .from("workout_set_logs")
        .select("id, set_number, reps_completed, weight_kg, exercise_id, logged_at, exercises(name)")
        .eq("workout_log_id", completedLog.id)
        .order("set_number", { ascending: true })
      if (cancelled) return
      setLoggedSets(data ?? [])
      setLoadingSets(false)
    }
    fetchLoggedSets()
    return () => { cancelled = true }
  }, [selectedDay, completedLog, clientId])

  useEffect(() => {
    if (!loggingMode || !isCustom || !workoutRef?.customContent) return
    let cancelled = false
    const failSafe = setTimeout(() => { if (!cancelled) setAiParseError(true) }, 10000)
    async function buildAiExercises() {
      try {
        let parsed = null
        try {
          const jsonMatch = workoutRef.customContent.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const p = JSON.parse(jsonMatch[0])
            if (p && Array.isArray(p.exercises) && p.exercises.length > 0) parsed = p
          }
        } catch (e) { console.warn('AI workout JSON parse failed:', e) }
        if (!parsed) { if (!cancelled) { clearTimeout(failSafe); setAiParseError(true) } ; return }
        const names = parsed.exercises.map(e => (e?.name ?? '').trim()).filter(Boolean)
        const resolvedMap = {}
        try {
          const { data: resolved, error } = await supabase.rpc('resolve_exercise_ids', { p_names: names })
          if (error) console.error('resolve_exercise_ids error:', error)
          for (const row of resolved ?? []) {
            const key = (row?.input_name ?? '').trim().toLowerCase()
            if (key) resolvedMap[key] = row
          }
        } catch (e) { console.error('resolve_exercise_ids exception:', e) }
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
        if (!cancelled) { clearTimeout(failSafe); setCoachAiExercises(built) }
      } catch (e) {
        console.error('buildAiExercises fatal error:', e)
        if (!cancelled) { clearTimeout(failSafe); setAiParseError(true) }
      }
    }
    buildAiExercises()
    return () => { cancelled = true; clearTimeout(failSafe) }
  }, [loggingMode, isCustom, workoutRef])

  if (!selectedDay) return null;
  const { date, workout } = selectedDay;
  const exercises = workout.exercises || workout.workout_exercises || [];
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
  const estMinutes = Math.round(totalSets * 2.5);
  const dateLabel = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  const hasEdits = Object.keys(editedSets).length > 0

  const setsByExercise = loggedSets.reduce((acc, s) => {
    const key = s.exercise_id || 'unknown'
    if (!acc[key]) acc[key] = { name: s.exercises?.name || 'Exercise', sets: [] }
    acc[key].sets.push(s)
    return acc
  }, {})

  const trackedExercises = loggingMode
    ? (isCustom ? (coachAiExercises || []) : exercises.map(ex => ({
        id: ex.id,
        exercise_id: ex.exercise_id || ex.exercises?.id || null,
        exercises: { name: ex.exercise?.name || ex.exercises?.name || ex.name || 'Exercise' },
        sets: ex.sets || 1,
        reps: String(ex.reps || ''),
      })))
    : []

  function updateLiveSet(exerciseIdx, setIdx, field, rawValue) {
    setLiveSetData(prev => {
      const key = `${exerciseIdx}_${setIdx}`
      const existing = prev[key] || {}
      if (rawValue === '') return { ...prev, [key]: { ...existing, [field]: '' } }
      const n = field === 'weight_kg' ? parseFloat(rawValue) : parseInt(rawValue)
      if (isNaN(n)) return prev
      const clamped = field === 'weight_kg' ? Math.min(500, Math.max(0, n)) : Math.min(100, Math.max(0, n))
      return { ...prev, [key]: { ...existing, [field]: clamped } }
    })
  }

  function handleSetEdit(setId, field, rawValue) {
    if (rawValue === '') {
      setEditedSets(prev => ({ ...prev, [setId]: { ...prev[setId], [field]: '' } }))
      return
    }
    const n = field === 'weight_kg' ? parseFloat(rawValue) : parseInt(rawValue)
    if (isNaN(n)) return
    const clamped = field === 'weight_kg' ? Math.min(500, Math.max(0, n)) : Math.min(100, Math.max(0, n))
    setEditedSets(prev => ({ ...prev, [setId]: { ...prev[setId], [field]: clamped } }))
  }

  function displayValue(s, field) {
    const edited = editedSets[s.id]
    if (edited && edited[field] !== undefined) return edited[field]
    return field === 'weight_kg' ? s.weight_kg : s.reps_completed
  }

  async function recomputePBsForExercise(exerciseId) {
    const { data: allSets, error: fetchError } = await supabase
      .from('workout_set_logs')
      .select('weight_kg, reps_completed, logged_at, workout_log_id')
      .eq('client_id', clientId)
      .eq('exercise_id', exerciseId)
    if (fetchError) throw fetchError
    let best1RM = 0, best1RMAt = null, bestSetScore = 0, bestSetAt = null
    const volumeByLog = {}
    for (const row of allSets ?? []) {
      const weight = parseFloat(row.weight_kg) || 0
      const reps = parseFloat(row.reps_completed) || 0
      if (weight === 0) continue
      const estimated1RM = reps === 1 ? weight : weight * (1 + reps / 30)
      if (estimated1RM > best1RM) { best1RM = estimated1RM; best1RMAt = row.logged_at }
      const setScore = weight * reps
      if (setScore > bestSetScore) { bestSetScore = setScore; bestSetAt = row.logged_at }
      if (!row.workout_log_id) continue
      const logKey = row.workout_log_id
      if (!volumeByLog[logKey]) volumeByLog[logKey] = { total: 0, at: row.logged_at }
      volumeByLog[logKey].total += weight * reps
      if (row.logged_at > volumeByLog[logKey].at) volumeByLog[logKey].at = row.logged_at
    }
    let bestVolume = 0, bestVolumeAt = null
    for (const logKey of Object.keys(volumeByLog)) {
      if (volumeByLog[logKey].total > bestVolume) { bestVolume = volumeByLog[logKey].total; bestVolumeAt = volumeByLog[logKey].at }
    }
    const results = [
      { type: '1rm', value: Math.round(best1RM * 10) / 10, at: best1RMAt },
      { type: 'best_set', value: bestSetScore, at: bestSetAt },
      { type: 'volume', value: Math.round(bestVolume), at: bestVolumeAt },
    ]
    for (const pb of results) {
      if (pb.value > 0) {
        const { error: pbError } = await supabase.from('personal_bests').upsert(
          { client_id: clientId, exercise_id: exerciseId, pb_type: pb.type, value: pb.value, achieved_at: pb.at },
          { onConflict: 'client_id,exercise_id,pb_type' }
        )
        if (pbError) throw pbError
      } else {
        const { error: delError } = await supabase.from('personal_bests')
          .delete()
          .eq('client_id', clientId)
          .eq('exercise_id', exerciseId)
          .eq('pb_type', pb.type)
        if (delError) throw delError
      }
    }
  }

  async function handleSaveEdits() {
    if (!hasEdits || savingEdits) return
    setSavingEdits(true)
    try {
      const touchedExerciseIds = new Set()
      for (const [setId, fields] of Object.entries(editedSets)) {
        const original = loggedSets.find(s => String(s.id) === String(setId))
        if (!original) continue
        const weight = fields.weight_kg !== undefined && fields.weight_kg !== '' ? Math.min(500, Math.max(0, parseFloat(fields.weight_kg) || 0)) : (parseFloat(original.weight_kg) || 0)
        const reps = fields.reps_completed !== undefined && fields.reps_completed !== '' ? Math.min(100, Math.max(0, parseInt(fields.reps_completed) || 0)) : (parseInt(original.reps_completed) || 0)
        const { error } = await supabase.from('workout_set_logs').update({ weight_kg: weight, reps_completed: reps }).eq('id', original.id)
        if (error) throw error
        if (original.exercise_id) touchedExerciseIds.add(original.exercise_id)
      }
      for (const exerciseId of touchedExerciseIds) {
        await recomputePBsForExercise(exerciseId)
      }
      setLoggedSets(prev => prev.map(s => {
        const fields = editedSets[s.id]
        if (!fields) return s
        return {
          ...s,
          weight_kg: fields.weight_kg !== undefined && fields.weight_kg !== '' ? fields.weight_kg : s.weight_kg,
          reps_completed: fields.reps_completed !== undefined && fields.reps_completed !== '' ? fields.reps_completed : s.reps_completed,
        }
      }))
      setEditedSets({})
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2500)
    } catch (e) {
      console.error('Save edits error:', e)
      alert('Failed to save changes: ' + e.message)
    }
    setSavingEdits(false)
  }

  async function handleCompleteSession() {
    if (completing) return
    setCompleting(true)
    try {
      const now = new Date().toISOString()
      let totalVolume = 0
      const setInserts = []
      const touchedExerciseIds = new Set()
      trackedExercises.forEach((ex, exIdx) => {
        const exerciseId = ex.exercise_id || ex.exercises?.id
        if (!exerciseId) return
        for (let setIdx = 0; setIdx < (ex.sets || 1); setIdx++) {
          const key = `${exIdx}_${setIdx}`
          const val = liveSetData[key] || {}
          let weight = parseFloat(val.weight_kg) || 0
          let reps = parseInt(val.reps_completed) || 0
          if (weight < 0) weight = 0; if (weight > 500) weight = 500
          if (reps < 0) reps = 0; if (reps > 100) reps = 100
          if (weight > 0 || reps > 0) {
            totalVolume += reps * weight
            setInserts.push({
              client_id: clientId,
              scheduled_workout_id: workout.id ?? null,
              exercise_id: exerciseId,
              set_number: setIdx + 1,
              weight_kg: weight,
              reps_completed: reps,
              logged_at: now,
            })
            touchedExerciseIds.add(exerciseId)
          }
        }
      })
      let insertedSetIds = []
      if (setInserts.length > 0) {
        const { data: insertedSets, error: setsError } = await supabase.from('workout_set_logs').insert(setInserts).select('id')
        if (setsError) throw setsError
        insertedSetIds = (insertedSets ?? []).map(r => r.id)
      }
      const { data: newLog, error: logError } = await supabase
        .from('workout_logs')
        .insert({
          client_id: clientId,
          program_workout_id: workout._isCustom ? null : (workout.program_workout_id ?? null),
          scheduled_workout_id: workout.id ?? null,
          logged_at: now,
          completed: true,
          total_volume_kg: totalVolume,
        })
        .select()
        .single()
      if (logError) throw logError
      if (newLog && insertedSetIds.length > 0) {
        const { error: stampError } = await supabase.from('workout_set_logs').update({ workout_log_id: newLog.id }).in('id', insertedSetIds)
        if (stampError) console.error('workout_log_id stamp error:', stampError)
      }
      for (const exerciseId of touchedExerciseIds) {
        await recomputePBsForExercise(exerciseId)
      }
      onWorkoutDone && onWorkoutDone(newLog)
      onClose()
    } catch (e) {
      console.error('Complete session error:', e)
      alert('Failed to complete session: ' + e.message)
    }
    setCompleting(false)
  }


  let customParsed = null
  if (!completedLog && !loggingMode && workout._isCustom && workout.customContent) {
    try {
      const candidate = JSON.parse(workout.customContent)
      if (candidate && Array.isArray(candidate.exercises)) customParsed = candidate
    } catch { /* legacy plain-text content, shown as text below */ }
  }

  const footer = completedLog ? (
    <Button block size="lg" onClick={handleSaveEdits} disabled={!hasEdits || savingEdits}>
      {savingEdits ? 'Saving' : savedFlash ? 'Saved' : hasEdits ? 'Save changes' : 'No changes'}
    </Button>
  ) : loggingMode ? (
    <div className="flex gap-2">
      <Button variant="secondary" size="lg" className="flex-1" onClick={() => setLoggingMode(false)}>Cancel</Button>
      <Button size="lg" className="flex-1" onClick={handleCompleteSession} disabled={completing}>{completing ? 'Saving' : 'Complete session'}</Button>
    </div>
  ) : (
    <Button block size="lg" onClick={() => setLoggingMode(true)}>Start workout</Button>
  )

  return (
    <Sheet open onClose={onClose} title={workout.name} footer={footer}>
      <p className="text-[13px] text-muted -mt-1">{dateLabel}</p>
      <div className="flex flex-wrap items-center gap-2 mt-2.5">
        {completedLog && <Chip tone="accent"><CheckCircle2 size={13} /> Completed</Chip>}
        {loggingMode && <Chip tone="solid">Logging live</Chip>}
        {estMinutes > 0 && <Chip><Clock size={13} /> About {estMinutes} min</Chip>}
        {exercises.length > 0 && <Chip><Dumbbell size={13} /> {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}</Chip>}
      </div>

      <div className="mt-5">
        {completedLog ? (
          <>
            <SectionLabel className="!px-0">Logged results</SectionLabel>
            {loadingSets ? (
              <p className="text-sm text-muted text-center py-6">Getting the logged sets</p>
            ) : Object.keys(setsByExercise).length === 0 ? (
              <p className="text-sm text-muted text-center py-6">No set data was recorded for this session.</p>
            ) : (
              <div className="space-y-5">
                {Object.entries(setsByExercise).map(([exKey, ex]) => (
                  <div key={exKey}>
                    <p className="text-[15px] font-bold text-ink mb-2">{ex.name}</p>
                    <div className="space-y-2">
                      {ex.sets.map((s) => (
                        <SetRow
                          key={s.id}
                          label={`Set ${s.set_number}`}
                          weight={displayValue(s, 'weight_kg')}
                          reps={displayValue(s, 'reps_completed')}
                          onWeight={(e) => handleSetEdit(s.id, 'weight_kg', e.target.value)}
                          onReps={(e) => handleSetEdit(s.id, 'reps_completed', e.target.value)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : loggingMode ? (
          <>
            <SectionLabel className="!px-0">Log sets</SectionLabel>
            {isCustom && !coachAiExercises && !aiParseError && <p className="text-sm text-muted text-center py-6">Preparing exercises</p>}
            {aiParseError && <p className="text-sm text-bad text-center py-6">Could not read this AI workout. Check the workout content.</p>}
            {trackedExercises.length === 0 && !aiParseError && !(isCustom && !coachAiExercises) && (
              <p className="text-sm text-muted text-center py-6">No exercises to log.</p>
            )}
            <div className="space-y-5">
              {trackedExercises.map((ex, exIdx) => (
                <div key={ex.id || exIdx}>
                  <p className="text-[15px] font-bold text-ink">{ex.exercises?.name || 'Exercise'}</p>
                  <p className="text-[13px] text-muted mb-2">{ex.sets || 1} sets × {ex.reps || '-'} reps</p>
                  <div className="space-y-2">
                    {Array.from({ length: ex.sets || 1 }).map((_, setIdx) => {
                      const val = liveSetData[`${exIdx}_${setIdx}`] || {}
                      return (
                        <SetRow
                          key={setIdx}
                          label={`Set ${setIdx + 1}`}
                          placeholder="0"
                          weight={val.weight_kg ?? ''}
                          reps={val.reps_completed ?? ''}
                          onWeight={(e) => updateLiveSet(exIdx, setIdx, 'weight_kg', e.target.value)}
                          onReps={(e) => updateLiveSet(exIdx, setIdx, 'reps_completed', e.target.value)}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : workout._isCustom && workout.customContent ? (
          <>
            <SectionLabel className="!px-0">AI workout plan</SectionLabel>
            {customParsed ? (
              <div className="divide-y divide-line">
                {customParsed.exercises.map((ex, idx) => (
                  <ExerciseLine
                    key={idx}
                    idx={idx}
                    name={ex.name || 'Exercise'}
                    detail={`${ex.sets || 0} sets × ${ex.reps || '-'} reps${ex.rest_seconds ? ` · ${ex.rest_seconds}s rest` : ''}`}
                    note={ex.notes}
                  />
                ))}
              </div>
            ) : (
              <pre className="text-sm text-ink leading-relaxed whitespace-pre-wrap font-sans bg-surface-2 rounded-[14px] p-4">{workout.customContent}</pre>
            )}
          </>
        ) : exercises.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">No exercises added to this workout yet.</p>
        ) : (
          <div className="divide-y divide-line">
            {exercises.map((ex, idx) => (
              <ExerciseLine
                key={ex.id || idx}
                idx={idx}
                name={ex.exercise?.name || ex.exercises?.name || ex.name || 'Exercise'}
                detail={`${ex.sets || 0} sets × ${ex.reps || '-'} reps${ex.rest_seconds ? ` · ${ex.rest_seconds}s rest` : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    </Sheet>
  )
}

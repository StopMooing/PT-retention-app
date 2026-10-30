// Progress > Sessions: recent finished sessions. Tap one to see its sets.
// Hidden until there is at least one.
import { useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import { supabase } from '../supabase'
import { Card, SectionLabel } from '../ui'
import { plural } from './metrics'
import { DoneDot } from './common'

const cx = (...c) => c.filter(Boolean).join(' ')
const SHOW = 5

export default function SessionsList({ client }) {
  const [logs, setSessionLogs] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [setLogs, setSetLogs] = useState({})

  // Last 30 finished sessions, with program workout names looked up in a second step.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: rows, error } = await supabase
          .from('workout_logs')
          .select('id, client_id, program_workout_id, scheduled_workout_id, logged_at, completed, total_volume_kg')
          .eq('client_id', client.id)
          .eq('completed', true)
          .order('logged_at', { ascending: false })
          .limit(30)
        if (error) throw error
        const pwIds = [...new Set((rows ?? []).map((l) => l.program_workout_id).filter(Boolean))]
        const nameMap = {}
        if (pwIds.length > 0) {
          const { data: pwData } = await supabase.from('program_workouts').select('id, name').in('id', pwIds)
          if (pwData) pwData.forEach((pw) => { nameMap[pw.id] = pw.name })
        }
        // AI and saved workouts have no program day: use the saved workout's name.
        const swIds = [...new Set((rows ?? []).filter((l) => !l.program_workout_id && l.scheduled_workout_id).map((l) => l.scheduled_workout_id))]
        const savedNames = {}
        if (swIds.length > 0) {
          const { data: swData, error: swErr } = await supabase.from('scheduled_workouts').select('id, saved_workouts(name)').in('id', swIds)
          if (swErr) console.error('Sessions saved workout names error:', swErr)
          for (const sw of swData ?? []) if (sw.saved_workouts?.name) savedNames[sw.id] = sw.saved_workouts.name
        }
        if (!cancelled) setSessionLogs((rows ?? []).map((l) => ({ ...l, _workoutName: nameMap[l.program_workout_id] || savedNames[l.scheduled_workout_id] || null })))
      } catch (e) {
        console.error('Sessions load error:', e)
      }
    })()
    return () => { cancelled = true }
  }, [client.id])

  async function toggle(log) {
    if (expandedId === log.id) { setExpandedId(null); return }
    setExpandedId(log.id)
    if (setLogs[log.id]) return
    try {
      const { data } = await supabase
        .from('workout_set_logs')
        .select('id, set_number, reps_completed, weight_kg, exercise_id, exercises(name, muscle_group)')
        .eq('workout_log_id', log.id)
        .order('exercise_id')
        .order('set_number')
      if (data) setSetLogs((prev) => ({ ...prev, [log.id]: data }))
    } catch (e) { console.error('Set logs load error:', e) }
  }

  if (logs.length === 0) return null
  const shown = showAll ? logs : logs.slice(0, SHOW)

  return (
    <section>
      <SectionLabel>Sessions</SectionLabel>
      <Card padded={false} className="divide-y divide-line">
        {shown.map((log) => {
          const open = expandedId === log.id
          const sets = setLogs[log.id] ?? []
          const byEx = {}
          for (const s of sets) (byEx[s.exercise_id] ||= { name: s.exercises?.name || 'Exercise', sets: [] }).sets.push(s)
          return (
            <div key={log.id}>
              <button onClick={() => toggle(log)} className="w-full text-left flex items-center gap-3 px-4 py-3.5 min-h-[64px] hover:bg-surface-2">
                <DoneDot done size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-ink truncate">{log._workoutName || 'Workout'}</p>
                  <p className="text-[13px] text-muted">
                    {new Date(log.logged_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {log.total_volume_kg > 0 ? ` · ${Math.round(log.total_volume_kg).toLocaleString('en-AU')} kg moved` : ''}
                  </p>
                </div>
                <ChevronRight size={18} className={cx('text-faint transition-transform', open && 'rotate-90')} />
              </button>
              {open && (
                <div className="px-4 pb-4 space-y-3">
                  {sets.length === 0 ? (
                    <p className="text-[13px] text-muted">This one was logged without sets.</p>
                  ) : Object.values(byEx).map((ex) => (
                    <div key={ex.name}>
                      <p className="text-[13px] font-bold text-ink mb-1.5">{ex.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ex.sets.map((s) => (
                          <span key={s.id} className="h-8 px-3 rounded-full bg-surface-2 text-[13px] font-semibold text-ink inline-flex items-center tabular-nums">
                            {s.weight_kg > 0 ? `${s.weight_kg} kg x ${s.reps_completed}` : plural(s.reps_completed, 'rep')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </Card>
      {logs.length > SHOW && (
        <button onClick={() => setShowAll((v) => !v)} className="w-full text-center text-[13px] font-bold text-accent pt-2.5">
          {showAll ? 'Show fewer' : `Show all ${plural(logs.length, 'session')}`}
        </button>
      )}
    </section>
  )
}

// Habits the coach set for this client, ticked off for today on Home. The coach sees the
// same habit_logs rows on their Habits screen. Hidden when there are no habits.
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../supabase'
import { Card } from '../ui'
import { toLocalDateStr, addDays, mondayOf } from './dates'

export default function HabitsCard({ client, showToast }) {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [busy, setBusy] = useState(null)
  const today = toLocalDateStr()
  const monday = mondayOf(today)

  useEffect(() => {
    if (!client?.id || !client.pt_id) return
    let cancelled = false
    ;(async () => {
      const { data: h, error } = await supabase.from('habits').select('id, name, description, icon, frequency, target_per_week').eq('client_id', client.id).eq('is_active', true).order('created_at')
      if (error) { console.error('Habits load error:', error); return }
      if (cancelled || !h?.length) return
      const { data: l } = await supabase.from('habit_logs').select('id, habit_id, completed_date, completed').eq('client_id', client.id).gte('completed_date', addDays(today, -6)) // this week's Monday is never further back
      if (cancelled) return
      setHabits(h)
      setLogs(l ?? [])
    })()
    return () => { cancelled = true }
  }, [client?.id, client?.pt_id, today, monday])

  if (habits.length === 0) return null

  const doneOn = (habitId, day) => logs.some((l) => l.habit_id === habitId && l.completed_date === day && l.completed)
  const doneToday = habits.filter((h) => doneOn(h.id, today)).length

  async function toggle(habit) {
    if (busy) return
    setBusy(habit.id)
    const was = doneOn(habit.id, today)
    const { data, error } = was
      ? await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('client_id', client.id).eq('completed_date', today).select('id')
      : await supabase.from('habit_logs').insert({ habit_id: habit.id, client_id: client.id, completed_date: today, completed: true }).select('id, habit_id, completed_date, completed')
    setBusy(null)
    if (error || !data?.length) {
      console.error('Habit tick error:', error ?? 'no row changed')
      showToast?.("Couldn't save that. Try again.")
      return
    }
    setLogs((prev) => (was ? prev.filter((l) => !(l.habit_id === habit.id && l.completed_date === today)) : [...prev, ...data]))
  }

  return (
    <Card padded={false}>
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Habits</p>
        <p className="text-[13px] font-bold text-muted tabular-nums">{doneToday} of {habits.length} today</p>
      </div>
      <ul className="divide-y divide-line">
        {habits.map((h) => {
          const done = doneOn(h.id, today)
          const target = h.target_per_week || 7
          const thisWeek = logs.filter((l) => l.habit_id === h.id && l.completed && l.completed_date >= monday).length
          return (
            <li key={h.id}>
              <button onClick={() => toggle(h)} disabled={busy === h.id} aria-pressed={done} className="w-full flex items-center gap-3 px-4 py-3 min-h-[60px] text-left">
                {h.icon && <span className="text-[20px] shrink-0" aria-hidden>{h.icon}</span>}
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-bold text-ink truncate">{h.name}</span>
                  <span className="block text-[13px] text-muted truncate">
                    {target < 7 ? `${thisWeek} of ${target} this week` : h.description || 'Every day'}
                  </span>
                </span>
                <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${done ? 'bg-accent text-on-accent' : 'border-2 border-line-strong text-faint'}`}>
                  <Check size={18} strokeWidth={3} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

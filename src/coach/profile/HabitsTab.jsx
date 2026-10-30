// Habits: today's progress and a 14-day strip per habit. Habits are managed on the Habits page.
import { useNavigate } from 'react-router-dom'
import { Heart, Flame, Check, ChevronRight } from 'lucide-react'
import { Button, Card, Chip, EmptyState, Ring } from '../../ui'
import { toLocalDateStr, addDays, formatDate, firstName } from '../lib'

function done(logs, habitId, day) {
  return logs.some((l) => l.habit_id === habitId && l.completed_date === day && l.completed)
}

function streak(logs, habitId) {
  let n = 0
  let day = toLocalDateStr()
  while (done(logs, habitId, day)) { n++; day = addDays(day, -1) }
  return n
}

function bestStreak(logs, habitId) {
  const dates = [...new Set(logs.filter((l) => l.habit_id === habitId && l.completed).map((l) => l.completed_date))].sort()
  let best = 0, cur = 0, prev = null
  for (const d of dates) {
    cur = prev && addDays(prev, 1) === d ? cur + 1 : 1
    best = Math.max(best, cur)
    prev = d
  }
  return best
}

export default function HabitsTab({ client, habits, habitLogs }) {
  const navigate = useNavigate()
  const today = toLocalDateStr()
  const manage = (
    <Button variant="secondary" size="sm" onClick={() => navigate('/habits')}>
      Manage habits <ChevronRight size={16} />
    </Button>
  )

  if (habits.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Heart}
          title="No habits yet"
          body={`Give ${firstName(client.full_name)} one or two small daily habits to build consistency.`}
          action={<Button onClick={() => navigate('/habits')}>Go to habits</Button>}
        />
      </Card>
    )
  }

  const doneToday = habits.filter((h) => done(habitLogs, h.id, today)).length
  const weekFrom = addDays(today, -6)

  return (
    <div className="space-y-3 max-w-[760px]">
      <Card className="flex items-center gap-4">
        <Ring value={doneToday / habits.length} size={64} stroke={7}>
          <span className="font-display text-lg leading-none text-ink">{doneToday}<span className="text-sm text-muted">/{habits.length}</span></span>
        </Ring>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-ink">{doneToday} of {habits.length} done today</p>
          <p className="text-[13px] text-muted">{formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <span className="max-sm:hidden">{manage}</span>
      </Card>

      {habits.map((habit) => {
        const s = streak(habitLogs, habit.id)
        const week = habitLogs.filter((l) => l.habit_id === habit.id && l.completed && l.completed_date >= weekFrom).length
        const month = habitLogs.filter((l) => l.habit_id === habit.id && l.completed).length
        return (
          <Card key={habit.id}>
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-[14px] bg-surface-2 flex items-center justify-center text-2xl shrink-0">{habit.icon || '✅'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink truncate">{habit.name}</p>
                <p className="text-[13px] text-muted capitalize">{habit.frequency}</p>
              </div>
              {done(habitLogs, habit.id, today) && <Chip tone="accent"><Check size={13} /> Today</Chip>}
            </div>

            <div className="flex justify-between gap-1 mt-4">
              {Array.from({ length: 14 }, (_, i) => {
                const day = addDays(today, i - 13)
                const ok = done(habitLogs, habit.id, day)
                return (
                  <span
                    key={day}
                    title={`${formatDate(day, { day: 'numeric', month: 'short' })}${ok ? ', done' : ''}`}
                    className={`flex-1 max-w-7 aspect-square rounded-full flex items-center justify-center ${ok ? 'bg-accent text-on-accent' : day === today ? 'border-2 border-dashed border-line-strong' : 'bg-surface-2'}`}
                  >
                    {ok && <Check size={12} strokeWidth={3} />}
                  </span>
                )
              })}
            </div>
            <p className="text-xs text-faint mt-1.5 flex justify-between"><span>2 weeks ago</span><span>Today</span></p>

            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-line text-center">
              {[
                { label: 'This week', value: `${week}${habit.target_per_week ? `/${habit.target_per_week}` : ''}` },
                { label: '30 days', value: month },
                { label: 'Streak', value: s, flame: s > 0 },
                { label: 'Best', value: bestStreak(habitLogs, habit.id) },
              ].map((x) => (
                <div key={x.label}>
                  <p className="font-display text-xl leading-tight text-ink tabular-nums flex items-center justify-center gap-0.5">
                    {x.flame && <Flame size={15} className="text-accent" />}{x.value}
                  </p>
                  <p className="text-xs text-muted">{x.label}</p>
                </div>
              ))}
            </div>
          </Card>
        )
      })}
      <div className="sm:hidden">{manage}</div>
    </div>
  )
}

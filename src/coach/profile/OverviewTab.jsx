// Overview: the latest check-in and reply first, then this week, weight and food.
import { useState } from 'react'
import { MessageSquare, CalendarDays, Scale, Utensils, Plus, ChevronRight, Check, AlertCircle } from 'lucide-react'
import { Button, Ring, EmptyState, Segmented, Card } from '../../ui'
import { Panel, CheckinCard, LineChart, UnitInput, Bar } from './parts'
import { startOfWeekStr, addDays, toLocalDateStr, formatDate, dayNutrition, weightAverages, formatMl, sessionsThisMonth, dayOf, firstName } from '../lib'

const PERIODS = [
  { value: '14', label: '2 wks' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
]

function LatestCheckin({ checkins, client, reply, focusReplyId, onOpenTab }) {
  if (checkins.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={MessageSquare}
          title="No check-ins yet"
          body={client.user_id ? `${firstName(client.full_name)} checks in from the app each week.` : `${firstName(client.full_name)} can check in once they set up their account.`}
        />
      </Card>
    )
  }
  const unreplied = checkins.filter((c) => !c.coach_reply)
  const focus = checkins.find((c) => c.id === focusReplyId) ?? unreplied[0] ?? checkins[0]
  const others = unreplied.filter((c) => c.id !== focus.id).length
  return (
    <div>
      <CheckinCard
        ci={focus}
        number={checkins.length - checkins.indexOf(focus)}
        clientName={firstName(client.full_name)}
        reply={reply}
        autoFocus={!!focusReplyId}
        compact
      />
      {others > 0 && (
        <button onClick={() => onOpenTab('checkins')} className="mt-2 px-1 text-[13px] font-bold text-accent hover:underline">
          {others} more {others === 1 ? 'check-in needs' : 'check-ins need'} a reply
        </button>
      )}
    </div>
  )
}

function ThisWeek({ scheduledWorkouts, workoutLogs, onOpenWorkout, onOpenTab }) {
  const start = startOfWeekStr()
  const end = addDays(start, 6)
  const today = toLocalDateStr()
  const week = scheduledWorkouts
    .filter((sw) => sw.scheduled_date >= start && sw.scheduled_date <= end)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
  const doneLog = (sw) => workoutLogs.find((l) => l.scheduled_workout_id === sw.id && l.completed) ?? null
  const done = week.filter(doneLog).length
  const extra = workoutLogs.filter((l) => l.completed && !l.scheduled_workout_id && dayOf(l.logged_at) >= start && dayOf(l.logged_at) <= end).length
  const month = sessionsThisMonth(workoutLogs)

  return (
    <Panel title="This week" icon={CalendarDays} action={<Button variant="ghost" size="sm" onClick={() => onOpenTab('training')}>Schedule</Button>}>
      <div className="flex items-center gap-4">
        <Ring value={week.length ? done / week.length : 0} size={64} stroke={7}>
          <span className="font-display text-lg leading-none text-ink">{done}<span className="text-muted text-sm">/{week.length}</span></span>
        </Ring>
        <div className="min-w-0">
          <p className="font-bold text-ink">{week.length ? `${done} of ${week.length} sessions done` : 'Nothing scheduled this week'}</p>
          <p className="text-[13px] text-muted">
            {extra > 0 ? `Plus ${extra} unscheduled · ` : ''}{month} {month === 1 ? 'session' : 'sessions'} this month
          </p>
        </div>
      </div>
      {week.length > 0 && (
        <ul className="mt-3 divide-y divide-line -mx-4 border-t border-line">
          {week.map((sw) => {
            const log = doneLog(sw)
            const past = sw.scheduled_date < today
            return (
              <li key={sw.id}>
                <button onClick={() => onOpenWorkout(sw, log)} className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left hover:bg-surface-2 transition-colors">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${log ? 'bg-accent text-on-accent' : sw.scheduled_date === today ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'}`}>
                    {log ? <Check size={18} /> : formatDate(sw.scheduled_date, { weekday: 'short' }).slice(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink truncate">{sw._displayName}</span>
                    <span className="block text-[13px] text-muted">
                      {formatDate(sw.scheduled_date, { weekday: 'long', day: 'numeric', month: 'short' })}
                      {log ? ' · Done' : sw.scheduled_date === today ? ' · Today' : past ? ' · Not logged' : ''}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-faint shrink-0" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

function Weight({ weightLogs, onLogWeight }) {
  const [period, setPeriod] = useState('30')
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const avgs = weightAverages(weightLogs)
  const from = addDays(toLocalDateStr(), -parseInt(period))
  const idx = weightLogs.map((w, i) => (w.logged_date >= from ? i : -1)).filter((i) => i >= 0)
  const shown = idx.map((i) => weightLogs[i])
  const shownAvg = idx.map((i) => avgs[i])
  const latestAvg = shownAvg[shownAvg.length - 1]
  const change = shownAvg.length > 1 ? Math.round((shownAvg[shownAvg.length - 1] - shownAvg[0]) * 10) / 10 : null

  async function save() {
    setSaving(true)
    const ok = await onLogWeight(value)
    setSaving(false)
    if (ok) { setValue(''); setAdding(false) }
  }

  return (
    <Panel
      title="Weight"
      icon={Scale}
      action={!adding && <Button variant="soft" size="sm" onClick={() => setAdding(true)}><Plus size={16} /> Log</Button>}
    >
      {adding && (
        <div className="flex items-center gap-2 mb-4">
          <UnitInput unit="kg" step="0.1" min="20" max="500" placeholder="78.5" value={value} onChange={(e) => setValue(e.target.value)} className="flex-1" autoFocus />
          <Button onClick={save} disabled={saving || !value}>{saving ? 'Saving' : 'Save'}</Button>
          <Button variant="ghost" onClick={() => { setAdding(false); setValue('') }}>Cancel</Button>
        </div>
      )}
      {shown.length === 0 ? (
        <p className="text-[15px] text-muted py-4">No weigh-ins in this period.</p>
      ) : (
        <>
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <p className="font-display text-[32px] leading-none text-ink tabular-nums">{latestAvg}<span className="font-sans text-sm font-semibold text-muted ml-1">kg</span></p>
              <p className="text-[13px] text-muted mt-1">7-day average{change !== null && change !== 0 ? ` · ${change < 0 ? 'down' : 'up'} ${Math.abs(change)} kg` : ''}</p>
            </div>
            <p className="text-[13px] text-muted text-right">Last weigh-in<br /><span className="text-ink font-semibold">{shown[shown.length - 1].weight_kg} kg</span> · {formatDate(shown[shown.length - 1].logged_date, { day: 'numeric', month: 'short' })}</p>
          </div>
          <LineChart
            height={110}
            series={[
              { values: shown.map((w) => parseFloat(w.weight_kg)), color: 'var(--faint)', dots: true, dotsOnly: true, dotSize: 5, dotOpacity: 0.7 },
              { values: shownAvg, color: 'var(--accent)', width: 3 },
            ]}
            labels={[formatDate(shown[0].logged_date, { day: 'numeric', month: 'short' }), formatDate(shown[shown.length - 1].logged_date, { day: 'numeric', month: 'short' })]}
          />
        </>
      )}
      <Segmented className="mt-4" value={period} onChange={setPeriod} options={PERIODS} />
    </Panel>
  )
}

function FoodToday({ foodLogs, waterLogs, targets, onOpenTab }) {
  const t = dayNutrition(foodLogs, waterLogs)
  const nothing = t.food.length === 0 && t.waterMl === 0
  const rows = [
    { label: 'Protein', v: t.protein, target: targets.protein, color: 'var(--protein)' },
    { label: 'Carbs', v: t.carbs, target: targets.carbs, color: 'var(--carbs)' },
    { label: 'Fats', v: t.fats, target: targets.fats, color: 'var(--fats)' },
  ]
  return (
    <Panel title="Food today" icon={Utensils} action={<Button variant="ghost" size="sm" onClick={() => onOpenTab('nutrition')}>Details</Button>}>
      {nothing ? (
        <p className="text-[15px] text-muted py-2">Nothing logged yet today.</p>
      ) : (
        <div className="flex items-center gap-4">
          <Ring value={targets.calories ? t.calories / targets.calories : 0} size={84} stroke={8} color="var(--kcal)">
            <span className="font-display text-xl leading-none text-ink tabular-nums">{t.calories}</span>
            <span className="text-[11px] text-muted">{targets.calories ? `of ${targets.calories}` : 'kcal'}</span>
          </Ring>
          <div className="flex-1 min-w-0 space-y-2.5">
            {rows.map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="text-muted">{r.label}</span>
                  <span className="text-ink font-semibold tabular-nums">{r.v}{r.target ? <span className="text-muted font-normal"> / {r.target} g</span> : ' g'}</span>
                </div>
                <Bar value={r.target ? r.v / r.target : 0} color={r.color} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-between text-[13px] mt-4 pt-3 border-t border-line">
        <span className="text-muted">Water</span>
        <span className="text-ink font-semibold">{formatMl(t.waterMl)}<span className="text-muted font-normal"> / {formatMl(targets.water)}</span></span>
      </div>
    </Panel>
  )
}

export default function OverviewTab(props) {
  const { limitations } = props
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-3 lg:gap-4 items-start">
      <div className="space-y-3 lg:space-y-4 min-w-0">
        <LatestCheckin {...props} />
        <ThisWeek {...props} />
      </div>
      <div className="space-y-3 lg:space-y-4 min-w-0">
        {limitations?.trim() && (
          <div className="flex gap-3 rounded-[20px] bg-warn-soft px-4 py-3">
            <AlertCircle size={18} className="text-warn shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-warn">Injuries and limitations</p>
              <p className="text-[15px] text-ink">{limitations}</p>
            </div>
          </div>
        )}
        <Weight {...props} />
        <FoodToday {...props} />
      </div>
    </div>
  )
}

// Overview: the latest check-in and reply first, then this week, weight and food.
import { Fragment, useState } from 'react'
import { MessageSquare, Scale, Utensils, Plus, ChevronRight, Check, AlertCircle, Activity } from 'lucide-react'
import { Button, Ring, EmptyState, Segmented, Card, Hero } from '../../ui'
import { Panel, CheckinCard, LineChart, UnitInput, Bar } from './parts'
import { startOfWeekStr, addDays, toLocalDateStr, formatDate, dayNutrition, formatMl, sessionsThisMonth, sessionsThisWeek, completedKeys, awaitingReply, dayOf, firstName, relativeDay, lastDays, feelingFlag, scoreTone, DAILY_SCORES } from '../lib'
import { weightSeries, weekStreak } from '../../client/metrics'

const PERIODS = [
  { value: '14', label: '2 wks' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
]

function LatestCheckin({ checkins, client, reply }) {
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
  // The latest check-in, with its reply box if it's still owed one (shared rule).
  const focus = awaitingReply(checkins) ?? checkins[0]
  return (
    <CheckinCard
      ci={focus}
      number={checkins.length - checkins.indexOf(focus)}
      clientName={firstName(client.full_name)}
      reply={reply}
      compact
    />
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
  // Same count as the client's Train ring (a backdated, not done session doesn't count).
  const { scheduled: planned, done } = sessionsThisWeek(scheduledWorkouts, completedKeys(workoutLogs), today)
  const extra = workoutLogs.filter((l) => l.completed && !l.scheduled_workout_id && dayOf(l.logged_at) >= start && dayOf(l.logged_at) <= end).length
  const month = sessionsThisMonth(workoutLogs)

  const streak = weekStreak(workoutLogs)
  const todays = week.find((sw) => sw.scheduled_date === today && !doneLog(sw))
  const line = [
    todays ? `${todays._displayName} is planned for today.` : null,
    streak > 1 ? `${streak} weeks in a row.` : null,
    extra > 0 ? `Plus ${extra} unscheduled.` : null,
    `${month} ${month === 1 ? 'session' : 'sessions'} this month.`,
  ].filter(Boolean).join(' ')

  return (
    <div className="space-y-3 lg:space-y-4">
      <Hero className="flex items-center gap-5">
        <Ring value={planned ? done / planned : 0} size={112} stroke={12} color="var(--on-hero)" track="var(--hero-track)" dot="var(--hero-dot)">
          <span className="font-display text-[36px] leading-none tabular-nums">{done}<span className="text-[18px] text-hero-muted">/{planned}</span></span>
        </Ring>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[26px] leading-none">{planned ? 'This week' : 'Nothing scheduled this week'}</p>
          <p className="text-[14px] leading-snug text-hero-muted mt-1.5">{line}</p>
          <button onClick={() => onOpenTab('training')} className="mt-3 h-9 px-4 rounded-full bg-hero-chip text-[13px] font-bold hover:opacity-90">Schedule</button>
        </div>
      </Hero>
      {week.length > 0 && (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-line">
            {week.map((sw) => {
              const log = doneLog(sw)
              const past = sw.scheduled_date < today
              return (
                <li key={sw.id}>
                  <button onClick={() => onOpenWorkout(sw, log)} className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left hover:bg-surface-2 transition-colors">
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${log ? 'bg-accent text-on-accent' : sw.scheduled_date === today ? 'bg-tan text-on-tan' : 'bg-surface-2 text-muted'}`}>
                      {log ? <Check size={18} /> : formatDate(sw.scheduled_date, { weekday: 'short' }).slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink truncate">{sw._displayName}</span>
                      <span className="block text-[13px] text-muted">
                        {formatDate(sw.scheduled_date, { weekday: 'long', day: 'numeric', month: 'short' })}
                        {log ? ', done' : sw.scheduled_date === today ? ', today' : past ? ', not logged' : ''}
                      </span>
                    </span>
                    <ChevronRight size={18} className="text-faint shrink-0" />
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}

function Weight({ weightLogs, onLogWeight }) {
  const [period, setPeriod] = useState('30')
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Same series as the client's Progress tab: one weigh-in per day, 7-day rolling average.
  const from = addDays(toLocalDateStr(), -parseInt(period))
  const shown = weightSeries(weightLogs).filter((p) => p.date >= from)
  const shownAvg = shown.map((p) => p.avg)
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
            <p className="text-[13px] text-muted text-right">Last weigh-in<br /><span className="text-ink font-semibold">{shown[shown.length - 1].weight} kg</span> · {formatDate(shown[shown.length - 1].date, { day: 'numeric', month: 'short' })}</p>
          </div>
          <LineChart
            height={110}
            series={[
              { values: shown.map((p) => p.weight), color: 'var(--faint)', dots: true, dotsOnly: true, dotSize: 5, dotOpacity: 0.7 },
              { values: shownAvg, color: 'var(--accent)', width: 3 },
            ]}
            labels={[formatDate(shown[0].date, { day: 'numeric', month: 'short' }), formatDate(shown[shown.length - 1].date, { day: 'numeric', month: 'short' })]}
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

// Last 7 days of daily check-ins: energy, sleep and soreness, plus the latest note.
function Feeling({ dailyCheckins = [], client, onOpenDaily }) {
  const today = toLocalDateStr()
  const days = lastDays(7, today)
  const byDay = Object.fromEntries(dailyCheckins.map((d) => [d.checkin_date, d]))
  const inWeek = days.filter((d) => byDay[d]).length
  const latestNote = dailyCheckins.find((d) => d.note?.trim())
  const flag = feelingFlag(dailyCheckins, today)
  const first = firstName(client.full_name)

  return (
    <Panel
      title="How they've been feeling"
      icon={Activity}
      action={dailyCheckins.length > 0 && <Button variant="ghost" size="sm" onClick={onOpenDaily}>All</Button>}
    >
      {dailyCheckins.length === 0 ? (
        <EmptyState
          title="No daily check-ins yet"
          body={client.user_id ? `${first} can log energy, sleep and soreness each day in the app.` : `${first} can check in daily once they set up their account.`}
        />
      ) : (
        <>
          <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] gap-y-1.5 items-center" role="table" aria-label="Daily check-ins, last 7 days">
            <span role="columnheader" />
            {days.map((d) => (
              <span key={d} role="columnheader" className={`text-center text-[11px] font-bold ${d === today ? 'text-accent' : 'text-muted'}`}>
                {d === today ? 'Today' : formatDate(d, { weekday: 'short' }).slice(0, 2)}
              </span>
            ))}
            {DAILY_SCORES.map((s) => (
              <Fragment key={s.key}>
                <span role="rowheader" className="text-[13px] text-muted">{s.label}</span>
                {days.map((d) => {
                  const v = byDay[d]?.[s.key]
                  return (
                    <span key={d} role="cell" className="flex justify-center">
                      {v != null ? (
                        <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-[13px] font-bold tabular-nums ${scoreTone(v, s.invert)}`} title={`${s.label} ${v}/5, ${formatDate(d, { weekday: 'long' })}`}>
                          {v}
                        </span>
                      ) : (
                        <span className="w-8 h-8 inline-flex items-center justify-center" aria-label="No check-in">
                          <span className="w-1.5 h-1.5 rounded-full bg-line-strong" />
                        </span>
                      )}
                    </span>
                  )
                })}
              </Fragment>
            ))}
          </div>
          <p className="text-[13px] text-muted mt-2.5">
            {inWeek > 0 ? `Checked in ${inWeek} of the last 7 days` : `Last daily check-in ${relativeDay(dailyCheckins[0].checkin_date).toLowerCase()}`} · 1 low, 5 high
          </p>
          {flag && (
            <div className="mt-3 flex gap-2.5 rounded-[14px] bg-warn-soft px-3.5 py-3">
              <AlertCircle size={18} className="text-warn shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-warn">{flag}</p>
                <p className="text-[13px] text-ink">2 or lower on 3 of the last 4 days. Worth asking {first} how things are going.</p>
              </div>
            </div>
          )}
          {latestNote && (
            <div className="mt-3">
              <p className="text-xs font-bold text-muted mb-1">Latest note · {relativeDay(latestNote.checkin_date)}</p>
              <p className="text-[15px] text-ink leading-relaxed bg-surface-2 rounded-[14px] px-4 py-3 whitespace-pre-wrap">{latestNote.note}</p>
            </div>
          )}
        </>
      )}
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
        <Feeling {...props} />
        <Weight {...props} />
        <FoodToday {...props} />
      </div>
    </div>
  )
}

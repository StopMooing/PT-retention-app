// Home: what do I do today. Greeting, the "This week" rings (Train, Fuel, Recover),
// today's workout, the weekly check-in when it's due, the daily check-in, today's food and
// a recent personal best. Coach messages and check-in replies live in Messages. Empty
// sections are hidden. Tapping a day on the week strip opens a summary of that day, with
// arrows to step through the days.
import { useEffect, useState } from 'react'
import { Trophy, ChevronRight, ChevronLeft, Check, Pencil } from 'lucide-react'
import { supabase } from '../supabase'
import { Card, Button, Chip, Avatar, Sheet, Hero, Ring } from '../ui'
import { toLocalDateStr, getGreeting, weekDays, weekdayName, parseDay, formatShortDate, formatDateLabel, addDays, daysBetween } from './dates'
import {
  isDone, workoutName, groupByDate, nextSession, weekStreak, checkinStatus, sessionExercises,
  logsForDate, foodTotals, nutritionTargetsFor, latestPB, fmtKg, weekRings, plannedLine, sessionStatusLine, dailyCheckinFor, DAILY_SCALES, sessionsThisWeek,
} from './metrics'
import CheckinSheet from './CheckinSheet'
import DailyCheckinSheet from './DailyCheckinSheet'
import HabitsCard from './HabitsCard'
import { NutritionSummary, DoneDot } from './common'

const greetWord = () => getGreeting().replace('Good ', '').replace(/^./, (c) => c.toUpperCase())

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const cx = (...c) => c.filter(Boolean).join(' ')

/* "Thursday 5 November" */
const longDate = (d) => parseDay(d).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

/* The emerald block at the top (cream in dark mode): this week's sessions as an open ring,
   what's next, the streak, and the week day by day. Tapping a day opens it. */
function WeekHero({ week, train, nextName, streak, today, byDate, completedIds, onPickDay }) {
  const left = Math.max(0, train.scheduled - train.done)
  let line
  if (train.scheduled === 0) line = week.parts[0]?.label || 'No sessions this week.'
  else if (left === 0) line = 'All done. The ring stays open, there is always next week.'
  else line = `${left === 1 ? 'One' : left} to go.${nextName ? ` ${nextName} is ready when you are.` : ''}`
  return (
    <Hero className="space-y-[18px]">
      <div className="flex items-center gap-[18px]">
        <Ring
          value={train.scheduled ? Math.min(1, train.done / train.scheduled) : 0}
          size={120} stroke={12} color="var(--on-hero)" track="var(--hero-track)" dot="var(--hero-dot)"
        >
          <span className="font-display text-[40px] leading-[0.9] tabular-nums">{Math.min(train.done, train.scheduled || train.done)}</span>
          {train.scheduled > 0 && <span className="text-[12px] font-semibold text-hero-muted">of {train.scheduled}</span>}
        </Ring>
        <div className="min-w-0">
          <p className="font-display text-[24px] leading-[1.05]">This week</p>
          <p className="text-[15px] leading-[1.45] text-hero-muted mt-1.5">{line}</p>
          {streak > 0 && (
            <p className="inline-flex items-center h-7 px-2.5 mt-2.5 rounded-full text-[12px] font-bold" style={{ backgroundColor: 'var(--hero-chip)' }}>
              {streak} {streak === 1 ? 'week' : 'weeks'} in a row
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays(today).map((d, i) => {
          const sessions = byDate[d] ?? []
          const anyDone = sessions.some((sw) => isDone(sw, completedIds))
          const isTodayD = d === today
          return (
            <button key={d} onClick={() => onPickDay(d)} className="flex flex-col items-center gap-1.5 rounded-[14px]" aria-label={formatShortDate(d)}>
              <span className="text-[11px] font-semibold text-hero-muted">{DAY_LETTERS[i]}</span>
              <span
                className={cx(
                  'w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold tabular-nums border-2',
                  anyDone ? 'bg-on-hero text-hero border-transparent' : isTodayD ? 'border-[var(--on-hero)]' : 'border-[var(--hero-track)] text-hero-muted',
                )}
              >
                {anyDone ? <Check size={15} strokeWidth={3.5} /> : parseDay(d).getDate()}
              </span>
              <span className={cx('w-1 h-1 rounded-full', !anyDone && sessions.length > 0 ? 'bg-hero-muted' : 'bg-transparent')} />
            </button>
          )
        })}
      </div>
    </Hero>
  )
}

/* A small tile: label, big number with its target, and a bar. */
function Tile({ label, value, of, pct, onClick }) {
  return (
    <Card as="button" onClick={onClick} className="flex flex-col gap-2.5">
      <p className="text-[13px] font-semibold text-muted">{label}</p>
      <p className="font-display text-[26px] leading-none text-ink tabular-nums">
        {value}{of && <span className="font-sans text-[13px] font-semibold text-muted"> {of}</span>}
      </p>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: 'var(--ring)' }} />
      </div>
    </Card>
  )
}

/* Today's water in litres, for the Home tile. Same rows as the Nutrition tab's water card. */
function useWaterToday(clientId, date) {
  const [ml, setMl] = useState(null)
  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    supabase.from('water_logs').select('amount_ml').eq('client_id', clientId).eq('logged_date', date)
      .then(({ data, error }) => {
        if (error) console.error('Water load error:', error)
        if (!cancelled) setMl((data ?? []).reduce((t, w) => t + (w.amount_ml || 0), 0))
      })
    return () => { cancelled = true }
  }, [clientId, date])
  return ml
}

/* One day: its sessions and, up to today, what was eaten. Arrows step a day either way
   without closing the sheet. Start for today's and upcoming sessions. */
function DaySheet({ date, setDate, today, byDate, completedIds, workoutLogs, workoutExercises, foodLogs, targets, onOpenWorkout }) {
  const sessions = date ? byDate[date] ?? [] : []
  const food = date ? logsForDate(foodLogs, date) : []
  const totals = foodTotals(food)
  const showFood = food.length > 0 || (sessions.length > 0 && !!date && date <= today)
  const onClose = () => setDate(null)
  const open = (sw) => { onClose(); onOpenWorkout(sw) }
  const arrow = 'w-9 h-9 rounded-full flex items-center justify-center text-ink hover:bg-surface-2 shrink-0'
  return (
    <Sheet
      open={!!date}
      onClose={onClose}
      title={date ? formatDateLabel(date) : ''}
      actions={
        <div className="flex items-center gap-1">
          <button onClick={() => setDate(addDays(date, -1))} aria-label="Previous day" className={arrow}><ChevronLeft size={20} /></button>
          <button onClick={() => setDate(addDays(date, 1))} aria-label="Next day" className={arrow}><ChevronRight size={20} /></button>
        </div>
      }
    >
      <div className="space-y-5">
        {sessions.length > 0 && (
          <section>
            <p className="text-[13px] font-semibold text-muted mb-2">Training</p>
            <div className="rounded-[16px] border border-line divide-y divide-line">
              {sessions.map((sw) => {
                const done = isDone(sw, completedIds)
                const upcoming = !done && date >= today
                const meta = sessionStatusLine(sw, { completedIds, workoutLogs, exMap: workoutExercises, today }) || plannedLine(sessionExercises(sw, workoutExercises))
                const body = (
                  <>
                    <DoneDot done={done} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-ink truncate">{workoutName(sw)}</p>
                      {meta && <p className="text-[13px] text-muted truncate">{meta}</p>}
                    </div>
                  </>
                )
                return (
                  <div key={sw.id} className="flex items-center gap-3 px-4 py-3 min-h-[64px]">
                    {done ? (
                      <button onClick={() => open(sw)} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                        {body}
                        <ChevronRight size={18} className="text-faint shrink-0" />
                      </button>
                    ) : (
                      <div className="flex-1 min-w-0 flex items-center gap-3">{body}</div>
                    )}
                    {upcoming && <Button size="sm" onClick={() => open(sw)}>Start</Button>}
                  </div>
                )
              })}
            </div>
          </section>
        )}
        {showFood && (
          <section>
            <p className="text-[13px] font-semibold text-muted mb-2">Food</p>
            <NutritionSummary compact totals={totals} targets={targets} />
          </section>
        )}
        {sessions.length === 0 && food.length === 0 && (
          <p className="text-[15px] text-muted py-2">A rest day.</p>
        )}
      </div>
    </Sheet>
  )
}

/* A card with a small label, a big title, a line under it and an action on the right. */
function NextThing({ todo }) {
  const inner = (
    <>
      {todo.avatar}
      <div className="flex-1 min-w-0">
        {todo.eyebrow && <p className="text-[13px] font-semibold text-muted truncate">{todo.eyebrow}</p>}
        <p className="font-display text-[26px] leading-none text-ink truncate mt-0.5">{todo.title}</p>
        {todo.body && <div className="text-[14px] text-muted mt-1">{todo.body}</div>}
      </div>
      {todo.action}
    </>
  )
  return todo.onClick
    ? <Card as="button" onClick={todo.onClick} className="flex items-center gap-3.5 !pl-5">{inner}</Card>
    : <Card className="flex items-center gap-3.5 !pl-5">{inner}</Card>
}

/* Today's daily check-in: a prompt until it's done, then the three scores as chips.
   Tap either to fill in or change today's. */
function DailyCard({ todays, onOpen }) {
  if (!todays) {
    return (
      <Card className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold text-ink leading-snug">How are you today?</p>
          <p className="text-[13px] text-muted mt-0.5">Energy, sleep, soreness. Three taps.</p>
        </div>
        <Button variant="soft" onClick={onOpen}>Check in</Button>
      </Card>
    )
  }
  return (
    <Card as="button" onClick={onOpen} aria-label="Change today's check-in" className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-muted inline-flex items-center gap-1">
          <Check size={14} strokeWidth={3} className="text-accent" /> Checked in today
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {DAILY_SCALES.map((s) => (
            <Chip key={s.key} tone="accent">{s.label} {todays[s.key]}</Chip>
          ))}
        </div>
      </div>
      <Pencil size={17} className="text-faint shrink-0" />
    </Card>
  )
}

export default function HomeTab({
  client, checkins, setCheckins, dailyCheckins, setDailyCheckins, scheduledWorkouts, completedIds, workoutLogs, workoutExercises,
  foodLogs, nutritionTargets, personalBests, coachName,
  onOpenWorkout, onStartWorkout, onOpenProfile, onLogFood, onOpenWater, showToast,
}) {
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [dailyOpen, setDailyOpen] = useState(false)
  const [dayOpen, setDayOpen] = useState(null) // 'YYYY-MM-DD' of the day tapped on the strip
  const today = toLocalDateStr()
  const firstName = client.full_name?.split(' ')[0] || client.full_name || ''
  const hasCoach = !!client.pt_id

  const streak = weekStreak(workoutLogs, today)
  const status = checkinStatus(checkins, today)
  const byDate = groupByDate(scheduledWorkouts)
  const todays = byDate[today] ?? []
  const todayLeft = todays.filter((sw) => !isDone(sw, completedIds))
  const next = nextSession(scheduledWorkouts, completedIds, today)
  const week = weekRings({ scheduledWorkouts, completedIds, foodLogs, dailyCheckins, today })
  const todaysDaily = dailyCheckinFor(dailyCheckins, today)
  const totals = foodTotals(logsForDate(foodLogs, today))
  const targets = nutritionTargetsFor(client, nutritionTargets)
  const pb = latestPB(personalBests, 14, today)
  const train = sessionsThisWeek(scheduledWorkouts, completedIds, today)
  const waterMl = useWaterToday(client.id, today)
  const waterTarget = client.water_target_ml || 2000

  // Today's workout, always: still to do, done, or a rest day pointing to the next one.
  let todayCard
  if (todayLeft.length > 0) {
    const sw = todayLeft[0]
    todayCard = {
      eyebrow: 'Today',
      title: workoutName(sw),
      body: plannedLine(sessionExercises(sw, workoutExercises)) || 'Ready when you are',
      action: <Button onClick={() => onStartWorkout(sw)}>Start</Button>,
    }
  } else if (todays.length > 0) {
    const sw = todays[0]
    todayCard = {
      eyebrow: 'Today',
      title: workoutName(sw),
      body: <span className="inline-flex items-center gap-1 font-bold text-accent"><Check size={15} strokeWidth={3} /> Completed</span>,
      action: <ChevronRight size={20} className="text-faint shrink-0" />,
      onClick: () => onOpenWorkout(sw),
    }
  } else {
    const when = next && (daysBetween(today, next.scheduled_date) < 7 ? weekdayName(next.scheduled_date) : formatShortDate(next.scheduled_date))
    todayCard = {
      eyebrow: 'Today',
      title: 'Rest day',
      body: next ? `Next up: ${workoutName(next)}, ${when}` : 'Rest and recover',
      action: next ? <ChevronRight size={20} className="text-faint shrink-0" /> : null,
      onClick: next ? () => onOpenWorkout(next) : undefined,
    }
  }

  // The weekly check-in, once it's due (7 calendar days after the last one).
  const checkinCard = status.due ? {
    eyebrow: 'Weekly check-in',
    title: 'Your week in review',
    body: <span><span className="font-bold text-ink">Due today.</span> {hasCoach ? `Tell ${coachName || 'your coach'} how it went.` : 'A quick look back.'}</span>,
    action: <Button onClick={() => setCheckinOpen(true)}>Check in</Button>,
  } : null

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),24px)] space-y-3.5">
      {/* Date and greeting */}
      <header className="flex items-start justify-between gap-3 px-1 pb-0.5">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-muted">{longDate(today)}</p>
          <h1 className="font-display text-[34px] leading-none text-ink mt-1">{greetWord()}, {firstName}.</h1>
        </div>
        <button onClick={onOpenProfile} aria-label="Profile and settings" className="rounded-full shrink-0 ring-offset-2 ring-offset-bg focus-visible:ring-2 ring-accent">
          <Avatar name={client.full_name} src={client.profile_photo_url} size={44} />
        </button>
      </header>

      <WeekHero
        week={week} train={train} streak={streak} today={today} byDate={byDate} completedIds={completedIds} onPickDay={setDayOpen}
        nextName={todayLeft[0] ? workoutName(todayLeft[0]) : next ? workoutName(next) : null}
      />

      <NextThing todo={todayCard} />

      <div className="grid grid-cols-2 gap-3">
        <Tile
          label="Calories today"
          value={totals.kcal.toLocaleString('en-AU')}
          of={targets.kcal > 0 ? `of ${targets.kcal.toLocaleString('en-AU')}` : 'kcal'}
          pct={targets.kcal > 0 ? (totals.kcal / targets.kcal) * 100 : 0}
          onClick={onLogFood}
        />
        {waterMl !== null && (
          <Tile
            label="Water"
            value={(waterMl / 1000).toFixed(waterMl % 1000 === 0 ? 0 : 2).replace(/0$/, '')}
            of={`of ${(waterTarget / 1000).toLocaleString('en-AU')} L`}
            pct={(waterMl / waterTarget) * 100}
            onClick={onOpenWater || onLogFood}
          />
        )}
      </div>

      {checkinCard ? <NextThing todo={checkinCard} /> : hasCoach && status.nextDate && (
        <div className="rounded-[24px] bg-surface-2 px-5 py-3.5">
          <p className="text-[15px] font-bold text-ink">Weekly check-in with {coachName || 'your coach'}</p>
          <p className="text-[13px] text-muted mt-0.5">Due {status.daysToNext === 1 ? 'tomorrow' : weekdayName(status.nextDate)}, takes about two minutes</p>
        </div>
      )}

      <DailyCard todays={todaysDaily} onOpen={() => setDailyOpen(true)} />
      <HabitsCard client={client} showToast={showToast} />

      {/* Recent personal best: tan, the colour for wins */}
      {pb && (
        <div className="rounded-[24px] bg-tan text-on-tan px-[18px] py-4 flex items-center gap-3.5">
          <Trophy size={28} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold">New personal best, {formatShortDate(toLocalDateStr(new Date(pb.achieved_at)))}</p>
            <p className="text-[16px] font-bold truncate">{pb.exercises?.name || 'Exercise'}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display text-[30px] leading-none tabular-nums">{fmtKg(pb.value)}<span className="font-sans text-xs font-bold ml-0.5">kg</span></p>
            <p className="text-[11px] font-semibold mt-1">est. 1RM</p>
          </div>
        </div>
      )}

      <DaySheet
        date={dayOpen}
        setDate={setDayOpen}
        today={today}
        byDate={byDate}
        completedIds={completedIds}
        workoutLogs={workoutLogs}
        workoutExercises={workoutExercises}
        foodLogs={foodLogs}
        targets={targets}
        onOpenWorkout={onOpenWorkout}
      />

      <CheckinSheet
        open={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        client={client}
        onSaved={(row) => {
          setCheckins((prev) => [row, ...prev])
          setCheckinOpen(false)
          // The reply comes back in Messages (it shows there with the check-in).
          showToast?.(
            hasCoach ? (coachName ? `Sent to ${coachName}. You'll see the reply in Messages.` : "Sent to your coach. You'll see their reply in Messages.") : 'Check-in saved.',
            { ms: 4500 },
          )
        }}
      />

      <DailyCheckinSheet
        open={dailyOpen}
        onClose={() => setDailyOpen(false)}
        client={client}
        existing={todaysDaily}
        onSaved={(row) => {
          setDailyCheckins((prev) => [row, ...prev.filter((d) => d.checkin_date !== row.checkin_date)])
          setDailyOpen(false)
          showToast?.(todaysDaily ? 'Updated for today' : 'Nice one. Logged for today.')
        }}
      />
    </div>
  )
}

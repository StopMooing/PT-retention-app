// Home: what do I do today. Greeting, the "This week" rings (Train, Fuel, Recover),
// today's workout, the weekly check-in when it's due, the daily check-in, today's food and
// a recent personal best. Coach messages and check-in replies live in Messages. Empty
// sections are hidden. Tapping a day on the week strip opens a summary of that day, with
// arrows to step through the days.
import { useState } from 'react'
import { Flame, Trophy, ChevronRight, ChevronLeft, Check, Plus, Pencil } from 'lucide-react'
import { Card, Button, Chip, Avatar, Sheet } from '../ui'
import { toLocalDateStr, getGreeting, weekDays, weekdayName, parseDay, formatShortDate, formatDateLabel, addDays, daysBetween } from './dates'
import {
  isDone, workoutName, groupByDate, nextSession, weekStreak, checkinStatus, sessionExercises,
  logsForDate, foodTotals, nutritionTargetsFor, latestPB, fmtKg, weekRings, plannedLine, sessionStatusLine, dailyCheckinFor, DAILY_SCALES,
} from './metrics'
import CheckinSheet from './CheckinSheet'
import DailyCheckinSheet from './DailyCheckinSheet'
import { NutritionSummary, DoneDot } from './common'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const cx = (...c) => c.filter(Boolean).join(' ')

// One shade of the accent per ring, so the rings and their labels match. Tracks are a
// faint wash of the same shade.
const SHADES = {
  train: 'var(--accent)',
  fuel: 'color-mix(in srgb, var(--accent) 66%, var(--bg))',
  recover: 'color-mix(in srgb, var(--accent) 42%, var(--bg))',
}
const trackOf = (c) => `color-mix(in srgb, ${c} 16%, var(--surface-2))`

/* The week rings: the logo's open ring, one lane each for Train, Fuel and Recover, round ends, a gap at
   the top right with the accent dot in it. Never closes: we aren't done. */
const GAP = 50 // degrees left open
const GAP_AT = -60 // centre of the gap, degrees from 3 o'clock (clockwise)
function WeekRing({ parts, complete, size = 152, stroke = 12, pitch = 16 }) {
  const c0 = size / 2
  const sweep = 360 - GAP
  const startAt = GAP_AT + GAP / 2
  const outerR = (size - stroke) / 2
  const dotA = (GAP_AT * Math.PI) / 180
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        {parts.map((p, i) => {
          const r = outerR - i * pitch
          const c = 2 * Math.PI * r
          const arc = (c * sweep) / 360
          const color = SHADES[p.key]
          return (
            <g key={p.key} transform={`rotate(${startAt} ${c0} ${c0})`}>
              <circle cx={c0} cy={c0} r={r} fill="none" stroke={trackOf(color)} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arc} ${c}`} />
              {p.value > 0 && (
                <circle
                  cx={c0} cy={c0} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
                  strokeDasharray={`${arc * Math.min(1, p.value)} ${c}`} style={{ transition: 'stroke-dasharray 500ms ease' }}
                />
              )}
            </g>
          )
        })}
        <circle cx={c0 + outerR * Math.cos(dotA)} cy={c0 + outerR * Math.sin(dotA)} r={stroke * 0.55} fill="var(--accent)" />
      </svg>
      {complete && (
        <span className="absolute inset-0 flex items-center justify-center text-accent">
          <Check size={34} strokeWidth={3} />
        </span>
      )}
    </div>
  )
}

function WeekHero({ week, today, byDate, completedIds, onPickDay }) {
  const headline = week.complete ? 'Week done. Keep moving.' : week.started ? "You're on your way." : "Fresh week. Let's get moving."
  return (
    <Card padded={false}>
      <div className="px-4 pt-4">
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">This week</p>
        <p className="font-display text-[24px] leading-tight text-ink mt-0.5">{headline}</p>
      </div>
      <div className="flex items-center gap-4 px-4 pt-3 pb-4">
        <WeekRing parts={week.parts} complete={week.complete} />
        <ul className="flex-1 min-w-0 space-y-3">
          {week.parts.map((p) => (
            <li key={p.key} className="flex items-start gap-2.5">
              <span className="w-3 h-3 rounded-full shrink-0 mt-[5px]" style={{ backgroundColor: SHADES[p.key] }} />
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-ink leading-snug flex items-center gap-1">
                  {p.name}
                  {p.done && <Check size={15} strokeWidth={3} className="text-accent shrink-0" />}
                </p>
                <p className="text-[13px] text-muted leading-snug">{p.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Day by day: tick for a finished session, dot for one still to come. */}
      <div className="grid grid-cols-7 border-t border-line px-2 py-2">
        {weekDays(today).map((d, i) => {
          const sessions = byDate[d] ?? []
          const anyDone = sessions.some((sw) => isDone(sw, completedIds))
          const isTodayD = d === today
          return (
            <button key={d} onClick={() => onPickDay(d)} className="flex flex-col items-center gap-1 py-1 rounded-[14px] hover:bg-surface-2" aria-label={formatShortDate(d)}>
              <span className={cx('text-[11px] font-bold', isTodayD ? 'text-accent' : 'text-faint')}>{DAY_LETTERS[i]}</span>
              <span
                className={cx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold tabular-nums',
                  anyDone ? 'bg-accent text-on-accent' : isTodayD ? 'ring-2 ring-inset ring-accent text-ink' : 'text-ink',
                )}
              >
                {anyDone ? <Check size={15} strokeWidth={3.5} /> : parseDay(d).getDate()}
              </span>
              <span className={cx('w-1 h-1 rounded-full', !anyDone && sessions.length > 0 ? 'bg-muted' : 'bg-transparent')} />
            </button>
          )
        })}
      </div>
    </Card>
  )
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
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted mb-2">Training</p>
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
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted mb-2">Food</p>
            <NutritionSummary compact totals={totals} targets={targets} />
          </section>
        )}
        {sessions.length === 0 && food.length === 0 && (
          <p className="text-[15px] text-muted py-2">Nothing logged or planned.</p>
        )}
      </div>
    </Sheet>
  )
}

/* A card with an eyebrow, a title, a line under it and an action on the right. */
function NextThing({ todo }) {
  const inner = (
    <>
      {todo.avatar}
      <div className="flex-1 min-w-0">
        {todo.eyebrow && <p className="text-[13px] font-bold text-muted truncate">{todo.eyebrow}</p>}
        <p className="text-[19px] font-bold text-ink leading-snug truncate">{todo.title}</p>
        {todo.body && <div className="text-[13px] text-muted mt-0.5">{todo.body}</div>}
      </div>
      {todo.action}
    </>
  )
  return todo.onClick
    ? <Card as="button" onClick={todo.onClick} className="flex items-center gap-3">{inner}</Card>
    : <Card className="flex items-center gap-3">{inner}</Card>
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
  client, checkins, setCheckins, dailyCheckins, setDailyCheckins, assignment, scheduledWorkouts, completedIds, workoutLogs, workoutExercises,
  foodLogs, nutritionTargets, personalBests, coachName,
  onOpenWorkout, onStartWorkout, onOpenProfile, onLogFood, showToast,
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
      body: next ? `Next up: ${workoutName(next)}, ${when}` : 'Nothing scheduled yet',
      action: next ? <ChevronRight size={20} className="text-faint shrink-0" /> : null,
      onClick: next ? () => onOpenWorkout(next) : undefined,
    }
  }

  // The weekly check-in, once it's due (7 calendar days after the last one).
  const checkinCard = status.due ? {
    eyebrow: 'Weekly check-in',
    title: 'Your week in review',
    body: <span><span className="font-bold text-accent">Due today.</span> {hasCoach ? `Tell ${coachName || 'your coach'} how it went.` : 'A quick look back.'}</span>,
    action: <Button onClick={() => setCheckinOpen(true)}>Check in</Button>,
  } : null

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),24px)] space-y-7">
      {/* Greeting */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] text-muted">{getGreeting()}</p>
          <h1 className="font-display text-[34px] leading-[1.05] text-ink truncate">{firstName}</h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {streak > 0 && (
              <Chip tone="accent"><Flame size={13} /> {streak} week streak</Chip>
            )}
            {assignment?.programs?.name && <Chip>{assignment.programs.name}</Chip>}
          </div>
        </div>
        <button onClick={onOpenProfile} aria-label="Profile and settings" className="rounded-full shrink-0 ring-offset-2 ring-offset-bg focus-visible:ring-2 ring-accent">
          <Avatar name={client.full_name} src={client.profile_photo_url} size={46} />
        </button>
      </header>

      <div className="space-y-3">
        <WeekHero week={week} today={today} byDate={byDate} completedIds={completedIds} onPickDay={setDayOpen} />

        <NextThing todo={todayCard} />
        {checkinCard && <NextThing todo={checkinCard} />}
        <DailyCard todays={todaysDaily} onOpen={() => setDailyOpen(true)} />

        {/* Today's food */}
        <Card padded={false}>
          <div className="flex items-center justify-between px-4 pt-3">
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Today's food</p>
            <Button variant="ghost" size="sm" className="text-accent -mr-2" onClick={onLogFood}><Plus size={16} /> Log food</Button>
          </div>
          <div className="px-4 pt-1 pb-4">
            <NutritionSummary compact totals={totals} targets={targets} />
          </div>
        </Card>

        {/* Recent personal best */}
        {pb && (
          <Card className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
              <Trophy size={21} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-muted">New personal best · {formatShortDate(toLocalDateStr(new Date(pb.achieved_at)))}</p>
              <p className="text-[17px] font-bold text-ink truncate">{pb.exercises?.name || 'Exercise'}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-[26px] leading-none text-ink tabular-nums">{fmtKg(pb.value)}<span className="font-sans text-xs font-bold text-muted ml-0.5">kg</span></p>
              <p className="text-[11px] text-muted mt-1">est. 1RM</p>
            </div>
          </Card>
        )}
      </div>

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
            hasCoach ? (coachName ? `Sent to ${coachName}. You'll see his reply in Messages.` : "Sent to your coach. You'll see their reply in Messages.") : 'Check-in saved.',
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

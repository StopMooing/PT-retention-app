// Home: what do I do today. Greeting, the "This week" ring, the one thing to do now,
// the latest word from the coach, today's food and a recent personal best.
// Empty sections are hidden.
import { useState } from 'react'
import { Flame, Trophy, ChevronRight, Sparkles, Check, Plus } from 'lucide-react'
import { Card, Button, Chip, Avatar } from '../ui'
import { toLocalDateStr, getGreeting, weekDays, weekdayName, parseDay, formatShortDate } from './dates'
import {
  isDone, workoutName, groupByDate, estMinutes, nextSession, weekStreak, checkinStatus, sessionExercises,
  plural, logsForDate, foodTotals, nutritionTargetsFor, latestPB, fmtKg, weekCommitments,
} from './metrics'
import CheckinSheet from './CheckinSheet'
import { NutritionSummary, CoachAvatar } from './common'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const cx = (...c) => c.filter(Boolean).join(' ')
const coachLabel = (name) => (name ? `Your coach, ${name}` : 'Your coach')

// One shade of the accent per commitment, so the ring and its labels match. Tracks are a
// faint wash of the same shade.
const SHADES = {
  sessions: 'var(--accent)',
  checkin: 'color-mix(in srgb, var(--accent) 66%, var(--bg))',
  food: 'color-mix(in srgb, var(--accent) 42%, var(--bg))',
}
const trackOf = (c) => `color-mix(in srgb, ${c} 16%, var(--surface-2))`

/* The week ring: the logo's open ring, one lane per commitment, round ends, a gap at
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

function WeekHero({ week, sessionHint, today, byDate, completedIds, onPickDay }) {
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
          {week.parts.map((p) => {
            const hint = p.key === 'sessions' && !p.done ? sessionHint : p.hint
            return (
              <li key={p.key} className="flex items-start gap-2.5">
                <span className="w-3 h-3 rounded-full shrink-0 mt-[5px]" style={{ backgroundColor: SHADES[p.key] }} />
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-ink leading-snug flex items-center gap-1">
                    {p.label}
                    {p.done && <Check size={15} strokeWidth={3} className="text-accent shrink-0" />}
                  </p>
                  {hint && <p className="text-[13px] text-muted leading-snug truncate">{hint}</p>}
                </div>
              </li>
            )
          })}
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

/* The one thing to do now: today's session, then the check-in, then food. */
function NextThing({ todo }) {
  return (
    <Card className="flex items-center gap-3">
      {todo.avatar}
      <div className="flex-1 min-w-0">
        {todo.eyebrow && <p className="text-[13px] font-bold text-muted truncate">{todo.eyebrow}</p>}
        <p className="text-[19px] font-bold text-ink leading-snug truncate">{todo.title}</p>
        {todo.body && <p className="text-[13px] text-muted mt-0.5">{todo.body}</p>}
      </div>
      {todo.action}
    </Card>
  )
}

export default function HomeTab({
  client, checkins, setCheckins, assignment, scheduledWorkouts, completedIds, workoutLogs, workoutExercises,
  foodLogs, nutritionTargets, personalBests, coachName, onOpenWorkout, onOpenProfile, onBuildWorkout, onLogFood, onPickDay, onSeeCheckins,
}) {
  const [checkinOpen, setCheckinOpen] = useState(false)
  const today = toLocalDateStr()
  const firstName = client.full_name?.split(' ')[0] || client.full_name || ''
  const hasCoach = !!client.pt_id

  const streak = weekStreak(workoutLogs, today)
  const status = checkinStatus(checkins, today)
  const byDate = groupByDate(scheduledWorkouts)
  const todayLeft = (byDate[today] ?? []).filter((sw) => !isDone(sw, completedIds))
  const todayDone = (byDate[today] ?? []).some((sw) => isDone(sw, completedIds))
  const next = nextSession(scheduledWorkouts, completedIds, today)
  const week = weekCommitments({ scheduledWorkouts, completedIds, checkins, foodLogs, today })
  const todaysFood = logsForDate(foodLogs, today)
  const totals = foodTotals(todaysFood)
  const targets = nutritionTargetsFor(client, nutritionTargets)
  const pb = latestPB(personalBests, 14, today)
  const sundayOfWeek = weekDays(today)[6]

  // Next step for the sessions lane: today's session, or the next one this week.
  const sessionHint = todayLeft.length > 0
    ? `Next: ${workoutName(todayLeft[0])}, today`
    : next && next.scheduled_date <= sundayOfWeek ? `Next: ${workoutName(next)}, ${weekdayName(next.scheduled_date)}` : null

  let todo = null
  if (todayLeft.length > 0) {
    const sw = todayLeft[0]
    const exs = sessionExercises(sw, workoutExercises)
    const mins = estMinutes(exs)
    todo = {
      eyebrow: 'Today',
      title: workoutName(sw),
      body: [exs.length ? plural(exs.length, 'exercise') : null, mins ? `about ${mins} min` : null].filter(Boolean).join(' · ') || 'Ready when you are',
      action: <Button onClick={() => onOpenWorkout(sw)}>Start</Button>,
    }
  } else if (status.due) {
    todo = {
      avatar: hasCoach ? <CoachAvatar name={coachName} size={44} /> : null,
      eyebrow: hasCoach ? coachLabel(coachName) : null,
      title: 'Time to check in',
      body: hasCoach ? `Tell ${coachName || 'your coach'} how the week went.` : 'A quick look back at your week.',
      action: <Button onClick={() => setCheckinOpen(true)}>Check in</Button>,
    }
  } else if (todaysFood.length === 0) {
    todo = {
      eyebrow: 'Today',
      title: "Log today's food",
      body: "Whatever you've had so far.",
      action: <Button onClick={onLogFood}>Log food</Button>,
    }
  } else if (next) {
    todo = {
      eyebrow: todayDone ? 'Done for today. Nice work.' : 'Rest day',
      title: `Next up: ${workoutName(next)}`,
      body: weekdayName(next.scheduled_date),
      action: (
        <button onClick={() => onOpenWorkout(next)} aria-label={`Look at ${workoutName(next)}`} className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-faint hover:bg-surface-2 shrink-0">
          <ChevronRight size={20} />
        </button>
      ),
    }
  } else if (!todayDone) {
    todo = {
      eyebrow: 'Today',
      title: 'Feel like moving?',
      body: 'Build a session for today.',
      action: <Button variant="secondary" size="sm" onClick={onBuildWorkout}><Sparkles size={15} /> Build one</Button>,
    }
  }

  const reply = hasCoach ? status.lastReply : null

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
        <WeekHero week={week} sessionHint={sessionHint} today={today} byDate={byDate} completedIds={completedIds} onPickDay={onPickDay} />

        {todo && <NextThing todo={todo} />}

        {/* Latest word from the coach */}
        {reply && (
          <Card onClick={onSeeCheckins} as="button" className="block">
            <div className="flex items-center gap-3">
              <CoachAvatar name={coachName} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-ink truncate">{coachLabel(coachName)}</p>
                <p className="text-[13px] text-muted">{formatShortDate(toLocalDateStr(new Date(reply.replied_at || reply.submitted_at)))}</p>
              </div>
              <ChevronRight size={18} className="text-faint shrink-0" />
            </div>
            <p className="text-[15px] text-ink leading-relaxed mt-3 line-clamp-3">{reply.coach_reply}</p>
          </Card>
        )}

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

      <CheckinSheet
        open={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        client={client}
        onSaved={(row) => { setCheckins((prev) => [row, ...prev]); setCheckinOpen(false) }}
      />
    </div>
  )
}

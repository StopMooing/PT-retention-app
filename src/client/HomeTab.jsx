// Home: what do I do today. Greeting, check-in, today's session and food, this week, a
// recent personal best. Empty sections are hidden.
import { useState } from 'react'
import { Flame, Trophy, ChevronRight, MessageCircle, Sparkles, Check, Plus } from 'lucide-react'
import { Card, Button, Ring, Chip, Avatar, SectionLabel } from '../ui'
import { toLocalDateStr, getGreeting, weekDays, weekdayName, parseDay, formatShortDate } from './dates'
import {
  isDone, workoutName, groupByDate, estMinutes, sessionsThisWeek, nextSession, weekStreak,
  checkinStatus, sessionExercises, plural, logsForDate, foodTotals, nutritionTargetsFor, latestPB, fmtKg,
} from './metrics'
import CheckinSheet from './CheckinSheet'
import { NutritionSummary } from './common'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function CheckinCard({ status, onCheckIn, onSeeAll }) {
  const { due, daysToNext, daysSince, nextDate, lastReply } = status
  return (
    <Card padded={false}>
      <div className="flex items-center gap-4 p-4">
        {due ? (
          // Due: an open accent outline, not a full ring (a full ring with a tick reads as done).
          <span className="w-[68px] h-[68px] rounded-full border-[3px] border-accent flex flex-col items-center justify-center shrink-0">
            <span className="font-display text-[20px] leading-none text-accent">Due</span>
            <span className="text-[10px] font-bold text-muted mt-0.5">today</span>
          </span>
        ) : (
          <Ring value={(7 - daysToNext) / 7} size={68} stroke={7}>
            <span className="font-display text-[24px] leading-none text-ink tabular-nums">{daysToNext}</span>
            <span className="text-[10px] font-bold text-muted mt-0.5">{daysToNext === 1 ? 'day' : 'days'}</span>
          </Ring>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold text-ink">{due ? 'Check-in time' : 'Weekly check-in'}</p>
          <p className="text-[13px] text-muted mt-0.5">
            {due
              ? 'Tell your coach how the week went.'
              : `Sent ${daysSince === 0 ? 'today' : daysSince === 1 ? 'yesterday' : `${daysSince} days ago`}. Next one ${daysToNext === 1 ? 'tomorrow' : weekdayName(nextDate)}.`}
          </p>
        </div>
        {due && <Button size="sm" onClick={onCheckIn}>Check in</Button>}
      </div>
      {lastReply && (
        <button onClick={onSeeAll} className="w-full text-left flex items-start gap-3 px-4 py-3.5 border-t border-line hover:bg-surface-2 rounded-b-[20px]">
          <span className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
            <MessageCircle size={17} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-muted">From your coach · {formatShortDate(toLocalDateStr(new Date(lastReply.replied_at || lastReply.submitted_at)))}</p>
            <p className="text-[15px] text-ink mt-0.5 line-clamp-2">{lastReply.coach_reply}</p>
          </div>
          <ChevronRight size={18} className="text-faint shrink-0 mt-1.5" />
        </button>
      )}
    </Card>
  )
}

export default function HomeTab({
  client, checkins, setCheckins, assignment, scheduledWorkouts, completedIds, workoutLogs, workoutExercises,
  foodLogs, nutritionTargets, personalBests, onOpenWorkout, onOpenProfile, onBuildWorkout, onLogFood, onPickDay, onSeeCheckins,
}) {
  const [checkinOpen, setCheckinOpen] = useState(false)
  const today = toLocalDateStr()
  const firstName = client.full_name?.split(' ')[0] || client.full_name || ''

  const streak = weekStreak(workoutLogs, today)
  const status = checkinStatus(checkins)
  const byDate = groupByDate(scheduledWorkouts)
  const todays = byDate[today] ?? []
  const next = todays.length === 0 ? nextSession(scheduledWorkouts, completedIds, today) : null
  const week = sessionsThisWeek(scheduledWorkouts, completedIds, today)
  const totals = foodTotals(logsForDate(foodLogs, today))
  const targets = nutritionTargetsFor(client, nutritionTargets)
  const pb = latestPB(personalBests, 14, today)

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
        <CheckinCard status={status} onCheckIn={() => setCheckinOpen(true)} onSeeAll={onSeeCheckins} />

        {/* Today */}
        <Card padded={false}>
          <div className="px-4 pt-4">
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Today</p>
          </div>
          {todays.length > 0 ? (
            <div className="divide-y divide-line">
              {todays.map((sw) => {
                const done = isDone(sw, completedIds)
                const exs = sessionExercises(sw, workoutExercises)
                const mins = estMinutes(exs)
                return (
                  <div key={sw.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[19px] font-bold text-ink truncate">{workoutName(sw)}</p>
                      <p className="text-[13px] text-muted">
                        {done ? 'Completed. Nice work.' : [exs.length ? plural(exs.length, 'exercise') : null, mins ? `about ${mins} min` : null].filter(Boolean).join(' · ') || 'Ready when you are'}
                      </p>
                    </div>
                    {done ? (
                      <Button variant="soft" size="sm" onClick={() => onOpenWorkout(sw)}><Check size={16} strokeWidth={3} /> Done</Button>
                    ) : (
                      <Button size="md" onClick={() => onOpenWorkout(sw)}>Start</Button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-[19px] font-bold text-ink">{next ? 'Rest day' : 'Nothing scheduled yet'}</p>
                <p className="text-[13px] text-muted">
                  {next ? `Next up: ${workoutName(next)}, ${weekdayName(next.scheduled_date)}` : 'Feel like moving? Build a session for today.'}
                </p>
              </div>
              {!next && (
                <Button variant="secondary" size="sm" onClick={onBuildWorkout}><Sparkles size={15} /> Build one</Button>
              )}
            </div>
          )}
          <div className="border-t border-line px-4 pt-2 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Nutrition</p>
              <Button variant="ghost" size="sm" className="text-accent -mr-2" onClick={onLogFood}><Plus size={16} /> Log food</Button>
            </div>
            <div className="mt-1">
              <NutritionSummary compact totals={totals} targets={targets} />
            </div>
          </div>
        </Card>
      </div>

      {/* This week */}
      {week.scheduled > 0 && (
        <section>
          <SectionLabel action={<span className="text-[13px] font-bold text-ink tabular-nums">{week.done} of {week.scheduled} done</span>}>This week</SectionLabel>
          <Card className="grid grid-cols-7 gap-1 px-2 py-3">
            {weekDays(today).map((d, i) => {
              const sessions = byDate[d] ?? []
              const anyDone = sessions.some((sw) => isDone(sw, completedIds))
              const isTodayD = d === today
              return (
                <button key={d} onClick={() => onPickDay(d)} className="flex flex-col items-center gap-1.5 py-1 rounded-[14px] hover:bg-surface-2" aria-label={formatShortDate(d)}>
                  <span className="text-[11px] font-bold text-faint">{DAY_LETTERS[i]}</span>
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-bold tabular-nums ${isTodayD ? 'bg-accent text-on-accent' : 'text-ink'}`}>
                    {parseDay(d).getDate()}
                  </span>
                  <span className="h-4 flex items-center justify-center">
                    {anyDone ? (
                      <span className="w-4 h-4 rounded-full bg-accent text-on-accent flex items-center justify-center"><Check size={11} strokeWidth={3.5} /></span>
                    ) : sessions.length > 0 ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                    ) : null}
                  </span>
                </button>
              )
            })}
          </Card>
        </section>
      )}

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

      <CheckinSheet
        open={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        client={client}
        onSaved={(row) => { setCheckins((prev) => [row, ...prev]); setCheckinOpen(false) }}
      />
    </div>
  )
}

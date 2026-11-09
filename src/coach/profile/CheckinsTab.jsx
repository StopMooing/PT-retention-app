// Weekly check-ins (newest first, each with its reply) and the client's daily check-ins.
// On a wide screen the averages, a trend chart and the coach's own questions sit beside them.
import { useEffect, useState } from 'react'
import { MessageSquare, Activity, ListChecks, TrendingUp } from 'lucide-react'
import { supabase } from '../../supabase'
import { Card, EmptyState, Segmented, Button } from '../../ui'
import { CheckinCard, Panel, LineChart } from './parts'
import CheckinQuestionsSheet from '../CheckinQuestionsSheet'
import { fetchQuestions, KINDS } from '../../lib/checkinQuestions'
import { firstName, formatDate, relativeDay, scoreTone, DAILY_SCORES } from '../lib'

function avg(list, key) {
  const vals = list.map((c) => c[key]).filter((v) => v != null)
  return vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null
}

function Averages({ checkins, className = '' }) {
  const recent = checkins.slice(0, 4)
  const trend = recent.length >= 2 ? recent[0].training_score - recent[recent.length - 1].training_score : 0
  return (
    <Card className={`grid grid-cols-3 divide-x divide-line !px-0 ${className}`}>
      {[
        { label: 'Avg training', value: avg(checkins, 'training_score'), unit: '/5' },
        { label: 'Avg energy', value: avg(checkins, 'energy_score'), unit: '/5' },
        { label: 'Last 4 weeks', value: trend > 0 ? 'Up' : trend < 0 ? 'Down' : 'Steady' },
      ].map((s) => (
        <div key={s.label} className="px-4 text-center">
          <p className="text-[13px] text-muted">{s.label}</p>
          <p className="font-display text-[26px] leading-tight text-ink tabular-nums">
            {s.value ?? '-'}{s.unit && <span className="font-sans text-sm text-muted">{s.unit}</span>}
          </p>
        </div>
      ))}
    </Card>
  )
}

// Training and energy scores across the last 10 check-ins, oldest on the left.
function Trend({ checkins }) {
  const last = checkins.slice(0, 10).reverse()
  if (last.length < 2) return null
  return (
    <Panel title="Trend" icon={TrendingUp} sub={`Last ${last.length} check-ins`}>
      <LineChart
        height={110}
        series={[
          { values: last.map((c) => c.training_score), color: 'var(--accent)', width: 3, dots: true },
          { values: last.map((c) => c.energy_score), color: 'var(--faint)', dots: true },
        ]}
        labels={[formatDate(last[0].submitted_at, { day: 'numeric', month: 'short' }), formatDate(last[last.length - 1].submitted_at, { day: 'numeric', month: 'short' })]}
      />
      <div className="flex gap-4 mt-3 text-[13px] text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />Training</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1 rounded-full" style={{ backgroundColor: 'var(--faint)' }} />Energy</span>
      </div>
    </Panel>
  )
}

// The coach's own questions, so it is clear what clients are asked each week.
function Questions({ onEdit, version }) {
  const [list, setList] = useState(null)
  useEffect(() => {
    let live = true
    supabase.auth.getUser()
      .then(({ data }) => fetchQuestions(data?.user?.id))
      .then((q) => live && setList(q))
      .catch((e) => { console.error('Check-in questions load error:', e); if (live) setList([]) })
    return () => { live = false }
  }, [version])
  return (
    <Panel title="Your questions" icon={ListChecks} action={<Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>}>
      {list === null ? (
        <div className="h-12 rounded-[12px] bg-surface-2 animate-pulse" />
      ) : list.length === 0 ? (
        <p className="text-[14px] text-muted">Only the built-in questions so far. Add your own, like sleep or how the meal plan went, and every client answers them weekly.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((q) => (
            <li key={q.id} className="text-[14px] text-ink">
              {q.question} <span className="text-muted">({KINDS.find((k) => k.value === q.kind)?.label.toLowerCase()})</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function Weekly({ checkins, client, reply }) {
  if (checkins.length === 0) {
    return (
      <Card>
        <EmptyState icon={MessageSquare} title="No weekly check-ins yet" body={`${firstName(client.full_name)} checks in from the app once their account is active.`} />
      </Card>
    )
  }
  return (
    <>
      <Averages checkins={checkins} className="lg:hidden" />
      {checkins.map((ci) => (
        <CheckinCard key={ci.id} ci={ci} number={checkins.length - checkins.indexOf(ci)} clientName={firstName(client.full_name)} reply={reply} />
      ))}
    </>
  )
}

function Daily({ dailyCheckins, client }) {
  if (dailyCheckins.length === 0) {
    return (
      <Card>
        <EmptyState icon={Activity} title="No daily check-ins yet" body={`${firstName(client.full_name)} can log energy, sleep and soreness each day in the app.`} />
      </Card>
    )
  }
  return (
    <Card padded={false} className="overflow-hidden divide-y divide-line">
      {dailyCheckins.map((d) => (
        <div key={d.id} className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="font-bold text-ink">{formatDate(d.checkin_date, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
              <p className="text-[13px] text-muted">{relativeDay(d.checkin_date)}</p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {DAILY_SCORES.filter((s) => d[s.key] != null).map((s) => (
                <span key={s.key} className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-bold tabular-nums ${scoreTone(d[s.key], s.invert)}`}>
                  {s.label} {d[s.key]}
                </span>
              ))}
            </div>
          </div>
          {d.note?.trim() && <p className="mt-2.5 text-[15px] text-ink leading-relaxed bg-surface-2 rounded-[14px] px-4 py-3 whitespace-pre-wrap">{d.note}</p>}
        </div>
      ))}
    </Card>
  )
}

export default function CheckinsTab({ checkins, dailyCheckins = [], client, reply, view = 'weekly', onViewChange }) {
  const [questionsOpen, setQuestionsOpen] = useState(false)
  const [version, setVersion] = useState(0) // reloads the questions card after editing
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
      <div className="space-y-3 min-w-0">
        <Segmented
          value={view}
          onChange={onViewChange}
          options={[{ value: 'weekly', label: 'Weekly check-ins' }, { value: 'daily', label: 'Daily' }]}
        />
        {view === 'weekly' && (
          <button onClick={() => setQuestionsOpen(true)} className="lg:hidden inline-flex items-center gap-1.5 px-1 text-[13px] font-semibold text-muted underline underline-offset-2 hover:text-ink">
            <ListChecks size={15} /> Your check-in questions
          </button>
        )}
        {view === 'daily' ? <Daily dailyCheckins={dailyCheckins} client={client} /> : <Weekly checkins={checkins} client={client} reply={reply} />}
      </div>
      <div className="hidden lg:block space-y-4 lg:sticky lg:top-4">
        {checkins.length > 0 && <Averages checkins={checkins} />}
        <Trend checkins={checkins} />
        <Questions onEdit={() => setQuestionsOpen(true)} version={version} />
      </div>
      <CheckinQuestionsSheet open={questionsOpen} onClose={() => { setQuestionsOpen(false); setVersion((v) => v + 1) }} />
    </div>
  )
}

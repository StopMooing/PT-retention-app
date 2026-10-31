// Weekly check-ins (newest first, each with its reply) and the client's daily check-ins.
import { useState } from 'react'
import { MessageSquare, Activity } from 'lucide-react'
import { Card, EmptyState, Segmented } from '../../ui'
import { CheckinCard } from './parts'
import { firstName, formatDate, relativeDay, scoreTone, DAILY_SCORES } from '../lib'

function avg(list, key) {
  const vals = list.map((c) => c[key]).filter((v) => v != null)
  return vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null
}

function Weekly({ checkins, client, reply }) {
  const [show, setShow] = useState('all')
  if (checkins.length === 0) {
    return (
      <Card>
        <EmptyState icon={MessageSquare} title="No weekly check-ins yet" body={`${firstName(client.full_name)} checks in from the app once their account is active.`} />
      </Card>
    )
  }
  const recent = checkins.slice(0, 4)
  const trend = recent.length >= 2 ? recent[0].training_score - recent[recent.length - 1].training_score : 0
  const unreplied = checkins.filter((c) => !c.coach_reply).length
  const list = show === 'reply' ? checkins.filter((c) => !c.coach_reply) : checkins

  return (
    <>
      <Card className="grid grid-cols-3 divide-x divide-line !px-0">
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

      {unreplied > 0 && (
        <Segmented
          value={show}
          onChange={setShow}
          options={[{ value: 'all', label: `All (${checkins.length})` }, { value: 'reply', label: `Needs reply (${unreplied})` }]}
        />
      )}

      {list.map((ci) => (
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
  return (
    <div className="space-y-3 max-w-[760px]">
      <Segmented
        value={view}
        onChange={onViewChange}
        options={[{ value: 'weekly', label: 'Weekly check-ins' }, { value: 'daily', label: 'Daily' }]}
      />
      {view === 'daily' ? <Daily dailyCheckins={dailyCheckins} client={client} /> : <Weekly checkins={checkins} client={client} reply={reply} />}
    </div>
  )
}

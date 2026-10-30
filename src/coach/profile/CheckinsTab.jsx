// Every check-in, newest first, each with its reply.
import { MessageSquare } from 'lucide-react'
import { Card, EmptyState, Segmented } from '../../ui'
import { CheckinCard } from './parts'
import { firstName } from '../lib'
import { useState } from 'react'

function avg(list, key) {
  const vals = list.map((c) => c[key]).filter((v) => v != null)
  return vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null
}

export default function CheckinsTab({ checkins, client, reply }) {
  const [show, setShow] = useState('all')
  if (checkins.length === 0) {
    return (
      <Card>
        <EmptyState icon={MessageSquare} title="No check-ins yet" body={`${firstName(client.full_name)} checks in from the app once their account is active.`} />
      </Card>
    )
  }
  const recent = checkins.slice(0, 4)
  const trend = recent.length >= 2 ? recent[0].training_score - recent[recent.length - 1].training_score : 0
  const unreplied = checkins.filter((c) => !c.coach_reply).length
  const list = show === 'reply' ? checkins.filter((c) => !c.coach_reply) : checkins

  return (
    <div className="space-y-3 max-w-[760px]">
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
    </div>
  )
}

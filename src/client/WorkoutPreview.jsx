// Look at a workout before starting it: exercises, muscles, time. Also used for a program
// day (with "Add to calendar" instead of "Start").
import { useState } from 'react'
import { Info } from 'lucide-react'
import { Chip, Card } from '../ui'
import ExerciseInfoSheet from './ExerciseInfoSheet'
import { Overlay, BackHeader } from './common'
import { estMinutes, totalSets } from './metrics'
import { parseAiJson } from './foods'
import { prescriptionText, supersets } from '../lib/setTargets.js'

function StatsRow({ items }) {
  return (
    <Card className="grid grid-cols-3 divide-x divide-line" padded={false}>
      {items.map((s) => (
        <div key={s.label} className="py-3 text-center">
          <p className="font-display text-[26px] leading-none text-ink tabular-nums">{s.value}</p>
          <p className="text-xs text-muted mt-1">{s.label}</p>
        </div>
      ))}
    </Card>
  )
}

function ExerciseRow({ idx, name, muscle, detail, notes, onInfo, superset }) {
  const Tag = onInfo ? 'button' : 'div'
  return (
    <Tag onClick={onInfo} className="w-full text-left flex items-start gap-3 px-4 py-3.5">
      <span className="w-7 h-7 rounded-full bg-surface-2 text-muted text-[13px] font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">{idx + 1}</span>
      <div className="flex-1 min-w-0">
        {superset?.first && <p className="text-[12px] font-bold text-accent mb-0.5">Superset {superset.letter} · back to back with the next</p>}
        <p className="text-[15px] font-bold text-ink inline-flex items-start gap-1.5">
          <span>{name}</span>
          {onInfo && <Info size={14} className="shrink-0 mt-1 text-muted" aria-label="How to do it" />}
        </p>
        <p className="text-[13px] text-muted mt-0.5">{detail}</p>
        {notes && <p className="text-[13px] text-muted mt-1 italic">{notes}</p>}
      </div>
      {muscle && <Chip className="mt-0.5">{muscle}</Chip>}
    </Tag>
  )
}

export default function WorkoutPreview({ eyebrow, title, exercises = [], customContent, onBack, footer }) {
  const parsed = customContent ? parseAiJson(customContent) : null
  const aiExercises = parsed?.title && Array.isArray(parsed?.exercises) ? parsed.exercises : null
  const list = customContent ? aiExercises ?? [] : exercises
  const muscles = customContent ? [] : [...new Set(exercises.map((ex) => ex.exercises?.muscle_group).filter(Boolean))]
  const [infoFor, setInfoFor] = useState(null)
  const marks = supersets(list.map((ex, i) => ({ ...ex, id: ex.id ?? i })))

  return (
    <Overlay>
      <BackHeader onBack={onBack} eyebrow={eyebrow} title={title} />
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {list.length > 0 && (
          <StatsRow
            items={[
              { label: 'Exercises', value: list.length },
              { label: 'Sets', value: totalSets(list) },
              { label: 'Minutes', value: `~${estMinutes(list)}` },
            ]}
          />
        )}

        {muscles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {muscles.map((m) => <Chip key={m} tone="accent">{m}</Chip>)}
          </div>
        )}

        {list.length > 0 ? (
          <Card padded={false} className="divide-y divide-line">
            {list.map((ex, i) => (
              <ExerciseRow
                key={ex.id ?? i}
                idx={i}
                name={ex.exercises?.name || ex.name || 'Exercise'}
                muscle={ex.exercises?.muscle_group}
                detail={prescriptionText(ex)}
                superset={marks[ex.id ?? i]}
                notes={ex.notes}
                onInfo={ex.exercises?.id ? () => setInfoFor(ex.exercises) : undefined}
              />
            ))}
          </Card>
        ) : customContent ? (
          <Card>
            <pre className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap font-sans">{customContent}</pre>
          </Card>
        ) : null}
      </div>
      {footer && (
        <div className="shrink-0 bg-bg px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">{footer}</div>
      )}
      {infoFor && <ExerciseInfoSheet exercise={infoFor} onClose={() => setInfoFor(null)} />}
    </Overlay>
  )
}

// Look at a workout before starting it: exercises, muscles, time. Also used for a program
// day (with "Add to calendar" instead of "Start").
import { Chip, Card } from '../ui'
import { Overlay, BackHeader } from './common'
import { estMinutes, totalSets } from './metrics'
import { parseAiJson } from './foods'

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

function ExerciseRow({ idx, name, muscle, detail, notes }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <span className="w-7 h-7 rounded-full bg-surface-2 text-muted text-[13px] font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">{idx + 1}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-ink">{name}</p>
        <p className="text-[13px] text-muted mt-0.5">{detail}</p>
        {notes && <p className="text-[13px] text-muted mt-1 italic">{notes}</p>}
      </div>
      {muscle && <Chip className="mt-0.5">{muscle}</Chip>}
    </div>
  )
}

const detailFor = (ex) =>
  [ex.sets > 0 ? `${ex.sets} sets x ${ex.reps}` : ex.reps, ex.rest_seconds > 0 ? `${ex.rest_seconds}s rest` : null].filter(Boolean).join(' · ')

export default function WorkoutPreview({ eyebrow, title, exercises = [], customContent, onBack, footer }) {
  const parsed = customContent ? parseAiJson(customContent) : null
  const aiExercises = parsed?.title && Array.isArray(parsed?.exercises) ? parsed.exercises : null
  const list = customContent ? aiExercises ?? [] : exercises
  const muscles = customContent ? [] : [...new Set(exercises.map((ex) => ex.exercises?.muscle_group).filter(Boolean))]

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
                detail={detailFor(ex)}
                notes={ex.notes}
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
        <div className="shrink-0 border-t border-line bg-bg px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">{footer}</div>
      )}
    </Overlay>
  )
}

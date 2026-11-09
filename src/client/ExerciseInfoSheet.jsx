// How to do an exercise: the coach's own video if they added one (Exercises page), else a
// drawing of the movement, then the library's instructions and coaching cues, and a link
// to watch it done. Opened by tapping an exercise in a workout or its preview. Everything
// loads only when someone opens it.
import { useEffect, useState } from 'react'
import { PlayCircle } from 'lucide-react'
import { supabase } from '../supabase'
import { fetchExerciseVideo } from '../lib/exerciseVideo'
import { ExerciseVideo } from '../lib/ExerciseVideo'
import { Sheet, Chip } from '../ui'

export default function ExerciseInfoSheet({ exercise, onClose }) {
  const [info, setInfo] = useState(null) // { instructions, equipment, tips, video }
  const id = exercise?.id

  useEffect(() => {
    if (!id) return
    let live = true
    Promise.all([
      supabase.from('exercises').select('instructions, equipment').eq('id', id).maybeSingle(),
      import('../tools/coachingTips'),
      fetchExerciseVideo(id),
    ])
      .then(([{ data }, mod, video]) => {
        if (!live) return
        const tips = mod.getCoachingTips(exercise.name, exercise.muscle_group) || []
        setInfo({ instructions: data?.instructions || '', equipment: data?.equipment || '', tips, video })
      })
      .catch((e) => { console.error('Exercise info load error:', e); if (live) setInfo({ instructions: '', equipment: '', tips: [], video: null }) })
    return () => { live = false }
  }, [id, exercise?.name, exercise?.muscle_group])

  if (!exercise) return null
  const watch = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} exercise proper form`)}`

  return (
    <Sheet open onClose={onClose} title={exercise.name}>
      <div className="space-y-4">
        {(exercise.muscle_group || info?.equipment) && (
          <div className="flex flex-wrap gap-1.5">
            {exercise.muscle_group && <Chip>{exercise.muscle_group}</Chip>}
            {info?.equipment && <Chip>{info.equipment.charAt(0).toUpperCase() + info.equipment.slice(1)}</Chip>}
          </div>
        )}
        {!info ? (
          <div className="h-28 rounded-[16px] bg-surface-2 animate-pulse" />
        ) : (
          <>
            {info.video && (
              <section>
                <h4 className="text-[15px] font-bold text-ink mb-1.5">From your coach</h4>
                <ExerciseVideo media={info.video} />
              </section>
            )}
            {info.instructions && (
              <section>
                <h4 className="text-[15px] font-bold text-ink mb-1">How to do it</h4>
                <p className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap">{info.instructions}</p>
              </section>
            )}
            {info.tips.length > 0 && (
              <section>
                <h4 className="text-[15px] font-bold text-ink mb-1.5">Coaching cues</h4>
                <ul className="space-y-2">
                  {info.tips.map((t, i) => (
                    <li key={i} className="flex gap-2.5 text-[15px] text-ink leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-ink shrink-0 mt-2.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
        <a href={watch} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 h-12 rounded-full border border-line-strong text-ink text-[15px] font-bold hover:bg-surface-2">
          <PlayCircle size={18} /> {info?.video ? 'More videos on YouTube' : "Watch how it's done"}
        </a>
      </div>
    </Sheet>
  )
}

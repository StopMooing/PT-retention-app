// Suggested swaps for an exercise, for one session only (the machine is taken, a niggle,
// no barbell at this gym). Library names read "Movement (Equipment)", so the best swap is
// the same movement on other kit, then the same kind of movement for the same muscle
// (another press, row, squat), then anything else for that muscle.

// "Bench Press (Barbell)" -> "bench press"
export function baseName(name) {
  return String(name ?? '').replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase()
}

const SKIP = new Set(['with', 'and', 'the', 'to', 'of', 'on', 'a', 'single', 'arm', 'leg', 'alternating', 'seated', 'standing'])
const words = (name) => baseName(name).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !SKIP.has(w))
// Warm-up and cool-down moves are not a swap for a working exercise (and the reverse).
const kind = (ex) => (['warmup', 'cooldown'].includes(ex?.category) ? ex.category : 'work')

export function swapReason(from, to) {
  if (baseName(from.name) === baseName(to.name)) return 'Same movement, different kit'
  if (words(from.name).some((w) => words(to.name).includes(w))) return `Similar movement, ${from.muscle_group?.toLowerCase() || 'same muscles'}`
  return `Also works ${from.muscle_group?.toLowerCase() || 'the same muscles'}`
}

// The best few swaps for `from` out of the library, best first. `exclude` holds exercise
// ids not to offer (the exercise itself, others already in today's workout).
export function suggestSwaps(from, library, { limit = 6, exclude = [] } = {}) {
  if (!from?.id) return []
  const skip = new Set([from.id, ...exclude])
  const base = baseName(from.name)
  const fromWords = words(from.name)
  const scored = []
  for (const ex of library) {
    if (skip.has(ex.id) || kind(ex) !== kind(from)) continue
    const sameBase = base && baseName(ex.name) === base
    if (!sameBase && (!from.muscle_group || ex.muscle_group !== from.muscle_group)) continue
    const shared = words(ex.name).filter((w) => fromWords.includes(w)).length
    const score = (sameBase ? 100 : 0) + shared * 10 + (ex.category === from.category ? 3 : 0) + (ex.equipment !== from.equipment ? 1 : 0)
    scored.push({ ex, score })
  }
  scored.sort((a, b) => b.score - a.score || a.ex.name.localeCompare(b.ex.name))
  return scored.slice(0, limit).map((s) => s.ex)
}

// A program exercise with today's swap applied. The coach's sets, reps, rest and notes
// stay; kg targets are dropped because they were set for the other exercise.
export function applySwap(ex, swap) {
  if (!swap || !ex) return ex
  return {
    ...ex,
    exercise_id: swap.id,
    exercises: swap,
    swappedFrom: ex.exercises,
    workout_exercise_sets: ex.workout_exercise_sets?.map((s) => ({ ...s, weight_kg: null })),
  }
}

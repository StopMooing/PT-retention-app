// The planned sets of one program exercise, and how they read. One place, so the coach's
// builder, the coach's client view and the client's app always show the same sets.
// A program exercise (a workout_exercises row) may have set rows (workout_exercise_sets):
// one per set, each with its own type, reps, kg, RPE and rest. Older exercises only have
// the summary columns (sets, reps, rest_seconds), which stand for that many equal sets.

export const SET_TYPES = [
  { value: 'normal', label: 'Working set', short: null },
  { value: 'warmup', label: 'Warm-up', short: 'W' },
  { value: 'drop', label: 'Drop set', short: 'D' },
  { value: 'failure', label: 'To failure', short: 'F' },
]
const TYPE = Object.fromEntries(SET_TYPES.map((t) => [t.value, t]))
export const setTypeOf = (value) => TYPE[value] ?? TYPE.normal

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))
const clean = (v) => String(v ?? '').trim()

// The planned sets, in order: [{ type, reps, weight_kg, rpe, rest_seconds }].
// An exercise with no sets saved (an old row left blank) counts as one set, so every
// screen shows at least one row to tick.
export function plannedSets(ex) {
  const rows = ex?.workout_exercise_sets
  if (rows?.length) {
    return [...rows]
      .sort((a, b) => a.set_number - b.set_number)
      .map((r) => ({
        type: TYPE[r.set_type] ? r.set_type : 'normal',
        reps: clean(r.reps),
        weight_kg: num(r.weight_kg),
        rpe: num(r.rpe),
        rest_seconds: num(r.rest_seconds),
      }))
  }
  const count = Math.max(1, parseInt(ex?.sets, 10) || 1)
  // A summary like "12/10/8" (saved by the builder) splits back into one value per set.
  const parts = clean(ex?.reps).split('/').map((s) => s.trim())
  return Array.from({ length: count }, (_, i) => ({
    type: 'normal',
    reps: parts.length === count ? parts[i] : clean(ex?.reps),
    weight_kg: null,
    rpe: null,
    rest_seconds: num(ex?.rest_seconds),
  }))
}

// True when the coach has written anything at all for this exercise.
export function hasPrescription(ex) {
  return !!(ex?.workout_exercise_sets?.length || ex?.sets != null || clean(ex?.reps) || ex?.rest_seconds != null)
}

export function restLabel(s) {
  if (!s) return ''
  if (s % 60 === 0) return `${s / 60} min`
  return s <= 90 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// "10" -> "10 reps", "8-12" -> "8-12 reps", "30s" or "AMRAP" stay as written.
export function repsLabel(r) {
  const v = clean(r)
  if (!v) return ''
  return /^\d+(\s*-\s*\d+)?$/.test(v) ? `${v.replace(/\s/g, '')} ${v === '1' ? 'rep' : 'reps'}` : v
}

const same = (list) => list.length > 0 && list.every((v) => v === list[0])

// One line for an exercise: "1 warm-up + 3 sets · 12, 10, 8 reps · 60 kg · RPE 8 · 90s rest".
// Empty when nothing is set (the coach has not filled it in yet).
export function prescriptionText(ex) {
  if (!hasPrescription(ex)) return ''
  const sets = plannedSets(ex)
  const warm = sets.filter((s) => s.type === 'warmup')
  const work = sets.filter((s) => s.type !== 'warmup')
  const main = work.length ? work : sets
  const parts = []
  parts.push(warm.length && work.length ? `${plural(warm.length, 'warm-up')} + ${plural(work.length, 'set')}` : plural(sets.length, 'set'))
  const reps = main.map((s) => s.reps)
  if (reps.some(Boolean)) parts.push(same(reps) ? repsLabel(reps[0]) : `${reps.map((r) => r || '-').join(', ')} reps`)
  const kg = main.map((s) => s.weight_kg).filter((v) => v != null)
  if (kg.length) parts.push(same(kg) ? `${kg[0]} kg` : `${Math.min(...kg)} to ${Math.max(...kg)} kg`)
  const rpe = main.map((s) => s.rpe).filter((v) => v != null)
  if (rpe.length) parts.push(same(rpe) ? `RPE ${rpe[0]}` : `RPE ${Math.min(...rpe)} to ${Math.max(...rpe)}`)
  const rest = main.map((s) => s.rest_seconds).filter(Boolean)
  if (rest.length) parts.push(same(rest) ? `${restLabel(rest[0])} rest` : `${restLabel(Math.min(...rest))} to ${restLabel(Math.max(...rest))} rest`)
  const drops = sets.filter((s) => s.type === 'drop').length
  const fails = sets.filter((s) => s.type === 'failure').length
  if (drops) parts.push(plural(drops, 'drop set'))
  if (fails) parts.push(fails === 1 ? 'last set to failure' : `${fails} sets to failure`)
  return parts.join(' · ')
}

// One set as a short line, for a set row: "12 reps · 60 kg · RPE 8".
export function setText(s) {
  return [repsLabel(s.reps), s.weight_kg != null ? `${s.weight_kg} kg` : '', s.rpe != null ? `RPE ${s.rpe}` : ''].filter(Boolean).join(' · ')
}

// The summary columns saved next to the set rows (older screens and the AI read these):
// how many sets, the reps ("10" when every working set is the same, "12/10/8" when not)
// and the usual rest.
export function summaryColumns(sets) {
  const work = sets.filter((s) => s.type !== 'warmup')
  const main = work.length ? work : sets
  const reps = main.map((s) => clean(s.reps))
  const rests = main.map((s) => num(s.rest_seconds)).filter(Boolean)
  const repsSummary = !reps.some(Boolean) ? null : same(reps) ? reps[0] : reps.map((r) => r || '-').join('/')
  return {
    sets: sets.length || null,
    reps: repsSummary ? repsSummary.slice(0, 60) : null,
    rest_seconds: rests.length ? rests[rests.length - 1] : null,
  }
}

// Supersets: exercises next to each other that share a superset_group. Returns
// { [exerciseRowId]: { letter, first, last } } for exercises in a superset of 2 or more.
export function supersets(list) {
  const out = {}
  let letter = 0
  let i = 0
  while (i < list.length) {
    const g = list[i].superset_group
    let j = i
    while (g != null && j + 1 < list.length && list[j + 1].superset_group === g) j++
    if (j > i) {
      const L = String.fromCharCode(65 + (letter++ % 26))
      for (let k = i; k <= j; k++) out[list[k].id] = { letter: L, first: k === i, last: k === j }
    }
    i = j + 1
  }
  return out
}

// The exercises in blocks: a superset is one block, any other exercise is a block of its own.
export function blocks(list) {
  const marks = supersets(list)
  const out = []
  for (const ex of list) {
    const m = marks[ex.id]
    if (m && !m.first) out[out.length - 1].push(ex)
    else out.push([ex])
  }
  return out
}

// The label of each set in the Set column: W, D or F for a warm-up, drop or failure set,
// otherwise the working set's number (warm-ups are not counted, as in Hevy). total can be
// more than the plan (sets the client added), which count on as working sets.
export function setLabels(sets, total = sets.length) {
  const out = []
  let k = 0
  for (let i = 0; i < total; i++) {
    const short = setTypeOf(sets[i]?.type).short
    if (short && i < sets.length) out.push(short)
    else out.push(String(++k))
  }
  return out
}

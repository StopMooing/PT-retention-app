// node src/lib/setTargets.test.mjs
import assert from 'node:assert/strict'
import { plannedSets, prescriptionText, summaryColumns, supersets, blocks, repsLabel } from './setTargets.js'

// Old rows: summary columns only.
assert.equal(plannedSets({ sets: 3, reps: '10', rest_seconds: 90 }).length, 3)
assert.equal(prescriptionText({ sets: 3, reps: '8-12', rest_seconds: 90 }), '3 sets · 8-12 reps · 90s rest')
assert.equal(prescriptionText({ sets: null, reps: null }), '')
assert.equal(plannedSets({ sets: null, reps: '10' }).length, 1)
assert.deepEqual(plannedSets({ sets: 3, reps: '12/10/8' }).map((s) => s.reps), ['12', '10', '8'])

// Set rows win over the summary.
const ex = { sets: 4, reps: '12/10/8', workout_exercise_sets: [
  { set_number: 2, set_type: 'normal', reps: '12', weight_kg: '40', rest_seconds: 90 },
  { set_number: 1, set_type: 'warmup', reps: '10', weight_kg: '20' },
  { set_number: 3, set_type: 'normal', reps: '10', weight_kg: '45', rest_seconds: 90 },
  { set_number: 4, set_type: 'failure', reps: '8', weight_kg: '45', rest_seconds: 120 },
] }
assert.equal(plannedSets(ex)[0].type, 'warmup')
assert.equal(prescriptionText(ex), '1 warm-up + 3 sets · 12, 10, 8 reps · 40 to 45 kg · 90s to 2 min rest · last set to failure')
assert.deepEqual(summaryColumns(plannedSets(ex)), { sets: 4, reps: '12/10/8', rest_seconds: 120 })
assert.deepEqual(summaryColumns([{ type: 'normal', reps: '10' }, { type: 'normal', reps: '10' }]), { sets: 2, reps: '10', rest_seconds: null })
assert.equal(repsLabel('30s'), '30s')
assert.equal(repsLabel('1'), '1 rep')

// Supersets only count when the exercises sit together.
const list = [{ id: 'a', superset_group: 1 }, { id: 'b', superset_group: 1 }, { id: 'c' }, { id: 'd', superset_group: 2 }, { id: 'e', superset_group: 3 }]
const m = supersets(list)
assert.deepEqual(Object.keys(m), ['a', 'b'])
assert.equal(m.a.letter, 'A'); assert.ok(m.a.first && m.b.last)
assert.deepEqual(blocks(list).map((b) => b.map((x) => x.id).join('')), ['ab', 'c', 'd', 'e'])
console.log('setTargets: all good')
import { setLabels } from './setTargets.js'
assert.deepEqual(setLabels([{ type: 'warmup' }, { type: 'normal' }, { type: 'normal' }, { type: 'drop' }], 5), ['W', '1', '2', 'D', '3'])
console.log('setLabels: all good')

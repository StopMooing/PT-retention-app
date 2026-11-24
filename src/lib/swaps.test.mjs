import assert from 'node:assert/strict'
import { baseName, suggestSwaps, swapReason, applySwap } from './swaps.js'

const lib = [
  { id: 'bb', name: 'Bench Press (Barbell)', muscle_group: 'Chest', equipment: 'barbell', category: 'strength' },
  { id: 'db', name: 'Bench Press (Dumbbell)', muscle_group: 'Chest', equipment: 'dumbbell', category: 'strength' },
  { id: 'sm', name: 'Bench Press (Smith Machine)', muscle_group: 'Chest', equipment: 'machine', category: 'strength' },
  { id: 'ib', name: 'Incline Bench Press (Dumbbell)', muscle_group: 'Chest', equipment: 'dumbbell', category: 'strength' },
  { id: 'cf', name: 'Cable Fly (Mid)', muscle_group: 'Chest', equipment: 'cable', category: 'accessory' },
  { id: 'pu', name: 'Push Up', muscle_group: 'Chest', equipment: 'bodyweight', category: 'bodyweight' },
  { id: 'st', name: 'Chest Stretch', muscle_group: 'Chest', equipment: 'bodyweight', category: 'cooldown' },
  { id: 'sq', name: 'Back Squat (Barbell)', muscle_group: 'Legs', equipment: 'barbell', category: 'strength' },
  { id: 'cgb', name: 'Close Grip Bench Press (Barbell)', muscle_group: 'Triceps', equipment: 'barbell', category: 'strength' },
]

assert.equal(baseName('Bench Press (Smith Machine)'), 'bench press')
assert.equal(baseName('Push Up'), 'push up')

const s = suggestSwaps(lib[0], lib)
assert.deepEqual(s.slice(0, 2).map((e) => e.id).sort(), ['db', 'sm'], 'same movement first')
assert.equal(s[2].id, 'ib', 'then a similar movement')
assert.ok(!s.some((e) => e.id === 'bb'), 'never itself')
assert.ok(!s.some((e) => e.id === 'st'), 'no cool-down stretch for a working lift')
assert.ok(!s.some((e) => e.id === 'sq'), 'other muscles left out')
assert.ok(!s.some((e) => e.id === 'cgb'), 'a different muscle group, even with the same words')
assert.deepEqual(suggestSwaps(lib[0], lib, { exclude: ['db'] }).map((e) => e.id).includes('db'), false)
assert.equal(suggestSwaps(lib[0], lib, { limit: 2 }).length, 2)
assert.deepEqual(suggestSwaps({ name: 'x' }, lib), [])

assert.equal(swapReason(lib[0], lib[1]), 'Same movement, different kit')
assert.equal(swapReason(lib[0], lib[3]), 'Similar movement, chest')
assert.equal(swapReason(lib[0], lib[4]), 'Also works chest')

const ex = { id: 'we1', exercise_id: 'bb', exercises: lib[0], sets: 3, reps: '8', workout_exercise_sets: [{ set_number: 1, reps: '8', weight_kg: 80 }] }
const swapped = applySwap(ex, lib[1])
assert.equal(swapped.exercise_id, 'db')
assert.equal(swapped.swappedFrom.id, 'bb')
assert.equal(swapped.workout_exercise_sets[0].weight_kg, null, 'kg targets dropped')
assert.equal(swapped.workout_exercise_sets[0].reps, '8', 'reps kept')
assert.equal(swapped.id, 'we1')
assert.equal(applySwap(ex, null), ex)
console.log('swaps: all good')

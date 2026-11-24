// The equipment values in the exercise library and how they read.
export const EQUIPMENT = [
  ['barbell', 'Barbell'], ['dumbbell', 'Dumbbell'], ['cable', 'Cable'], ['machine', 'Machine'],
  ['bodyweight', 'Bodyweight'], ['band', 'Band'], ['kettlebell', 'Kettlebell'], ['trx', 'TRX'],
  ['sled', 'Sled'], ['landmine', 'Landmine'], ['trap_bar', 'Trap bar'], ['functional', 'Functional'], ['plate', 'Plate'],
]
const LABEL = Object.fromEntries(EQUIPMENT)
export const equipmentLabel = (v) => LABEL[v] ?? ''

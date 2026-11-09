// Hand-made movements, version 2. Each move: start pose A, end pose B, which muscles work by
// default, where the load sits (load: joints to point), any fixed kit (scene). The figure
// faces right; the floor is y 184 in a 240 x 200 box (tall moves use a taller box). Every
// move is checked frame by frame in tools/movement/sheet2.mjs before an exercise uses it.
export const GROUND = 184
const G = GROUND
export const TALL = '0 -46 240 246'

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const unit = (a) => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l] }
// A point in the body's own frame, from the shoulder: along the spine (up) and towards the
// chest (front). Keeps a bar on the back or a weight at the chest as the body tilts.
function onTorso(j, up, front, from = 'shoulder') {
  const u = unit(sub(j.shoulder, j.hip))
  const fr = [-u[1], u[0]]
  const o = j[from]
  return [o[0] + u[0] * up + fr[0] * front, o[1] + u[1] * up + fr[1] * front]
}
const stand = (a = {}, x = 110) => ({ root: 'ankle', at: [x, G], a: { shin: 0, thigh: 0, torso: 0, upper: 181, fore: 179, ...a } })
const arms = (upper, fore, upper2 = upper, fore2 = fore) => ({ upper, fore, upper2, fore2 })
const rect = (x, y, w, h, rx = 3) => ({ k: 'rect', x, y, w, h, rx, tone: 'kit' })
// A flat bench: pad on two legs.
const bench = (x = 56, w = 104, y = 140) => [rect(x, y, w, 9), rect(x + 12, y + 9, 7, G - y - 9, 2), rect(x + w - 19, y + 9, 7, G - y - 9, 2)]
const box = (x, y, w) => [rect(x, y, w, G - y, 4)]
// A machine pad on the shin near the ankle: on the front of the shin (side 1) or the back (-1).
const shinPad = (side) => (j) => {
  const u = unit(sub(j.knee, j.ankle))
  const n = [-u[1] * side, u[0] * side]
  return [{ k: 'circle', cx: j.ankle[0] + n[0] * 9 + u[0] * 5, cy: j.ankle[1] + n[1] * 9 + u[1] * 5, r: 6, tone: 'gear' }]
}
const bar = (x1, x2, y) => ({ k: 'line', x1, y1: y, x2, y2: y, tone: 'gear', w: 3.5 })

export const MOVES = {
  // ---------------------------------------------------------------- Squats
  // Back squat: bar on the upper back, hips back and down, chest up, knees over toes.
  backSquat: {
    A: { ...stand({ torso: 3 }, 102), reach: { near: (j) => onTorso(j, -2, -13), bend: -1 } },
    B: { ...stand({ shin: 38, thigh: -74, torso: 44 }, 102), reach: { near: (j) => onTorso(j, -2, -13), bend: -1 } },
    load: (j) => onTorso(j, 1, -9),
    work: ['quads', 'glutes'],
  },
  // Front squat: bar on the front of the shoulders, elbows high, torso tall.
  frontSquat: {
    A: { ...stand({ torso: 1 }, 100), reach: { near: (j) => onTorso(j, 0, 15), bend: 1 } },
    B: { ...stand({ shin: 40, thigh: -80, torso: 24 }, 100), reach: { near: (j) => onTorso(j, 0, 15), bend: 1 } },
    load: (j) => onTorso(j, 1, 13),
    work: ['quads'],
  },
  // Goblet squat: one weight held at the chest.
  gobletSquat: {
    A: { ...stand({ torso: 1 }, 100), reach: { near: (j) => onTorso(j, -16, 19), bend: -1 } },
    B: { ...stand({ shin: 40, thigh: -80, torso: 26 }, 100), reach: { near: (j) => onTorso(j, -16, 19), bend: -1 } },
    load: (j) => onTorso(j, -14, 21),
    work: ['quads', 'glutes'],
  },
  // Dumbbell squat: a weight in each hand at the sides.
  dbSquat: {
    A: stand({ torso: 2, ...arms(181, 179) }, 102),
    B: stand({ shin: 36, thigh: -74, torso: 38, ...arms(176, 178) }, 102),
    work: ['quads', 'glutes'],
  },
  // Bodyweight squat: arms forward for balance at the bottom.
  airSquat: {
    A: stand({ torso: 2, ...arms(181, 179) }, 102),
    B: stand({ shin: 36, thigh: -76, torso: 36, ...arms(88, 90) }, 102),
    work: ['quads', 'glutes'],
  },
  // Thruster: front squat into a press overhead.
  thruster: {
    A: { ...stand({ shin: 38, thigh: -78, torso: 26 }, 100), reach: { near: (j) => onTorso(j, 0, 15), bend: 1 } },
    B: { ...stand({ torso: -2 }, 100), reach: { near: (j) => onTorso(j, 58, 4), bend: 1 } },
    load: (j) => j.wrist,
    work: ['quads', 'delts'],
    view: TALL,
  },
  // Bulgarian split squat: back foot on a bench, front knee bends.
  splitSquat: {
    A: { root: 'hip', at: [104, 98], a: { torso: 4, ...arms(181, 179), foot2: -112 }, plant: { near: [136, G], far: [62, 135], bend: -1 } },
    B: { root: 'hip', at: [100, 136], a: { torso: 12, ...arms(181, 179), foot2: -112 }, plant: { near: [136, G], far: [62, 135], bend: -1 } },
    scene: bench(26, 46, 141),
    work: ['quads', 'glutes'],
  },
  // Lunge (static or reverse): feet split, both knees bend, back knee towards the floor.
  lunge: {
    A: { root: 'hip', at: [108, 100], a: { torso: 2, ...arms(181, 179), foot2: 128 }, plant: { near: [136, G], far: [80, G - 11], bend: -1 } },
    B: { root: 'hip', at: [106, 138], a: { torso: 4, ...arms(181, 179), foot2: 128 }, plant: { near: [138, G], far: [70, G - 11], bend: -1 } },
    work: ['quads', 'glutes'],
  },
  // Step up onto a box, driving through the front foot.
  stepUp: {
    A: { root: 'hip', at: [98, 98], a: { torso: 8, ...arms(181, 179) }, plant: { near: [140, 146], far: [96, G], bend: -1 } },
    B: { root: 'hip', at: [134, 56], a: { torso: 0, ...arms(181, 179) }, plant: { near: [140, 146], far: [128, 146], bend: -1 } },
    scene: box(118, 146, 64),
    work: ['quads', 'glutes'],
    view: TALL,
  },
  // Leg press: seated reclined, feet on the sled, knees bend towards the chest.
  legPress: {
    A: { root: 'hip', at: [84, 146], a: { torso: -50, ...arms(140, 120) }, plant: { near: [172, 98], bend: -1 } },
    B: { root: 'hip', at: [84, 146], a: { torso: -50, ...arms(140, 120) }, plant: { near: [140, 116], bend: -1 } },
    scene: [rect(30, 152, 76, 9), rect(52, 161, 8, 23, 2), { k: 'path', d: 'M38 152 L18 118 L26 113 L48 150 Z', tone: 'kit' }],
    kit: (j) => [{ k: 'line', x1: j.toe[0] + 4, y1: j.toe[1] - 26, x2: j.toe[0] + 4 + 0, y2: j.toe[1] + 20, tone: 'gear', w: 7 }],
    work: ['quads', 'glutes'],
  },
  // Leg extension: seated, knee straightens.
  legExtension: {
    A: { root: 'hip', at: [100, 126], a: { torso: -8, thigh: -90, shin: 2, ...arms(178, 150) } },
    B: { root: 'hip', at: [100, 126], a: { torso: -8, thigh: -90, shin: -86, ...arms(178, 150) } },
    scene: [rect(66, 132, 62, 9), rect(94, 141, 7, 43, 2), rect(60, 72, 9, 62, 3)],
    kit: shinPad(1),
    work: ['quads'],
  },
  // Single leg extension: one knee straightens, the other leg stays bent.
  legExtensionSingle: {
    A: { root: 'hip', at: [100, 126], a: { torso: -8, thigh: -90, shin: 2, shin2: 2, ...arms(178, 150) } },
    B: { root: 'hip', at: [100, 126], a: { torso: -8, thigh: -90, shin: -86, shin2: 2, ...arms(178, 150) } },
    scene: [rect(66, 132, 62, 9), rect(94, 141, 7, 43, 2), rect(60, 72, 9, 62, 3)],
    kit: shinPad(1),
    work: ['quads'],
  },
  // Seated leg curl: legs out straight, heels pull down and back under the seat.
  legCurlSeated: {
    A: { root: 'hip', at: [100, 126], a: { torso: -12, thigh: -90, shin: -88, ...arms(170, 140) } },
    B: { root: 'hip', at: [100, 126], a: { torso: -12, thigh: -90, shin: -6, ...arms(170, 140) } },
    scene: [rect(66, 132, 62, 9), rect(94, 141, 7, 43, 2), rect(60, 70, 9, 64, 3)],
    kit: shinPad(-1),
    work: ['hamstrings'],
  },
  // Lying leg curl: face down on the bench, heels curl towards the glutes.
  legCurlLying: {
    A: { root: 'hip', at: [128, 128], a: { torso: -90, neck: -78, thigh: -90, shin: -90, foot: 180, ...arms(182, 100) } },
    B: { root: 'hip', at: [128, 128], a: { torso: -90, neck: -78, thigh: -90, shin: -205, foot: 65, ...arms(182, 100) } },
    scene: bench(76, 112, 140),
    kit: shinPad(1),
    work: ['hamstrings'],
  },
  // Calf raise: up onto the toes.
  calfRaise: {
    A: stand({ ...arms(181, 179) }, 110),
    B: { root: 'ankle', at: [110, G - 10], a: { shin: 0, thigh: 0, torso: 0, foot: 134, ...arms(181, 179) } },
    work: ['calves'],
  },
  // Seated calf raise: knees under a pad, heels lift.
  seatedCalf: {
    A: { root: 'ankle', at: [140, G], a: { shin: 0, thigh: -90, torso: 2, foot: 90, ...arms(170, 120) } },
    B: { root: 'ankle', at: [140, G - 10], a: { shin: 0, thigh: -90, torso: 2, foot: 132, ...arms(170, 120) } },
    scene: [rect(66, 146, 60, 9), rect(90, 155, 7, 29, 2)],
    kit: (j) => [rect(j.knee[0] - 12, j.knee[1] - 13, 26, 7, 3)],
    work: ['calves'],
  },
  // ---------------------------------------------------------------- Hips
  // Hip thrust: upper back on a bench, hips drive up to a straight line.
  hipThrust: {
    A: { root: 'shoulder', at: [76, 132], a: { torso: -60, neck: -66 }, reach: { near: (j) => onTorso(j, -58, 18), bend: 1 }, plant: { near: [172, G], bend: -1 } },
    B: { root: 'shoulder', at: [76, 132], a: { torso: -92, neck: -74 }, reach: { near: (j) => onTorso(j, -58, 18), bend: 1 }, plant: { near: [172, G], bend: -1 } },
    load: (j) => onTorso(j, -58, 14),
    scene: [rect(30, 138, 50, 46, 4)],
    work: ['glutes'],
  },
  // Glute bridge: lying on the floor, hips lift.
  gluteBridge: {
    A: { root: 'shoulder', at: [62, G - 9], a: { torso: -90, neck: -92, ...arms(90, 90) }, plant: { near: [150, G], bend: -1 } },
    B: { root: 'shoulder', at: [62, G - 9], a: { torso: -124, neck: -92, ...arms(90, 90) }, plant: { near: [150, G], bend: -1 } },
    work: ['glutes'],
  },
  // Conventional deadlift: bar over the mid-foot, close to the legs, back flat.
  deadlift: {
    A: { ...stand({ shin: 3, torso: 2 }, 104), reach: { near: [109, 132], bend: 1 } },
    B: { ...stand({ shin: 24, thigh: -52, torso: 62 }, 104), reach: { near: [115, 166], bend: 1 } },
    load: (j) => j.wrist,
    work: ['hamstrings', 'glutes', 'lowerBack'],
  },
  // Rack pull: a deadlift from just below the knee.
  rackPull: {
    A: { ...stand({ shin: 3, torso: 2 }, 104), reach: { near: [109, 132], bend: 1 } },
    B: { ...stand({ shin: 10, thigh: -26, torso: 42 }, 104), reach: { near: [113, 140], bend: 1 } },
    load: (j) => j.wrist,
    scene: [rect(88, 146, 7, 38, 2), rect(134, 146, 7, 38, 2)],
    work: ['back', 'glutes'],
  },
  // Romanian deadlift: soft knees, hips push back, weight slides down the thighs.
  rdl: {
    A: { ...stand({ shin: 4, torso: 2 }, 104), reach: { near: [110, 132], bend: 1 } },
    B: { ...stand({ shin: 10, thigh: -22, torso: 76 }, 104), reach: { near: [122, 158], bend: 1 } },
    load: (j) => j.wrist,
    work: ['hamstrings', 'glutes'],
  },
  // Single leg RDL: back leg lifts as the body tips forward.
  singleLegRdl: {
    A: { root: 'ankle', at: [116, G], a: { shin: 4, thigh: 0, torso: 2, thigh2: 4, shin2: 0, foot2: 96, ...arms(181, 179) } },
    B: { root: 'ankle', at: [116, G], a: { shin: 8, thigh: -14, torso: 82, thigh2: 82, shin2: 84, foot2: 178, ...arms(181, 179) } },
    work: ['hamstrings', 'glutes'],
  },
  // Good morning: bar on the back, hinge forward with a flat back.
  goodMorning: {
    A: { ...stand({ torso: 2 }, 104), reach: { near: (j) => onTorso(j, -2, -13), bend: -1 } },
    B: { ...stand({ shin: 8, thigh: -20, torso: 80 }, 104), reach: { near: (j) => onTorso(j, -2, -13), bend: -1 } },
    load: (j) => onTorso(j, 1, -9),
    work: ['hamstrings', 'lowerBack'],
  },
  // Kettlebell swing: hinge, then snap the hips so the bell floats to chest height.
  kbSwing: {
    A: { ...stand({ shin: 10, thigh: -34, torso: 66 }, 102), reach: { near: [92, 152], bend: 1 } },
    B: { ...stand({ torso: -4 }, 102), reach: { near: (j) => onTorso(j, -12, 60), bend: 1 } },
    load: (j) => j.wrist,
    work: ['glutes', 'hamstrings'],
  },
  // ---------------------------------------------------------------- Push
  // Bench press: lying on a flat bench, bar from the chest to straight arms.
  bench: {
    A: { root: 'hip', at: [138, 125], a: { torso: -90, neck: -94 }, reach: { rel: 'shoulder', near: [14, -9], bend: 1 }, plant: { near: [178, G], bend: -1 } },
    B: { root: 'hip', at: [138, 125], a: { torso: -90, neck: -94 }, reach: { rel: 'shoulder', near: [3, -62], bend: 1 }, plant: { near: [178, G], bend: -1 } },
    load: (j) => j.wrist,
    scene: bench(56, 104, 140),
    work: ['chest', 'triceps'],
  },
  // Incline press: back on a raised bench, press straight up over the upper chest.
  inclineBench: {
    A: { root: 'hip', at: [140, 140], a: { torso: -55, neck: -55 }, reach: { rel: 'shoulder', near: [12, -11], bend: 1 }, plant: { near: [186, G], bend: -1 } },
    B: { root: 'hip', at: [140, 140], a: { torso: -55, neck: -55 }, reach: { rel: 'shoulder', near: [3, -62], bend: 1 }, plant: { near: [186, G], bend: -1 } },
    load: (j) => j.wrist,
    scene: [{ k: 'line', x1: 135, y1: 153, x2: 76, y2: 112, tone: 'kit', w: 10 }, rect(120, 149, 44, 8), rect(138, 157, 7, 27, 2), rect(94, 128, 7, 56, 2)],
    work: ['chest', 'delts', 'triceps'],
  },
  // Push up: straight body from heels to head, chest lowers to the floor.
  pushUp: {
    A: { root: 'ankle', at: [34, G - 11], a: { foot: 140, shin: 68, thigh: 68, torso: 68, neck: 74 }, reach: { near: [172, G - 6], bend: 1 } },
    B: { root: 'ankle', at: [34, G - 11], a: { foot: 140, shin: 83, thigh: 83, torso: 83, neck: 86 }, reach: { near: [172, G - 6], bend: 1 } },
    work: ['chest', 'triceps'],
  },
  // Overhead press: from the front of the shoulders to locked out overhead.
  ohp: {
    A: { ...stand({ torso: -2 }, 104), reach: { near: (j) => onTorso(j, 0, 15), bend: 1 } },
    B: { ...stand({ torso: -1 }, 104), reach: { near: (j) => onTorso(j, 60, 3), bend: 1 } },
    load: (j) => j.wrist,
    work: ['delts', 'triceps'],
    view: TALL,
  },
  // Dips: on parallel bars, body lowers until the elbows are bent, then presses up.
  dips: {
    A: { root: 'wrist', at: [124, 92], a: { upper: 180, fore: 180, torso: 6, thigh: -8, shin: 62, foot: 168 } },
    B: { root: 'wrist', at: [124, 92], a: { upper: -110, fore: 160, torso: 24, thigh: 2, shin: 74, foot: 176 } },
    scene: [rect(92, 92, 66, 5, 2), rect(152, 92, 6, 92, 2)],
    work: ['triceps', 'chest'],
  },
  // Bench dip: hands on a bench behind, heels on the floor, body lowers.
  benchDip: {
    A: { root: 'wrist', at: [96, 137], a: { upper: 180, fore: 180, torso: 2, foot: 20 }, plant: { near: [182, G - 5], bend: -1 } },
    B: { root: 'wrist', at: [96, 137], a: { upper: -100, fore: 160, torso: 8, foot: 20 }, plant: { near: [182, G - 5], bend: -1 } },
    scene: bench(26, 74, 140),
    work: ['triceps'],
  },
  // ---------------------------------------------------------------- Pull
  // Pull up: hang under the bar, pull until the chin clears it.
  pullUp: {
    A: { root: 'wrist', at: [118, -60], a: { upper: -4, fore: -2, torso: 0, neck: 2, thigh: -6, shin: 24, foot: 160 } },
    B: { root: 'wrist', at: [118, -60], a: { upper: 120, fore: -28, torso: -8, neck: -14, thigh: -10, shin: 30, foot: 160 } },
    scene: [{ k: 'line', x1: 70, y1: -60, x2: 180, y2: -60, tone: 'kit', w: 5 }],
    work: ['back', 'biceps'],
    view: TALL,
  },
  // Hanging knee raise: hang from the bar, knees lift to hip height.
  hangingKneeRaise: {
    A: { root: 'wrist', at: [118, -60], a: { upper: -4, fore: -2, torso: 0, thigh: -4, shin: 6, foot: 160 } },
    B: { root: 'wrist', at: [118, -60], a: { upper: -4, fore: -2, torso: -6, thigh: -96, shin: 8, foot: 150 } },
    scene: [{ k: 'line', x1: 70, y1: -60, x2: 180, y2: -60, tone: 'kit', w: 5 }],
    work: ['abs'],
    view: TALL,
  },
  // Hanging leg raise: legs straight, lifted to hip height.
  hangingLegRaise: {
    A: { root: 'wrist', at: [118, -60], a: { upper: -4, fore: -2, torso: 0, thigh: -4, shin: -4, foot: 160 } },
    B: { root: 'wrist', at: [118, -60], a: { upper: -4, fore: -2, torso: -10, thigh: -92, shin: -90, foot: 40 } },
    scene: [{ k: 'line', x1: 70, y1: -60, x2: 180, y2: -60, tone: 'kit', w: 5 }],
    work: ['abs'],
    view: TALL,
  },
  // Lat pulldown: seated under the pad, bar from overhead to the top of the chest.
  latPulldown: {
    A: { root: 'hip', at: [104, 132], a: { torso: -6, thigh: -88, shin: 0 }, reach: { rel: 'shoulder', near: [8, -60], bend: 1 } },
    B: { root: 'hip', at: [104, 132], a: { torso: -14, thigh: -88, shin: 0 }, reach: { rel: 'shoulder', near: [12, 10], bend: 1 } },
    cableFrom: [116, -6],
    scene: [rect(78, 138, 50, 8), rect(98, 146, 7, 38, 2), rect(132, 112, 22, 7, 3)],
    work: ['back', 'biceps'],
    view: TALL,
  },
  // Seated cable row: arms long, then the handle pulls to the stomach, chest up.
  seatedRow: {
    A: { root: 'hip', at: [92, 146], a: { torso: 16 }, reach: { rel: 'shoulder', near: [58, 18], bend: 1 }, plant: { near: [168, 158], bend: -1 } },
    B: { root: 'hip', at: [92, 146], a: { torso: -6 }, reach: { rel: 'shoulder', near: [10, 34], bend: 1 }, plant: { near: [168, 158], bend: -1 } },
    cableFrom: [232, 150],
    scene: [rect(46, 152, 92, 9), rect(84, 161, 7, 23, 2), rect(176, 130, 7, 54, 2)],
    work: ['back', 'biceps'],
  },
  // Bent over row: hinged, bar from straight arms up to the lower chest.
  bentRow: {
    A: { ...stand({ shin: 14, thigh: -30, torso: 68 }, 100), reach: { near: (j) => [j.shoulder[0] + 4, j.shoulder[1] + 58], bend: 1 } },
    B: { ...stand({ shin: 14, thigh: -30, torso: 66 }, 100), reach: { near: (j) => onTorso(j, -20, 14), bend: 1 } },
    load: (j) => j.wrist,
    work: ['back', 'biceps'],
  },
  // Face pull: rope from in front at face height, hands pull back beside the ears.
  facePull: {
    A: { ...stand({ torso: -2 }, 96), reach: { rel: 'shoulder', near: [58, -8], bend: -1 } },
    B: { ...stand({ torso: -4 }, 96), reach: { rel: 'shoulder', near: [-2, -14], bend: -1 } },
    cableFrom: [234, 30],
    work: ['delts', 'back'],
  },
  // Straight arm pulldown: arms long, sweep from in front of the face down to the thighs.
  straightArmPulldown: {
    A: stand({ shin: 6, thigh: -14, torso: 22, ...arms(62, 62) }, 96),
    B: stand({ shin: 6, thigh: -14, torso: 22, ...arms(170, 170) }, 96),
    cableFrom: [222, 8],
    work: ['back'],
  },
  // Pullover: lying on a bench, straight arms from behind the head to over the chest.
  pullover: {
    A: { root: 'hip', at: [138, 125], a: { torso: -90, neck: -94, ...arms(-114, -110) }, plant: { near: [178, G], bend: -1 } },
    B: { root: 'hip', at: [138, 125], a: { torso: -90, neck: -94, ...arms(6, 10) }, plant: { near: [178, G], bend: -1 } },
    load: (j) => j.wrist,
    scene: bench(56, 104, 140),
    work: ['back', 'chest'],
  },
  // ---------------------------------------------------------------- Arms and shoulders
  // Curl: elbows stay by the sides, hands curl up to the shoulders.
  curl: {
    A: stand({ ...arms(182, 174) }, 106),
    B: stand({ ...arms(188, 26) }, 106),
    cableFrom: [150, 180],
    work: ['biceps'],
  },
  // Preacher curl: upper arm on the angled pad, forearm curls up.
  preacherCurl: {
    A: stand({ torso: 12, ...arms(140, 150) }, 100),
    B: stand({ torso: 12, ...arms(140, 18) }, 100),
    scene: [{ k: 'line', x1: 113, y1: 54, x2: 136, y2: 79, tone: 'kit', w: 9 }, rect(134, 80, 7, 104, 2)],
    work: ['biceps'],
  },
  // Pushdown: elbows pinned by the sides, hands push down until the arms are straight.
  pushdown: {
    A: stand({ shin: 4, thigh: -8, torso: 10, ...arms(174, 36) }, 102),
    B: stand({ shin: 4, thigh: -8, torso: 10, ...arms(176, 178) }, 102),
    cableFrom: [150, 2],
    bandFrom: () => [150, 2],
    work: ['triceps'],
  },
  // Overhead extension: elbows up by the head, hands lower behind it and press back up.
  overheadExtension: {
    A: stand({ ...arms(-8, -150) }, 106),
    B: stand({ ...arms(-4, -2) }, 106),
    cableFrom: [64, 178],
    load: (j) => j.wrist,
    work: ['triceps'],
    view: TALL,
  },
  // Skull crusher: lying on a bench, forearms lower towards the forehead and extend.
  skullCrusher: {
    A: { root: 'hip', at: [138, 125], a: { torso: -90, neck: -94, ...arms(-14, -118) }, plant: { near: [178, G], bend: -1 } },
    B: { root: 'hip', at: [138, 125], a: { torso: -90, neck: -94, ...arms(-12, -10) }, plant: { near: [178, G], bend: -1 } },
    load: (j) => j.wrist,
    scene: bench(56, 104, 140),
    work: ['triceps'],
  },
  // Kickback: hinged, upper arm along the body, forearm straightens back.
  kickback: {
    A: stand({ shin: 12, thigh: -28, torso: 68, ...arms(-104, 178) }, 112),
    B: stand({ shin: 12, thigh: -28, torso: 68, ...arms(-104, -102) }, 112),
    cableFrom: [200, 178],
    work: ['triceps'],
  },
  // Front raise: straight arms lift in front to shoulder height.
  frontRaise: {
    A: stand({ ...arms(176, 174) }, 104),
    B: stand({ ...arms(88, 86) }, 104),
    cableFrom: [92, 182],
    load: (j) => j.wrist,
    work: ['delts'],
  },
  // ---------------------------------------------------------------- Core
  // Plank: on the forearms, a straight line from heels to head.
  plank: {
    A: { root: 'ankle', at: [40, G - 11], a: { foot: 140, shin: 80, thigh: 80, torso: 80, neck: 84, ...arms(180, 90) } },
    B: { root: 'ankle', at: [40, G - 11], a: { foot: 140, shin: 79, thigh: 78, torso: 81, neck: 84, ...arms(180, 90) } },
    work: ['abs'],
  },
  // Crunch: on the back, knees bent, shoulders curl off the floor.
  crunch: {
    A: { root: 'hip', at: [112, G - 10], a: { torso: -90, neck: -94 }, reach: { near: (j) => onTorso(j, 12, 6), bend: -1 }, plant: { near: [156, G - 4], bend: -1 } },
    B: { root: 'hip', at: [112, G - 10], a: { torso: -58, neck: -40 }, reach: { near: (j) => onTorso(j, 12, 6), bend: -1 }, plant: { near: [156, G - 4], bend: -1 } },
    work: ['abs'],
  },
  // Sit up: from lying all the way up to sitting.
  sitUp: {
    A: { root: 'hip', at: [112, G - 10], a: { torso: -90, neck: -94 }, reach: { near: (j) => onTorso(j, -12, 12), bend: 1 }, plant: { near: [156, G - 4], bend: -1 } },
    B: { root: 'hip', at: [112, G - 10], a: { torso: -6, neck: 4 }, reach: { near: (j) => onTorso(j, -12, 12), bend: 1 }, plant: { near: [156, G - 4], bend: -1 } },
    work: ['abs'],
  },
  // Lying leg raise: on the back, straight legs lift to vertical.
  legRaise: {
    A: { root: 'hip', at: [104, G - 10], a: { torso: -90, neck: -94, ...arms(92, 92), thigh: -90, shin: -90, foot: 0 } },
    B: { root: 'hip', at: [104, G - 10], a: { torso: -90, neck: -94, ...arms(92, 92), thigh: 176, shin: 176, foot: -86 } },
    work: ['abs'],
  },
  // Mountain climber: high plank, one knee drives up under the chest.
  mountainClimber: {
    A: { root: 'ankle2', at: [44, G - 11], a: { foot2: 140, shin2: 68, thigh2: 68, torso: 68, neck: 74, foot: 140, shin: 68, thigh: 68 }, reach: { near: [182, G - 6], bend: 1 } },
    B: { root: 'ankle2', at: [44, G - 11], a: { foot2: 140, shin2: 68, thigh2: 68, torso: 68, neck: 74, foot: 150, shin: 22, thigh: -58 }, reach: { near: [182, G - 6], bend: 1 } },
    work: ['abs'],
  },
  // Back extension: hips on the angled pad, the body lowers forward and lifts back in line.
  backExtension: {
    A: { root: 'hip', at: [128, 104], a: { thigh: 45, shin: 45, foot: 135, torso: 150, neck: 150 }, reach: { near: (j) => onTorso(j, -12, 12), bend: 1 } },
    B: { root: 'hip', at: [128, 104], a: { thigh: 45, shin: 45, foot: 135, torso: 46, neck: 40 }, reach: { near: (j) => onTorso(j, -12, 12), bend: 1 } },
    scene: [{ k: 'line', x1: 140, y1: 108, x2: 108, y2: 140, tone: 'kit', w: 10 }, rect(116, 132, 7, 52, 2), rect(70, 168, 20, 16, 3)],
    work: ['lowerBack', 'glutes'],
  },
}

export { bar }

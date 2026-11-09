// Movement patterns: two poses each (start and end), the kit drawn with them, and which
// exercises use them (matchPattern). Our own drawings. The figure faces right; the floor
// is at y 184 in a 240 x 200 box.
import { gear, GROUND } from './draw'

const G = GROUND
const TALL = '0 -40 240 240'
const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
const stand = (x = 112, a = {}) => ({ root: 'ankle', at: [x, G], a: { shin: 0, thigh: 0, torso: 0, ...a } })
const withHands = (p, reach) => ({ ...p, reach })

// Bar on the upper back: halfway between the shoulder and the hands.
const backBar = (j) => gear.plate(mid(j.shoulder, j.wrist))
const handBar = (j) => gear.plate(j.wrist)
const handDb = (j) => [...gear.dumbbell(j.wrist2), ...gear.dumbbell(j.wrist)]

export const PATTERNS = {
  squat: {
    A: withHands(stand(104, { torso: 4 }), { rel: 'shoulder', near: [-5, 1], bend: -1 }),
    B: withHands(stand(104, { shin: 36, thigh: -76, torso: 40 }), { rel: 'shoulder', near: [-5, 1], bend: -1 }),
    kit: backBar,
  },
  frontSquat: {
    A: withHands(stand(104, { torso: 2 }), { rel: 'shoulder', near: [10, 2], bend: 1 }),
    B: withHands(stand(104, { shin: 34, thigh: -78, torso: 22 }), { rel: 'shoulder', near: [10, 2], bend: 1 }),
    kit: handBar,
  },
  gobletSquat: {
    A: withHands(stand(104, { torso: 2 }), { rel: 'shoulder', near: [14, 18], bend: 1 }),
    B: withHands(stand(104, { shin: 34, thigh: -78, torso: 26 }), { rel: 'shoulder', near: [14, 18], bend: 1 }),
    kit: (j) => gear.dumbbell(j.wrist),
  },
  airSquat: {
    A: { ...stand(104, { torso: 2, upper: 180, fore: 180 }) },
    B: { ...stand(104, { shin: 36, thigh: -78, torso: 32, upper: 90, fore: 90 }) },
  },
  deadlift: {
    A: withHands(stand(100), { near: [110, 132], bend: 1 }),
    B: withHands(stand(100, { shin: 20, thigh: -58, torso: 58 }), { near: [118, 166], bend: 1 }),
    kit: handBar,
  },
  rdl: {
    A: withHands(stand(100, { shin: 4 }), { near: [108, 134], bend: 1 }),
    B: withHands(stand(100, { shin: 10, thigh: -24, torso: 78 }), { near: [122, 160], bend: 1 }),
    kit: handBar,
  },
  goodMorning: {
    A: withHands(stand(104, { torso: 2 }), { rel: 'shoulder', near: [-5, 1], bend: -1 }),
    B: withHands(stand(104, { shin: 8, thigh: -22, torso: 80 }), { rel: 'shoulder', near: [-5, 1], bend: -1 }),
    kit: backBar,
  },
  swing: {
    A: withHands(stand(100, { shin: 10, thigh: -30, torso: 62 }), { near: [96, 150], bend: 1 }),
    B: withHands(stand(100, { torso: -4 }), { rel: 'shoulder', near: [56, 4], bend: 1 }),
    kit: (j) => gear.kettlebell(j.wrist),
  },
  row: {
    A: withHands(stand(100, { shin: 10, thigh: -26, torso: 72 }), { near: [134, 150], bend: 1 }),
    B: withHands(stand(100, { shin: 10, thigh: -26, torso: 72 }), { rel: 'shoulder', near: [-14, 30], bend: -1 }),
    kit: handBar,
  },
  dbRow: {
    A: withHands(stand(100, { shin: 10, thigh: -26, torso: 74 }), { near: [134, 152], bend: 1 }),
    B: withHands(stand(100, { shin: 10, thigh: -26, torso: 74 }), { rel: 'shoulder', near: [-14, 30], bend: -1 }),
    kit: (j) => gear.dumbbell(j.wrist),
  },
  ohp: {
    A: withHands(stand(112), { rel: 'shoulder', near: [12, 2], bend: 1 }),
    B: withHands(stand(112), { rel: 'shoulder', near: [2, -56], bend: 1 }),
    kit: handBar,
    view: TALL,
  },
  dbPress: {
    A: withHands(stand(112), { rel: 'shoulder', near: [2, -4], bend: 1 }),
    B: withHands(stand(112), { rel: 'shoulder', near: [2, -56], bend: 1 }),
    kit: handDb,
    view: TALL,
  },
  bench: {
    A: { root: 'hip', at: [150, 132], a: { torso: -90, neck: -88 }, reach: { rel: 'shoulder', near: [6, -8], bend: -1 }, plant: { near: [176, G], bend: -1 } },
    B: { root: 'hip', at: [150, 132], a: { torso: -90, neck: -88 }, reach: { rel: 'shoulder', near: [2, -56], bend: -1 }, plant: { near: [176, G], bend: -1 } },
    kit: handBar,
    scene: [...gear.rect(70, 140, 100, 8), ...gear.rect(84, 148, 6, 36, 2), ...gear.rect(150, 148, 6, 36, 2)],
  },
  dbBench: {
    A: { root: 'hip', at: [150, 132], a: { torso: -90, neck: -88 }, reach: { rel: 'shoulder', near: [2, -6], bend: -1 }, plant: { near: [176, G], bend: -1 } },
    B: { root: 'hip', at: [150, 132], a: { torso: -90, neck: -88 }, reach: { rel: 'shoulder', near: [2, -56], bend: -1 }, plant: { near: [176, G], bend: -1 } },
    kit: handDb,
    scene: [...gear.rect(70, 140, 100, 8), ...gear.rect(84, 148, 6, 36, 2), ...gear.rect(150, 148, 6, 36, 2)],
  },
  pushUp: {
    A: { root: 'ankle', at: [44, G - 4], a: { shin: 76, thigh: 76, torso: 76, neck: 80, foot: 170 }, reach: { near: [152, G], bend: -1 } },
    B: { root: 'ankle', at: [44, G - 4], a: { shin: 84, thigh: 84, torso: 84, neck: 86, foot: 170 }, reach: { near: [152, G], bend: -1 } },
  },
  pullUp: {
    A: { root: 'hip', at: [116, 78], a: { torso: 4, thigh: -8, shin: 50 }, reach: { near: [124, -32], bend: 1 } },
    B: { root: 'hip', at: [112, 34], a: { torso: 10, thigh: -16, shin: 56 }, reach: { near: [124, -32], bend: 1 } },
    scene: gear.bar(64, 184, -34),
    view: TALL,
  },
  pulldown: {
    A: { root: 'hip', at: [112, 138], a: { torso: -6 }, reach: { near: [126, 40], bend: 1 }, plant: { near: [152, G], bend: 1 } },
    B: { root: 'hip', at: [112, 138], a: { torso: -12 }, reach: { rel: 'shoulder', near: [14, -2], bend: 1 }, plant: { near: [152, G], bend: 1 } },
    kit: (j) => [...gear.cable(j.wrist, [128, -24]), ...gear.bar(j.wrist[0] - 22, j.wrist[0] + 22, j.wrist[1])],
    view: TALL,
    scene: [...gear.rect(84, 140, 46, 8), ...gear.rect(104, 148, 6, 36, 2)],
  },
  seatedRow: {
    A: { root: 'hip', at: [92, 156], a: { torso: 14 }, reach: { near: [158, 132], bend: -1 }, plant: { near: [166, 166], bend: 1 } },
    B: { root: 'hip', at: [92, 156], a: { torso: -6 }, reach: { rel: 'shoulder', near: [8, 34], bend: -1 }, plant: { near: [166, 166], bend: 1 } },
    kit: (j) => gear.cable(j.wrist, [196, 150]),
    scene: [...gear.rect(60, 162, 70, 8), ...gear.rect(168, 150, 8, 34, 2)],
  },
  curl: {
    A: withHands(stand(112), { rel: 'shoulder', near: [4, 56], bend: -1 }),
    B: withHands(stand(112), { rel: 'shoulder', near: [16, 10], bend: -1 }),
    kit: handDb,
  },
  barCurl: {
    A: withHands(stand(112), { rel: 'shoulder', near: [6, 56], bend: -1 }),
    B: withHands(stand(112), { rel: 'shoulder', near: [16, 10], bend: -1 }),
    kit: handBar,
  },
  pushdown: {
    A: withHands(stand(104, { torso: 8 }), { rel: 'shoulder', near: [24, 18], bend: -1 }),
    B: withHands(stand(104, { torso: 8 }), { rel: 'shoulder', near: [14, 54], bend: -1 }),
    kit: (j) => gear.cable(j.wrist, [150, 14]),
  },
  overheadExt: {
    A: withHands(stand(112), { rel: 'shoulder', near: [-18, -16], bend: 1 }),
    B: withHands(stand(112), { rel: 'shoulder', near: [2, -56], bend: 1 }),
    kit: (j) => gear.dumbbell(j.wrist),
    view: TALL,
  },
  skullCrusher: {
    A: { root: 'hip', at: [150, 132], a: { torso: -90, neck: -88 }, reach: { rel: 'shoulder', near: [-14, -36], bend: 1 }, plant: { near: [176, G], bend: -1 } },
    B: { root: 'hip', at: [150, 132], a: { torso: -90, neck: -88 }, reach: { rel: 'shoulder', near: [2, -56], bend: 1 }, plant: { near: [176, G], bend: -1 } },
    kit: handBar,
    scene: [...gear.rect(70, 140, 100, 8), ...gear.rect(84, 148, 6, 36, 2), ...gear.rect(150, 148, 6, 36, 2)],
  },
  raise: {
    A: withHands(stand(112), { rel: 'shoulder', near: [6, 56], bend: 1 }),
    B: withHands(stand(112), { rel: 'shoulder', near: [54, -2], bend: 1 }),
    kit: handDb,
  },
  lunge: {
    A: { root: 'hip', at: [112, 94], a: { torso: 0, upper: 180, fore: 180 }, plant: { near: [126, G], far: [98, G], bend: 1 } },
    B: { root: 'hip', at: [112, 136], a: { torso: 4, upper: 180, fore: 180 }, plant: { near: [142, G], far: [74, G], bend: 1 } },
  },
  splitSquat: {
    A: { root: 'hip', at: [108, 104], a: { torso: 2, upper: 180, fore: 180 }, plant: { near: [142, G], far: [62, 146], bend: 1 } },
    B: { root: 'hip', at: [104, 138], a: { torso: 8, upper: 180, fore: 180 }, plant: { near: [142, G], far: [62, 146], bend: 1 } },
    scene: gear.rect(40, 146, 40, 10),
  },
  stepUp: {
    A: { root: 'hip', at: [100, 100], a: { torso: 6 }, plant: { near: [138, 148], far: [96, G], bend: 1 } },
    B: { root: 'hip', at: [134, 60], a: { torso: 0 }, plant: { near: [138, 148], far: [130, 148], bend: 1 } },
    scene: gear.rect(116, 148, 60, 36),
    view: TALL,
  },
  hipThrust: {
    A: { root: 'shoulder', at: [80, 132], a: { torso: -62, neck: -70 }, reach: { rel: 'hip', near: [0, -14], bend: -1 }, plant: { near: [176, G], bend: 1 } },
    B: { root: 'shoulder', at: [80, 132], a: { torso: -92, neck: -76 }, reach: { rel: 'hip', near: [0, -14], bend: -1 }, plant: { near: [176, G], bend: 1 } },
    kit: (j) => gear.plate([j.hip[0], j.hip[1] - 14], 14),
    scene: gear.rect(38, 138, 46, 46),
  },
  bridge: {
    A: { root: 'shoulder', at: [66, G - 8], a: { torso: -90, neck: -90, upper: 90, fore: 90 }, plant: { near: [168, G], bend: 1 } },
    B: { root: 'shoulder', at: [66, G - 8], a: { torso: -114, neck: -90, upper: 90, fore: 90 }, plant: { near: [168, G], bend: 1 } },
  },
  plank: {
    A: { root: 'ankle', at: [40, G - 4], a: { shin: 80, thigh: 80, torso: 80, neck: 84, foot: 170 }, reach: { near: [148, G], far: [148, G], bend: -1 } },
    B: { root: 'ankle', at: [40, G - 4], a: { shin: 81, thigh: 81, torso: 81, neck: 84, foot: 170 }, reach: { near: [148, G], far: [148, G], bend: -1 } },
    period: 4000,
  },
  crunch: {
    A: { root: 'hip', at: [130, G - 8], a: { torso: -90, neck: -88, upper: 60, fore: 80 }, plant: { near: [172, G], bend: -1 } },
    B: { root: 'hip', at: [130, G - 8], a: { torso: -50, neck: -40, upper: 80, fore: 90 }, plant: { near: [172, G], bend: -1 } },
  },
  legRaise: {
    A: { root: 'shoulder', at: [110, 46], a: { torso: 0, neck: 0, thigh: 0, shin: 0, upper: 0, fore: 0 } },
    B: { root: 'shoulder', at: [110, 46], a: { torso: -4, neck: 0, thigh: -88, shin: -88, upper: 0, fore: 0 } },
    scene: gear.bar(70, 170, -12),
    view: TALL,
  },
  calfRaise: {
    view: TALL,
    A: stand(112, { foot: 90 }),
    B: { root: 'ankle', at: [112, G - 11], a: { shin: 0, thigh: 0, torso: 0, foot: 132 } },
  },
  legPress: {
    A: { root: 'hip', at: [86, 144], a: { torso: -48, upper: 150, fore: 150 }, plant: { near: [168, 92], bend: -1 } },
    B: { root: 'hip', at: [86, 144], a: { torso: -48, upper: 150, fore: 150 }, plant: { near: [138, 118], bend: -1 } },
    scene: [...gear.rect(40, 150, 70, 8), ...gear.rect(60, 158, 8, 26, 2)],
    kit: (j) => gear.rect(j.ankle[0] + 2, j.ankle[1] - 24, 9, 44, 3),
  },
  legExtension: {
    A: { root: 'hip', at: [100, 128], a: { torso: -6, thigh: -90, shin: 0, upper: 180, fore: 180 } },
    B: { root: 'hip', at: [100, 128], a: { torso: -6, thigh: -90, shin: -90, upper: 180, fore: 180 } },
    scene: [...gear.rect(70, 134, 60, 8), ...gear.rect(96, 142, 6, 42, 2)],
  },
  legCurl: {
    A: { root: 'hip', at: [100, 128], a: { torso: -6, thigh: -90, shin: -90, upper: 180, fore: 180 } },
    B: { root: 'hip', at: [100, 128], a: { torso: -6, thigh: -90, shin: 0, upper: 180, fore: 180 } },
    scene: [...gear.rect(70, 134, 60, 8), ...gear.rect(96, 142, 6, 42, 2)],
  },
  dip: {
    A: { root: 'hip', at: [116, 96], a: { torso: 4, thigh: 14, shin: 110 }, reach: { near: [122, 96], bend: -1 } },
    B: { root: 'hip', at: [108, 124], a: { torso: 26, thigh: 20, shin: 116 }, reach: { near: [122, 96], bend: -1 } },
    scene: [...gear.bar(100, 154, 100), ...gear.rect(148, 100, 6, 84, 2)],
  },
  jump: {
    view: TALL,
    A: stand(112, { shin: 30, thigh: -60, torso: 36, upper: 220, fore: 220 }),
    B: { root: 'ankle', at: [112, G - 26], a: { shin: 0, thigh: 0, torso: 0, foot: 150, upper: 10, fore: 10 } },
    period: 1600,
  },
  carry: {
    A: { root: 'hip', at: [112, 98], a: { torso: 0 }, reach: { rel: 'shoulder', near: [4, 56], far: [2, 56], bend: -1 }, plant: { near: [132, G], far: [92, G], bend: 1 } },
    B: { root: 'hip', at: [112, 98], a: { torso: 0 }, reach: { rel: 'shoulder', near: [2, 56], far: [4, 56], bend: -1 }, plant: { near: [92, G], far: [132, G], bend: 1 } },
    kit: handDb,
    period: 1400,
  },
  walk: {
    A: { root: 'hip', at: [112, 98], a: { torso: 4, upper: 160, fore: 140, upper2: 200, fore2: 180 }, plant: { near: [132, G], far: [92, G], bend: 1 } },
    B: { root: 'hip', at: [112, 98], a: { torso: 4, upper: 200, fore: 180, upper2: 160, fore2: 140 }, plant: { near: [92, G], far: [132, G], bend: 1 } },
    period: 1200,
  },
  mountainClimber: {
    A: { root: 'hip', at: [92, 140], a: { torso: 72 }, reach: { near: [150, G], far: [150, G], bend: -1 }, plant: { near: [36, G], far: [36, G], bend: -1 } },
    B: { root: 'hip', at: [92, 140], a: { torso: 72 }, reach: { near: [150, G], far: [150, G], bend: -1 }, plant: { near: [118, G - 6], far: [36, G], bend: -1 } },
    period: 1000,
  },
  facePull: {
    A: withHands(stand(104, { torso: -4 }), { rel: 'shoulder', near: [56, 4], bend: -1 }),
    B: withHands(stand(104, { torso: -4 }), { rel: 'shoulder', near: [16, -14], bend: -1 }),
    kit: (j) => gear.cable(j.wrist, [226, 30]),
  },
  kickback: {
    A: withHands(stand(100, { shin: 10, thigh: -26, torso: 74 }), { rel: 'shoulder', near: [-28, 26], bend: 1 }),
    B: withHands(stand(100, { shin: 10, thigh: -26, torso: 74 }), { rel: 'shoulder', near: [-56, 14], bend: 1 }),
    kit: (j) => gear.dumbbell(j.wrist),
  },
  uprightRow: {
    A: withHands(stand(112), { rel: 'shoulder', near: [8, 56], bend: -1 }),
    B: withHands(stand(112), { rel: 'shoulder', near: [10, 4], bend: -1 }),
    kit: handBar,
  },
  wallSit: {
    A: { root: 'hip', at: [70, 132], a: { torso: 0, thigh: -90, shin: 0, upper: 180, fore: 180 } },
    B: { root: 'hip', at: [70, 133], a: { torso: 0, thigh: -90, shin: 0, upper: 180, fore: 180 } },
    scene: gear.rect(46, 10, 10, 174, 2),
    period: 4000,
  },
}

// Exercise name to pattern. Checked in order; the first match wins.
const RULES = [
  // Moves our drawings would show wrongly: better nothing than a wrong picture.
  [/jumping jack|inverted row|seal row|nordic|handstand|leg raise \(lying\)|lying leg raise|rowing machine|row machine|ski erg/, null],
  [/upright row/, 'uprightRow'],
  [/face pull/, 'facePull'],
  [/kickback \(dumbbell\)|tricep kickback|dumbbell kickback/, 'kickback'],
  [/farmer|suitcase carry|trap bar carry|sandbag carry/, 'carry'],
  [/treadmill|\bwalk\b/, 'walk'],
  [/mountain climber/, 'mountainClimber'],
  [/wall sit/, 'wallSit'],
  [/calf/, 'calfRaise'],
  [/leg press|hack squat \(machine\)/, 'legPress'],
  [/front squat|front rack|zercher/, 'frontSquat'],
  [/goblet|dumbbell squat|db squat|thruster/, 'gobletSquat'],
  [/split squat|bulgarian/, 'splitSquat'],
  [/bodyweight squat|air squat|squat jump|jump squat/, 'airSquat'],
  [/squat/, 'squat'],
  [/romanian|rdl|stiff leg|pull through/, 'rdl'],
  [/good morning/, 'goodMorning'],
  [/swing/, 'swing'],
  [/deadlift|rack pull|clean/, 'deadlift'],
  [/hip thrust/, 'hipThrust'],
  [/glute bridge|frog pump|bridge/, 'bridge'],
  [/step up|step down/, 'stepUp'],
  [/lunge/, 'lunge'],
  [/leg extension/, 'legExtension'],
  [/leg curl|hamstring curl/, 'legCurl'],
  [/plank/, 'plank'],
  [/skull|lying tricep/, 'skullCrusher'],
  [/pushdown|push down|pressdown/, 'pushdown'],
  [/overhead tricep|tricep extension|french press/, 'overheadExt'],
  [/dip/, 'dip'],
  [/curl/, (n) => (/barbell|ez bar|ez-bar/.test(n) ? 'barCurl' : 'curl')],
  [/lateral raise|front raise|y raise|rear delt|reverse fly/, 'raise'],
  [/push ?up|push-up|press up/, 'pushUp'],
  [/dumbbell (bench|press)|incline dumbbell press|db bench/, 'dbBench'],
  [/bench|floor press|chest press|close grip (bench|press)/, 'bench'],
  [/arnold|dumbbell shoulder|db shoulder/, 'dbPress'],
  [/overhead press|shoulder press|military|push press|ohp/, 'ohp'],
  [/pull ?up|chin ?up/, 'pullUp'],
  [/pulldown|pull down/, 'pulldown'],
  [/seated cable row|machine row|cable row|seated row/, 'seatedRow'],
  [/dumbbell row|single arm row|renegade|chest supported dumbbell/, 'dbRow'],
  [/\brow\b/, 'row'],
  [/hanging (knee|leg) raise|knee raise|toes to bar/, 'legRaise'],
  [/crunch|sit ?up/, 'crunch'],
  [/box jump|broad jump|burpee|jump/, 'jump'],
]

export function matchPattern(name) {
  const n = String(name || '').toLowerCase()
  for (const [re, p] of RULES) if (re.test(n)) return typeof p === 'function' ? p(n) : p ?? null
  return null
}

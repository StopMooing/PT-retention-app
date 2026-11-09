// Equipment, taken from the exercise (not guessed from the movement): a barbell plate where
// the bar sits, dumbbells or a kettlebell in the hands, a band from the feet, a cable from
// its pulley. Returns shapes to draw behind the figure and in front of it.
const f = (n) => Math.round(n * 10) / 10

function plate(p, r = 17) {
  return [
    { k: 'circle', cx: f(p[0]), cy: f(p[1]), r, tone: 'gear' },
    { k: 'circle', cx: f(p[0]), cy: f(p[1]), r: r * 0.62, tone: 'gearIn' },
    { k: 'circle', cx: f(p[0]), cy: f(p[1]), r: r * 0.24, tone: 'gear' },
  ]
}
function dumbbell(p) {
  return [
    { k: 'circle', cx: f(p[0]), cy: f(p[1]), r: 8.5, tone: 'gear' },
    { k: 'circle', cx: f(p[0]), cy: f(p[1]), r: 3.6, tone: 'gearIn' },
  ]
}
// Bell hangs from the handle along the forearm, so at the top of a swing it points out.
function kettlebell(p, dir = [0, 1]) {
  const n = [-dir[1], dir[0]]
  const at = (a, b) => `${f(p[0] + dir[0] * a + n[0] * b)} ${f(p[1] + dir[1] * a + n[1] * b)}`
  return [
    { k: 'path', d: `M${at(6, -6)}Q${at(-3, -6)} ${at(-3, 0)}Q${at(-3, 6)} ${at(6, 6)}`, tone: 'none', stroke: 'gear', w: 3.5 },
    { k: 'circle', cx: f(p[0] + dir[0] * 14), cy: f(p[1] + dir[1] * 14), r: 11, tone: 'gear' },
  ]
}
const line = (a, b, tone, w) => ({ k: 'line', x1: f(a[0]), y1: f(a[1]), x2: f(b[0]), y2: f(b[1]), tone, w })

export function kitFor(kind, p, j) {
  const behind = [], front = []
  const hold = p.load ? p.load(j) : j.wrist
  if (kind === 'barbell' || kind === 'smith') {
    front.push(...plate(hold, p.plateR ?? 17))
  } else if (kind === 'dumbbell') {
    if (p.oneHand) front.push(...dumbbell(hold))
    else { behind.push(...dumbbell(p.load2 ? p.load2(j) : j.wrist2)); front.push(...dumbbell(hold)) }
  } else if (kind === 'goblet') {
    front.push(...dumbbell(hold))
  } else if (kind === 'kettlebell') {
    const d = [hold[0] - j.elbow[0], hold[1] - j.elbow[1]], l = Math.hypot(d[0], d[1]) || 1
    front.push(...kettlebell(hold, [d[0] / l, d[1] / l]))
  } else if (kind === 'band') {
    const from = p.bandFrom ? p.bandFrom(j) : [j.toe[0] - 6, j.toe[1]]
    front.push(line(from, j.wrist, 'band', 3.2))
  } else if (kind === 'cable') {
    const from = p.cableFrom ?? [230, 20]
    behind.push(line(from, j.wrist, 'cable', 2), { k: 'circle', cx: from[0], cy: from[1], r: 5, tone: 'gear' })
  }
  if (p.kit) front.push(...p.kit(j))
  return { behind, front }
}

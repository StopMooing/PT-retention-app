// Draws the figure as a person, side on: muscle-shaped limbs (quads and hamstrings, calves,
// biceps and triceps, forearms), a torso with chest, back and glutes, a head with a jaw,
// shoes, and a soft floor shadow. Far-side limbs are a lighter tone so the figure reads in
// depth, and every part has a thin outline in the background colour so overlaps stay
// clear. The working muscles are tinted. Output is plain shapes so the app and the
// checking tool draw exactly the same thing.

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const mul = (a, k) => [a[0] * k, a[1] * k]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1]
const len = (a) => Math.hypot(a[0], a[1]) || 1
const unit = (a) => mul(a, 1 / len(a))
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const perp = (u) => [-u[1], u[0]]
const f = (n) => Math.round(n * 10) / 10
const pt = (p) => `${f(p[0])} ${f(p[1])}`

// A smooth closed shape through points (midpoint quadratic curves).
function blob(points, tone, extra = {}) {
  const n = points.length
  const mid = (i) => lerp(points[i % n], points[(i + 1) % n], 0.5)
  let d = `M${pt(mid(0))}`
  for (let i = 1; i <= n; i++) d += `Q${pt(points[i % n])} ${pt(mid(i))}`
  return { k: 'path', d: d + 'Z', tone, outline: true, ...extra }
}

// Width at t along a profile [[t, w], ...].
function at(profile, t) {
  if (t <= profile[0][0]) return profile[0][1]
  for (let i = 1; i < profile.length; i++) {
    if (t <= profile[i][0]) {
      const [a, wa] = profile[i - 1], [b, wb] = profile[i]
      return wa + (wb - wa) * ((t - a) / (b - a))
    }
  }
  return profile[profile.length - 1][1]
}

// A shaped segment from a to b: one profile on the `side` of the bone (+1 or -1 across its
// normal), the other profile opposite. Round ends.
function segment(a, b, sideProfile, otherProfile, side, tone) {
  const L = len(sub(b, a))
  const u = unit(sub(b, a))
  const n = mul(perp(u), side)
  const ts = [0, 0.12, 0.25, 0.4, 0.55, 0.7, 0.85, 1]
  const along = (t) => add(a, mul(u, t * L))
  const one = ts.map((t) => add(along(t), mul(n, at(sideProfile, t))))
  const two = [...ts].reverse().map((t) => add(along(t), mul(n, -at(otherProfile, t))))
  const capB = add(along(1), mul(u, Math.min(at(sideProfile, 1), at(otherProfile, 1)) * 0.9))
  const capA = add(along(0), mul(u, -Math.min(at(sideProfile, 0), at(otherProfile, 0)) * 0.9))
  return blob([capA, ...one, capB, ...two], tone)
}

// Profiles, half-widths in px at points along each bone (0 is the joint nearer the body).
const P = {
  quad: [[0, 10.5], [0.3, 11.5], [0.6, 10], [0.85, 7.5], [1, 6.5]],
  ham: [[0, 10], [0.25, 9.5], [0.6, 8.5], [0.9, 6.2], [1, 6]],
  calf: [[0, 6], [0.18, 8.6], [0.38, 8], [0.7, 4.6], [1, 3.8]],
  shinFront: [[0, 6], [0.3, 4.8], [0.8, 3.8], [1, 3.8]],
  biceps: [[0, 6.5], [0.45, 6.8], [0.85, 4.4], [1, 4.1]],
  triceps: [[0, 7], [0.35, 6.8], [0.8, 4.8], [1, 4.3]],
  flexor: [[0, 4.6], [0.25, 5.6], [0.7, 3.8], [1, 3.1]],
  extensor: [[0, 4.3], [0.3, 4.6], [0.8, 3.4], [1, 3.1]],
}

// The side of a bone that a folding joint closes towards, or `fallback` when straight.
function foldSide(a, b, c, fallback) {
  const u = unit(sub(b, a))
  const s = dot(perp(u), sub(c, b))
  return Math.abs(s) < 2 ? fallback : Math.sign(s)
}
// Which side of a bone faces the body's front (chest side).
function frontSide(a, b, front) {
  return dot(perp(unit(sub(b, a))), front) >= 0 ? 1 : -1
}

function legShapes(j, hip, knee, ankle, toe, front, tone, tint) {
  // Hamstrings face the way the shin folds; calves face the hip side of the shin.
  const hamSide = foldSide(hip, knee, ankle, -frontSide(hip, knee, front))
  const calfSide = foldSide(ankle, knee, hip, -frontSide(knee, ankle, front)) * -1
  const thighTone = tint.has('quads') || tint.has('hamstrings') || tint.has('glutes') ? 'muscle' : tone
  return [
    segment(knee, ankle, P.calf, P.shinFront, calfSide, tint.has('calves') ? 'muscle' : tone),
    shoe(ankle, toe, tone),
    segment(hip, knee, P.ham, P.quad, hamSide, thighTone),
  ]
}

function armShapes(shoulder, elbow, wrist, front, tone, tint) {
  const bicSide = foldSide(shoulder, elbow, wrist, frontSide(shoulder, elbow, front))
  const flexSide = -foldSide(wrist, elbow, shoulder, -frontSide(elbow, wrist, front))
  const upperTone = tint.has('biceps') || tint.has('triceps') ? 'muscle' : tone
  return [
    segment(elbow, wrist, P.flexor, P.extensor, flexSide, tint.has('forearms') ? 'muscle' : tone),
    { k: 'circle', cx: f(wrist[0] + (wrist[0] - elbow[0]) * 0.12), cy: f(wrist[1] + (wrist[1] - elbow[1]) * 0.12), r: 5, tone, outline: true },
    segment(shoulder, elbow, P.biceps, P.triceps, bicSide, upperTone),
    // Shoulder cap (deltoid), small, over the top of the arm.
    blob(ring(lerp(shoulder, elbow, 0.1), 8.8, unit(sub(elbow, shoulder)), 1.3), tint.has('delts') ? 'muscle' : tone, { outline: false }),
  ]
}

// Points round an ellipse centred at c, long along u.
function ring(c, r, u, stretch = 1) {
  const n = perp(u)
  return Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2
    return add(c, add(mul(u, Math.cos(a) * r * stretch), mul(n, Math.sin(a) * r)))
  })
}

// A trainer: heel behind the ankle, a flat sole, a rounded toe.
function shoe(ankle, toe, tone) {
  const u = unit(sub(toe, ankle))
  const down = perp(u)
  const side = down[1] >= 0 ? 1 : -1 // the sole faces the floor
  const s = (k) => mul(down, side * k)
  const heel = add(ankle, mul(u, -5.5))
  return blob([
    add(heel, s(-3.5)), add(ankle, s(-5)), add(lerp(ankle, toe, 0.55), s(-4.2)), add(toe, add(mul(u, 3), s(-1.5))),
    add(toe, add(mul(u, 3.5), s(3.2))), add(lerp(ankle, toe, 0.4), s(4.4)), add(heel, add(mul(u, -1), s(4.2))), add(heel, add(mul(u, -2.5), s(0.5))),
  ], tone)
}

// Torso from hip to shoulder, chest on the front, a curved back and glutes.
const TORSO_FRONT = [[-0.08, 9], [0.12, 11], [0.35, 10.5], [0.62, 13.2], [0.82, 13.5], [0.97, 10.5], [1.1, 6.5]]
const TORSO_BACK = [[-0.1, 9], [-0.02, 14.5], [0.14, 13.5], [0.36, 10.5], [0.62, 12], [0.85, 13.2], [1.0, 10.5], [1.13, 7]]
function torsoShape(hip, shoulder, tone) {
  const u = unit(sub(shoulder, hip))
  const L = len(sub(shoulder, hip))
  const front = perp(u)
  const p = (t, w) => add(add(hip, mul(u, t * L)), mul(front, w))
  return blob([...TORSO_FRONT.map(([t, w]) => p(t, w)), ...[...TORSO_BACK].reverse().map(([t, w]) => p(t, -w))], tone)
}
// Part of the torso tinted for a working trunk muscle.
const TRUNK = { chest: [0.58, 0.96, 1], abs: [0.12, 0.56, 1], back: [0.45, 0.95, -1], lowerBack: [0.08, 0.44, -1], glutes: [-0.08, 0.2, -1] }
function trunkPart(hip, shoulder, [t0, t1, sideSign]) {
  const u = unit(sub(shoulder, hip))
  const L = len(sub(shoulder, hip))
  const front = perp(u)
  const prof = sideSign > 0 ? TORSO_FRONT : TORSO_BACK
  const ts = [0, 0.25, 0.5, 0.75, 1].map((k) => t0 + (t1 - t0) * k)
  const p = (t, w) => add(add(hip, mul(u, t * L)), mul(front, sideSign * w))
  return blob([...ts.map((t) => p(t, at(prof, t) - 1.2)), ...[...ts].reverse().map((t) => p(t, 2.5))], 'muscle', { outline: false })
}

// Head: a skull with a jaw on the face side, on a neck.
function headShapes(shoulder, head, front, tone) {
  const u = unit(sub(head, shoulder))
  const face = frontSide(shoulder, head, front) > 0 ? perp(u) : mul(perp(u), -1)
  const c = head
  const neckA = add(shoulder, mul(face, 1.5)), neckB = add(lerp(shoulder, head, 0.6), mul(face, 1))
  return [
    { ...segment(neckA, neckB, [[0, 6.5], [1, 5.6]], [[0, 7], [1, 5.6]], 1, tone), outline: false },
    blob([
      add(c, mul(u, 10.2)), add(c, add(mul(u, 7), mul(face, 7.8))), add(c, add(mul(u, 0.5), mul(face, 9.6))),
      add(c, add(mul(u, -5.5), mul(face, 8.8))), add(c, add(mul(u, -9.2), mul(face, 4.4))), add(c, add(mul(u, -8.6), mul(face, -2))),
      add(c, add(mul(u, -4.5), mul(face, -8.8))), add(c, add(mul(u, 4), mul(face, -9.6))), add(c, add(mul(u, 8.8), mul(face, -5.5))),
    ], tone),
  ]
}

// The whole figure, back to front.
export function body(j, work = []) {
  const tint = new Set(work)
  const none = new Set()
  const front = perp(unit(sub(j.shoulder, j.hip)))
  const floor = Math.max(j.toe[1], j.toe2[1], j.ankle[1], j.ankle2[1])
  return [
    ...(floor > 178 ? [{ k: 'ellipse', cx: f((j.toe[0] + j.ankle2[0]) / 2), cy: 185.5, rx: 30, ry: 3.2, rotate: 0, tone: 'shadow' }] : []),
    ...legShapes(j, j.hip, j.knee2, j.ankle2, j.toe2, front, 'far', none),
    ...armShapes(j.shoulder, j.elbow2, j.wrist2, front, 'far', none),
    torsoShape(j.hip, j.shoulder, 'body'),
    ...headShapes(j.shoulder, j.head, front, 'body'),
    ...Object.keys(TRUNK).filter((m) => tint.has(m)).map((m) => trunkPart(j.hip, j.shoulder, TRUNK[m])),
    ...legShapes(j, j.hip, j.knee, j.ankle, j.toe, front, 'body', tint),
    ...armShapes(j.shoulder, j.elbow, j.wrist, front, 'body', tint),
  ]
}

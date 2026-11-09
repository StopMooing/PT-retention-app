// A simple side-on figure (our own drawing, no outside artwork): bones with fixed lengths,
// a pose is the direction of each bone, and the figure is solved from one fixed joint
// (the feet for standing moves, the hands for hanging, the hips for lying). Angles are in
// degrees: 0 points up, 90 points forward (the figure faces right), 180 down, -90 back.

export const LEN = { foot: 15, shin: 44, thigh: 46, torso: 56, neck: 17, upper: 33, fore: 30 }

// parent, child, bone (direction is from parent to child)
const EDGES = [
  ['ankle', 'toe', 'foot'], ['ankle', 'knee', 'shin'], ['knee', 'hip', 'thigh'],
  ['ankle2', 'toe2', 'foot2'], ['ankle2', 'knee2', 'shin2'], ['knee2', 'hip', 'thigh2'],
  ['hip', 'shoulder', 'torso'], ['shoulder', 'head', 'neck'],
  ['shoulder', 'elbow', 'upper'], ['elbow', 'wrist', 'fore'],
  ['shoulder', 'elbow2', 'upper2'], ['elbow2', 'wrist2', 'fore2'],
]
const FAR = { foot2: 'foot', shin2: 'shin', thigh2: 'thigh', upper2: 'upper', fore2: 'fore' }
const rad = (d) => (d * Math.PI) / 180

// Far-side bones copy the near side unless the pose sets them.
export function fullAngles(a) {
  // Head in line with the back, arms hanging, foot flat, unless the pose says otherwise.
  const out = { foot: 90, upper: 180, fore: 180, ...a }
  if (out.neck == null) out.neck = out.torso ?? 0
  for (const [far, near] of Object.entries(FAR)) if (out[far] == null) out[far] = out[near]
  return out
}

// Joint positions for a pose { root, at: [x, y], a: { bone: angle } }.
export function solve(pose) {
  const a = fullAngles(pose.a)
  const pts = { [pose.root]: pose.at }
  let changed = true
  while (changed) {
    changed = false
    for (const [p, c, bone] of EDGES) {
      const L = LEN[bone.replace('2', '')]
      const ang = a[bone]
      if (pts[p] && !pts[c]) {
        pts[c] = [pts[p][0] + L * Math.sin(rad(ang)), pts[p][1] - L * Math.cos(rad(ang))]
        changed = true
      } else if (pts[c] && !pts[p]) {
        pts[p] = [pts[c][0] - L * Math.sin(rad(ang)), pts[c][1] + L * Math.cos(rad(ang))]
        changed = true
      }
    }
  }
  return pts
}

const lerp = (x, y, t) => x + (y - x) * t
// Shortest way round between two angles.
function lerpAngle(x, y, t) {
  let d = ((y - x + 540) % 360) - 180
  return x + d * t
}

const lerpPt = (p, q, t) => (p && q ? [lerp(p[0], q[0], t), lerp(p[1], q[1], t)] : p || q)

export function blend(A, B, t) {
  const a = fullAngles(A.a)
  const b = fullAngles(B.a)
  const out = {}
  for (const k of Object.keys(a)) out[k] = lerpAngle(a[k], b[k] ?? a[k], t)
  // Every hand and foot target becomes a function of the joints (fixed points, points
  // relative to a joint, or points on the body), and the two ends are mixed on the
  // in-between body, so a bar stays on the back and a hand stays on the bar mid-rep.
  const fn = (spec, pt) => (typeof pt === 'function' ? pt : pt && spec?.rel ? (j) => [j[spec.rel][0] + pt[0], j[spec.rel][1] + pt[1]] : pt ? () => pt : null)
  const mix = (key) => {
    const x = A[key], y = B[key]
    if (!x && !y) return undefined
    const o = { bend: (t < 0.5 ? x ?? y : y ?? x).bend }
    for (const k of ['near', 'far']) {
      if (!x?.[k] && !y?.[k]) continue
      const fx = fn(x, x?.[k] ?? x?.near), fy = fn(y, y?.[k] ?? y?.near)
      o[k] = (j) => lerpPt(fx?.(j), fy?.(j), t)
    }
    return o
  }
  return { root: A.root, at: [lerp(A.at[0], B.at[0], t), lerp(A.at[1], B.at[1], t)], a: out, reach: mix('reach'), plant: mix('plant') }
}

// Direction (our angle convention) from p to q.
const dirOf = (p, q) => (Math.atan2(q[0] - p[0], -(q[1] - p[1])) * 180) / Math.PI

// Two-bone reach from joint p0 to target: returns [first bone angle, second bone angle].
// bend 1 or -1 picks which side the middle joint (elbow or knee) goes.
function ik(p0, target, L1, L2, bend) {
  const dx = target[0] - p0[0], dy = target[1] - p0[1]
  const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.01)
  const theta = dirOf(p0, target)
  const cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)
  const alpha = (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI
  const first = theta + bend * alpha
  const mid = [p0[0] + L1 * Math.sin(rad(first)), p0[1] - L1 * Math.cos(rad(first))]
  return [first, dirOf(mid, target)]
}

// Joints for a pose, with hands (reach) and feet (plant) pulled to their targets.
export function pose(p) {
  const a = fullAngles(p.a)
  const base = solve({ ...p, a })
  // Targets are absolute, or offsets from a joint when rel names one (a bar on the back).
  const at = (spec, pt) => (typeof pt === 'function' ? pt(base) : pt && spec.rel ? [base[spec.rel][0] + pt[0], base[spec.rel][1] + pt[1]] : pt)
  if (p.reach) {
    const bend = p.reach.bend ?? 1
    const near = at(p.reach, p.reach.near)
    if (near) [a.upper, a.fore] = ik(base.shoulder, near, LEN.upper, LEN.fore, bend)
    const far = at(p.reach, p.reach.far) ?? near
    if (far) [a.upper2, a.fore2] = ik(base.shoulder, far, LEN.upper, LEN.fore, bend)
  }
  if (p.plant && p.root !== 'ankle') {
    const bend = p.plant.bend ?? 1
    const legs = [['near', 'thigh', 'shin'], ['far', 'thigh2', 'shin2']]
    for (const [k, th, sh] of legs) {
      const target = at(p.plant, p.plant[k]) ?? at(p.plant, p.plant.near)
      if (!target) continue
      const [h, k2] = ik(base.hip, target, LEN.thigh, LEN.shin, bend)
      a[th] = h + 180
      a[sh] = k2 + 180
    }
  }
  return solve({ ...p, a })
}

// Smooth there and back: hold briefly at each end.
export function cycle(ms, period = 2600) {
  const p = (ms % period) / period
  const tri = p < 0.5 ? p * 2 : 2 - p * 2
  const held = Math.min(1, Math.max(0, (tri - 0.08) / 0.84))
  return held * held * (3 - 2 * held)
}

// Turns joint positions into simple shapes (no React here, so the contact-sheet tool can
// render it too). Tones map to colour tokens in the component: far limbs are lighter, so
// the figure reads in depth.
const line = (p, q, tone, w = 9) => ({ k: 'line', x1: p[0], y1: p[1], x2: q[0], y2: q[1], tone, w })

export function figure(j) {
  return [
    line(j.ankle2, j.toe2, 'far', 7), line(j.ankle2, j.knee2, 'far'), line(j.knee2, j.hip, 'far'),
    line(j.shoulder, j.elbow2, 'far', 8), line(j.elbow2, j.wrist2, 'far', 7),
    line(j.hip, j.shoulder, 'body', 13),
    { k: 'circle', cx: j.head[0], cy: j.head[1], r: 11, tone: 'body' },
    line(j.ankle, j.toe, 'body', 7), line(j.ankle, j.knee, 'body'), line(j.knee, j.hip, 'body'),
    line(j.shoulder, j.elbow, 'body', 8), line(j.elbow, j.wrist, 'body', 7),
  ]
}

// Equipment, drawn side on.
export const gear = {
  plate: (p, r = 16) => [{ k: 'circle', cx: p[0], cy: p[1], r, tone: 'gear' }, { k: 'circle', cx: p[0], cy: p[1], r: 3.5, tone: 'body' }],
  dumbbell: (p) => [{ k: 'rect', x: p[0] - 9, y: p[1] - 6, w: 18, h: 12, rx: 4, tone: 'gear' }],
  kettlebell: (p) => [{ k: 'circle', cx: p[0], cy: p[1] + 10, r: 9, tone: 'gear' }, line(p, [p[0], p[1] + 3], 'gear', 4)],
  cable: (p, from) => [line(from, p, 'cable', 2), { k: 'circle', cx: from[0], cy: from[1], r: 5, tone: 'gear' }],
  rect: (x, y, w, h, rx = 3) => [{ k: 'rect', x, y, w, h, rx, tone: 'kit' }],
  bar: (x1, x2, y) => [line([x1, y], [x2, y], 'kit', 5)],
}

export const GROUND = 184

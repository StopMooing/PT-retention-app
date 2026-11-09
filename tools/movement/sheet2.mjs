// Contact sheet for the body drawings: every exercise in tools/movement/check.json style
// list, 5 frames each, light and dark. Usage: bundle with esbuild, then node out.mjs file.html
import { MOVES as PATTERNS } from '../../src/lib/movement/moves.js'
import { pose, blend } from '../../src/lib/movement/rig.js'
import { body } from '../../src/lib/movement/body.js'
import { kitFor } from '../../src/lib/movement/kit.js'
import fs from 'node:fs'

const LIGHT = { body: '#1C1A17', far: '#A39A8C', muscle: '#D9B77A', kit: '#DCD1BE', gear: '#5C564D', gearIn: '#F1E7D6', band: '#C24E33', cable: '#8A8377', bg: '#F1E7D6', shadow: '#1C1A1722' }
const svg = (shapes, C) => shapes.map((s0) => {
  const s = s0
  const ol = s.outline ? ` stroke="${C.bg}" stroke-width="2.2" stroke-linejoin="round"` : ''
  if (s.k === 'path') return `<path d="${s.d}"${ol} fill="${s.tone === 'none' ? 'none' : C[s.tone]}"${s.stroke ? ` stroke="${C[s.stroke]}" stroke-width="${s.w}" stroke-linecap="round"` : ''}/>`
  if (s.k === 'circle') return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}"${ol} fill="${C[s.tone]}"/>`
  if (s.k === 'ellipse') return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" transform="rotate(${s.rotate} ${s.cx} ${s.cy})" fill="${C[s.tone]}"/>`
  if (s.k === 'line') return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${C[s.tone]}" stroke-width="${s.w}" stroke-linecap="round"/>`
  return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.rx}" fill="${C[s.tone]}"/>`
}).join('')
const list = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'))
let html = '<html><body style="margin:0;background:#F7F2EA;font:13px sans-serif;padding:6px">'
for (const item of list) {
  const p = PATTERNS[item.p]
  html += `<div style="background:#fff;border-radius:10px;padding:4px;margin:4px;display:inline-block"><div><b>${item.name}</b> (${item.p}, ${item.kit})</div>`
  for (const t of item.frames || [0, 0.25, 0.5, 0.75, 1]) {
    const j = pose(blend(p.A, p.B, t))
    const k = kitFor(item.kit, p, j)
    const shapes = [...(p.scene || []), ...k.behind, { k: 'rect', x: 0, y: 184, w: 240, h: 3, rx: 1, tone: 'kit' }, ...body(j, item.work || p.work || []), ...k.front]
    html += `<svg viewBox="${p.view || '0 0 240 200'}" width="${item.w || 150}" style="background:${LIGHT.bg};border-radius:8px;margin:2px">${svg(shapes, LIGHT)}</svg>`
  }
  html += '</div>'
}
fs.writeFileSync(process.argv[2], html + '</body></html>')

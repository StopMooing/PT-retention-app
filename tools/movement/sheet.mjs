// Contact sheet of every movement pattern (start, middle, end), to check the drawings.
// npx esbuild tools/movement/sheet.mjs --bundle --platform=node --format=esm --outfile=/tmp/s.mjs
// node /tmp/s.mjs sheet.html, then open sheet.html in a browser.
import { PATTERNS } from '../../src/lib/movement/patterns.js'
import { pose, blend } from '../../src/lib/movement/rig.js'
import { figure } from '../../src/lib/movement/draw.js'
import fs from 'node:fs'

const COL = { body: '#1C1A17', far: '#B9B0A3', gear: '#C9A96E', kit: '#D9CFC0', cable: '#8A8276' }
const svg = (shapes) => shapes.map((s) => s.k === 'line'
  ? `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${COL[s.tone]}" stroke-width="${s.w}" stroke-linecap="round"/>`
  : s.k === 'circle' ? `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${COL[s.tone]}"/>`
  : `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.rx}" fill="${COL[s.tone]}"/>`).join('')
let html = '<html><body style="margin:0;background:#F7F2EA;font:12px sans-serif;display:flex;flex-wrap:wrap;gap:6px;padding:6px">'
for (const [name, p] of Object.entries(PATTERNS)) {
  html += `<div style="background:#fff;border-radius:10px;padding:4px"><div>${name}</div>`
  for (const t of [0, 0.5, 1]) {
    const j = pose(blend(p.A, p.B, t))
    const shapes = [...(p.scene || []), { k: 'rect', x: 0, y: 184, w: 240, h: 2, rx: 0, tone: 'kit' }, ...figure(j), ...(p.kit ? p.kit(j) : [])]
    html += `<svg viewBox="${p.view || '0 0 240 200'}" width="160" height="133">${svg(shapes)}</svg>`
  }
  html += '</div>'
}
fs.writeFileSync(process.argv[2], html + '</body></html>')

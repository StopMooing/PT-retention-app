/* eslint-disable react-refresh/only-export-components */
// Renders the real MovementDemo and MovementThumb for a list of exercise names, in light or
// dark, for checking the in-app look. Bundle with esbuild, open with ?dark=1 for dark.
import { createRoot } from 'react-dom/client'
import MovementDemo, { MovementThumb } from '../../src/lib/movement/MovementDemo'
import css from '../../src/index.css?raw-fig'

const dark = location.search.includes('dark=1')
const block = (sel) => (css.split(sel)[1] || '').split('}')[0]
const vars = (txt) => Object.fromEntries([...txt.matchAll(/--(fig-[a-z-]+):\s*([^;]+);/g)].map((m) => ['--' + m[1], m[2].trim()]))
const theme = { ...vars(block(':root {')), ...(dark ? vars(block('[data-theme=dark] {')) : {}) }
const bg = dark ? '#141311' : '#F7F2EA', card = dark ? '#1F1D1A' : '#FFFFFF', ink = dark ? '#F7F2EA' : '#1C1A17'

function App() {
  return (
    <div style={{ ...theme, background: bg, color: ink, font: '14px sans-serif', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 340px)', gap: 12 }}>
      {window.NAMES.map((n) => (
        <div key={n} style={{ background: card, borderRadius: 20, padding: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}><MovementThumb name={n} /><b>{n}</b></div>
          <MovementDemo name={n} />
        </div>
      ))}
    </div>
  )
}
createRoot(document.getElementById('root')).render(<App />)

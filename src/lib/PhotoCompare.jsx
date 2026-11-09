// Two progress photos side by side, first and latest to start with. Tap a photo below to
// put it on the side that is selected. Used by the client's Progress tab and the coach's
// Notes tab, so both see the same comparison.
import { useState } from 'react'
import { Sheet, Segmented } from '../ui'
import { parseDay, daysBetween } from '../client/dates'

const label = (p) => (p?.taken_date ? parseDay(p.taken_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

export default function PhotoCompare({ photos, urls, onClose }) {
  // Oldest first so "before" reads left to right.
  const list = [...photos].sort((a, b) => String(a.taken_date ?? '').localeCompare(String(b.taken_date ?? '')))
  const [left, setLeft] = useState(list[0]?.id)
  const [right, setRight] = useState(list[list.length - 1]?.id)
  const [side, setSide] = useState('left')
  const L = list.find((p) => p.id === left)
  const R = list.find((p) => p.id === right)
  const gap = L?.taken_date && R?.taken_date ? Math.abs(daysBetween(L.taken_date, R.taken_date)) : null

  const frame = (p, tag) => (
    <figure className="flex-1 min-w-0">
      <div className="aspect-[3/4] rounded-[14px] overflow-hidden bg-surface-2">
        {p && urls[p.id] && <img src={urls[p.id]} alt={`${tag} photo`} className="w-full h-full object-cover" />}
      </div>
      <figcaption className="text-[13px] font-semibold text-ink mt-1.5 text-center">{label(p)}</figcaption>
    </figure>
  )

  return (
    <Sheet open onClose={onClose} title="Compare photos">
      <div className="space-y-4">
        <div className="flex gap-2.5">{frame(L, 'Earlier')}{frame(R, 'Later')}</div>
        {gap != null && gap > 0 && <p className="text-[14px] text-muted text-center -mt-1">{gap < 14 ? `${gap} days apart` : `${Math.round(gap / 7)} weeks apart`}</p>}
        <Segmented value={side} onChange={setSide} options={[{ value: 'left', label: 'Change left' }, { value: 'right', label: 'Change right' }]} />
        <div className="grid grid-cols-4 gap-1.5">
          {list.map((p) => {
            const on = p.id === (side === 'left' ? left : right)
            return (
              <button key={p.id} onClick={() => (side === 'left' ? setLeft(p.id) : setRight(p.id))} aria-pressed={on} aria-label={`Use the photo from ${label(p)}`} className={`relative aspect-[3/4] rounded-[10px] overflow-hidden bg-surface-2 ${on ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}`}>
                {urls[p.id] && <img src={urls[p.id]} alt="" className="w-full h-full object-cover" />}
              </button>
            )
          })}
        </div>
      </div>
    </Sheet>
  )
}

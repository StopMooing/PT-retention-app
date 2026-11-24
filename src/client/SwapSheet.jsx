// Swap an exercise for this session only: suggestions first (same movement on other kit,
// then similar moves for the same muscle), and a search of the whole library.
import { useEffect, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { supabase } from '../supabase'
import { Sheet, Chip } from '../ui'
import { SearchBox } from '../tools/kit'
import { Loading } from './common'
import { suggestSwaps, swapReason } from '../lib/swaps.js'
import { equipmentLabel } from '../lib/equipment.js'

// The library is the same for the whole visit, so it is loaded once.
let libraryCache = null
async function loadLibrary() {
  if (libraryCache) return libraryCache
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, muscle_group, equipment, category, exercise_aliases(alias)')
    .order('name')
  if (error) throw error
  libraryCache = data ?? []
  return libraryCache
}

function Option({ ex, reason, onPick }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(ex)}
        className="w-full min-h-[56px] px-1 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-surface-2 rounded-xl"
      >
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-ink">{ex.name}</span>
          {reason && <span className="block text-[13px] text-muted">{reason}</span>}
        </span>
        {equipmentLabel(ex.equipment) && <Chip className="shrink-0">{equipmentLabel(ex.equipment)}</Chip>}
      </button>
    </li>
  )
}

export default function SwapSheet({ open, from, exclude = [], onPick, onClose }) {
  const [library, setLibrary] = useState(libraryCache)
  const [failed, setFailed] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open || library) return
    let cancelled = false
    loadLibrary()
      .then((rows) => { if (!cancelled) setLibrary(rows) })
      .catch((e) => { console.error('Exercise library load error:', e); if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [open, library])

  if (!from) return null
  // The search starts empty each time the sheet opens.
  const close = () => { setSearch(''); onClose() }
  const pick = (ex) => { setSearch(''); onPick(ex) }
  const q = search.trim().toLowerCase()
  const skip = new Set([from.id, ...exclude])
  const suggested = library ? suggestSwaps(from, library, { exclude }) : []
  const found = library && q
    ? library.filter((ex) => !skip.has(ex.id) && (ex.name.toLowerCase().includes(q) || ex.exercise_aliases?.some((a) => a.alias.toLowerCase().includes(q)))).slice(0, 40)
    : []

  return (
    <Sheet open={open} onClose={close} title={`Swap ${from.name}`}>
      <div className="flex flex-col gap-3">
        <p className="flex items-start gap-2 text-[14px] text-muted">
          <ArrowLeftRight size={16} className="shrink-0 mt-0.5" />
          <span>Just for today. Your program stays the same, and your coach will see what you swapped.</span>
        </p>
        <SearchBox value={search} onChange={setSearch} placeholder="Search all exercises" />
        {failed ? (
          <p role="alert" className="text-[14px] text-bad font-semibold text-center py-4">Couldn't load the exercises. Check your signal and try again.</p>
        ) : !library ? (
          <Loading />
        ) : q ? (
          found.length ? (
            <ul className="divide-y divide-line -mx-1">
              {found.map((ex) => <Option key={ex.id} ex={ex} reason={ex.muscle_group} onPick={pick} />)}
            </ul>
          ) : (
            <p className="text-sm text-muted text-center py-6">No exercises match "{search}".</p>
          )
        ) : suggested.length ? (
          <>
            <p className="text-[13px] font-bold text-muted mt-1">Good swaps</p>
            <ul className="divide-y divide-line -mx-1">
              {suggested.map((ex) => <Option key={ex.id} ex={ex} reason={swapReason(from, ex)} onPick={pick} />)}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted text-center py-6">Search for the exercise you'd like to do instead.</p>
        )}
      </div>
    </Sheet>
  )
}

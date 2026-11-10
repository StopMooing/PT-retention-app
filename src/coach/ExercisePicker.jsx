// Picking an exercise from the library: search (names and other names), muscle and
// equipment filters. Tapping one calls onPick and leaves the sheet open, so several can
// be added in a row.
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Sheet } from '../ui'
import { Select, SearchBox, FilterChips } from '../tools/kit'

const EQUIPMENT = [
  ['barbell', 'Barbell'], ['dumbbell', 'Dumbbell'], ['cable', 'Cable'], ['machine', 'Machine'],
  ['bodyweight', 'Bodyweight'], ['band', 'Band'], ['kettlebell', 'Kettlebell'], ['trx', 'TRX'],
  ['sled', 'Sled'], ['landmine', 'Landmine'], ['trap_bar', 'Trap bar'], ['functional', 'Functional'], ['plate', 'Plate'],
]

export default function ExercisePicker({ open, onClose, title = 'Add exercise', library, onPick, footer }) {
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('')
  const [equipment, setEquipment] = useState('')

  const muscles = ['All', ...[...new Set(library.map((e) => e.muscle_group).filter(Boolean))].sort()]
  const q = search.trim().toLowerCase()
  const list = library.filter((ex) =>
    (!q || ex.name.toLowerCase().includes(q) || ex.exercise_aliases?.some((a) => a.alias.toLowerCase().includes(q))) &&
    (!equipment || ex.equipment === equipment) &&
    (!muscle || ex.muscle_group === muscle))

  return (
    <Sheet open={open} onClose={onClose} title={title} footer={footer}>
      <div className="flex flex-col gap-3">
        <SearchBox value={search} onChange={setSearch} placeholder="Search exercises" autoFocus />
        <FilterChips options={muscles} value={muscle || 'All'} onChange={(v) => setMuscle(v === 'All' ? '' : v)} />
        <Select value={equipment} onChange={(e) => setEquipment(e.target.value)} aria-label="Equipment">
          <option value="">Any equipment</option>
          {EQUIPMENT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        {list.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">{search ? `No exercises match "${search}".` : 'No exercises match these filters.'}</p>
        ) : (
          <ul className="divide-y divide-line -mx-1">
            {list.slice(0, 50).map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => onPick(ex)}
                  className="w-full min-h-[52px] px-1 py-2 flex items-center justify-between gap-3 text-left hover:bg-surface-2 rounded-xl"
                >
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-ink truncate">{ex.name}</span>
                    {ex.muscle_group && <span className="block text-[13px] text-muted">{ex.muscle_group}</span>}
                  </span>
                  <Plus size={18} className="text-accent shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {list.length > 50 && <p className="text-[13px] text-muted text-center">Showing 50 of {list.length}. Search to narrow it down.</p>}
      </div>
    </Sheet>
  )
}

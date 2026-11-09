// Every recipe used in the meal plans, searchable and filtered by meal and diet. Tapping
// one opens it; adding it logs it to the chosen meal on the day the Nutrition tab shows.
import { useMemo, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { Card } from '../ui'
import { MEAL_TYPES, recipeTotals, recipeTime } from '../lib/recipes'
import { capitalise } from './foods'

const DIETS = [
  { id: 'all', label: 'Any diet' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'glutenfree', label: 'Gluten free' },
  { id: 'dairyfree', label: 'Dairy free' },
]

// Each recipe's diets come from its ingredients (tools/meal-library), so a vegan recipe is
// also vegetarian and pescatarian, and gluten free or dairy free when nothing in it has any.
const fitsDiet = (r, diet) => diet === 'all' || (r.diets ?? []).includes(diet)

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`h-9 px-3.5 rounded-full text-[13px] font-bold whitespace-nowrap shrink-0 transition-colors ${active ? 'bg-accent text-on-accent' : 'bg-surface text-muted border border-line hover:text-ink'}`}
    >
      {children}
    </button>
  )
}

export default function RecipesView({ recipes, onOpen }) {
  const [q, setQ] = useState('')
  const [meal, setMeal] = useState('all')
  const [diet, setDiet] = useState('all')

  const list = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    // Some styles share a recipe (the same dish in High protein and Pescatarian, say): list it once.
    const seen = new Set()
    return recipes
      .filter((r) => (seen.has(r.name) ? false : seen.add(r.name)))
      .filter((r) => (meal === 'all' || r.meal_type === meal) && fitsDiet(r, diet))
      .filter((r) => {
        if (!words.length) return true
        const hay = `${r.name} ${r.description || ''} ${(r.recipe_ingredients ?? []).map((i) => i.label).join(' ')}`.toLowerCase()
        return words.every((w) => hay.includes(w))
      })
      .sort((a, b) => MEAL_TYPES.indexOf(a.meal_type) - MEAL_TYPES.indexOf(b.meal_type) || a.name.localeCompare(b.name))
  }, [recipes, q, meal, diet])

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 h-12 px-4 rounded-[14px] bg-surface border border-line-strong">
        <Search size={18} className="text-faint shrink-0" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search recipes or ingredients"
          className="flex-1 min-w-0 bg-transparent text-[15px] text-ink placeholder:text-faint outline-none"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-0.5 no-scrollbar">
        <Pill active={meal === 'all'} onClick={() => setMeal('all')}>All meals</Pill>
        {MEAL_TYPES.map((m) => <Pill key={m} active={meal === m} onClick={() => setMeal(m)}>{capitalise(m)}</Pill>)}
      </div>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-0.5 no-scrollbar">
        {DIETS.map((d) => <Pill key={d.id} active={diet === d.id} onClick={() => setDiet(d.id)}>{d.label}</Pill>)}
      </div>

      {list.length > 0 ? (
        <>
          <p className="text-[13px] text-muted px-1">{list.length} {list.length === 1 ? 'recipe' : 'recipes'}</p>
          <Card padded={false} className="divide-y divide-line overflow-hidden">
            {list.map((r) => {
              const t = recipeTotals(r)
              return (
              <button key={r.id} onClick={() => onOpen(r)} className="w-full flex items-center gap-3 pl-4 pr-3 py-3 min-h-[56px] text-left hover:bg-surface-2">
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-bold text-ink">{r.name}</span>
                  <span className="block text-[13px] text-muted tabular-nums">
                    {capitalise(r.meal_type)}{recipeTime(r) ? ` · ${recipeTime(r)}` : ''} · {t.calories} kcal · P {Math.round(t.protein_g)}g
                  </span>
                </span>
                <ChevronRight size={18} className="text-faint shrink-0" />
              </button>
              )
            })}
          </Card>
        </>
      ) : (
        <p className="text-[15px] text-muted text-center py-6">Nothing matches that. Try another word or clear a filter.</p>
      )}
    </div>
  )
}

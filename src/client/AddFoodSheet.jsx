// Add food to the log: search (AFCD, common foods, Open Food Facts), pick a serving size,
// or type the numbers in by hand. Saves one food_logs row, as before.
import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import { supabase } from '../supabase'
import { Sheet, Button, Field } from '../ui'
import { searchFoods, MEAL_ORDER, capitalise } from './foods'

const EMPTY_INPUT = { name: '', calories: '', protein: '', carbs: '', fats: '', meal_type: 'breakfast' }
const cx = (...c) => c.filter(Boolean).join(' ')

// A sensible starting meal for the time of day; the client can change it.
function mealForNow() {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h >= 17) return 'dinner'
  return 'snack'
}

// Mount it only while open, so each time it starts clean on the meal it was opened for.
export default function AddFoodSheet({ onClose, date, defaultMeal, client, onAdded }) {
  const [foodInput, setFoodInput] = useState(() => ({ ...EMPTY_INPUT, meal_type: defaultMeal || mealForNow() }))
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [servingSize, setServingSize] = useState(100)
  const [base, setBase] = useState(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  function onQuery(value) {
    setQuery(value)
    setFoodInput((f) => ({ ...f, name: value }))
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSearching(true)
      const r = await searchFoods(value)
      setResults(r)
      setSearching(false)
    }, 400)
  }

  function pick(r) {
    setBase({ calories: r.calories, protein: r.protein, carbs: r.carbs, fats: r.fats })
    setFoodInput((f) => ({ ...f, name: r.name, calories: String(r.calories), protein: String(r.protein), carbs: String(r.carbs), fats: String(r.fats) }))
    setQuery(r.name)
    setServingSize(100)
    setResults([])
  }

  function applyServing(value) {
    const size = parseFloat(value) || 100
    setServingSize(size)
    if (base) {
      const scale = size / 100
      setFoodInput((f) => ({
        ...f,
        calories: String(Math.round(base.calories * scale)),
        protein: String(parseFloat((base.protein * scale).toFixed(1))),
        carbs: String(parseFloat((base.carbs * scale).toFixed(1))),
        fats: String(parseFloat((base.fats * scale).toFixed(1))),
      }))
    }
  }

  async function handleAdd() {
    if (!foodInput.name.trim()) return
    setAdding(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('food_logs').insert({
        client_id: client.id,
        food_name: foodInput.name.trim(),
        meal_type: foodInput.meal_type,
        calories: parseFloat(foodInput.calories) || 0,
        protein_g: parseFloat(foodInput.protein) || 0,
        carbs_g: parseFloat(foodInput.carbs) || 0,
        fats_g: parseFloat(foodInput.fats) || 0,
        logged_at: new Date(date + 'T12:00:00').toISOString(),
      }).select().single()
      if (error) throw error
      onAdded(data)
      onClose()
    } catch (e) {
      console.error('Add food error:', e)
      setError("Couldn't add that. Check your signal and try again.")
    } finally { setAdding(false) }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Log food"
      footer={
        <>
          {error && <p role="alert" className="text-[13px] font-semibold text-bad text-center mb-2.5">{error}</p>}
          <Button size="lg" block onClick={handleAdd} disabled={adding || !foodInput.name.trim()}>
            {adding ? 'Saving...' : foodInput.meal_type === 'other' ? 'Add to log' : `Add to ${capitalise(foodInput.meal_type)}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {MEAL_ORDER.map((t) => (
            <button
              key={t}
              onClick={() => setFoodInput((f) => ({ ...f, meal_type: t }))}
              className={cx('h-9 px-3.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors', foodInput.meal_type === t ? 'bg-accent text-on-accent' : 'bg-surface-2 text-ink')}
            >
              {capitalise(t)}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input
            type="text"
            placeholder="Search foods, e.g. oats"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-10 rounded-[14px] border border-line-strong bg-surface text-ink placeholder:text-faint outline-none focus:border-accent"
          />
          {searching && <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent animate-pulse" />}
        </div>

        {results.length > 0 && (
          <div className="rounded-[16px] border border-line divide-y divide-line overflow-hidden">
            {results.map((r, i) => (
              <button key={i} type="button" onClick={() => pick(r)} className="w-full text-left px-4 py-3 hover:bg-surface-2">
                <p className="text-[15px] font-bold text-ink truncate">{r.name}</p>
                <p className="text-[13px] text-muted truncate">
                  {r.brand ? `${r.brand} · ` : ''}{r.calories} kcal · P {r.protein} · C {r.carbs} · F {r.fats} <span className="text-faint">per 100 g</span>
                </p>
              </button>
            ))}
          </div>
        )}

        {foodInput.calories && base && (
          <div className="rounded-[16px] bg-accent-soft px-4 py-3 flex items-center gap-3">
            <label className="text-[15px] font-bold text-ink" htmlFor="serving">Serving</label>
            <input
              id="serving"
              type="text"
              inputMode="decimal"
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              onBlur={(e) => applyServing(e.target.value)}
              className="w-20 h-10 rounded-[12px] border border-line-strong bg-surface text-ink text-center font-bold tabular-nums outline-none focus:border-accent"
            />
            <span className="text-[15px] text-muted">g</span>
            <span className="ml-auto text-[15px] font-bold text-ink tabular-nums">{foodInput.calories} kcal</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {[
            ['calories', 'Calories (kcal)'],
            ['protein', 'Protein (g)'],
            ['carbs', 'Carbs (g)'],
            ['fats', 'Fats (g)'],
          ].map(([key, label]) => (
            <Field
              key={key}
              label={label}
              inputMode="decimal"
              value={foodInput[key]}
              onChange={(e) => setFoodInput((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          ))}
        </div>
      </div>
    </Sheet>
  )
}

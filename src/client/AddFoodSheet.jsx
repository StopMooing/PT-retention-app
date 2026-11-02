// Add food to the log: search (AFCD, common foods, Open Food Facts), scan a barcode, pick
// a serving size, or type the numbers in by hand. Saves one food_logs row, as before.
// A scanned product nobody has added yet can be entered once from the label; it is then
// saved to the shared product list for everyone.
import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react'
import { Search, ScanBarcode } from 'lucide-react'
import { supabase } from '../supabase'
import { Sheet, Button, Field } from '../ui'
import { searchFoods, MEAL_ORDER, capitalise } from './foods'
import { lookupBarcode, saveBarcodeProduct } from './barcode'

const BarcodeScanner = lazy(() => import('./BarcodeScanner'))
const EMPTY_PRODUCT = { name: '', brand: '', serving: '', calories: '', protein: '', carbs: '', fats: '' }

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
  const [perServe, setPerServe] = useState(false) // takeaway items are counted in serves, not grams
  const [menuServeG, setMenuServeG] = useState(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)
  const [scanOpen, setScanOpen] = useState(false)
  const [barcode, setBarcode] = useState(null) // the scanned product's barcode, saved with the log
  const [scanNote, setScanNote] = useState(null)
  const [newProduct, setNewProduct] = useState(null) // { barcode, ...EMPTY_PRODUCT } when we don't know it
  const [savingProduct, setSavingProduct] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  function onQuery(value) {
    setQuery(value)
    setBarcode(null)
    setScanNote(null)
    // A new search drops the last picked food's numbers, so they can't be logged under a new name.
    setBase(null)
    setPerServe(false)
    setMenuServeG(null)
    setFoodInput((f) => ({ ...f, name: value, calories: '', protein: '', carbs: '', fats: '' }))
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSearching(true)
      const r = await searchFoods(value)
      setResults(r)
      setSearching(false)
    }, 400)
  }

  // r is per 100 g (serving in grams, default 100), or per serve for takeaway items
  // (serving = number of serves, default 1).
  function pick(r, serving = r.perServe ? 1 : 100) {
    setPerServe(!!r.perServe)
    setMenuServeG(r.perServe ? r.servingG : null)
    const k = r.perServe ? serving : serving / 100
    setBase({ calories: r.calories, protein: r.protein, carbs: r.carbs, fats: r.fats })
    setFoodInput((f) => ({
      ...f, name: r.name,
      calories: String(Math.round(r.calories * k)), protein: String(parseFloat((r.protein * k).toFixed(1))),
      carbs: String(parseFloat((r.carbs * k).toFixed(1))), fats: String(parseFloat((r.fats * k).toFixed(1))),
    }))
    setQuery(r.name)
    setServingSize(serving)
    setResults([])
  }

  const onScanned = useCallback(async (code) => {
    setScanOpen(false)
    setResults([])
    setNewProduct(null)
    setScanNote('Looking that up...')
    const found = await lookupBarcode(code)
    if (found) {
      pick(found, found.serving || 100)
      setBarcode(code)
      setScanNote(`${found.brand ? `${found.brand} · ` : ''}${found.source === 'members' ? 'Added by a UNFNSHD member' : 'From Open Food Facts'}`)
    } else {
      setScanNote(null)
      setNewProduct({ barcode: code, ...EMPTY_PRODUCT })
    }
  }, [])

  async function handleSaveProduct() {
    const p = newProduct
    if (!p?.name.trim() || !(parseFloat(p.calories) >= 0)) return
    setSavingProduct(true)
    const { error: saveError } = await saveBarcodeProduct(p)
    setSavingProduct(false)
    // Already added by someone else a moment ago is fine: the label numbers still log.
    if (saveError && saveError.code !== '23505') {
      console.error('Save product error:', saveError)
      setError("Couldn't save that product. Check the numbers and try again.")
      return
    }
    const per100 = { name: p.name.trim(), calories: parseFloat(p.calories) || 0, protein: parseFloat(p.protein) || 0, carbs: parseFloat(p.carbs) || 0, fats: parseFloat(p.fats) || 0 }
    pick(per100, parseFloat(p.serving) || 100)
    setBarcode(p.barcode)
    setScanNote('Saved. Next time anyone scans it, it comes up straight away.')
    setNewProduct(null)
  }

  function applyServing(value) {
    const size = parseFloat(value) || (perServe ? 1 : 100)
    setServingSize(size)
    if (base) {
      const scale = perServe ? size : size / 100
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
        serving_size_g: base ? (perServe ? menuServeG : parseFloat(servingSize) || null) : null,
        servings: base && perServe ? parseFloat(servingSize) || 1 : 1,
        barcode,
        logged_at: date,
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

        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
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
          <button
            onClick={() => { setError(null); setScanOpen(true) }}
            aria-label="Scan a barcode"
            className="w-12 h-12 shrink-0 rounded-[14px] border border-line-strong bg-surface text-accent flex items-center justify-center hover:bg-surface-2"
          >
            <ScanBarcode size={22} />
          </button>
        </div>
        {scanNote && <p className="text-[13px] text-muted -mt-2 px-1">{scanNote}</p>}

        {newProduct && (
          <div className="rounded-[16px] border border-line p-4 space-y-3">
            <div>
              <p className="text-[15px] font-bold text-ink">New product</p>
              <p className="text-[13px] text-muted">Nobody has added this product yet. Copy the per 100 g column from the label once and it's saved for everyone.</p>
              <p className="mt-2 text-[13px] text-ink">Check this matches the number under the barcode: <span className="font-bold tabular-nums">{newProduct.barcode}</span>. If it doesn't, scan again.</p>
            </div>
            <Field label="Name" value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Protein yoghurt, vanilla" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Brand (optional)" value={newProduct.brand} onChange={(e) => setNewProduct((p) => ({ ...p, brand: e.target.value }))} />
              <Field label="Serving (g)" inputMode="decimal" value={newProduct.serving} onChange={(e) => setNewProduct((p) => ({ ...p, serving: e.target.value.replace(/[^0-9.]/g, '') }))} />
              {[['calories', 'kcal per 100 g'], ['protein', 'Protein per 100 g'], ['carbs', 'Carbs per 100 g'], ['fats', 'Fat per 100 g']].map(([k, label]) => (
                <Field key={k} label={label} inputMode="decimal" value={newProduct[k]} onChange={(e) => setNewProduct((p) => ({ ...p, [k]: e.target.value.replace(/[^0-9.]/g, '') }))} />
              ))}
            </div>
            <p className="text-[12px] text-faint">Label only shows kJ? Divide by 4.18 for kcal.</p>
            <div className="flex gap-2.5">
              <Button variant="secondary" className="flex-1" onClick={() => setNewProduct(null)}>Cancel</Button>
              <Button className="flex-1" disabled={savingProduct || !newProduct.name.trim() || newProduct.calories === ''} onClick={handleSaveProduct}>
                {savingProduct ? 'Saving...' : 'Save product'}
              </Button>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="rounded-[16px] border border-line divide-y divide-line overflow-hidden">
            {results.map((r, i) => (
              <button key={i} type="button" onClick={() => pick(r)} className="w-full text-left px-4 py-3 hover:bg-surface-2">
                <p className="text-[15px] font-bold text-ink truncate">{r.name}</p>
                <p className="text-[13px] text-muted truncate">
                  {r.brand && !r.perServe ? `${r.brand} · ` : ''}{r.calories} kcal · P {r.protein} · C {r.carbs} · F {r.fats} <span className="text-faint">{r.perServe ? 'per serve' : 'per 100 g'}</span>
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
            <span className="text-[15px] text-muted">{perServe ? (Number(servingSize) === 1 ? 'serve' : 'serves') : 'g'}</span>
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
        <p className="text-[12px] text-faint text-center">Food data from Food Standards Australia New Zealand (CC BY), Open Food Facts (ODbL) and each restaurant's published nutrition information.</p>
      </div>
      {scanOpen && (
        <Suspense fallback={null}>
          <BarcodeScanner onResult={onScanned} onClose={() => setScanOpen(false)} />
        </Suspense>
      )}
    </Sheet>
  )
}

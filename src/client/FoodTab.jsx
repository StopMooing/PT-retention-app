// Food: pick a day, see calories and macros against targets, meals grouped by type, add
// food in a sheet, saved meals from the AI helper, and the calorie calculator tucked away.
// A meal with ingredients (from the AI or a saved meal) opens to show them; each amount
// can be changed or the ingredient removed, and the meal's totals follow.
import { useState, useEffect } from 'react'
import { Plus, X, Sparkles, Calculator, ChevronDown } from 'lucide-react'
import { supabase } from '../supabase'
import { PageTitle, Card, Button, Segmented, SectionLabel, Sheet, Field } from '../ui'
import { toLocalDateStr, formatDateLabel } from './dates'
import { logsForDate, foodTotals, nutritionTargetsFor } from './metrics'
import { MEAL_ORDER, capitalise, parseSavedMealContent } from './foods'
import { NutritionSummary, DayNav } from './common'
import AddFoodSheet from './AddFoodSheet'
import { mealItems, logMeals, updateMealItem, restoreMeal } from '../lib/meals'
import MealPlanCard from './MealPlanCard'
import TdeeSheet from './TdeeSheet'

const macroLine = (f) => `P ${Math.round(f.protein_g || 0)} · C ${Math.round(f.carbs_g || 0)} · F ${Math.round(f.fats_g || 0)}`
const amount = (i) => (Number(i.grams) > 0 ? `${Math.round(i.grams)} g` : null)

// One ingredient: amount, name, calories. "Estimate" when the food database had no
// good match and the number is the AI's.
function IngredientLine({ item, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={`w-full flex items-center gap-3 py-2 text-left ${onClick ? 'hover:bg-surface-2 rounded-[10px] -mx-2 px-2' : ''}`}>
      <span className="w-14 shrink-0 text-[13px] font-bold text-muted tabular-nums">{amount(item) ?? ''}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] text-ink truncate">{item.name || item.label}</span>
        {(item.estimated || !item.food_id) && <span className="block text-[12px] text-faint">Estimate</span>}
      </span>
      <span className="text-[13px] text-muted tabular-nums shrink-0">{Math.round(item.calories || 0)} kcal</span>
    </Tag>
  )
}

// A row in the food log. Meals with ingredients open and close.
function FoodRow({ food, onDelete, onEditItem }) {
  const items = mealItems(food)
  const [open, setOpen] = useState(false)
  const head = (
    <>
      <p className="text-[15px] font-bold text-ink truncate">{food.food_name}</p>
      <p className="text-[13px] text-muted tabular-nums">
        {Math.round(food.calories || 0)} kcal · {macroLine(food)}{items.length > 0 && ` · ${items.length} ${items.length === 1 ? 'ingredient' : 'ingredients'}`}
      </p>
    </>
  )
  return (
    <div>
      <div className="flex items-center gap-2 pl-4 pr-2 py-3 min-h-[56px]">
        {items.length > 0 ? (
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex-1 min-w-0 flex items-center gap-2 text-left">
            <span className="flex-1 min-w-0">{head}</span>
            <ChevronDown size={18} className={`text-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        ) : (
          <div className="flex-1 min-w-0">{head}</div>
        )}
        <button onClick={() => onDelete(food)} aria-label={`Remove ${food.food_name}`} className="w-10 h-10 rounded-full flex items-center justify-center text-faint hover:text-bad hover:bg-surface-2 shrink-0">
          <X size={18} />
        </button>
      </div>
      {open && items.length > 0 && (
        <div className="px-4 pb-3 -mt-1">
          <div className="rounded-[14px] bg-bg px-3 py-1 divide-y divide-line">
            {items.map((i) => <IngredientLine key={i.id} item={i} onClick={() => onEditItem(food, i)} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// Change an ingredient's amount, or remove it.
function EditIngredientSheet({ target, onClose, onSave, onRemove, busy }) {
  const item = target?.item
  // Keyed by the ingredient, so this starts fresh for each one.
  const [grams, setGrams] = useState(() => (item?.grams ? String(Math.round(item.grams)) : ''))
  const g = parseFloat(grams)
  const valid = g > 0 && g <= 5000
  return (
    <Sheet
      open={!!target}
      onClose={onClose}
      title={item?.name || 'Ingredient'}
      footer={
        <div className="flex gap-2.5">
          <Button variant="secondary" size="lg" className="flex-1" disabled={busy} onClick={onRemove}>Remove</Button>
          <Button size="lg" className="flex-1" disabled={busy || !valid || !item?.grams} onClick={() => onSave(g)}>{busy ? 'Saving...' : 'Save'}</Button>
        </div>
      }
    >
      {item?.grams ? (
        <Field label="Amount (grams)" type="text" inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value.replace(/[^0-9.]/g, ''))} hint={valid ? `${Math.round((item.calories || 0) * g / item.grams)} kcal` : 'Enter grams'} />
      ) : (
        <p className="text-[15px] text-muted">This ingredient has no amount, so it can only be removed.</p>
      )}
    </Sheet>
  )
}

function SavedMeals({ savedMeals, onAddItems, onDelete }) {
  const [expandedId, setExpandedId] = useState(null)
  return (
    <div className="space-y-3">
      {savedMeals.map((meal) => {
        const parsed = parseSavedMealContent(meal)
        const open = expandedId === meal.id
        return (
          <Card key={meal.id} padded={false}>
            <div className="flex items-center gap-2 pl-4 pr-2 py-3">
              <button onClick={() => setExpandedId(open ? null : meal.id)} className="flex-1 min-w-0 text-left">
                <p className="text-[15px] font-bold text-ink truncate">{meal.name || meal.title}</p>
                <p className="text-[13px] text-muted tabular-nums">{Math.round(meal.calories || 0)} kcal · {macroLine(meal)} · {open ? 'Hide' : 'View'}</p>
              </button>
              <Button variant="soft" size="sm" onClick={() => onAddItems(parsed ? parsed.meals : [{ name: meal.name, meal_type: 'other', calories: meal.calories, protein_g: meal.protein_g, carbs_g: meal.carbs_g, fats_g: meal.fats_g }])}>
                <Plus size={15} /> {parsed && parsed.meals.length > 1 ? 'Add all' : 'Add'}
              </Button>
              <button onClick={() => onDelete(meal.id)} aria-label="Delete saved meal" className="w-10 h-10 rounded-full flex items-center justify-center text-faint hover:text-bad hover:bg-surface-2 shrink-0">
                <X size={18} />
              </button>
            </div>
            {open && (
              <div className="border-t border-line">
                {parsed ? (
                  <div className="divide-y divide-line">
                    {parsed.meals.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-muted">{capitalise(m.meal_type)}</p>
                          <p className="text-[15px] font-bold text-ink">{m.name}</p>
                          {m.description && <p className="text-[13px] text-muted">{m.description}</p>}
                          <p className="text-[13px] text-muted tabular-nums">{Math.round(m.calories || 0)} kcal · {macroLine(m)}</p>
                          {Array.isArray(m.ingredients) && m.ingredients.length > 0 && (
                            <div className="mt-1.5 rounded-[14px] bg-bg px-3 py-1 divide-y divide-line">
                              {m.ingredients.map((ing, n) => <IngredientLine key={n} item={{ ...ing, name: ing.label || ing.name }} />)}
                            </div>
                          )}
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => onAddItems([m])}>Add</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="px-4 py-3 text-[13px] text-muted leading-relaxed whitespace-pre-wrap font-sans">{meal.content}</pre>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

export default function FoodTab({
  client, setClient, showToast, foodLogs, setFoodLogs, refreshFoodLogs, savedMeals, setSavedMeals,
  nutritionTargets, setNutritionTargets, view, setView, addOpen, setAddOpen, onOpenAI,
}) {
  const today = toLocalDateStr()
  const [date, setDate] = useState(today)
  const [addMeal, setAddMeal] = useState(null)
  const [tdeeOpen, setTdeeOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // { food, item }
  const [editBusy, setEditBusy] = useState(false)

  // Fresh food logs whenever the tab opens or the day changes.
  useEffect(() => { refreshFoodLogs() }, [date, refreshFoodLogs])

  const dayLogs = logsForDate(foodLogs, date)
  const totals = foodTotals(dayLogs)
  const targets = nutritionTargetsFor(client, nutritionTargets)
  const meals = MEAL_ORDER.map((type) => ({ type, items: dayLogs.filter((f) => (MEAL_ORDER.includes(f.meal_type?.toLowerCase()) ? f.meal_type.toLowerCase() : 'other') === type) })).filter((m) => m.items.length > 0)
  const kcalLeft = targets.kcal - totals.kcal

  // One tap removes it; the toast offers Undo for a few seconds, which puts the same
  // values back as a new row.
  async function handleDeleteFood(food) {
    // Deleting the meal also removes its ingredients (on delete cascade).
    const { error } = await supabase.from('food_logs').delete().eq('id', food.id)
    if (error) {
      console.error('Delete food error:', error)
      showToast("Couldn't remove that. Try again.")
      return
    }
    setFoodLogs((prev) => prev.filter((f) => f.id !== food.id))
    showToast(`Removed ${food.food_name}`, { action: { label: 'Undo', onClick: () => undoDelete(food) } })
  }

  async function undoDelete(food) {
    const { log, error } = await restoreMeal(food)
    if (error) {
      console.error('Undo delete food error:', error)
      showToast("Couldn't put that back. Try adding it again.")
      return
    }
    setFoodLogs((prev) => [log, ...prev])
  }

  async function saveIngredient(grams) {
    if (!editTarget) return
    setEditBusy(true)
    const meal = editTarget.food
    const { log, removed, error } = await updateMealItem(meal, editTarget.item, grams)
    setEditBusy(false)
    if (error) {
      console.error('Update ingredient error:', error)
      showToast("Couldn't save that. Try again.")
      return
    }
    setEditTarget(null)
    if (removed) {
      setFoodLogs((prev) => prev.filter((f) => f.id !== meal.id))
      showToast(`Removed ${meal.food_name}`, { action: { label: 'Undo', onClick: () => undoDelete(meal) } })
      return
    }
    setFoodLogs((prev) => prev.map((f) => (f.id === log.id ? log : f)))
  }

  // Add a saved meal (or one dish from it) to the selected day, with its ingredients.
  async function handleAddMealItemsToLog(items) {
    try {
      const { added, error } = await logMeals({ clientId: client.id, date, meals: items })
      if (added.length > 0) setFoodLogs((prev) => [...added, ...prev])
      if (error) {
        console.error('Add meal error:', error)
        showToast("Couldn't add that to your log. Try again.")
        return
      }
      refreshFoodLogs()
      setView('log')
      showToast(`Added to ${date === today ? 'today' : formatDateLabel(date)}`)
    } catch (e) {
      console.error('Add meal exception:', e)
      showToast("Couldn't add that to your log. Try again.")
    }
  }

  async function handleDeleteSavedMeal(id) {
    if (!window.confirm("Delete this saved meal? You can't undo this.")) return
    try {
      const { error } = await supabase.from('saved_meals').delete().eq('id', id)
      if (error) throw error
      setSavedMeals((prev) => prev.filter((m) => m.id !== id))
    } catch (e) {
      console.error('Delete saved meal error:', e)
      showToast("Couldn't delete that meal. Try again.")
    }
  }

  function openAdd(meal) {
    setAddMeal(meal)
    setAddOpen(true)
  }

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),24px)] space-y-5">
      <PageTitle title="Nutrition" action={<Button variant="secondary" size="sm" onClick={onOpenAI}><Sparkles size={16} /> Ideas</Button>} />

      <DayNav date={date} onChange={setDate} max={today} />

      {savedMeals.length > 0 && (
        <Segmented value={view} onChange={setView} options={[{ value: 'log', label: 'Food log' }, { value: 'saved', label: 'Saved meals' }]} />
      )}

      {view === 'saved' && savedMeals.length > 0 ? (
        <SavedMeals savedMeals={savedMeals} onAddItems={handleAddMealItemsToLog} onDelete={handleDeleteSavedMeal} />
      ) : (
        <div className="space-y-3">
          <MealPlanCard client={client} />
          <Card>
            <NutritionSummary totals={totals} targets={targets} />
          </Card>
          {targets.kcal > 0 ? (
            <p className="text-[13px] text-muted text-center tabular-nums">
              {kcalLeft >= 0 ? `${kcalLeft.toLocaleString('en-AU')} kcal to go` : `${(-kcalLeft).toLocaleString('en-AU')} kcal above target`}
            </p>
          ) : (
            <p className="text-[13px] text-muted text-center">
              No daily target yet. Your coach can set one, or{' '}
              <button onClick={() => setTdeeOpen(true)} className="font-bold text-accent underline underline-offset-2">work yours out</button>.
            </p>
          )}

          <Button size="lg" block onClick={() => openAdd(null)}><Plus size={20} /> Log food</Button>

          {meals.map(({ type, items }) => {
            const t = foodTotals(items)
            return (
              <section key={type} className="pt-4">
                <SectionLabel
                  action={
                    <span className="flex items-center gap-1">
                      <span className="text-[13px] font-bold text-muted tabular-nums">{t.kcal} kcal</span>
                      <button onClick={() => openAdd(type)} aria-label={`Add to ${type}`} className="w-8 h-8 rounded-full flex items-center justify-center text-accent hover:bg-surface-2"><Plus size={18} /></button>
                    </span>
                  }
                >
                  {capitalise(type)}
                </SectionLabel>
                <Card padded={false} className="divide-y divide-line">
                  {items.map((f) => (
                    <FoodRow key={f.id} food={f} onDelete={handleDeleteFood} onEditItem={(food, item) => setEditTarget({ food, item })} />
                  ))}
                </Card>
              </section>
            )
          })}

          {/* Only when the coach hasn't set targets: theirs come first. */}
          {!client.calorie_target && (
            <div className="pt-4 flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => setTdeeOpen(true)} className="text-muted">
                <Calculator size={16} /> Work out my calorie target
              </Button>
            </div>
          )}
        </div>
      )}

      {addOpen && (
        <AddFoodSheet
          onClose={() => setAddOpen(false)}
          date={date}
          defaultMeal={addMeal}
          client={client}
          onAdded={(row) => { setFoodLogs((prev) => [row, ...prev]); refreshFoodLogs(); showToast(`Added ${row.food_name}`) }}
        />
      )}
      <EditIngredientSheet
        key={editTarget?.item?.id ?? 'none'}
        target={editTarget}
        onClose={() => setEditTarget(null)}
        busy={editBusy}
        onSave={saveIngredient}
        onRemove={() => saveIngredient(null)}
      />
      <TdeeSheet
        open={tdeeOpen}
        onClose={() => setTdeeOpen(false)}
        client={client}
        onSaved={(t) => {
          setNutritionTargets(t)
          setClient((prev) => ({ ...prev, calorie_target: t.calories, protein_target_g: t.protein, carbs_target_g: t.carbs, fats_target_g: t.fats }))
          showToast('New targets saved')
        }}
      />
    </div>
  )
}

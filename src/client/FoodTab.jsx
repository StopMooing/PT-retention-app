// Food: pick a day, see calories and macros against targets, meals grouped by type, add
// food in a sheet, saved meals from the AI helper, and the calorie calculator tucked away.
// Plans and Recipes hold the on-demand meal plans and every recipe in them; a chosen plan
// puts the day's meals on the food log, ready to tick off.
// A meal with ingredients (from the AI or a saved meal) opens to show them; each amount
// can be changed or the ingredient removed, and the meal's totals follow.
import { useState, useEffect } from 'react'
import { Plus, X, Sparkles, Calculator, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../supabase'
import { Card, Button, Segmented, Sheet, Field, Hero, Mark } from '../ui'
import { toLocalDateStr, formatDateLabel, formatShortDate, addDays } from './dates'
import { logsForDate, foodTotals, nutritionTargetsFor } from './metrics'
import { MEAL_ORDER, capitalise, parseSavedMealContent } from './foods'
import AddFoodSheet from './AddFoodSheet'
import { mealItems, logMeals, updateMealItem, restoreMeal } from '../lib/meals'
import MealPlanCard from './MealPlanCard'
import WaterCard from './WaterCard'
import TdeeSheet from './TdeeSheet'
import RecipeSheet from './RecipeSheet'
import RecipesView from './RecipesView'
import PlansView from './PlansView'
import TodaysPlan from './TodaysPlan'
import { recipeAsMeal, planDayType } from '../lib/recipes'
import { fetchRecipes, fetchPlans, fetchPlanItems, fetchClientPlan, startPlan, stopPlan, planDay, closestPlan } from '../lib/mealLibrary'

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

// The big block at the top: calories to go (or eaten, with no target) and the three macros.
function NutritionHero({ totals, targets, onWorkOut }) {
  const has = targets.kcal > 0
  const left = targets.kcal - totals.kcal
  const n = (v) => Math.round(v).toLocaleString('en-AU')
  const macros = [
    { name: 'Protein', v: totals.protein, t: targets.protein },
    { name: 'Carbs', v: totals.carbs, t: targets.carbs },
    { name: 'Fats', v: totals.fats, t: targets.fats },
  ]
  const most = Math.max(1, ...macros.map((m) => m.v))
  return (
    <Hero>
      <p className="font-display text-[clamp(36px,11vw,44px)] leading-[0.95] tabular-nums">
        {!has ? `${n(totals.kcal)} kcal eaten` : left >= 0 ? `${n(left)} kcal to go` : `${n(-left)} kcal over`}
      </p>
      {has ? (
        <p className="text-[14px] text-hero-muted mt-1 tabular-nums">{n(totals.kcal)} of {n(targets.kcal)} kcal eaten</p>
      ) : (
        <p className="text-[14px] text-hero-muted mt-1">
          No daily target yet. Your coach can set one, or{' '}
          <button onClick={onWorkOut} className="font-semibold text-on-hero underline underline-offset-2">work yours out</button>.
        </p>
      )}
      <div className="mt-3.5 space-y-2.5">
        {macros.map((m) => {
          const pct = m.t > 0 ? Math.min(1, m.v / m.t) : m.v / most
          return (
            <div key={m.name}>
              <div className="flex justify-between text-[13px] font-semibold">
                <span>{m.name}</span>
                <span className="text-hero-muted tabular-nums">{m.t > 0 ? `${n(m.v)} of ${n(m.t)} g` : `${n(m.v)} g`}</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-hero-track overflow-hidden">
                <div className="h-full rounded-full bg-on-hero transition-all" style={{ width: `${pct * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </Hero>
  )
}

export default function FoodTab({
  client, setClient, showToast, foodLogs, setFoodLogs, refreshFoodLogs, savedMeals, setSavedMeals,
  nutritionTargets, setNutritionTargets, view, setView, addOpen, setAddOpen, onOpenAI,
  waterByDate, setWaterFor, loadWater,
}) {
  const today = toLocalDateStr()
  const [date, setDate] = useState(today)
  const [addMeal, setAddMeal] = useState(null)
  const [tdeeOpen, setTdeeOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // { food, item }
  const [editBusy, setEditBusy] = useState(false)

  // Meal plans and recipes. choice is the client's plan ({ plan_id, started_at }) or null;
  // undefined until it has loaded.
  const [library, setLibrary] = useState(null) // { recipes, plans }
  const [libraryFailed, setLibraryFailed] = useState(false)
  const [choice, setChoice] = useState(undefined)
  const [planItems, setPlanItems] = useState(null)
  const [planBusy, setPlanBusy] = useState(false)
  const [recipeOpen, setRecipeOpen] = useState(null) // { recipe, servings, meal, planItemId }
  const [recipeBusy, setRecipeBusy] = useState(false)
  const [tickBusyId, setTickBusyId] = useState(null)
  const [libraryTry, setLibraryTry] = useState(0)

  // Which plan the client is on. The library itself loads only when it is needed.
  useEffect(() => {
    let live = true
    fetchClientPlan(client.id)
      .then((c) => live && setChoice(c))
      .catch((e) => { console.error('Meal plan choice load error:', e); if (live) setChoice(null) })
    return () => { live = false }
  }, [client.id])

  const needLibrary = !!choice || view === 'plans' || view === 'recipes'
  useEffect(() => {
    if (!needLibrary || library) return
    let live = true
    Promise.all([fetchRecipes(), fetchPlans()])
      .then(([recipes, plans]) => live && setLibrary({ recipes, plans }))
      .catch((e) => { console.error('Meal library load error:', e); if (live) setLibraryFailed(true) })
    return () => { live = false }
  }, [needLibrary, library, libraryTry])

  useEffect(() => {
    if (!choice?.plan_id) return
    let live = true
    fetchPlanItems(choice.plan_id).then((d) => live && setPlanItems(d)).catch((e) => console.error('Plan meals load error:', e))
    return () => { live = false }
  }, [choice?.plan_id])

  // Fresh food logs whenever the tab opens or the day changes.
  useEffect(() => { refreshFoodLogs(date) }, [date, refreshFoodLogs])

  const dayLogs = logsForDate(foodLogs, date)
  const totals = foodTotals(dayLogs)
  const targets = nutritionTargetsFor(client, nutritionTargets)
  const myPlan = choice && library ? library.plans.find((p) => p.id === choice.plan_id) : null
  const dayType = planDayType(date)
  const myDay = myPlan && planItems && planItems[0]?.plan_id === myPlan.id ? planDay(planItems, library.recipes, dayType) : null
  const meals = MEAL_ORDER.map((type) => ({ type, items: dayLogs.filter((f) => (MEAL_ORDER.includes(f.meal_type?.toLowerCase()) ? f.meal_type.toLowerCase() : 'other') === type) })).filter((m) => m.items.length > 0)

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
      refreshFoodLogs(date)
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

  // Log a recipe (from Recipes, a plan, or today's plan) with all its ingredients.
  async function logRecipe(recipe, servings, mealType, planItemId) {
    const { added, error } = await logMeals({ clientId: client.id, date, meals: [recipeAsMeal(recipe, recipe.recipe_ingredients, servings, mealType, planItemId)] })
    if (added.length > 0) setFoodLogs((prev) => [...added, ...prev])
    if (error) {
      console.error('Log recipe error:', error)
      showToast("Couldn't add that to your log. Try again.")
      return false
    }
    refreshFoodLogs(date)
    return true
  }

  // Only a meal from the client's own plan counts as ticking it off.
  const planItemFor = (m) => (m?.item && m.item.plan_id === choice?.plan_id ? m.item.id : null)

  async function addFromRecipeSheet({ servings, meal }) {
    const { recipe, planItemId } = recipeOpen
    setRecipeBusy(true)
    const ok = await logRecipe(recipe, servings, meal, planItemId)
    setRecipeBusy(false)
    if (!ok) return
    setRecipeOpen(null)
    setView('log')
    showToast(`Added to ${meal} ${date === today ? 'today' : `on ${formatDateLabel(date)}`}`)
  }

  async function tickMeal(m) {
    setTickBusyId(m.item.id)
    const ok = await logRecipe(m.recipe, m.servings, m.item.meal_type, m.item.id)
    setTickBusyId(null)
    if (ok) showToast(`${capitalise(m.item.meal_type)} ticked off`)
  }

  function openPlanMeal(m) {
    setRecipeOpen({ recipe: m.recipe, servings: m.servings, meal: m.item.meal_type, planItemId: planItemFor(m) })
  }

  // Starting a plan with no daily target yet makes the plan's numbers the target.
  async function handleStartPlan(plan) {
    setPlanBusy(true)
    const { choice: next, error } = await startPlan(client.id, plan.id)
    if (error) {
      setPlanBusy(false)
      console.error('Start plan error:', error)
      showToast("Couldn't start that plan. Try again.")
      return false
    }
    let setTargets = false
    if (!client.calorie_target) {
      const t = { calories: plan.target_calories, protein: plan.target_protein_g, carbs: plan.target_carbs_g, fats: plan.target_fats_g }
      const { error: tErr } = await supabase.from('clients')
        .update({ calorie_target: t.calories, protein_target_g: t.protein, carbs_target_g: t.carbs, fats_target_g: t.fats })
        .eq('id', client.id)
      if (tErr) console.error('Plan targets error:', tErr)
      else {
        setTargets = true
        setNutritionTargets(t)
        setClient((prev) => ({ ...prev, calorie_target: t.calories, protein_target_g: t.protein, carbs_target_g: t.carbs, fats_target_g: t.fats }))
      }
    }
    setPlanBusy(false)
    setPlanItems(null)
    setChoice(next)
    setView('log')
    setDate(today)
    showToast(setTargets ? "Plan started. Your daily targets now match it." : "Plan started. Today's meals are on your food log.")
    return true
  }

  async function handleStopPlan() {
    const was = myPlan
    setPlanBusy(true)
    const { error } = await stopPlan(client.id)
    setPlanBusy(false)
    if (error) {
      console.error('Stop plan error:', error)
      showToast("Couldn't stop that plan. Try again.")
      return false
    }
    setChoice(null)
    setPlanItems(null)
    showToast('Plan stopped', was ? { action: { label: 'Undo', onClick: () => handleStartPlan(was) } } : undefined)
    return true
  }

  function openAdd(meal) {
    setAddMeal(meal)
    setAddOpen(true)
  }

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),24px)] space-y-5">
      <div className="flex items-center justify-between gap-3 px-1">
        <h1 className="font-display text-[40px] leading-none text-ink">Nutrition</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => setDate(addDays(date, -1))} aria-label="Previous day" className="w-9 h-9 rounded-full flex items-center justify-center text-ink hover:bg-surface-2"><ChevronLeft size={20} /></button>
          <span className="text-[15px] font-bold text-ink min-w-[64px] text-center">{date === today ? 'Today' : formatShortDate(date)}</span>
          <button onClick={() => { const n = addDays(date, 1); if (n <= today) setDate(n) }} disabled={date >= today} aria-label="Next day" className="w-9 h-9 rounded-full flex items-center justify-center text-ink hover:bg-surface-2 disabled:opacity-30"><ChevronRight size={20} /></button>
        </div>
      </div>

      <Segmented
        value={view}
        onChange={setView}
        className="[&>button]:px-2"
        options={[
          { value: 'log', label: 'Food log' },
          { value: 'plans', label: 'Plans' },
          { value: 'recipes', label: 'Recipes' },
          ...(savedMeals.length > 0 ? [{ value: 'saved', label: 'Saved' }] : []),
        ]}
      />

      {(view === 'plans' || view === 'recipes') && !library ? (
        libraryFailed ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-[15px] text-muted">Couldn't load the {view === 'plans' ? 'meal plans' : 'recipes'}.</p>
            <Button variant="secondary" onClick={() => { setLibraryFailed(false); setLibraryTry((n) => n + 1) }}>Try again</Button>
          </div>
        ) : (
          <div className="flex justify-center py-12"><Mark size={36} className="animate-pulse" /></div>
        )
      ) : view === 'plans' ? (
        <PlansView
          plans={library.plans}
          recipes={library.recipes}
          choice={choice}
          startSex={(myPlan || closestPlan(library.plans, targets.kcal))?.sex}
          startGoal={(myPlan || closestPlan(library.plans, targets.kcal))?.goal}
          busy={planBusy}
          onStart={handleStartPlan}
          onStop={handleStopPlan}
          onOpenRecipe={openPlanMeal}
        />
      ) : view === 'recipes' ? (
        <RecipesView recipes={library.recipes} onOpen={(r) => setRecipeOpen({ recipe: r, servings: 1, meal: r.meal_type, planItemId: null })} />
      ) : view === 'saved' && savedMeals.length > 0 ? (
        <SavedMeals savedMeals={savedMeals} onAddItems={handleAddMealItemsToLog} onDelete={handleDeleteSavedMeal} />
      ) : (
        <div className="space-y-3">
          <NutritionHero totals={totals} targets={targets} onWorkOut={() => setTdeeOpen(true)} />

          <Button size="lg" block onClick={() => openAdd(null)}><Plus size={20} /> Log food</Button>

          <TodaysPlan
            plan={myPlan}
            day={myDay}
            dayType={dayType}
            isToday={date === today}
            dayLogs={dayLogs}
            busyId={tickBusyId}
            onTick={tickMeal}
            onUntick={handleDeleteFood}
            onOpen={openPlanMeal}
          />

          {meals.length > 0 && (
            <Card padded={false} className="divide-y divide-line overflow-hidden">
              {meals.map(({ type, items }) => {
                const t = foodTotals(items)
                return (
                  <div key={type} className="divide-y divide-line">
                    <div className="flex items-center gap-2 pl-4 pr-2 pt-3 pb-1.5">
                      <p className="flex-1 text-[13px] font-semibold text-muted">{capitalise(type)}</p>
                      <span className="text-[13px] font-bold text-ink tabular-nums">{t.kcal.toLocaleString('en-AU')} kcal</span>
                      <button onClick={() => openAdd(type)} aria-label={`Add to ${type}`} className="w-8 h-8 rounded-full flex items-center justify-center text-ink hover:bg-surface-2"><Plus size={18} /></button>
                    </div>
                    {items.map((f) => (
                      <FoodRow key={f.id} food={f} onDelete={handleDeleteFood} onEditItem={(food, item) => setEditTarget({ food, item })} />
                    ))}
                  </div>
                )
              })}
            </Card>
          )}

          <WaterCard client={client} date={date} showToast={showToast} logs={waterByDate[date]} setLogs={(update) => setWaterFor(date, update)} onLoad={loadWater} />

          <MealPlanCard client={client} />

          <Button variant="secondary" size="lg" block onClick={onOpenAI} className="!bg-transparent"><Sparkles size={18} /> Meal ideas with AI</Button>

          {/* Only when the coach hasn't set targets: theirs come first. */}
          {!client.calorie_target && targets.kcal > 0 && (
            <div className="flex justify-center">
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
          onAdded={(row) => { setFoodLogs((prev) => [row, ...prev]); refreshFoodLogs(date); showToast(`Added ${row.food_name}`) }}
        />
      )}
      {recipeOpen && (
        <RecipeSheet
          key={`${recipeOpen.recipe.id}:${recipeOpen.planItemId ?? ''}`}
          open
          recipe={recipeOpen.recipe}
          servings={recipeOpen.servings}
          meal={recipeOpen.meal}
          busy={recipeBusy}
          onClose={() => setRecipeOpen(null)}
          onAdd={addFromRecipeSheet}
          addLabel={recipeOpen.planItemId ? 'Tick off and log' : undefined}
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

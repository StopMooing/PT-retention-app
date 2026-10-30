// Food: pick a day, see calories and macros against targets, meals grouped by type, add
// food in a sheet, saved meals from the AI helper, and the calorie calculator tucked away.
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Sparkles, Calculator } from 'lucide-react'
import { supabase } from '../supabase'
import { PageTitle, Card, Button, Segmented, SectionLabel } from '../ui'
import { toLocalDateStr, addDays, formatDateLabel } from './dates'
import { logsForDate, foodTotals, nutritionTargetsFor } from './metrics'
import { MEAL_ORDER, capitalise, parseSavedMealContent } from './foods'
import { NutritionSummary } from './common'
import AddFoodSheet from './AddFoodSheet'
import TdeeSheet from './TdeeSheet'

const macroLine = (f) => `P ${Math.round(f.protein_g || 0)} · C ${Math.round(f.carbs_g || 0)} · F ${Math.round(f.fats_g || 0)}`

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
                          <p className="text-[13px] text-muted tabular-nums">{m.calories} kcal · {macroLine(m)}</p>
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
    const row = { ...food }
    delete row.id
    const { data, error } = await supabase.from('food_logs').insert(row).select().single()
    if (error) {
      console.error('Undo delete food error:', error)
      showToast("Couldn't put that back. Try adding it again.")
      return
    }
    setFoodLogs((prev) => [data, ...prev])
  }

  // Add a saved meal (or one dish from it) to the selected day.
  async function handleAddMealItemsToLog(items) {
    try {
      const rows = items.map((item) => ({
        client_id: client.id,
        food_name: item.name,
        meal_type: item.meal_type || 'other',
        calories: item.calories || 0,
        protein_g: item.protein_g || 0,
        carbs_g: item.carbs_g || 0,
        fats_g: item.fats_g || 0,
        logged_at: new Date(date + 'T12:00:00').toISOString(),
      }))
      const { data, error } = await supabase.from('food_logs').insert(rows).select()
      if (error) {
        console.error('Add meal error:', error)
        showToast("Couldn't add that to your log. Try again.")
        return
      }
      setFoodLogs((prev) => [...(data ?? []), ...prev])
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

      <div className="flex items-center gap-2">
        <button onClick={() => setDate(addDays(date, -1))} aria-label="Previous day" className="w-11 h-11 rounded-full flex items-center justify-center text-ink bg-surface border border-line hover:bg-surface-2">
          <ChevronLeft size={20} />
        </button>
        <p className="flex-1 text-center text-[17px] font-bold text-ink">{formatDateLabel(date)}</p>
        <button disabled={date >= today} onClick={() => { const n = addDays(date, 1); if (n <= today) setDate(n) }} aria-label="Next day" className="w-11 h-11 rounded-full flex items-center justify-center text-ink bg-surface border border-line hover:bg-surface-2 disabled:opacity-30">
          <ChevronRight size={20} />
        </button>
      </div>

      {savedMeals.length > 0 && (
        <Segmented value={view} onChange={setView} options={[{ value: 'log', label: 'Food log' }, { value: 'saved', label: 'Saved meals' }]} />
      )}

      {view === 'saved' && savedMeals.length > 0 ? (
        <SavedMeals savedMeals={savedMeals} onAddItems={handleAddMealItemsToLog} onDelete={handleDeleteSavedMeal} />
      ) : (
        <div className="space-y-3">
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
                    <div key={f.id} className="flex items-center gap-2 pl-4 pr-2 py-3 min-h-[56px]">
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-ink truncate">{f.food_name}</p>
                        <p className="text-[13px] text-muted tabular-nums">{Math.round(f.calories || 0)} kcal · {macroLine(f)}</p>
                      </div>
                      <button onClick={() => handleDeleteFood(f)} aria-label={`Remove ${f.food_name}`} className="w-10 h-10 rounded-full flex items-center justify-center text-faint hover:text-bad hover:bg-surface-2 shrink-0">
                        <X size={18} />
                      </button>
                    </div>
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

// A meal with ingredients: one food_logs row (its totals, so every existing total keeps
// working) plus food_log_items rows for what is in it. AI meals arrive with ingredients
// already checked against the food database (api/chat.js). Used by the client Nutrition
// tab and the coach's view of a client, so both show the same thing.
import { supabase } from '../supabase'

export const FOOD_LOG_SELECT = '*, food_log_items(id, position, name, food_id, grams, calories, protein_g, carbs_g, fats_g, estimated)'

const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10
const MACROS = ['calories', 'protein_g', 'carbs_g', 'fats_g']

// Ingredients in their saved order.
export function mealItems(log) {
  return [...(log?.food_log_items ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
}

// Meal totals are always the sum of the ingredients.
export function itemsTotals(items) {
  const t = {}
  for (const k of MACROS) t[k] = k === 'calories' ? Math.round(items.reduce((s, i) => s + (Number(i[k]) || 0), 0)) : round1(items.reduce((s, i) => s + (Number(i[k]) || 0), 0))
  return t
}

// Same food, new amount: every number scales with the grams.
export function rescaleItem(item, grams) {
  const from = Number(item.grams) || 0
  if (!from || !(grams > 0)) return item
  const f = grams / from
  return { ...item, grams, calories: Math.round((Number(item.calories) || 0) * f), protein_g: round1(item.protein_g * f), carbs_g: round1(item.carbs_g * f), fats_g: round1(item.fats_g * f) }
}

// Logs meals from an AI reply or a saved meal on a day. One meal at a time, so each
// meal's ingredients attach to the right row. Returns the new rows with their items.
export async function logMeals({ clientId, date, meals }) {
  const added = []
  for (const meal of meals) {
    const items = (Array.isArray(meal.ingredients) ? meal.ingredients : []).filter((i) => i && (i.label || i.name))
    const totals = items.length > 0 ? itemsTotals(items) : { calories: Number(meal.calories) || 0, protein_g: Number(meal.protein_g) || 0, carbs_g: Number(meal.carbs_g) || 0, fats_g: Number(meal.fats_g) || 0 }
    const { data: row, error } = await supabase.from('food_logs').insert({
      client_id: clientId,
      food_name: String(meal.name || 'Meal').slice(0, 200),
      meal_type: meal.meal_type || 'other',
      ...totals,
      logged_at: date,
    }).select().single()
    if (error) return { added, error }
    let saved = []
    if (items.length > 0) {
      const { data, error: itemsError } = await supabase.from('food_log_items').insert(items.map((i, n) => ({
        food_log_id: row.id,
        position: n,
        name: String(i.label || i.name).slice(0, 200),
        food_id: i.food_id || null,
        grams: Number(i.grams) > 0 ? Number(i.grams) : null,
        calories: Math.max(0, Math.round(Number(i.calories) || 0)),
        protein_g: Math.max(0, round1(i.protein_g)),
        carbs_g: Math.max(0, round1(i.carbs_g)),
        fats_g: Math.max(0, round1(i.fats_g)),
        estimated: !!i.estimated || !i.food_id,
      }))).select()
      if (itemsError) console.error('Meal ingredients error:', itemsError)
      saved = data ?? []
    }
    added.push({ ...row, food_log_items: saved })
  }
  return { added, error: null }
}

// Change one ingredient's amount, or remove it (grams null), then make the meal's
// totals the sum of what is left. Returns the updated meal row with its items.
export async function updateMealItem(log, item, grams) {
  const items = mealItems(log)
  let next
  if (grams == null) {
    // Last ingredient gone: the meal goes too (its items cascade with it).
    if (items.length <= 1) {
      const { error } = await supabase.from('food_logs').delete().eq('id', log.id)
      if (error) return { error }
      return { log: null, removed: true, error: null }
    }
    const { error } = await supabase.from('food_log_items').delete().eq('id', item.id)
    if (error) return { error }
    next = items.filter((i) => i.id !== item.id)
  } else {
    const scaled = rescaleItem(item, grams)
    const { error } = await supabase.from('food_log_items')
      .update({ grams: scaled.grams, calories: scaled.calories, protein_g: scaled.protein_g, carbs_g: scaled.carbs_g, fats_g: scaled.fats_g })
      .eq('id', item.id)
    if (error) return { error }
    next = items.map((i) => (i.id === item.id ? scaled : i))
  }
  const totals = itemsTotals(next)
  const { data, error } = await supabase.from('food_logs').update(totals).eq('id', log.id).select().single()
  if (error) return { error }
  return { log: { ...data, food_log_items: next }, error: null }
}

// Puts a removed meal back (Undo), ingredients included.
export async function restoreMeal(log) {
  const row = { ...log }
  const items = mealItems(log)
  delete row.id
  delete row.food_log_items
  const { data, error } = await supabase.from('food_logs').insert(row).select().single()
  if (error) return { error }
  let saved = []
  if (items.length > 0) {
    const { data: d } = await supabase.from('food_log_items').insert(items.map((i) => { const copy = { ...i, food_log_id: data.id }; delete copy.id; return copy })).select()
    saved = d ?? []
  }
  return { log: { ...data, food_log_items: saved }, error: null }
}

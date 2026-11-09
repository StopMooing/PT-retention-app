// Reading the recipe and on-demand meal plan library, and the plan a client has chosen.
// The library never changes while the app is open, so it is fetched once and kept.
// Numbers for a plan day come from planDay() here, so the plan screens, today's plan on
// the food log and what gets logged always agree.
import { supabase } from '../supabase'
import { scaleRecipe, sumMacros, planDayType, MEAL_TYPES } from './recipes'

const RECIPE_SELECT = 'id, slug, family, day_type, meal_type, name, description, prep_minutes, cook_minutes, steps, tip, diets, calories, protein_g, carbs_g, fats_g, position, photo_url, photo_thumb_url, photo_credit, photo_credit_url, recipe_ingredients(id, position, label, food_id, grams, measure, each_label, each_grams, calories, protein_g, carbs_g, fats_g)'
const PLAN_SELECT = 'id, slug, family, family_name, sex, goal, name, description, ref_weight_kg, ref_height_cm, ref_age, activity_factor, maintenance_calories, target_calories, target_protein_g, target_carbs_g, target_fats_g, avg_calories, avg_protein_g, avg_carbs_g, avg_fats_g, position'

// Fetch once, share the answer; a failed fetch is forgotten so the next call retries.
function once(load) {
  let p = null
  return () => {
    if (!p) p = load().catch((e) => { p = null; throw e })
    return p
  }
}

export const fetchRecipes = once(async () => {
  const { data, error } = await supabase.from('recipes').select(RECIPE_SELECT).order('position')
  if (error) throw error
  return (data ?? []).map((r) => ({ ...r, recipe_ingredients: [...(r.recipe_ingredients ?? [])].sort((a, b) => a.position - b.position) }))
})

export const fetchPlans = once(async () => {
  const { data, error } = await supabase.from('meal_plan_library').select(PLAN_SELECT).order('position')
  if (error) throw error
  return data ?? []
})

const itemsByPlan = new Map()
export function fetchPlanItems(planId) {
  if (!itemsByPlan.has(planId)) {
    const p = supabase.from('meal_plan_library_items').select('id, plan_id, day_type, meal_type, position, recipe_id, servings').eq('plan_id', planId)
      .then(({ data, error }) => {
        if (error) throw error
        return data ?? []
      })
      .catch((e) => { itemsByPlan.delete(planId); throw e })
    itemsByPlan.set(planId, p)
  }
  return itemsByPlan.get(planId)
}

// The client's chosen plan: { plan_id, started_at } or null.
export async function fetchClientPlan(clientId) {
  const { data, error } = await supabase.from('client_meal_plans').select('plan_id, started_at').eq('client_id', clientId).maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function startPlan(clientId, planId) {
  const row = { client_id: clientId, plan_id: planId, started_at: new Date().toISOString() }
  const { error } = await supabase.from('client_meal_plans').upsert(row, { onConflict: 'client_id' })
  return { choice: error ? null : { plan_id: planId, started_at: row.started_at }, error }
}

export async function stopPlan(clientId) {
  const { error } = await supabase.from('client_meal_plans').delete().eq('client_id', clientId)
  return { error }
}

// One day of a plan: its meals in order (breakfast, lunch, dinner, snack), each with its
// recipe, serves and scaled ingredients, plus the day's totals.
export function planDay(items, recipes, dayType) {
  const byId = new Map(recipes.map((r) => [r.id, r]))
  const meals = (items ?? [])
    .filter((i) => i.day_type === dayType && byId.has(i.recipe_id))
    .sort((a, b) => MEAL_TYPES.indexOf(a.meal_type) - MEAL_TYPES.indexOf(b.meal_type))
    .map((item) => {
      const recipe = byId.get(item.recipe_id)
      const servings = Number(item.servings) || 1
      const ingredients = scaleRecipe(recipe.recipe_ingredients, servings)
      return { item, recipe, servings, ingredients, totals: sumMacros(ingredients) }
    })
  return { meals, totals: sumMacros(meals.map((m) => m.totals)) }
}

export const planDayFor = (items, recipes, dateStr) => planDay(items, recipes, planDayType(dateStr))

// The plan nearest a calorie target, so the plan picker can open on the right version.
export function closestPlan(plans, kcal) {
  if (!(kcal > 0) || !plans.length) return null
  return plans.reduce((best, p) => (Math.abs(p.avg_calories - kcal) < Math.abs(best.avg_calories - kcal) ? p : best))
}

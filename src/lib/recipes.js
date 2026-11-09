// Recipes and on-demand meal plans: scaling a recipe to a number of serves and turning it
// into food log ingredients. The meal plan builder (tools/meal-library) uses the same
// functions, so a plan's totals and what gets logged always match.

const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10

// Sensible kitchen amounts: whole grams for small things, 5 g steps for bigger ones.
function roundGrams(g) {
  if (g >= 50) return Math.round(g / 5) * 5
  if (g >= 5) return Math.round(g)
  return Math.round(g * 2) / 2
}

// One ingredient for a number of serves. Counted foods (eggs) stay whole.
// ing: { label, food_id, grams, measure, each_label, each_grams, calories, protein_g, carbs_g, fats_g } for 1 serve.
export function scaleIngredient(ing, servings = 1) {
  const base = Number(ing.grams) || 0
  let grams = base * servings
  let count = null
  if (ing.each_grams) {
    count = Math.max(1, Math.round(grams / ing.each_grams))
    grams = count * ing.each_grams
  } else {
    grams = roundGrams(grams)
  }
  const f = base > 0 ? grams / base : 0
  return {
    label: ing.label,
    food_id: ing.food_id ?? null,
    grams,
    count,
    each_label: ing.each_label ?? null,
    measure: servings === 1 ? ing.measure ?? null : null,
    calories: Math.round((Number(ing.calories) || 0) * f),
    protein_g: round1((Number(ing.protein_g) || 0) * f),
    carbs_g: round1((Number(ing.carbs_g) || 0) * f),
    fats_g: round1((Number(ing.fats_g) || 0) * f),
  }
}

export function scaleRecipe(ingredients, servings = 1) {
  return [...(ingredients ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((i) => scaleIngredient(i, servings))
}

export function sumMacros(items) {
  const t = { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 }
  for (const i of items) {
    t.calories += Number(i.calories) || 0
    t.protein_g += Number(i.protein_g) || 0
    t.carbs_g += Number(i.carbs_g) || 0
    t.fats_g += Number(i.fats_g) || 0
  }
  return { calories: Math.round(t.calories), protein_g: round1(t.protein_g), carbs_g: round1(t.carbs_g), fats_g: round1(t.fats_g) }
}

// A recipe's totals for a number of serves, from its ingredients. The recipe list and the
// recipe sheet both use this, so they always show the same numbers.
export function recipeTotals(recipe, servings = 1) {
  return sumMacros(scaleRecipe(recipe?.recipe_ingredients, servings))
}

// "25 min": prep plus cooking time, or null when there is none.
export function recipeTime(r) {
  const total = (r?.prep_minutes || 0) + (r?.cook_minutes || 0)
  return total > 0 ? `${total} min` : null
}

// "2 eggs", "150 g", or the household measure for one serve.
export function amountText(i) {
  if (i.count) return `${i.count} ${i.each_label}${i.count === 1 ? '' : 's'}`
  return `${i.grams} g`
}

// What logMeals (src/lib/meals.js) needs: a meal with its ingredients. planItemId marks
// it as a planned meal, so today's plan shows it ticked off.
export function recipeAsMeal(recipe, ingredients, servings, mealType, planItemId = null) {
  const items = scaleRecipe(ingredients, servings)
  return {
    name: servings === 1 ? recipe.name : `${recipe.name} (${formatServes(servings)} serves)`,
    meal_type: mealType,
    recipe_id: recipe.id ?? null,
    plan_item_id: planItemId,
    ingredients: items.map((i) => ({
      name: i.count ? `${i.label} (${amountText(i)})` : i.label,
      food_id: i.food_id,
      grams: i.grams,
      calories: i.calories,
      protein_g: i.protein_g,
      carbs_g: i.carbs_g,
      fats_g: i.fats_g,
      estimated: !i.food_id,
    })),
  }
}

export function formatServes(s) {
  const n = Math.round(Number(s) * 100) / 100
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '')
}

// Day types: A is Monday, Wednesday and Friday; B is Tuesday, Thursday and Saturday;
// C is Sunday. dateStr is 'YYYY-MM-DD' (local).
export function planDayType(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay() // 0 Sunday
  if (dow === 0) return 'C'
  return dow % 2 === 1 ? 'A' : 'B'
}

export const DAY_TYPES = [
  { id: 'A', label: 'Mon, Wed, Fri' },
  { id: 'B', label: 'Tue, Thu, Sat' },
  { id: 'C', label: 'Sunday' },
]

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export const PLAN_FAMILIES = {
  balanced: { name: 'Everyday balanced', blurb: 'Familiar Aussie food: chicken, lean beef, eggs, oats, rice and plenty of veg.' },
  budget: { name: 'Quick and budget', blurb: 'Cheap staples and pantry meals. Quick breakfasts, lunches and snacks, and one-pan or one-tray dinners.' },
  mediterranean: { name: 'Mediterranean', blurb: 'Olive oil, Greek yoghurt, chicken, lamb, legumes, wholegrains and salads.' },
  vegetarian: { name: 'Vegetarian', blurb: 'No meat or fish. Eggs, dairy, beans, lentils, paneer and halloumi carry the protein.' },
  vegan: { name: 'Vegan', blurb: 'Fully plant based. Tofu, lentils, chickpeas, edamame and soy milk.' },
  pescatarian: { name: 'Pescatarian', blurb: 'No meat. Salmon, prawns, tuna and white fish, plus eggs and dairy.' },
  highprotein: { name: 'High protein', blurb: 'About a third of your calories from protein. Eggs, lean meat, fish and dairy at every meal.' },
  glutenfree: { name: 'Gluten free', blurb: 'No wheat, barley, rye or oats. Check packaged foods are labelled gluten free.' },
  dairyfree: { name: 'Dairy free', blurb: 'No milk, cheese, yoghurt or butter. Eggs, meat, fish, tofu and soy milk carry the protein.' },
}

export const GOALS = {
  cut: { name: 'Cutting', blurb: 'To lose fat: 500 kcal under maintenance.' },
  maintain: { name: 'Maintenance', blurb: 'To hold your weight and keep training well.' },
  bulk: { name: 'Bulking', blurb: 'To build muscle: 300 kcal over maintenance.' },
}

// Who the plans are built for (ABS National Health Survey 2017-18, the typical
// Australian adult), training 3 to 5 days a week.
export const REFERENCE = {
  male: { weightKg: 87, heightCm: 175, age: 38, label: 'the average Australian man: 87 kg, 175 cm, 38 years old' },
  female: { weightKg: 72, heightCm: 161, age: 38, label: 'the average Australian woman: 72 kg, 161 cm, 38 years old' },
}

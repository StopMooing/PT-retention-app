// Builds the recipe and on-demand meal plan library.
//
//   node tools/meal-library/build.mjs            report only
//   node tools/meal-library/build.mjs --write supabase/migrations/<14-digit version>
//                                                also writes the four seed migrations
//
// The seed was applied on 2026-11-05 as migrations 20261105075343, 075641, 080039 and
// 080146. Its inserts skip rows that already exist, so changing a recipe or plan after
// that needs its own migration that updates the rows (run through the SQL Editor), like
// 20261105090000_meal_library_exact_foods, which moved 9 ingredients onto exact foods.
// Every food a recipe uses must be in foods.json and the foods table, so it can be found
// in Log food; recipe names for foods go in food_search_terms.
//
// Recipes come from recipes-*.cjs, every ingredient is matched to a food in the foods
// table (food-map.cjs, foods.json), and each plan's portions are scaled to the calorie
// target from src/lib/nutritionTargets.js, the same formula as the app's calculator.
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { maintenanceCalories, goalCalories, macroTargets, ACTIVITY } from '../../src/lib/nutritionTargets.js'
import { scaleRecipe, sumMacros, PLAN_FAMILIES, GOALS, REFERENCE, MEAL_TYPES } from '../../src/lib/recipes.js'

const require = createRequire(import.meta.url)
const recipes = [...require('./recipes-1.cjs'), ...require('./recipes-2.cjs'), ...require('./recipes-3.cjs'), ...require('./recipes-4.cjs')]
const foodMap = require('./food-map.cjs')
const foods = require('./foods.json')

const uuid = (s) => {
  const h = createHash('md5').update('unfnshd-meal-library:' + s).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`
}
const r1 = (n) => Math.round(n * 10) / 10
// Diets come from what is in the recipe, so a cheese toastie from Everyday balanced still
// shows under Vegetarian. Bread, pasta and the like are taken as plant based.
const MEAT = /^(Beef|Lamb|Chicken|Ham|Sausage|Pork|Bacon)\b/
const FISH = /^(Tuna|Salmon|Prawn|Barramundi|Fish)\b/
const ANIMAL = /^(Egg|Milk, cow|Yoghurt|Cheese|Butter|Honey|Protein powder, whey|Mayonnaise)\b/
// Gluten: wheat, barley, rye and oats (Australia does not count oats as gluten free), and
// packaged foods that usually contain wheat (soy sauce, sausages, seasoning mixes, sweet
// chilli sauce, baked beans, malt-style vinegar). Dairy: milk, yoghurt, cheese, butter, whey.
const GLUTEN = /^(Bagel|Biscuit, savoury, from wholemeal|Bread|Breadcrumbs|Bulgur|Couscous|Flour, wheat|Muesli|Oats|Pasta|Sauce, soy|Sausage|Taco seasoning|Baked beans|Sauce, sweet chilli|Vinegar \(except)/
const DAIRY = /^(Milk, cow|Yoghurt|Cheese|Butter|Protein powder, whey)/
function dietsOf(foodNames) {
  const free = [...(foodNames.some((n) => GLUTEN.test(n)) ? [] : ['glutenfree']), ...(foodNames.some((n) => DAIRY.test(n)) ? [] : ['dairyfree'])]
  if (foodNames.some((n) => MEAT.test(n))) return free
  if (foodNames.some((n) => FISH.test(n))) return ['pescatarian', ...free]
  if (foodNames.some((n) => ANIMAL.test(n))) return ['vegetarian', 'pescatarian', ...free]
  return ['vegan', 'vegetarian', 'pescatarian', ...free]
}
const FAMILY_DIET = { vegetarian: 'vegetarian', vegan: 'vegan', pescatarian: 'pescatarian', glutenfree: 'glutenfree', dairyfree: 'dairyfree' }
const FAMILY_ORDER = ['balanced', 'budget', 'mediterranean', 'vegetarian', 'vegan', 'pescatarian', 'highprotein', 'glutenfree', 'dairyfree']
const DAY_WEIGHT = { A: 3, B: 3, C: 1 }

// ---- recipes with their ingredients matched to foods
const problems = []
const built = recipes.map((r, ri) => {
  const ingredients = r.ing.map(([label, foodName, grams, measure, each], position) => {
    const name = foodMap[foodName] || foodName
    const f = foods[name]
    if (!f) problems.push(`${r.key}: no food for "${foodName}"`)
    const [food_id, kcal, p, c, fat] = f || [null, 0, 0, 0, 0]
    const k = grams / 100
    return {
      id: uuid(`${r.key}:ing:${position}`), position, label, food_id, grams, measure,
      each_label: each?.each ?? null, each_grams: each?.g ?? null,
      calories: r1(kcal * k), protein_g: r1(p * k), carbs_g: r1(c * k), fats_g: r1(fat * k),
    }
  })
  const totals = sumMacros(scaleRecipe(ingredients, 1))
  if (!MEAL_TYPES.includes(r.meal)) problems.push(`${r.key}: meal type ${r.meal}`)
  const diets = dietsOf(r.ing.map(([, foodName]) => foodMap[foodName] || foodName))
  if (FAMILY_DIET[r.family] && !diets.includes(FAMILY_DIET[r.family])) problems.push(`${r.key}: not ${FAMILY_DIET[r.family]}`)
  if (r.steps.some((s) => /\u2014/.test(s)) || /\u2014/.test(r.desc + r.name + (r.tip || ''))) problems.push(`${r.key}: em dash`)
  return { ...r, id: uuid(r.key), position: ri, ingredients, totals, diets }
})

// ---- plans: 9 styles x male/female x cut/maintain/bulk
const plans = []
for (const family of FAMILY_ORDER) {
  const fr = built.filter((r) => r.family === family)
  for (const sex of ['male', 'female']) {
    const ref = REFERENCE[sex]
    const maintenance = maintenanceCalories({ sex, weightKg: ref.weightKg, heightCm: ref.heightCm, age: ref.age, activity: ACTIVITY.moderate })
    for (const goal of ['cut', 'maintain', 'bulk']) {
      const target = macroTargets(goalCalories(maintenance, goal))
      const items = []
      const days = {}
      for (const day of ['A', 'B', 'C']) {
        const dayRecipes = MEAL_TYPES.map((m) => fr.find((r) => r.day === day && r.meal === m))
        if (dayRecipes.some((x) => !x)) { problems.push(`${family} day ${day} is missing a meal`); continue }
        const base = dayRecipes.reduce((s, r) => s + r.totals.calories, 0)
        const servings = Math.round((target.calories / base) / 0.05) * 0.05
        const scaled = dayRecipes.map((r) => sumMacros(scaleRecipe(r.ingredients, servings)))
        days[day] = sumMacros(scaled.map((t) => ({ calories: t.calories, protein_g: t.protein_g, carbs_g: t.carbs_g, fats_g: t.fats_g })))
        dayRecipes.forEach((r, i) => items.push({
          id: uuid(`${family}-${sex}-${goal}:${day}:${r.meal}`), day, meal: r.meal, position: i, recipe_id: r.id, servings: Number(servings.toFixed(2)),
        }))
      }
      const avg = (k) => Object.entries(days).reduce((s, [d, t]) => s + t[k] * DAY_WEIGHT[d], 0) / 7
      const slug = `${family}-${sex}-${goal}`
      plans.push({
        id: uuid(slug), slug, family, sex, goal, maintenance, target, days, items,
        avg: { calories: Math.round(avg('calories')), protein_g: Math.round(avg('protein_g')), carbs_g: Math.round(avg('carbs_g')), fats_g: Math.round(avg('fats_g')) },
        name: `${PLAN_FAMILIES[family].name}, ${sex}, ${GOALS[goal].name.toLowerCase()}`,
      })
    }
  }
}

// ---- report
console.log('Recipes:', built.length)
for (const family of FAMILY_ORDER) {
  const fr = built.filter((r) => r.family === family)
  const line = ['A', 'B', 'C'].map((d) => {
    const t = sumMacros(fr.filter((r) => r.day === d).map((r) => r.totals))
    return `${d} ${t.calories} kcal P${Math.round(t.protein_g)} (${Math.round(t.protein_g * 4 / t.calories * 100)}%)`
  }).join(' | ')
  console.log(family.padEnd(14), line)
}
console.log('\nPlans:', plans.length)
for (const p of plans) {
  const off = Math.round((p.avg.calories / p.target.calories - 1) * 1000) / 10
  const per = Object.entries(p.days).map(([d, t]) => `${d}:${t.calories}`).join(' ')
  console.log(p.slug.padEnd(30), 'target', p.target.calories, 'avg', p.avg.calories, `(${off}%)`, 'P', p.avg.protein_g, '/', p.target.protein, ' ', per)
}
if (problems.length) { console.log('\nPROBLEMS:\n' + problems.join('\n')); process.exitCode = 1 }

// ---- seed SQL
// Compact on purpose: the data travels as JSON and Postgres builds the rows. Ids are
// md5 of a fixed key, so re-running finds the same rows (on conflict do nothing).
// Ingredient macros are worked out in the database from the foods table.
// --refresh <file> writes one migration that updates the live library in place (same ids,
// so chosen plans and ticked meals stay linked). It needs the SQL Editor (it updates rows).
const WRITE = process.argv.includes('--write'), REFRESH = process.argv.includes('--refresh')
if ((WRITE || REFRESH) && !problems.length) {
  const base = process.argv[process.argv.indexOf(WRITE ? '--write' : '--refresh') + 1] // e.g. supabase/migrations/20261105080000
  const up = (cols) => (REFRESH ? `on conflict (id) do update set ${cols.map((c) => `${c} = excluded.${c}`).join(', ')}` : 'on conflict (id) do nothing')
  const foodIds = [...new Set(built.flatMap((r) => r.ingredients.map((i) => i.food_id)))]
  const ID = (expr) => `md5('unfnshd-meal-library:' || (${expr}))::uuid`
  const recipeSql = (list) => {
    const j = list.map((r) => ({
      k: r.key, f: r.family, d: r.day, m: r.meal, n: r.name, ds: r.desc, pr: r.prep, ck: r.cook, st: r.steps, tp: r.tip || null,
      dt: r.diets, c: r.totals.calories, p: r.totals.protein_g, cb: r.totals.carbs_g, ft: r.totals.fats_g, ps: r.position,
      i: r.ingredients.map((i) => [i.label, foodIds.indexOf(i.food_id), i.grams, i.measure || null, i.each_label, i.each_grams]),
    }))
    return `with f(ids) as (select '${JSON.stringify(foodIds)}'::jsonb),
d(r) as (select jsonb_array_elements($json$${JSON.stringify(j)}$json$::jsonb)),
ins as (
  insert into public.recipes (id, slug, family, day_type, meal_type, name, description, prep_minutes, cook_minutes, steps, tip, diets, calories, protein_g, carbs_g, fats_g, position)
  select ${ID("r->>'k'")}, r->>'k', r->>'f', r->>'d', r->>'m', r->>'n', r->>'ds', (r->>'pr')::int, (r->>'ck')::int, r->'st', r->>'tp',
    array(select jsonb_array_elements_text(r->'dt')), (r->>'c')::int, (r->>'p')::numeric, (r->>'cb')::numeric, (r->>'ft')::numeric, (r->>'ps')::int
  from d ${up(['slug', 'family', 'day_type', 'meal_type', 'name', 'description', 'prep_minutes', 'cook_minutes', 'steps', 'tip', 'diets', 'calories', 'protein_g', 'carbs_g', 'fats_g', 'position'])}
  returning id
)
insert into public.recipe_ingredients (id, recipe_id, position, label, food_id, grams, measure, each_label, each_grams, calories, protein_g, carbs_g, fats_g)
select ${ID("(r->>'k') || ':ing:' || (x.ord - 1)")}, ${ID("r->>'k'")}, x.ord - 1, x.e->>0, fd.id, (x.e->>2)::numeric, x.e->>3, x.e->>4, (x.e->>5)::numeric,
  round(fd.calories * (x.e->>2)::numeric / 100, 1), round(fd.protein_g * (x.e->>2)::numeric / 100, 1), round(fd.carbs_g * (x.e->>2)::numeric / 100, 1), round(fd.fats_g * (x.e->>2)::numeric / 100, 1)
from d cross join lateral jsonb_array_elements(r->'i') with ordinality as x(e, ord)
cross join f
join public.foods fd on fd.id = ((f.ids)->>((x.e->>1)::int))::uuid
${up(['recipe_id', 'position', 'label', 'food_id', 'grams', 'measure', 'each_label', 'each_grams', 'calories', 'protein_g', 'carbs_g', 'fats_g'])};
`
  }
  const files = []
  const planSql = (pj) => `with d(p, ord) as (select e, o from jsonb_array_elements($json$${JSON.stringify(pj)}$json$::jsonb) with ordinality as t(e, o)),
ins as (
  insert into public.meal_plan_library (id, slug, family, family_name, sex, goal, name, description, ref_weight_kg, ref_height_cm, ref_age, activity_factor, maintenance_calories,
    target_calories, target_protein_g, target_carbs_g, target_fats_g, avg_calories, avg_protein_g, avg_carbs_g, avg_fats_g, position)
  select ${ID("p->>'s'")}, p->>'s', p->>'f', p->>'fn', p->>'x', p->>'g', p->>'n', p->>'ds', (p->>'w')::numeric, (p->>'h')::numeric, (p->>'a')::int, (p->>'af')::numeric, (p->>'mc')::int,
    (p->'t'->>0)::int, (p->'t'->>1)::int, (p->'t'->>2)::int, (p->'t'->>3)::int, (p->'v'->>0)::int, (p->'v'->>1)::int, (p->'v'->>2)::int, (p->'v'->>3)::int, ord::int - 1
  from d ${up(['slug', 'family', 'family_name', 'sex', 'goal', 'name', 'description', 'ref_weight_kg', 'ref_height_cm', 'ref_age', 'activity_factor', 'maintenance_calories', 'target_calories', 'target_protein_g', 'target_carbs_g', 'target_fats_g', 'avg_calories', 'avg_protein_g', 'avg_carbs_g', 'avg_fats_g', 'position'])}
  returning id
)
insert into public.meal_plan_library_items (id, plan_id, day_type, meal_type, position, recipe_id, servings)
select ${ID("(p->>'s') || ':' || r.day_type || ':' || r.meal_type")}, ${ID("p->>'s'")}, r.day_type, r.meal_type,
  array_position(array['breakfast','lunch','dinner','snack'], r.meal_type) - 1, r.id, (p->'sv'->>r.day_type)::numeric
from d join public.recipes r on r.family = p->>'f'
${up(['plan_id', 'day_type', 'meal_type', 'position', 'recipe_id', 'servings'])};
`
  const groups = [['balanced', 'budget'], ['mediterranean', 'vegetarian'], ['vegan', 'pescatarian']]
  const pjAll = () => plans.map((p) => {
    const ref = REFERENCE[p.sex]
    const desc = `Built for ${ref.label}, training 3 to 5 days a week. Maintenance for this person is about ${p.maintenance.toLocaleString('en-AU')} kcal a day. ${GOALS[p.goal].blurb}`
    const sv = {}
    for (const it of p.items) sv[it.day] = it.servings
    return { s: p.slug, f: p.family, fn: PLAN_FAMILIES[p.family].name, x: p.sex, g: p.goal, n: p.name, ds: desc, w: ref.weightKg, h: ref.heightCm, a: ref.age, af: ACTIVITY.moderate, mc: p.maintenance,
      t: [p.target.calories, p.target.protein, p.target.carbs, p.target.fats], v: [p.avg.calories, p.avg.protein_g, p.avg.carbs_g, p.avg.fats_g], sv }
  })
  if (REFRESH) {
    const keep = built.map((r) => `('${r.key}', ${r.ingredients.length})`).join(', ')
    writeFileSync(base, `-- Refreshes the whole recipe and meal plan library in place. Generated by tools/meal-library/build.mjs --refresh; do not edit by hand.
-- Same ids as before, so chosen plans and ticked meals stay linked. Changes library rows only, no client data.
begin;
${recipeSql(built)}
-- Ingredients a recipe no longer has.
delete from public.recipe_ingredients ri using public.recipes r, (values ${keep}) as k(slug, n)
where ri.recipe_id = r.id and r.slug = k.slug and ri.position >= k.n;
${planSql(pjAll())}commit;
`)
    console.log('Wrote', base)
  } else groups.forEach((g, n) => {
    const file = `${base}${n}_meal_library_recipes_${n + 1}.sql`.replace(/(\d{14})(\d)_/, (m, ts, k) => `${String(BigInt(ts) + BigInt(k))}_`)
    writeFileSync(file, `-- Recipe library part ${n + 1} of 3 (${g.join(' and ')}). Generated by tools/meal-library/build.mjs; do not edit by hand.\n` + recipeSql(built.filter((r) => g.includes(r.family))))
    files.push(file)
  })
  if (REFRESH) process.exit(process.exitCode || 0)
  const pj = pjAll()
  const planFile = `${base.replace(/(\d{14})$/, (m) => String(BigInt(m) + 3n))}_meal_library_plans.sql`
  writeFileSync(planFile, `-- The on-demand meal plans and their meals. Generated by tools/meal-library/build.mjs; do not edit by hand.
${planSql(pj)}`)
  files.push(planFile)
  for (const f of files) console.log('Wrote', f)
}

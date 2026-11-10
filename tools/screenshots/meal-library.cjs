// The recipe and meal plan library for the screenshot fixtures, read straight from the
// seed migrations (supabase/migrations/*_meal_library_*.sql) so screens show real recipes.
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const MIG = path.join(__dirname, '../../supabase/migrations')
const uuid = (key) => {
  const h = crypto.createHash('md5').update('unfnshd-meal-library:' + key).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
const jsonIn = (line) => JSON.parse(line.slice(line.indexOf('$json$') + 6, line.lastIndexOf('$json$')))
const r1 = (n) => Math.round(n * 10) / 10

function load() {
  const files = fs.readdirSync(MIG)
  const foodsById = Object.fromEntries(Object.values(require('../meal-library/foods.json')).map(([id, ...m]) => [id, m]))
  const recipes = []
  // RECIPE_PHOTOS=1 gives each recipe a stand-in photo (the real ones come from Unsplash,
  // which this sandbox cannot reach), so photo layouts can be checked.
  const samplePhoto = (name) => {
    if (!process.env.RECIPE_PHOTOS) return {}
    const h = [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7)
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 100'><defs><radialGradient id='g'><stop offset='0' stop-color='hsl(${h},55%,62%)'/><stop offset='1' stop-color='hsl(${(h + 40) % 360},45%,32%)'/></radialGradient></defs><rect width='160' height='100' fill='hsl(${h},30%,85%)'/><ellipse cx='80' cy='52' rx='52' ry='38' fill='url(#g)'/></svg>`
    const url = 'data:image/svg+xml,' + encodeURIComponent(svg)
    return { photo_url: url, photo_thumb_url: url, photo_credit: 'Sample Photographer', photo_credit_url: 'https://unsplash.com' }
  }
  const recipe_ingredients = []
  // The latest full refresh if there is one, otherwise the first seed.
  const refresh = files.filter((x) => /_meal_library_refresh\.sql$/.test(x)).sort().pop()
  const sources = refresh ? [refresh] : files.filter((x) => /_meal_library_recipes_\d\.sql$/.test(x)).sort()
  for (const f of sources) {
    const lines = fs.readFileSync(path.join(MIG, f), 'utf8').split('\n')
    const idLine = lines.find((l) => l.startsWith('with f(ids)'))
    const ids = JSON.parse(idLine.slice(idLine.indexOf("'") + 1, idLine.lastIndexOf("'")))
    for (const r of jsonIn(lines.find((l) => l.startsWith('d(r) as')))) {
      const rid = uuid(r.k)
      recipes.push({ id: rid, slug: r.k, family: r.f, day_type: r.d, meal_type: r.m, name: r.n, description: r.ds, prep_minutes: r.pr, cook_minutes: r.ck, steps: r.st, tip: r.tp, diets: r.dt, calories: r.c, protein_g: r.p, carbs_g: r.cb, fats_g: r.ft, position: r.ps, ...samplePhoto(r.n) })
      r.i.forEach((e, pos) => {
        const foodId = ids[e[1]]
        const [kcal, p, c, fat] = foodsById[foodId] || [0, 0, 0, 0]
        const g = e[2]
        recipe_ingredients.push({ id: uuid(`${r.k}:ing:${pos}`), recipe_id: rid, position: pos, label: e[0], food_id: foodId, grams: g, measure: e[3], each_label: e[4], each_grams: e[5], calories: r1(kcal * g / 100), protein_g: r1(p * g / 100), carbs_g: r1(c * g / 100), fats_g: r1(fat * g / 100) })
      })
    }
  }
  const planFile = refresh || files.find((x) => /_meal_library_plans\.sql$/.test(x))
  const plans = jsonIn(fs.readFileSync(path.join(MIG, planFile), 'utf8').split('\n').find((l) => l.startsWith('with d(p, ord)')))
  const meal_plan_library = plans.map((p, i) => ({
    id: uuid(p.s), slug: p.s, family: p.f, family_name: p.fn, sex: p.x, goal: p.g, name: p.n, description: p.ds,
    ref_weight_kg: p.w, ref_height_cm: p.h, ref_age: p.a, activity_factor: p.af, maintenance_calories: p.mc,
    target_calories: p.t[0], target_protein_g: p.t[1], target_carbs_g: p.t[2], target_fats_g: p.t[3],
    avg_calories: p.v[0], avg_protein_g: p.v[1], avg_carbs_g: p.v[2], avg_fats_g: p.v[3], position: i,
  }))
  const order = ['breakfast', 'lunch', 'dinner', 'snack']
  const meal_plan_library_items = plans.flatMap((p) => recipes.filter((r) => r.family === p.f).map((r) => ({
    id: uuid(`${p.s}:${r.day_type}:${r.meal_type}`), plan_id: uuid(p.s), day_type: r.day_type, meal_type: r.meal_type,
    position: order.indexOf(r.meal_type), recipe_id: r.id, servings: p.sv[r.day_type],
  })))
  return { recipes, recipe_ingredients, meal_plan_library, meal_plan_library_items, planId: (slug) => uuid(slug) }
}

module.exports = load()

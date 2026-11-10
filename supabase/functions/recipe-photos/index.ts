// Gives every library recipe a photo from Unsplash (free to use; credit the photographer
// and Unsplash, and show the photo from Unsplash's own address, which their rules ask
// for). Each dish has a hand-written search below and the result to use (first by
// default). The function only searches for dishes whose photo is missing or whose search
// changed here, and does at most PER_RUN dishes per call because a new Unsplash app gets
// 50 requests an hour (each dish uses 2: the search, and the "download" ping Unsplash asks
// for when a photo is chosen). Call it again an hour later to carry on, by hand or with the
// hourly job in supabase/migrations/20261110023000_recipe_photos_cron.sql (Luke runs that
// one in the SQL Editor). Needs the UNSPLASH_ACCESS_KEY secret.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

// Dish name: [search, which result (0 is the first)].
const PHOTO: Record<string, [string, number?]> = {
  'Berry overnight oats': ['overnight oats berries'],
  'Teriyaki chicken rice bowl': ['teriyaki chicken rice bowl'],
  'Lean beef spaghetti bolognese': ['spaghetti bolognese'],
  'Peanut butter and banana toast': ['peanut butter banana toast'],
  'Scrambled eggs on toast with spinach and tomatoes': ['scrambled eggs on toast'],
  'Chicken, avocado and salad wrap': ['chicken avocado wrap'],
  'Beef burrito bowl': ['burrito bowl'],
  'Greek yoghurt with honey and walnuts': ['yogurt bowl honey nuts'],
  'Banana pancakes with yoghurt': ['banana pancakes'],
  'Ham, cheese and tomato toastie with side salad': ['toasted sandwich ham cheese'],
  'Sunday roast chicken thighs with vegetables': ['roast chicken thighs vegetables tray'],
  'Banana peanut butter smoothie': ['peanut butter smoothie'],
  'Peanut butter banana porridge': ['porridge banana peanut butter'],
  'Tuna, rice and veggie bowl': ['tuna rice bowl vegetables'],
  'Beef and bean chilli with rice': ['chili con carne rice'],
  'Cheese, crackers and an apple': ['cheese crackers apple snack'],
  'Baked beans and eggs on toast': ['baked beans eggs toast'],
  'Chicken, pea and corn pasta salad': ['chicken pasta salad'],
  'Sausage and vegetable tray bake': ['sausage vegetable tray bake'],
  'Yoghurt and muesli cup': ['yogurt muesli cup'],
  'Cheesy omelette with toast': ['cheese omelette toast'],
  'Ham and pineapple pita pizza': ['ham pineapple pizza'],
  'Honey garlic chicken thighs with rice and veg': ['honey garlic chicken rice'],
  'Rice cakes with peanut butter, banana and milk': ['rice cakes peanut butter banana'],
  'Honey soy salmon with rice and greens': ['glazed salmon rice greens'],
  'Chilli salt edamame': ['edamame bowl'],
  'Tofu scramble on toast': ['tofu scramble toast'],
  'Prawn and avocado poke bowl': ['shrimp poke bowl avocado'],
  'Lamb kofta with tabouli and hummus': ['kofta skewers hummus'],
  'Tuna and crackers with cherry tomatoes': ['tuna crackers cherry tomatoes'],
  'Berry chia overnight oats': ['chia pudding berries'],
  'Tuna, white bean and rocket salad': ['tuna bean salad rocket'],
  'Chocolate peanut butter smoothie': ['chocolate smoothie'],
  'Veggie omelette with sweet potato hash': ['vegetable omelette'],
  'Greek salad with chicken and quinoa': ['greek salad chicken quinoa'],
  'Baked barramundi with lemon potatoes and greens': ['baked fish lemon potatoes'],
  'Greek yoghurt crunch bowl': ['yogurt granola bowl'],
  'Chickpea, quinoa and roast veg bowl with tahini': ['buddha bowl chickpeas quinoa roasted vegetables'],
  'Cottage cheese with pineapple': ['cottage cheese pineapple'],
  'Smoked salmon, egg and avocado rice cakes': ['smoked salmon avocado egg'],
  'Halloumi, pumpkin and quinoa salad': ['halloumi salad pumpkin'],
  'Greek yoghurt with honey and pistachios': ['greek yogurt pistachios honey'],
  'Spinach, mushroom and feta omelette': ['spinach mushroom omelette'],
  'Chicken souvlaki pita with tzatziki': ['souvlaki pita tzatziki'],
  'Edamame and a cheese stick': ['edamame snack'],
  'Smoked salmon scrambled eggs on sourdough': ['smoked salmon scrambled eggs'],
  'Tuna, olive and feta pasta salad': ['pasta salad olives feta'],
  'Cottage cheese, crackers and tomato': ['cottage cheese crackers tomato'],
  'Feta, spinach and tomato scrambled eggs on sourdough': ['scrambled eggs feta spinach sourdough'],
  'Hummus with veggie sticks and crackers': ['hummus vegetable sticks'],
  'Greek yoghurt bowl with berries, oats and walnuts': ['yogurt bowl berries oats'],
  'Lemon and olive chicken with roast vegetables and couscous': ['chicken olives lemon couscous'],
  'Ricotta and berry toast': ['ricotta toast berries'],
  'Shakshuka with crusty bread': ['shakshuka'],
  'Beef souvlaki skewers with Greek salad and rice': ['beef skewers greek salad'],
  'Smoked salmon and cream cheese bagel': ['smoked salmon bagel cream cheese'],
  'Berry and banana protein porridge': ['porridge berries banana'],
  'Spiced fish tacos with slaw': ['fish tacos slaw'],
  'Salmon and potato fishcakes with salad': ['fishcakes salad'],
  'Mango lassi smoothie': ['mango lassi'],
  'Tofu satay stir-fry with noodles': ['tofu stir fry noodles'],
  'Trail mix and a protein soy milk': ['trail mix nuts'],
  'Red lentil and vegetable soup with bread': ['lentil soup bread'],
  'Black bean, tofu and sweet potato tacos': ['vegan tacos sweet potato black beans'],
  'Banana oat pancakes': ['oat pancakes banana'],
  'Smashed chickpea salad sandwich': ['chickpea salad sandwich'],
  'Red lentil dahl with rice': ['dal rice'],
  'Black bean and cheese quesadilla with salad': ['quesadilla'],
  'Chickpea, spinach and paneer curry with rice': ['paneer curry rice'],
  'Peanut butter protein overnight oats': ['overnight oats peanut butter'],
  'Poached egg and avocado smash on sourdough': ['avocado toast poached egg'],
  'Lentil bolognese with wholemeal spaghetti': ['lentil bolognese spaghetti'],
  'Ricotta hotcakes with berries': ['pancakes berries'],
  'Bean and cheese stuffed sweet potato': ['stuffed sweet potato'],
  'Banana oat smoothie': ['banana oat smoothie'],
}

const PER_RUN = 22
const UTM = 'utm_source=unfnshd&utm_medium=referral'

async function search(query: string, index: number, key: string) {
  const auth = { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' } }
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${Math.max(5, index + 1)}&orientation=landscape&content_filter=high`
  const res = await fetch(url, auth)
  if (res.status === 403 || res.status === 429) throw new Error('rate limit')
  if (!res.ok) throw new Error(`unsplash ${res.status}`)
  const body = await res.json()
  const p = body.results?.[index] ?? body.results?.[0]
  if (!p) return null
  // Unsplash asks apps to report when a photo is chosen.
  await fetch(p.links.download_location, auth).catch(() => {})
  return {
    photo_url: `${p.urls.raw}&w=1200&h=750&fit=crop&q=75&auto=format`,
    photo_thumb_url: `${p.urls.raw}&w=160&h=160&fit=crop&q=70&auto=format`,
    photo_credit: p.user.name,
    photo_credit_url: `${p.user.links.html}?${UTM}`,
  }
}

Deno.serve(async () => {
  const key = Deno.env.get('UNSPLASH_ACCESS_KEY')
  if (!key) return new Response(JSON.stringify({ error: 'UNSPLASH_ACCESS_KEY not set' }), { status: 503 })
  const { data: recipes, error } = await db.from('recipes').select('name, photo_key')
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  const done: string[] = [], skipped: string[] = [], missing: string[] = [], failed: string[] = [], later: string[] = []
  const names = [...new Set(recipes.map((r) => r.name))]
  for (const name of names) {
    const pick = PHOTO[name]
    if (!pick) { missing.push(name); continue }
    const [query, index = 0] = pick
    const want = `${query}#${index}`
    if (recipes.filter((r) => r.name === name).every((r) => r.photo_key === want)) { skipped.push(name); continue }
    if (done.length + failed.length >= PER_RUN) { later.push(name); continue }
    try {
      const photo = await search(query, index, key)
      if (!photo) { failed.push(name); continue }
      const { error: upErr } = await db.from('recipes').update({ ...photo, photo_key: want }).eq('name', name)
      if (upErr) throw upErr
      done.push(name)
    } catch (e) {
      console.error('recipe photo', name, e)
      if (String(e).includes('rate limit')) { later.push(name); break }
      failed.push(name)
    }
  }
  return new Response(JSON.stringify({ done: done.length, skipped: skipped.length, later: later.length, missing, failed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

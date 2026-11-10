// Gives every library recipe a photo from Unsplash (free to use; credit the photographer
// and Unsplash, and show the photo from Unsplash's own address, as their rules ask).
// Every photo is picked by hand against the recipe's ingredients: nothing clearly visible
// may be missing from the recipe, and the main ingredients must show. PICK below maps a
// dish name to its Unsplash photo id; a dish not listed has its photo cleared (no photo
// beats a wrong one). The function only works on dishes whose stored photo differs from
// PICK, at most PER_RUN per call, because a new Unsplash app gets 50 requests an hour and
// each pick uses 2 (fetching the photo, and the "download" ping Unsplash asks for). The
// hourly job (migrations/20261110023000_recipe_photos_cron.sql) carries it on.
// Needs the UNSPLASH_ACCESS_KEY secret.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

// Dish name: Unsplash photo id (the end of the photo's unsplash.com address).
const PICK: Record<string, string> = {
  'Banana oat pancakes': 'XLdXqvUSU4Y',
  'Banana oat smoothie': '64yyZGScq7U',
  'Banana pancakes with yoghurt': 'exyTIrXyqm0',
  'Beef burrito bowl': 'OQwX_hDkNEo',
  'Berry chia overnight oats': 'o-7npbt9xSw',
  'Berry overnight oats': 'LzrMzmVWhJw',
  'Cheesy omelette with toast': 'ivFdoHieX08',
  'Chicken souvlaki pita with tzatziki': 'HGd7G5J5dHM',
  'Greek yoghurt bowl with berries, oats and walnuts': 'k_vqk9KFizc',
  'Greek yoghurt crunch bowl': '1YsJ-d45ud0',
  'Greek yoghurt with honey and walnuts': 'o2gSwEZeNFk',
  'Ham and pineapple pita pizza': 'cbCu29Ggs8c',
  'Ham, cheese and tomato toastie with side salad': 'hdhWH1xoYwM',
  'Honey soy salmon with rice and greens': 'RZV1-tNbHy4',
  'Lean beef spaghetti bolognese': 'rQCBC9EgoDE',
  'Mango lassi smoothie': 'cfo98H6h3tQ',
  'Peanut butter and banana toast': 'Ep4XMaLn6tI',
  'Peanut butter banana porridge': 'sdPZ_07XLsg',
  'Poached egg and avocado smash on sourdough': 'IQSDSFO9UuI',
  'Red lentil and vegetable soup with bread': 'OMcrCX6wDpU',
  'Red lentil dahl with rice': 't-OO1RUgvt4',
  'Ricotta hotcakes with berries': 'Zt-0gWKodXk',
  'Shakshuka with crusty bread': 'K9oKpOebg84',
  'Teriyaki chicken rice bowl': 'ZhX8gMtQjwc',
  'Yoghurt and muesli cup': '-0gya0UbwPs',
}

const PER_RUN = 22
const UTM = 'utm_source=unfnshd&utm_medium=referral'
const NONE = { photo_url: null, photo_thumb_url: null, photo_credit: null, photo_credit_url: null }

async function fetchPhoto(id: string, key: string) {
  const auth = { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' } }
  const res = await fetch(`https://api.unsplash.com/photos/${encodeURIComponent(id)}`, auth)
  if (res.status === 403 || res.status === 429) throw new Error('rate limit')
  if (!res.ok) throw new Error(`unsplash ${res.status}`)
  const p = await res.json()
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

  const done: string[] = [], cleared: string[] = [], failed: string[] = []
  let skipped = 0, later = 0, fetched = 0
  for (const name of [...new Set(recipes.map((r) => r.name))]) {
    const id = PICK[name]
    const want = id ? `id:${id}` : 'none'
    if (recipes.filter((r) => r.name === name).every((r) => r.photo_key === want)) { skipped++; continue }
    try {
      if (!id) {
        const { error: e } = await db.from('recipes').update({ ...NONE, photo_key: want }).eq('name', name)
        if (e) throw e
        cleared.push(name)
        continue
      }
      if (fetched >= PER_RUN) { later++; continue }
      fetched++
      const photo = await fetchPhoto(id, key)
      const { error: e } = await db.from('recipes').update({ ...photo, photo_key: want }).eq('name', name)
      if (e) throw e
      done.push(name)
    } catch (e) {
      console.error('recipe photo', name, e)
      if (String(e).includes('rate limit')) { later++; break }
      failed.push(name)
    }
  }
  return new Response(JSON.stringify({ done: done.length, cleared: cleared.length, skipped, later, failed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

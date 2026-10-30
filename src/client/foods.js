// Food data and search for the client Food tab. The search reads three sources: the AFCD
// generic foods (Supabase RPC), a short list of common whole foods, and Open Food Facts
// for branded products. One source failing never breaks the others.
import { supabase } from '../supabase'

export const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack', 'other']
export const capitalise = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

export const COMMON_FOODS = [
  { name: 'Chicken breast, raw, skinless', brand: 'Whole food', calories: 110, protein: 23.1, carbs: 0, fats: 1.2 },
  { name: 'Chicken breast, cooked, skinless', brand: 'Whole food', calories: 157, protein: 32.1, carbs: 0, fats: 3.2 },
  { name: 'Chicken thigh, raw, skinless', brand: 'Whole food', calories: 130, protein: 19.7, carbs: 0, fats: 5.6 },
  { name: 'Chicken thigh, cooked, skinless', brand: 'Whole food', calories: 179, protein: 24.8, carbs: 0, fats: 8.9 },
  { name: 'Beef mince, lean, raw', brand: 'Whole food', calories: 149, protein: 20.7, carbs: 0, fats: 7.1 },
  { name: 'Beef steak, lean, raw', brand: 'Whole food', calories: 144, protein: 21.0, carbs: 0, fats: 6.3 },
  { name: 'Salmon, raw', brand: 'Whole food', calories: 208, protein: 20.0, carbs: 0, fats: 13.4 },
  { name: 'Tuna, canned in springwater', brand: 'Whole food', calories: 116, protein: 25.5, carbs: 0, fats: 0.8 },
  { name: 'Egg, whole, raw', brand: 'Whole food', calories: 143, protein: 12.6, carbs: 0.7, fats: 9.5 },
  { name: 'Egg whites, raw', brand: 'Whole food', calories: 52, protein: 10.9, carbs: 0.7, fats: 0.2 },
  { name: 'White rice, cooked', brand: 'Whole food', calories: 130, protein: 2.7, carbs: 28.0, fats: 0.3 },
  { name: 'Brown rice, cooked', brand: 'Whole food', calories: 123, protein: 2.7, carbs: 25.6, fats: 1.0 },
  { name: 'Oats, rolled, dry', brand: 'Whole food', calories: 389, protein: 16.9, carbs: 66.3, fats: 6.9 },
  { name: 'Sweet potato, raw', brand: 'Whole food', calories: 86, protein: 1.6, carbs: 20.1, fats: 0.1 },
  { name: 'Potato, raw', brand: 'Whole food', calories: 77, protein: 2.0, carbs: 17.0, fats: 0.1 },
  { name: 'Broccoli, raw', brand: 'Whole food', calories: 34, protein: 2.8, carbs: 6.6, fats: 0.4 },
  { name: 'Spinach, raw', brand: 'Whole food', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
  { name: 'Banana', brand: 'Whole food', calories: 89, protein: 1.1, carbs: 22.8, fats: 0.3 },
  { name: 'Apple', brand: 'Whole food', calories: 52, protein: 0.3, carbs: 13.8, fats: 0.2 },
  { name: 'Greek yoghurt, plain, full fat', brand: 'Whole food', calories: 97, protein: 9.0, carbs: 3.6, fats: 5.0 },
  { name: 'Milk, full cream', brand: 'Whole food', calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3 },
  { name: 'Cottage cheese, full fat', brand: 'Whole food', calories: 98, protein: 11.1, carbs: 3.4, fats: 4.3 },
  { name: 'Almonds, raw', brand: 'Whole food', calories: 579, protein: 21.2, carbs: 21.7, fats: 49.9 },
  { name: 'Peanut butter, no added salt', brand: 'Whole food', calories: 588, protein: 25.0, carbs: 20.0, fats: 50.0 },
  { name: 'Olive oil', brand: 'Whole food', calories: 884, protein: 0, carbs: 0, fats: 100.0 },
  { name: 'White bread', brand: 'Whole food', calories: 265, protein: 9.0, carbs: 49.0, fats: 3.2 },
  { name: 'Pasta, dry', brand: 'Whole food', calories: 371, protein: 13.0, carbs: 74.7, fats: 1.5 },
  { name: 'Whey protein powder', brand: 'Whole food', calories: 400, protein: 80.0, carbs: 8.0, fats: 5.0 },
  { name: 'Avocado', brand: 'Whole food', calories: 160, protein: 2.0, carbs: 8.5, fats: 14.7 },
  { name: 'Pork loin, lean, raw', brand: 'Whole food', calories: 143, protein: 21.3, carbs: 0, fats: 6.3 },
]

export async function searchFoods(query) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim().toLowerCase()
  const commonMatches = COMMON_FOODS.filter((f) => f.name.toLowerCase().includes(q))

  // Source 1: AFCD generic foods via Supabase RPC.
  let afcdResults = []
  try {
    const { data: afcdData, error: afcdError } = await supabase.rpc('search_foods', { search_query: query.trim() })
    if (afcdError) throw afcdError
    afcdResults = (afcdData || [])
      .map((f) => ({
        name: f.name,
        brand: '',
        calories: Math.round(f.calories || 0),
        protein: parseFloat((f.protein_g || 0).toFixed(1)),
        carbs: parseFloat((f.carbs_g || 0).toFixed(1)),
        fats: parseFloat((f.fats_g || 0).toFixed(1)),
      }))
      .slice(0, 5)
  } catch (e) {
    console.error('AFCD search error:', e)
  }

  // Source 2: Open Food Facts branded products.
  try {
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query.trim())}&search_simple=1&action=process&json=1&page_size=6&lc=en&cc=au&fields=product_name,brands,nutriments,code`)
    const json = await res.json()
    const apiResults = (json.products || [])
      .filter((p) => p.product_name && typeof p.nutriments?.['energy-kcal_100g'] === 'number')
      .map((p) => ({
        name: p.product_name,
        brand: p.brands || '',
        calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
        protein: parseFloat((p.nutriments['proteins_100g'] || 0).toFixed(1)),
        carbs: parseFloat((p.nutriments['carbohydrates_100g'] || 0).toFixed(1)),
        fats: parseFloat((p.nutriments['fat_100g'] || 0).toFixed(1)),
      }))
    return [...afcdResults, ...commonMatches, ...apiResults].slice(0, 8)
  } catch (e) {
    console.error('Food search error:', e)
    return [...afcdResults, ...commonMatches].slice(0, 8)
  }
}

// Saved meals from the AI come as JSON with a meals array; older ones are plain text.
export function parseSavedMealContent(meal) {
  try {
    const p = JSON.parse(meal.content)
    if (p && Array.isArray(p.meals) && p.meals.length > 0) return p
  } catch {
    // plain-text saved meal
  }
  return null
}

// Pull the first {...} JSON block out of an AI reply, or null.
export function parseAiJson(text) {
  try {
    const m = (text || '').match(/\{[\s\S]*\}/)
    return m ? JSON.parse(m[0]) : null
  } catch {
    return null
  }
}

// Barcode lookups for the Add food sheet. Our shared product list first (products
// clients added from a label), then Open Food Facts. Values come back per 100 g, in the
// same shape as a food search result, so the sheet treats them the same way.
import { supabase } from '../supabase'

const r1 = (n) => Math.round((Number(n) || 0) * 10) / 10

export const isBarcode = (s) => /^[0-9]{8,14}$/.test(String(s || '').trim())

export async function lookupBarcode(code) {
  const barcode = String(code).trim()
  const { data: own } = await supabase.from('barcode_products').select('*').eq('barcode', barcode).maybeSingle()
  if (own) {
    return {
      barcode, source: 'members', name: own.name, brand: own.brand || '', serving: Number(own.serving_size_g) || null,
      calories: Math.round(own.calories_100g), protein: r1(own.protein_100g), carbs: r1(own.carbs_100g), fats: r1(own.fats_100g),
    }
  }
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_en,brands,nutriments,serving_quantity`)
    if (!res.ok) return null
    const json = await res.json()
    const p = json?.product
    const n = p?.nutriments
    if (!p || !n) return null
    const kcal = typeof n['energy-kcal_100g'] === 'number' ? n['energy-kcal_100g'] : typeof n.energy_100g === 'number' ? n.energy_100g / 4.184 : null
    const name = (p.product_name_en || p.product_name || '').trim()
    if (kcal === null || !name) return null
    return {
      barcode, source: 'openfoodfacts', name, brand: (p.brands || '').split(',')[0].trim(), serving: Number(p.serving_quantity) || null,
      calories: Math.round(kcal), protein: r1(n.proteins_100g), carbs: r1(n.carbohydrates_100g), fats: r1(n.fat_100g),
    }
  } catch (e) {
    console.error('Open Food Facts lookup error:', e)
    return null
  }
}

// Adds a product from the label to the shared list (per 100 g).
export async function saveBarcodeProduct({ barcode, name, brand, serving, calories, protein, carbs, fats }) {
  return supabase.from('barcode_products').insert({
    barcode, name: name.trim().slice(0, 200), brand: brand?.trim() ? brand.trim().slice(0, 120) : null,
    serving_size_g: Number(serving) > 0 ? Number(serving) : null,
    calories_100g: Number(calories) || 0, protein_100g: Number(protein) || 0, carbs_100g: Number(carbs) || 0, fats_100g: Number(fats) || 0,
  })
}

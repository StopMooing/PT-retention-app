// The meal plan the coach set (NutritionPlanner), read-only for the client. A card on the
// Nutrition tab opens the full plan. Hidden when there is no active plan.
import { useEffect, useState } from 'react'
import { ChevronRight, ClipboardList } from 'lucide-react'
import { supabase } from '../supabase'
import { Card, Sheet } from '../ui'

const n = (v) => Math.round(Number(v) || 0)

export default function MealPlanCard({ client }) {
  const [plan, setPlan] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!client?.id || !client.pt_id) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('id, name, description, daily_calories, protein_target_g, carbs_target_g, fats_target_g, meals(id, name, meal_time, order_index, meal_foods(id, food_name, brand, serving_size_g, calories, protein_g, carbs_g, fats_g))')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
      if (error) { console.error('Meal plan load error:', error); return }
      if (!cancelled) setPlan(data?.[0] ?? null)
    })()
    return () => { cancelled = true }
  }, [client?.id, client?.pt_id])

  const meals = [...(plan?.meals ?? [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)).filter((m) => m.meal_foods?.length)
  if (!plan || meals.length === 0) return null

  const total = (foods, k) => n(foods.reduce((s, f) => s + (Number(f[k]) || 0), 0))
  const all = meals.flatMap((m) => m.meal_foods)

  return (
    <>
      <Card as="button" onClick={() => setOpen(true)} className="w-full flex items-center gap-3 text-left">
        <span className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0"><ClipboardList size={20} /></span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold text-muted">Your meal plan</span>
          <span className="block text-[15px] font-bold text-ink truncate">{plan.name}</span>
        </span>
        <ChevronRight size={18} className="text-faint shrink-0" />
      </Card>

      <Sheet open={open} onClose={() => setOpen(false)} title={plan.name}>
        <div className="space-y-5">
          {plan.description && <p className="text-[15px] text-muted -mt-1">{plan.description}</p>}
          <p className="text-[13px] font-semibold text-ink tabular-nums">
            {total(all, 'calories')} kcal · P {total(all, 'protein_g')}g · C {total(all, 'carbs_g')}g · F {total(all, 'fats_g')}g
          </p>
          {meals.map((m) => (
            <section key={m.id}>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <p className="text-[15px] font-bold text-ink">{m.name}{m.meal_time ? <span className="text-muted font-semibold"> · {m.meal_time}</span> : null}</p>
                <p className="text-[13px] text-muted tabular-nums shrink-0">{total(m.meal_foods, 'calories')} kcal</p>
              </div>
              <ul className="rounded-[16px] border border-line divide-y divide-line">
                {m.meal_foods.map((f) => (
                  <li key={f.id} className="px-3.5 py-2.5">
                    <p className="text-[15px] text-ink">{f.serving_size_g ? <span className="tabular-nums text-muted">{n(f.serving_size_g)} g </span> : null}{f.food_name}{f.brand ? <span className="text-muted">, {f.brand}</span> : null}</p>
                    <p className="text-[13px] text-muted tabular-nums">{n(f.calories)} kcal · P {n(f.protein_g)}g · C {n(f.carbs_g)}g · F {n(f.fats_g)}g</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Sheet>
    </>
  )
}

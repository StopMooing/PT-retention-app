// The coach's view of the ready-made meal plan library: every plan and recipe clients can
// use, browsed the same way clients see them, with "Give to a client" on each plan.
import { useEffect, useMemo, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { supabase } from '../supabase'
import { Card, Segmented, Sheet, Button, Mark } from '../ui'
import PlansView from '../client/PlansView'
import RecipesView from '../client/RecipesView'
import RecipeSheet from '../client/RecipeSheet'
import { fetchPlans, fetchRecipes, startPlan } from '../lib/mealLibrary'
import { firstName } from './lib'

function GiveSheet({ plan, clients, onClose, onGiven }) {
  const [clientId, setClientId] = useState(null)
  const [matchTargets, setMatchTargets] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const client = clients.find((c) => c.id === clientId)

  async function give() {
    if (!client) return
    setSaving(true)
    setError(null)
    const { error: err } = await startPlan(client.id, plan.id)
    if (!err && matchTargets) {
      await supabase.from('clients').update({ calorie_target: plan.avg_calories, protein_target_g: plan.avg_protein_g, carbs_target_g: plan.avg_carbs_g, fats_target_g: plan.avg_fats_g }).eq('id', client.id)
    }
    setSaving(false)
    if (err) { setError("Couldn't give that plan. Try again."); return }
    onGiven(client)
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Give this plan to"
      footer={<Button block size="lg" onClick={give} disabled={!client || saving}>{saving ? 'Saving' : client ? `Give ${firstName(client.full_name)} this plan` : 'Choose a client'}</Button>}
    >
      <p className="text-[14px] text-muted -mt-1 mb-3">{plan.name}. Every day shows in their app with recipes, ready to tick off. It replaces any ready-made plan they are on.</p>
      {clients.length === 0 ? (
        <p className="text-[15px] text-muted">Add a client first, then come back here.</p>
      ) : (
        <div className="flex flex-col">
          {clients.map((c) => {
            const on = c.id === clientId
            return (
              <button key={c.id} onClick={() => setClientId(c.id)} aria-pressed={on} className={`flex items-center gap-3 px-3 py-3 rounded-[14px] text-left ${on ? 'bg-accent-soft' : 'hover:bg-surface-2'}`}>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-accent bg-accent text-on-accent' : 'border-line-strong'}`}>{on && <Check size={12} strokeWidth={3} />}</span>
                <span className="font-bold text-ink truncate">{c.full_name}</span>
              </button>
            )
          })}
        </div>
      )}
      <button onClick={() => setMatchTargets((v) => !v)} aria-pressed={matchTargets} className="w-full flex items-start gap-3 text-left mt-4">
        <span className={`mt-0.5 w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 ${matchTargets ? 'border-accent bg-accent text-on-accent' : 'border-line-strong'}`}>
          {matchTargets && <Check size={12} strokeWidth={3} />}
        </span>
        <span className="text-[14px] text-ink">Also set their daily calories and macros to match (about {plan.avg_calories.toLocaleString('en-AU')} kcal)</span>
      </button>
      {error && <p className="text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3 mt-3">{error}</p>}
    </Sheet>
  )
}

export default function MealLibrary({ clients, showToast }) {
  const [data, setData] = useState(null) // { plans, recipes }
  const [failed, setFailed] = useState(false)
  const [view, setView] = useState('plans')
  const [give, setGive] = useState(null)
  const [recipe, setRecipe] = useState(null) // { recipe, servings }

  useEffect(() => {
    let live = true
    Promise.all([fetchPlans(), fetchRecipes()])
      .then(([plans, recipes]) => live && setData({ plans, recipes }))
      .catch((e) => { console.error('Meal library load error:', e); if (live) setFailed(true) })
    return () => { live = false }
  }, [])

  const active = useMemo(() => (clients ?? []).filter((c) => !c.archived_at).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '')), [clients])
  const styles = data ? new Set(data.plans.map((p) => p.family)).size : 0
  const dishes = data ? new Set(data.recipes.map((r) => r.name)).size : 0

  if (failed) return <p className="text-[15px] text-muted text-center py-8">Couldn't load the meal plans. Refresh the page to try again.</p>
  if (!data) return <div className="flex justify-center py-12"><Mark size={36} className="animate-pulse" /></div>

  return (
    <div className="space-y-4 max-w-[760px]">
      <Card className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0"><Sparkles size={20} /></span>
        <span className="min-w-0">
          <span className="block text-[15px] font-bold text-ink">{data.plans.length} ready-made meal plans, {dishes} recipes</span>
          <span className="block text-[14px] text-muted mt-0.5">{styles} styles, each for men and women and for cutting, maintenance or bulking. Open one to see every day's meals, then give it to a client. Clients without a coach can pick these themselves in the app.</span>
        </span>
      </Card>
      <Segmented className="max-w-[320px]" value={view} onChange={setView} options={[{ value: 'plans', label: 'Meal plans' }, { value: 'recipes', label: 'Recipes' }]} />
      {view === 'plans' ? (
        <PlansView
          audience="coach"
          plans={data.plans}
          recipes={data.recipes}
          startSex="female"
          startGoal="cut"
          startLabel="Give to a client"
          onStart={async (plan) => { setGive(plan); return true }}
          onStop={async () => true}
          onOpenRecipe={(m) => setRecipe({ recipe: m.recipe, servings: m.servings })}
        />
      ) : (
        <RecipesView recipes={data.recipes} onOpen={(r) => setRecipe({ recipe: r, servings: 1 })} />
      )}
      {recipe && <RecipeSheet key={recipe.recipe.id} open recipe={recipe.recipe} servings={recipe.servings} onClose={() => setRecipe(null)} />}
      {give && (
        <GiveSheet
          plan={give}
          clients={active}
          onClose={() => setGive(null)}
          onGiven={(c) => { setGive(null); showToast?.(`${firstName(c.full_name)} is on ${give.name}`) }}
        />
      )}
    </div>
  )
}

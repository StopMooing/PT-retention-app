// The coach gives a client one of the ready-made meal plans (the same 36+ plans clients
// can pick themselves in the app). Their Nutrition tab then shows the plan's meals each
// day, ready to tick off. Optionally sets the client's daily targets to match.
import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../../supabase'
import { Sheet, Button, Segmented } from '../../ui'
import { fetchPlans, startPlan, stopPlan, closestPlan } from '../../lib/mealLibrary'
import { PLAN_FAMILIES, GOALS } from '../../lib/recipes'

const SEXES = [{ value: 'female', label: 'Built for women' }, { value: 'male', label: 'Built for men' }]
const GOAL_OPTIONS = Object.entries(GOALS).map(([value, g]) => ({ value, label: g.name }))

export default function MealPlanPicker({ open, onClose, clientId, clientFirst, currentPlanId, calorieTarget, hasTargets, onPicked, onTargets }) {
  const [plans, setPlans] = useState(null)
  const [family, setFamily] = useState('balanced')
  const [sex, setSex] = useState('female')
  const [goal, setGoal] = useState('maintain')
  const [matchTargets, setMatchTargets] = useState(!hasTargets)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    let live = true
    fetchPlans().then((all) => {
      if (!live) return
      setPlans(all)
      // Open on their current plan, or the version nearest their calorie target.
      const start = all.find((p) => p.id === currentPlanId) ?? closestPlan(all.filter((p) => p.family === 'balanced'), calorieTarget)
      if (start) { setFamily(start.family); setSex(start.sex); setGoal(start.goal) }
    }).catch((e) => { console.error('Meal plans load error:', e); if (live) setPlans([]) })
    return () => { live = false }
  }, [open, currentPlanId, calorieTarget])

  const families = useMemo(() => [...new Set((plans ?? []).map((p) => p.family))], [plans])
  const plan = (plans ?? []).find((p) => p.family === family && p.sex === sex && p.goal === goal)

  async function save() {
    if (!plan) return
    setSaving(true)
    setError(null)
    const { choice, error: err } = await startPlan(clientId, plan.id)
    if (err) { setSaving(false); setError("Couldn't save that plan. Try again."); return }
    if (matchTargets) {
      const t = { calorie_target: plan.avg_calories, protein_target_g: plan.avg_protein_g, carbs_target_g: plan.avg_carbs_g, fats_target_g: plan.avg_fats_g }
      const { error: tErr } = await supabase.from('clients').update(t).eq('id', clientId)
      if (!tErr) onTargets?.(t)
    }
    setSaving(false)
    onPicked?.({ ...choice, plan })
    onClose()
  }

  async function remove() {
    setSaving(true)
    const { error: err } = await stopPlan(clientId)
    setSaving(false)
    if (err) { setError("Couldn't remove the plan. Try again."); return }
    onPicked?.(null)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={currentPlanId ? `Change ${clientFirst}'s meal plan` : `Give ${clientFirst} a meal plan`}
      footer={
        <div className="space-y-2">
          <Button block size="lg" onClick={save} disabled={!plan || saving || plan?.id === currentPlanId && !matchTargets}>
            {saving ? 'Saving' : plan?.id === currentPlanId ? 'Keep this plan' : `Give ${clientFirst} this plan`}
          </Button>
          {currentPlanId && (
            <button onClick={remove} disabled={saving} className="w-full h-10 text-[14px] font-bold text-muted hover:text-ink">Remove their meal plan</button>
          )}
        </div>
      }
    >
      {!plans ? (
        <div className="h-40 rounded-[16px] bg-surface-2 animate-pulse" />
      ) : (
        <div className="space-y-4">
          <p className="text-[14px] text-muted -mt-1">Every day of the plan shows in {clientFirst}'s app with recipes, ready to tick off as they eat.</p>
          <div className="flex flex-wrap gap-2">
            {families.map((f) => (
              <button
                key={f}
                onClick={() => setFamily(f)}
                aria-pressed={family === f}
                className={`h-9 px-3.5 rounded-full text-[13px] font-bold transition-colors ${family === f ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted hover:text-ink'}`}
              >
                {PLAN_FAMILIES[f]?.name ?? f}
              </button>
            ))}
          </div>
          {PLAN_FAMILIES[family] && <p className="text-[13px] text-muted -mt-2">{PLAN_FAMILIES[family].blurb}</p>}
          <Segmented value={sex} onChange={setSex} options={SEXES} />
          <Segmented value={goal} onChange={setGoal} options={GOAL_OPTIONS} />

          {plan && (
            <div className="rounded-[16px] bg-surface-2 px-4 py-3">
              <p className="font-bold text-ink">{plan.name}</p>
              <p className="text-[13px] text-muted tabular-nums mt-0.5">
                About {plan.avg_calories.toLocaleString('en-AU')} kcal a day · {plan.avg_protein_g} g protein · {plan.avg_carbs_g} g carbs · {plan.avg_fats_g} g fats
              </p>
              {calorieTarget > 0 && (
                <p className="text-[13px] text-muted mt-1">
                  {clientFirst}'s target is {calorieTarget.toLocaleString('en-AU')} kcal{Math.abs(plan.avg_calories - calorieTarget) > 150 ? `, so they may want to adjust serves a little.` : ', a close match.'}
                </p>
              )}
            </div>
          )}

          <button onClick={() => setMatchTargets((v) => !v)} className="w-full flex items-start gap-3 text-left" aria-pressed={matchTargets}>
            <span className={`mt-0.5 w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 ${matchTargets ? 'border-accent bg-accent text-on-accent' : 'border-line-strong'}`}>
              {matchTargets && <Check size={12} strokeWidth={3} />}
            </span>
            <span className="text-[14px] text-ink">Set {clientFirst}'s daily calories and macros to match this plan</span>
          </button>
          {error && <p className="text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3">{error}</p>}
        </div>
      )}
    </Sheet>
  )
}

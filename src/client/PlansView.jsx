// On-demand meal plans: 9 styles, each in male and female, cutting, maintenance and bulking
// versions (54 in all). Every plan rotates through 3 days: Mon, Wed and Fri are the same,
// Tue, Thu and Sat are the same, and Sunday is its own day. Starting a plan puts each
// day's meals on the food log, ready to tick off.
import { useEffect, useState } from 'react'
import { ChevronRight, Check, Calculator } from 'lucide-react'
import { Card, Button, Segmented, Sheet, Chip } from '../ui'
import { DAY_TYPES, GOALS, PLAN_FAMILIES, REFERENCE, formatServes, planDayType } from '../lib/recipes'
import { fetchPlanItems, planDay, closestPlan } from '../lib/mealLibrary'
import { toLocalDateStr } from './dates'
import { capitalise } from './foods'

const n = (v) => Math.round(Number(v) || 0).toLocaleString('en-AU')
const SEX = [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]
const GOAL_OPTIONS = Object.entries(GOALS).map(([value, g]) => ({ value, label: g.name }))

function planMacros(p) {
  return `P ${n(p.avg_protein_g)}g · C ${n(p.avg_carbs_g)}g · F ${n(p.avg_fats_g)}g`
}

// One plan: what it is built on, then each of its 3 days meal by meal.
function PlanSheet({ plan, recipes, isMine, onClose, onStart, onStop, onOpenRecipe, busy, startLabel = 'Start this plan' }) {
  const [items, setItems] = useState(null)
  const [failed, setFailed] = useState(false)
  const [day, setDay] = useState(() => planDayType(toLocalDateStr()))

  useEffect(() => {
    let live = true
    fetchPlanItems(plan.id).then((d) => live && setItems(d)).catch((e) => { console.error('Plan meals load error:', e); if (live) setFailed(true) })
    return () => { live = false }
  }, [plan.id])

  const today = planDayType(toLocalDateStr())
  const { meals, totals } = items ? planDay(items, recipes, day) : { meals: [], totals: null }

  return (
    <Sheet
      open
      onClose={onClose}
      title={PLAN_FAMILIES[plan.family]?.name || plan.family_name}
      footer={isMine ? (
        <Button variant="secondary" size="lg" block disabled={busy} onClick={onStop}>{busy ? 'Stopping...' : 'Stop this plan'}</Button>
      ) : (
        <Button size="lg" block disabled={busy || !items} onClick={onStart}>{busy ? 'Starting...' : startLabel}</Button>
      )}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Chip>{capitalise(plan.sex)}</Chip>
            <Chip>{GOALS[plan.goal]?.name}</Chip>
            {isMine && <Chip tone="accent"><Check size={12} /> Your plan</Chip>}
          </div>
          <p className="text-[15px] text-muted">{plan.description}</p>
          <p className="text-[13px] font-semibold text-ink tabular-nums">About {n(plan.avg_calories)} kcal a day · {planMacros(plan)}</p>
        </div>

        <Segmented value={day} onChange={setDay} options={DAY_TYPES.map((d) => ({ value: d.id, label: d.label }))} className="[&>button]:px-1.5 [&>button]:text-[13px]" />

        {failed ? (
          <p className="text-[15px] text-muted">Couldn't load this plan's meals. Close it and try again.</p>
        ) : !items ? (
          <div className="h-40 rounded-[16px] bg-surface-2 animate-pulse" />
        ) : (
          <section>
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <p className="text-[15px] font-bold text-ink">{DAY_TYPES.find((d) => d.id === day)?.label}{day === today && <span className="text-muted font-semibold"> · today</span>}</p>
              <p className="text-[13px] text-muted tabular-nums">{n(totals.calories)} kcal · P {n(totals.protein_g)}g</p>
            </div>
            <ul className="rounded-[16px] border border-line divide-y divide-line overflow-hidden">
              {meals.map((m) => (
                <li key={m.item.id}>
                  <button onClick={() => onOpenRecipe(m)} className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-surface-2">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-semibold text-muted">{capitalise(m.item.meal_type)}</span>
                      <span className="block text-[15px] font-bold text-ink">{m.recipe.name}</span>
                      <span className="block text-[13px] text-muted tabular-nums">{formatServes(m.servings)} {m.servings === 1 ? 'serve' : 'serves'} · {n(m.totals.calories)} kcal · P {n(m.totals.protein_g)}g</span>
                    </span>
                    <ChevronRight size={18} className="text-faint shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Sheet>
  )
}

// The coach's Nutrition library uses this too: no choice or calculator, and startLabel
// says what the button does there (give the plan to a client).
export default function PlansView({ plans, recipes, choice, startSex, startGoal, targetKcal, onWorkOut, onStart, onStop, onOpenRecipe, busy, startLabel, audience = 'client' }) {
  const [sex, setSex] = useState(startSex || 'male')
  const [goal, setGoal] = useState(startGoal || 'maintain')
  const [openId, setOpenId] = useState(null)

  const mine = choice ? plans.find((p) => p.id === choice.plan_id) : null
  const shown = plans.filter((p) => p.sex === sex && p.goal === goal)
  const open = plans.find((p) => p.id === openId)
  const ref = REFERENCE[sex]

  return (
    <div className="space-y-3">
      {mine && (
        <Card as="button" onClick={() => setOpenId(mine.id)} className="w-full flex items-center gap-3 text-left !bg-accent-soft !border-transparent">
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-bold text-muted">Your plan</span>
            <span className="block text-[17px] font-bold text-ink">{mine.name}</span>
            <span className="block text-[13px] text-muted tabular-nums">About {n(mine.avg_calories)} kcal a day. Today's meals are on your food log.</span>
          </span>
          <ChevronRight size={18} className="text-faint shrink-0" />
        </Card>
      )}

      <Card className="@3xl:max-w-[760px]">
        <p className="text-[17px] font-bold text-ink">Built for the average Australian</p>
        <p className="text-[15px] text-muted mt-1">
          {audience === 'coach'
            ? `These plans are sized for ${ref.label}, training 3 to 5 days a week (ABS National Health Survey). Clients who are bigger or smaller change the serves on any meal.`
            : `These plans are sized for ${ref.label}, training 3 to 5 days a week (ABS National Health Survey). If you are bigger or smaller, change the serves on any meal.`}
        </p>
        <p className="text-[13px] text-muted mt-2">Mon, Wed and Fri share the same meals, so do Tue, Thu and Sat. Sunday is its own day.</p>
      </Card>

      <Segmented value={sex} onChange={setSex} options={SEX} className="@3xl:max-w-[760px]" />
      <Segmented value={goal} onChange={setGoal} options={GOAL_OPTIONS} className="@3xl:max-w-[760px]" />
      <p className="text-[13px] text-muted px-1">{GOALS[goal].blurb}</p>

      <div className="grid gap-3 @3xl:grid-cols-2">
      {shown.map((p) => {
        const isMine = mine?.id === p.id
        return (
          <Card key={p.id} as="button" onClick={() => setOpenId(p.id)} className="w-full flex items-center gap-3 text-left">
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-[17px] font-bold text-ink">{PLAN_FAMILIES[p.family]?.name || p.family_name}</span>
                {isMine && <Chip tone="accent">Your plan</Chip>}
              </span>
              <span className="block text-[14px] text-muted mt-0.5">{PLAN_FAMILIES[p.family]?.blurb}</span>
              <span className="block text-[13px] font-semibold text-ink tabular-nums mt-1.5">About {n(p.avg_calories)} kcal a day</span>
              <span className="block text-[13px] text-muted tabular-nums">{planMacros(p)}</span>
            </span>
            <ChevronRight size={18} className="text-faint shrink-0" />
          </Card>
        )
      })}
      </div>

      {/* For anyone who is not the average size: their own number, then the nearest plan. */}
      {onWorkOut && <Card>
        <p className="text-[17px] font-bold text-ink">Not the average size?</p>
        {targetKcal > 0 ? (() => {
          const near = closestPlan(plans, targetKcal)
          const showing = near && near.sex === sex && near.goal === goal
          return (
            <>
              <p className="text-[15px] text-muted mt-1 tabular-nums">
                Your daily target is {n(targetKcal)} kcal. The closest plans are {capitalise(near.sex).toLowerCase()}, {GOALS[near.goal].name.toLowerCase()}, at about {n(near.avg_calories)} kcal. Change the serves on any meal to fine-tune.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {!showing && <Button size="sm" onClick={() => { setSex(near.sex); setGoal(near.goal) }}>Show those plans</Button>}
                <Button variant="secondary" size="sm" onClick={onWorkOut}><Calculator size={16} /> Recalculate</Button>
              </div>
            </>
          )
        })() : (
          <>
            <p className="text-[15px] text-muted mt-1">Work out your own daily calories, and we'll point you to the plans that fit best.</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={onWorkOut}><Calculator size={16} /> Work out my calories</Button>
          </>
        )}
      </Card>}

      {open && (
        <PlanSheet
          key={open.id}
          plan={open}
          recipes={recipes}
          isMine={mine?.id === open.id}
          busy={busy}
          startLabel={startLabel}
          onClose={() => setOpenId(null)}
          onStart={async () => { if (await onStart(open)) setOpenId(null) }}
          onStop={async () => { if (await onStop()) setOpenId(null) }}
          onOpenRecipe={(m) => onOpenRecipe(m)}
        />
      )}
    </div>
  )
}

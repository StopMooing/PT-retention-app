// One recipe, step by step: serves (amounts scale), every ingredient, numbered steps and a
// tip. "Add" logs it to the chosen meal with each ingredient, the same as any other meal.
// Opened from Recipes, a meal plan, or today's plan on the food log.
import { useState } from 'react'
import { Minus, Plus, Clock } from 'lucide-react'
import { Sheet, Button } from '../ui'
import { scaleRecipe, sumMacros, amountText, formatServes, recipeTime, MEAL_TYPES } from '../lib/recipes'
import { capitalise } from './foods'
import { RecipeHero } from '../lib/RecipePhoto'

const STEP = 0.25
const n = (v) => Math.round(Number(v) || 0).toLocaleString('en-AU')

// recipe: a row from fetchRecipes(). servings / meal: where it starts (a plan sets both).
// onAdd({ servings, meal }) does the logging; busy while it runs.
export default function RecipeSheet({ recipe, open, onClose, servings: startServings = 1, meal: startMeal, onAdd, busy, addLabel }) {
  // The parent keys this sheet by recipe, so these start fresh for each one.
  const [servings, setServings] = useState(startServings)
  const [meal, setMeal] = useState(startMeal || recipe?.meal_type || 'breakfast')
  if (!recipe) return null

  const items = scaleRecipe(recipe.recipe_ingredients, servings)
  const t = sumMacros(items)
  const time = recipeTime(recipe)
  const steps = Array.isArray(recipe.steps) ? recipe.steps : []
  const bump = (d) => setServings((s) => Math.min(6, Math.max(STEP, Math.round((s + d) / STEP) * STEP)))

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Recipe"
      footer={onAdd && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-surface-2" role="radiogroup" aria-label="Add to which meal">
            {MEAL_TYPES.map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={meal === m}
                onClick={() => setMeal(m)}
                className={`h-9 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${meal === m ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'}`}
              >
                {capitalise(m)}
              </button>
            ))}
          </div>
          <Button size="lg" block disabled={busy} onClick={() => onAdd({ servings, meal })}>
            {busy ? 'Adding...' : addLabel || `Add to ${meal}`}
          </Button>
        </div>
      )}
    >
      <div className="space-y-5">
        <RecipeHero recipe={recipe} />
        <div className="-mt-1">
          <h2 className="text-[20px] font-bold text-ink leading-snug">{recipe.name}</h2>
          {recipe.description && <p className="text-[15px] text-muted mt-1">{recipe.description}</p>}
          {time && <p className="text-[13px] font-semibold text-muted mt-1.5 flex items-center gap-1"><Clock size={14} /> {time}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-display text-[28px] leading-none text-ink tabular-nums">{n(t.calories)} kcal</p>
            <p className="text-[13px] text-muted tabular-nums mt-1">
              P {n(t.protein_g)}g · C {n(t.carbs_g)}g · F {n(t.fats_g)}g
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0" aria-label="Serves">
            <button onClick={() => bump(-STEP)} disabled={servings <= STEP} aria-label="Fewer serves" className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-ink disabled:opacity-40"><Minus size={18} /></button>
            <div className="w-16 text-center">
              <p className="text-[17px] font-bold text-ink tabular-nums leading-tight">{formatServes(servings)}</p>
              <p className="text-[12px] text-muted leading-tight">{servings === 1 ? 'serve' : 'serves'}</p>
            </div>
            <button onClick={() => bump(STEP)} disabled={servings >= 6} aria-label="More serves" className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-ink disabled:opacity-40"><Plus size={18} /></button>
          </div>
        </div>

        <section>
          <h4 className="text-[15px] font-bold text-ink mb-1.5">Ingredients</h4>
          <ul className="rounded-[16px] border border-line divide-y divide-line">
            {items.map((i, k) => (
              <li key={k} className="flex items-baseline gap-3 px-3.5 py-2.5">
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-ink">{i.label}</span>
                  {i.measure && i.measure !== amountText(i) && <span className="block text-[13px] text-muted">{i.measure}</span>}
                </span>
                <span className="text-[14px] font-bold text-ink tabular-nums shrink-0 text-right">
                  {amountText(i)}
                  {i.count ? <span className="block text-[12px] font-normal text-muted">{i.grams} g</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {steps.length > 0 && (
          <section>
            <h4 className="text-[15px] font-bold text-ink mb-1.5">Method</h4>
            {servings !== 1 && <p className="text-[13px] text-muted mb-2">The steps are written for 1 serve. Scale any water or stock the same way as the ingredients.</p>}
            <ol className="space-y-3">
              {steps.map((s, k) => (
                <li key={k} className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-accent-soft text-ink text-[13px] font-bold flex items-center justify-center shrink-0 tabular-nums">{k + 1}</span>
                  <p className="flex-1 text-[15px] text-ink leading-relaxed pt-0.5">{s}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {recipe.tip && (
          <div className="rounded-[16px] bg-accent-soft px-4 py-3">
            <p className="text-[13px] font-bold text-ink">Tip</p>
            <p className="text-[15px] text-ink">{recipe.tip}</p>
          </div>
        )}
      </div>
    </Sheet>
  )
}

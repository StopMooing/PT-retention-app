// The chosen meal plan's meals for the day on show, on the food log. One tap on the circle
// logs the meal with all its ingredients; tapping the meal opens the recipe. A logged
// meal shows ticked (its food_logs row carries the planned meal's id).
import { Check, ChevronRight } from 'lucide-react'
import { Card } from '../ui'
import { DAY_TYPES, formatServes } from '../lib/recipes'
import { capitalise } from './foods'

const n = (v) => Math.round(Number(v) || 0).toLocaleString('en-AU')

export default function TodaysPlan({ plan, day, dayType, isToday, dayLogs, busyId, onTick, onUntick, onOpen }) {
  if (!plan || !day?.meals.length) return null
  const loggedFor = (m) => dayLogs.find((f) => f.plan_item_id === m.item.id)
  const done = day.meals.filter(loggedFor).length

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="px-4 pt-3.5 pb-2">
        <p className="text-[13px] font-semibold text-muted">{isToday ? "Today's plan" : 'Planned for this day'} · {DAY_TYPES.find((d) => d.id === dayType)?.label}</p>
        <p className="text-[17px] font-bold text-ink">{plan.name}</p>
        <p className="text-[13px] text-muted tabular-nums">
          {done === day.meals.length ? 'Every meal ticked off. Nice work.' : done > 0 ? `${done} of ${day.meals.length} meals ticked off` : `${day.meals.length} meals · ${n(day.totals.calories)} kcal`}
        </p>
      </div>
      <ul className="divide-y divide-line border-t border-line">
        {day.meals.map((m) => {
          const log = loggedFor(m)
          const busy = busyId === m.item.id
          return (
            <li key={m.item.id} className={`flex items-center gap-1 pr-2 ${log ? 'bg-accent-soft' : ''}`}>
              <button onClick={() => onOpen(m)} className="flex-1 min-w-0 flex items-center gap-2 pl-4 py-3 text-left">
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold text-muted">{capitalise(m.item.meal_type)}</span>
                  <span className="block text-[15px] font-bold text-ink truncate">{m.recipe.name}</span>
                  <span className="block text-[13px] text-muted tabular-nums">{n(m.totals.calories)} kcal · P {n(m.totals.protein_g)}g{m.servings !== 1 ? ` · ${formatServes(m.servings)} serves` : ''}</span>
                </span>
                <ChevronRight size={16} className="text-faint shrink-0" />
              </button>
              <button
                onClick={() => (log ? onUntick(log) : onTick(m))}
                disabled={busy}
                aria-pressed={!!log}
                aria-label={log ? `Untick ${m.recipe.name}` : `Tick off ${m.recipe.name}`}
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${log ? 'bg-accent text-on-accent' : 'border-2 border-line-strong text-transparent'} ${busy ? 'animate-pulse' : ''}`}>
                  <Check size={18} strokeWidth={3} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

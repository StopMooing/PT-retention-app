// Nutrition: today against targets, target editing, water, the last week and the food log.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Droplets, CalendarCheck, TrendingUp, Utensils, BookOpen, Pencil, X, Check } from 'lucide-react'
import { Button, Ring, Segmented, Chip } from '../../ui'
import { Panel, UnitInput, Bar, LineChart } from './parts'
import { dayNutrition, dayOf, daysSince, addDays, toLocalDateStr, formatDate, formatMl } from '../lib'

const PERIODS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
]
const MACROS = [
  { key: 'protein', label: 'Protein', color: 'var(--protein)', kcalPerG: 4 },
  { key: 'carbs', label: 'Carbs', color: 'var(--carbs)', kcalPerG: 4 },
  { key: 'fats', label: 'Fats', color: 'var(--fats)', kcalPerG: 9 },
]
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack', 'other']

function band(cal, target) {
  if (!target || !cal) return null
  if (cal >= target * 0.9 && cal <= target * 1.1) return 'hit'
  return cal < target * 0.9 ? 'under' : 'over'
}

function Today({ foodLogs, waterLogs, t }) {
  const d = dayNutrition(foodLogs, waterLogs)
  const nothing = d.food.length === 0 && d.waterMl === 0
  return (
    <Panel title="Today" icon={Utensils} sub={formatDate(toLocalDateStr(), { weekday: 'long', day: 'numeric', month: 'short' })}>
      {nothing ? (
        <p className="text-[15px] text-muted">Nothing logged yet today.</p>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Ring value={t.calories ? d.calories / t.calories : 0} size={104} stroke={9} color="var(--kcal)" className="self-center">
            <span className="font-display text-2xl leading-none text-ink tabular-nums">{d.calories}</span>
            <span className="text-xs text-muted">{t.calories ? `of ${t.calories} kcal` : 'kcal'}</span>
          </Ring>
          <div className="flex-1 space-y-3">
            {MACROS.map((m) => {
              const v = d[m.key], target = t[m.key]
              return (
                <div key={m.key}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-muted">{m.label}</span>
                    <span className="text-ink font-semibold tabular-nums">
                      {v} g{target ? <span className="text-muted font-normal"> of {target} g{v < target ? `, ${target - v} g to go` : ''}</span> : ''}
                    </span>
                  </div>
                  <Bar value={target ? v / target : 0} color={m.color} />
                </div>
              )
            })}
            <div>
              <div className="flex justify-between text-[13px] mb-1">
                <span className="text-muted">Water</span>
                <span className="text-ink font-semibold">{formatMl(d.waterMl)}<span className="text-muted font-normal"> of {formatMl(t.water)}</span></span>
              </div>
              <Bar value={t.water ? d.waterMl / t.water : 0} color="var(--protein)" />
            </div>
          </div>
        </div>
      )}
    </Panel>
  )
}

function Targets({ tv, onSave, onCancel, saving }) {
  const [editing, setEditing] = useState(false)
  const [mode, setMode] = useState('grams')
  const [pct, setPct] = useState({ protein: '', carbs: '', fats: '' })
  const setters = { protein: tv.setProteinTarget, carbs: tv.setCarbsTarget, fats: tv.setFatsTarget }
  const grams = { protein: tv.proteinTarget, carbs: tv.carbsTarget, fats: tv.fatsTarget }

  function start() { setEditing(true); setMode('grams'); setPct({ protein: '', carbs: '', fats: '' }) }
  function cancel() { setEditing(false); onCancel() }
  async function save() { if (await onSave()) setEditing(false) }

  function onCalories(value) {
    tv.setCalorieTarget(value)
    if (mode === 'percentages') {
      const cals = parseFloat(value) || 0
      MACROS.forEach((m) => {
        const p = parseFloat(pct[m.key]) || 0
        setters[m.key](p > 0 ? String(Math.round((cals * (p / 100)) / m.kcalPerG)) : '')
      })
    }
  }
  function onPct(m, value) {
    setPct((prev) => ({ ...prev, [m.key]: value }))
    const cals = parseFloat(tv.calorieTarget) || 0
    const p = parseFloat(value) || 0
    setters[m.key](cals > 0 && p > 0 ? String(Math.round((cals * (p / 100)) / m.kcalPerG)) : '')
  }
  const total = MACROS.reduce((s, m) => s + (parseFloat(pct[m.key]) || 0), 0)

  return (
    <Panel
      title="Daily targets"
      icon={Target}
      action={!editing && <Button variant="ghost" size="sm" onClick={start}><Pencil size={15} /> Edit</Button>}
    >
      {editing ? (
        <div className="space-y-4">
          <Segmented value={mode} onChange={(v) => { setMode(v); if (v === 'grams') setPct({ protein: '', carbs: '', fats: '' }) }} options={[{ value: 'grams', label: 'Grams' }, { value: 'percentages', label: 'Percentages' }]} />
          <div>
            <p className="text-sm font-semibold text-ink mb-1.5">Calories</p>
            <UnitInput unit="kcal" placeholder="2000" value={tv.calorieTarget} onChange={(e) => onCalories(e.target.value)} className="max-w-[220px]" />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {MACROS.map((m) => (
              <div key={m.key}>
                <p className="text-sm font-semibold text-ink mb-1.5">{m.label}</p>
                {mode === 'grams' ? (
                  <UnitInput unit="g" placeholder="0" value={grams[m.key]} onChange={(e) => setters[m.key](e.target.value)} className="!px-3" />
                ) : (
                  <>
                    <UnitInput unit="%" min="0" max="100" placeholder="0" value={pct[m.key]} onChange={(e) => onPct(m, e.target.value)} className="!px-3" />
                    <p className="text-[13px] mt-1 px-1" style={{ color: m.color }}>{grams[m.key] ? `${grams[m.key]} g a day` : tv.calorieTarget ? 'Enter a %' : 'Set calories first'}</p>
                  </>
                )}
              </div>
            ))}
          </div>
          {mode === 'percentages' && (
            <p className={`text-[13px] font-semibold rounded-[14px] px-4 py-2.5 ${total > 100 ? 'bg-bad-soft text-bad' : total === 100 ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'}`}>
              Total {total}%{total > 100 ? ', over 100%' : total === 100 ? '' : `, ${100 - total}% left`}
            </p>
          )}
          <div className="pt-3 border-t border-line">
            <p className="text-sm font-semibold text-ink mb-1.5">Water</p>
            <UnitInput unit="ml" icon={Droplets} placeholder="2000" value={tv.waterTargetInput} onChange={(e) => tv.setWaterTargetInput(e.target.value)} className="max-w-[220px]" />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? 'Saving' : 'Save targets'}</Button>
            <Button variant="ghost" onClick={cancel}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Calories', value: tv.calorieTarget, unit: 'kcal', color: 'var(--kcal)' },
            { label: 'Protein', value: tv.proteinTarget, unit: 'g', color: 'var(--protein)' },
            { label: 'Carbs', value: tv.carbsTarget, unit: 'g', color: 'var(--carbs)' },
            { label: 'Fats', value: tv.fatsTarget, unit: 'g', color: 'var(--fats)' },
            { label: 'Water', value: tv.waterTarget ? formatMl(tv.waterTarget).split(' ')[0] : '', unit: formatMl(tv.waterTarget || 0).split(' ')[1], color: 'var(--protein)' },
          ].map((m) => (
            <div key={m.label} className="rounded-[14px] bg-surface-2 px-3 py-2.5">
              <p className="text-[13px] text-muted flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />{m.label}</p>
              <p className="font-display text-[22px] leading-tight text-ink tabular-nums">
                {m.value || <span className="font-sans text-sm font-semibold text-faint">Not set</span>}
                {m.value ? <span className="font-sans text-xs font-semibold text-muted ml-1">{m.unit}</span> : null}
              </p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

function Water({ waterLogs, waterTarget, onLogWater, onDeleteWater, savingWater }) {
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('ml')
  const today = toLocalDateStr()
  const todays = waterLogs.filter((w) => w.logged_date === today)
  const total = todays.reduce((s, w) => s + (w.amount_ml || 0), 0)

  async function logCustom() {
    const raw = parseFloat(amount)
    if (!raw || raw <= 0) return
    const ml = unit === 'ml' ? Math.round(raw) : Math.round(raw * 1000)
    if (await onLogWater(ml)) setAmount('')
  }

  return (
    <Panel title="Water today" icon={Droplets} sub={`${formatMl(total)} of ${formatMl(waterTarget)}`}>
      <Bar value={waterTarget ? total / waterTarget : 0} color="var(--protein)" className="!h-2.5" />
      <div className="flex flex-wrap gap-2 mt-4">
        {[250, 330, 500, 750, 1000].map((ml) => (
          <Button key={ml} variant="secondary" size="sm" disabled={savingWater} onClick={() => onLogWater(ml)}>
            +{formatMl(ml)}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <UnitInput placeholder="Other amount" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') logCustom() }} className="flex-1 !h-11" />
        <Segmented className="w-[104px] shrink-0" value={unit} onChange={setUnit} options={[{ value: 'ml', label: 'ml' }, { value: 'L', label: 'L' }]} />
        <Button onClick={logCustom} disabled={savingWater || !amount}>Log</Button>
      </div>
      {todays.length > 0 && (
        <ul className="mt-4 divide-y divide-line border-t border-line -mx-4">
          {todays.map((log) => (
            <li key={log.id} className="flex items-center justify-between px-4 h-12">
              <span className="text-[15px] text-ink font-semibold">{formatMl(log.amount_ml)} <span className="text-[13px] text-muted font-normal">{new Date(log.created_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}</span></span>
              <button onClick={() => onDeleteWater(log.id)} aria-label="Delete water entry" className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-muted hover:text-bad hover:bg-bad-soft">
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export default function NutritionTab(props) {
  const navigate = useNavigate()
  const { foodLogs, waterLogs, tv, mealPlan } = props
  const [period, setPeriod] = useState('30')
  const t = {
    calories: parseInt(tv.calorieTarget) || 0,
    protein: parseInt(tv.proteinTarget) || 0,
    carbs: parseInt(tv.carbsTarget) || 0,
    fats: parseInt(tv.fatsTarget) || 0,
    water: tv.waterTarget,
  }
  const today = toLocalDateStr()

  // Day totals over the chosen period, newest first.
  const inPeriod = foodLogs.filter((f) => daysSince(f.logged_at) <= parseInt(period))
  const byDay = inPeriod.reduce((acc, l) => { const d = dayOf(l.logged_at); (acc[d] ||= []).push(l); return acc }, {})
  const days = Object.keys(byDay).sort().reverse()
  const totals = Object.fromEntries(days.map((d) => [d, dayNutrition(byDay[d], [], d)]))

  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((d) => {
    const tot = dayNutrition(foodLogs, [], d)
    return { d, cal: tot.food.length ? tot.calories : null, band: tot.food.length ? band(tot.calories, t.calories) : null }
  })
  const logged7 = last7.filter((x) => x.cal !== null)
  const hit7 = last7.filter((x) => x.band === 'hit').length
  const avg = (k) => (logged7.length ? Math.round(logged7.reduce((s, x) => s + dayNutrition(foodLogs, [], x.d)[k], 0) / logged7.length) : 0)

  const chartDays = [...days].reverse()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 items-start">
      <div className="space-y-3 lg:space-y-4 min-w-0">
        <Today foodLogs={foodLogs} waterLogs={waterLogs} t={t} />
        <Targets tv={tv} onSave={props.onSaveTargets} onCancel={props.onCancelTargets} saving={props.savingTargets} />
        <Water waterLogs={waterLogs} waterTarget={tv.waterTarget} onLogWater={props.onLogWater} onDeleteWater={props.onDeleteWater} savingWater={props.savingWater} />
        <Panel
          title="Meal plan"
          icon={BookOpen}
          action={<Button variant="ghost" size="sm" onClick={() => navigate('/nutrition')}>{mealPlan ? 'Change' : 'Assign'}</Button>}
        >
          {!mealPlan ? (
            <p className="text-[15px] text-muted">No meal plan assigned.</p>
          ) : (
            <>
              <p className="font-bold text-ink">{mealPlan.name}</p>
              {mealPlan.description && <p className="text-[13px] text-muted mt-0.5">{mealPlan.description}</p>}
              <p className="text-[13px] text-muted mt-2 tabular-nums">
                {mealPlan.daily_calories} kcal · {mealPlan.protein_target_g} g protein · {mealPlan.carbs_target_g} g carbs · {mealPlan.fats_target_g} g fats
              </p>
            </>
          )}
        </Panel>
      </div>

      <div className="space-y-3 lg:space-y-4 min-w-0">
        <Panel title="Last 7 days" icon={CalendarCheck} action={t.calories > 0 && <Chip tone={hit7 >= 5 ? 'accent' : 'neutral'}>{hit7} of 7 on target</Chip>}>
          {t.calories === 0 ? (
            <p className="text-[15px] text-muted">Set a calorie target to see which days landed on it.</p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 text-center">
                {last7.map((x) => (
                  <div key={x.d} className="flex flex-col items-center gap-1">
                    <span className={`text-xs font-bold ${x.d === today ? 'text-accent' : 'text-muted'}`}>{formatDate(x.d, { weekday: 'narrow' })}</span>
                    <span
                      title={x.cal !== null ? `${x.cal} kcal` : 'Not logged'}
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${x.band === 'hit' ? 'bg-accent text-on-accent' : x.band ? 'bg-warn-soft text-warn' : 'border-2 border-dashed border-line-strong'}`}
                    >
                      {x.band === 'hit' ? <Check size={16} strokeWidth={3} /> : x.band === 'under' ? <span className="text-[11px] font-bold">Low</span> : x.band === 'over' ? <span className="text-[11px] font-bold">High</span> : null}
                    </span>
                    <span className="text-[11px] text-muted tabular-nums">{x.cal ?? ''}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-line text-center">
                <div><p className="font-display text-xl text-ink tabular-nums">{avg('calories')}</p><p className="text-xs text-muted">Avg kcal</p></div>
                <div><p className="font-display text-xl text-ink tabular-nums">{avg('protein')} g</p><p className="text-xs text-muted">Avg protein</p></div>
                <div><p className="font-display text-xl text-ink tabular-nums">{logged7.length}/7</p><p className="text-xs text-muted">Days logged</p></div>
              </div>
            </>
          )}
        </Panel>

        <Panel title="Calories" icon={TrendingUp}>
          {chartDays.length === 0 ? (
            <p className="text-[15px] text-muted">No food logged in this period.</p>
          ) : (
            <>
              <p className="text-[13px] text-muted mb-2">Daily total{t.calories ? `, target ${t.calories} kcal dashed` : ''}</p>
              <LineChart
                series={[{ values: chartDays.map((d) => totals[d].calories), color: 'var(--kcal)', dots: true }]}
                target={t.calories || undefined}
                labels={[formatDate(chartDays[0], { day: 'numeric', month: 'short' }), formatDate(chartDays[chartDays.length - 1], { day: 'numeric', month: 'short' })]}
              />
            </>
          )}
          <Segmented className="mt-4" value={period} onChange={setPeriod} options={PERIODS} />
        </Panel>

        <Panel title="Food log" icon={Utensils} sub={inPeriod.length ? `${inPeriod.length} entries` : undefined} padded={false}>
          {days.length === 0 ? (
            <p className="text-[15px] text-muted px-4 pb-4 pt-2">Food {props.clientFirst} logs will show here.</p>
          ) : (
            <div className="divide-y divide-line border-t border-line">
              {days.map((d) => {
                const tot = totals[d]
                const b = band(tot.calories, t.calories)
                const logs = [...byDay[d]].sort((a, c) => {
                  const ai = MEAL_ORDER.indexOf(a.meal_type?.toLowerCase() ?? 'other'), ci = MEAL_ORDER.indexOf(c.meal_type?.toLowerCase() ?? 'other')
                  return (ai === -1 ? 99 : ai) - (ci === -1 ? 99 : ci)
                })
                return (
                  <div key={d} className="px-4 py-3.5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="font-bold text-ink">{d === today ? 'Today' : formatDate(d, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                      {b && <Chip tone={b === 'hit' ? 'accent' : 'warn'}>{b === 'hit' ? 'On target' : b === 'under' ? 'Under' : 'Over'}</Chip>}
                    </div>
                    <p className="text-[13px] text-muted tabular-nums mb-2">
                      <span className="text-ink font-semibold">{tot.calories} kcal</span> · P {tot.protein} g · C {tot.carbs} g · F {tot.fats} g
                    </p>
                    <ul className="space-y-1.5">
                      {logs.map((log) => (
                        <li key={log.id} className="flex items-center gap-3 text-[15px]">
                          <span className="w-20 shrink-0 text-xs font-bold text-muted capitalize">{log.meal_type ?? 'other'}</span>
                          <span className="flex-1 min-w-0 truncate text-ink">{log.food_name}{log.brand && <span className="text-muted">, {log.brand}</span>}</span>
                          <span className="text-[13px] text-muted tabular-nums shrink-0">{Math.round(parseFloat(log.calories) || 0)} kcal</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

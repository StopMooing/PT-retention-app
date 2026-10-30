// Calorie calculator (Mifflin-St Jeor). "Use this" saves the calorie and macro targets on
// the client row, exactly as before.
import { useState } from 'react'
import { supabase } from '../supabase'
import { Sheet, Button, Field, Segmented } from '../ui'

const ACTIVITY = [
  ['1.2', 'Mostly sitting, little exercise'],
  ['1.375', 'Lightly active, 1 to 3 days a week'],
  ['1.55', 'Moderately active, 3 to 5 days a week'],
  ['1.725', 'Very active, 6 to 7 days a week'],
  ['1.9', 'Physical job plus training'],
]

export default function TdeeSheet({ open, onClose, client, onSaved }) {
  const [inputs, setInputs] = useState({ age: '', gender: 'male', heightCm: '', weightKg: '', activity: '1.55' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const set = (k) => (e) => setInputs((p) => ({ ...p, [k]: e.target.value }))

  function calculate() {
    const age = parseFloat(inputs.age)
    const h = parseFloat(inputs.heightCm)
    const w = parseFloat(inputs.weightKg)
    const act = parseFloat(inputs.activity)
    if (!age || !h || !w) { setError('Fill in your age, height and weight first.'); return }
    setError(null)
    const bmr = inputs.gender === 'male' ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161
    const maintenance = Math.round(bmr * act)
    setResult({ maintenance, fatLoss: maintenance - 500, aggressiveLoss: maintenance - 750, muscleGain: maintenance + 300 })
  }

  async function handleSetGoal(calories) {
    setError(null)
    try {
      const protein = Math.round((calories * 0.30) / 4)
      const carbs = Math.round((calories * 0.40) / 4)
      const fats = Math.round((calories * 0.30) / 9)
      const { error } = await supabase
        .from('clients')
        .update({ calorie_target: calories, protein_target_g: protein, carbs_target_g: carbs, fats_target_g: fats })
        .eq('id', client.id)
      if (error) throw error
      onSaved({ calories, protein, carbs, fats })
      setResult(null)
      onClose()
    } catch (e) {
      console.error('Set goal error:', e)
      setError("Couldn't save that target. Try again.")
    }
  }

  return (
    <Sheet open={open} onClose={() => { setResult(null); setError(null); onClose() }} title="Calorie calculator">
      <div className="space-y-4">
        <Segmented value={inputs.gender} onChange={(g) => setInputs((p) => ({ ...p, gender: g }))} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Age" inputMode="numeric" value={inputs.age} onChange={set('age')} />
          <Field label="Height (cm)" inputMode="decimal" value={inputs.heightCm} onChange={set('heightCm')} />
          <Field label="Weight (kg)" inputMode="decimal" value={inputs.weightKg} onChange={set('weightKg')} />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Activity</span>
          <select value={inputs.activity} onChange={set('activity')} className="h-12 px-4 rounded-[14px] border border-line-strong bg-surface text-ink outline-none focus:border-accent">
            {ACTIVITY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        {error && <p role="alert" className="text-[13px] font-semibold text-bad">{error}</p>}
        <Button size="lg" block variant={result ? 'secondary' : 'primary'} onClick={calculate}>Calculate</Button>

        {result && (
          <div className="rounded-[16px] border border-line divide-y divide-line">
            {[
              ['Maintain', result.maintenance, 'Stay where you are'],
              ['Steady fat loss', result.fatLoss, 'About 0.5 kg a week'],
              ['Faster fat loss', result.aggressiveLoss, 'About 0.75 kg a week'],
              ['Build muscle', result.muscleGain, 'Lean gain'],
            ].map(([label, cal, desc]) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-ink">{label}</p>
                  <p className="text-[13px] text-muted">{desc}</p>
                </div>
                <p className="font-display text-[22px] text-ink tabular-nums">{cal}<span className="font-sans text-xs font-bold text-muted ml-0.5">kcal</span></p>
                <Button variant="soft" size="sm" onClick={() => handleSetGoal(cal)}>Use</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  )
}

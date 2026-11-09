// Body measurements (cm). One row per client per day; any of the five can be blank.
// The client's Progress tab and the coach's client Overview both read summary() so the
// two screens always show the same numbers.
import { supabase } from '../supabase'

export const PARTS = [
  { key: 'waist_cm', label: 'Waist' },
  { key: 'hips_cm', label: 'Hips' },
  { key: 'chest_cm', label: 'Chest' },
  { key: 'arm_cm', label: 'Arm' },
  { key: 'thigh_cm', label: 'Thigh' },
]

const COLS = 'id, client_id, measured_on, waist_cm, hips_cm, chest_cm, arm_cm, thigh_cm, logged_by, created_at'

// Oldest first.
export async function fetchMeasurements(clientId) {
  const { data, error } = await supabase.from('body_measurements').select(COLS).eq('client_id', clientId).order('measured_on', { ascending: true })
  if (error) throw error
  return data ?? []
}

// values: { waist_cm: '82.5', ... } as typed. Blank means not measured. Returns { row } or { error }.
export async function saveMeasurements(clientId, day, values) {
  const row = { client_id: clientId, measured_on: day }
  let any = false
  for (const p of PARTS) {
    const raw = String(values[p.key] ?? '').trim().replace(',', '.')
    if (!raw) { row[p.key] = null; continue }
    const n = Math.round(parseFloat(raw) * 10) / 10
    if (!(n > 0 && n < 300)) return { error: 'range', part: p.label }
    row[p.key] = n
    any = true
  }
  if (!any) return { error: 'empty' }
  const { data, error } = await supabase.from('body_measurements').upsert(row, { onConflict: 'client_id,measured_on' }).select(COLS).single()
  if (error) return { error: 'save', detail: error }
  return { row: data }
}

export async function deleteMeasurement(id) {
  const { data, error } = await supabase.from('body_measurements').delete().eq('id', id).select('id')
  if (error || !data?.length) return { error: error ?? new Error('no row deleted') }
  return {}
}

const fmt = (v) => {
  const n = Math.round(Number(v) * 10) / 10
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
export const fmtCm = fmt

// Per part: the latest value, when, and the change since the first time it was measured.
// Parts never measured are left out.
export function summary(rows) {
  return PARTS.map((p) => {
    const had = rows.filter((r) => r[p.key] != null)
    if (!had.length) return null
    const first = had[0]
    const last = had[had.length - 1]
    const change = had.length > 1 ? Math.round((Number(last[p.key]) - Number(first[p.key])) * 10) / 10 : 0
    return { ...p, value: Number(last[p.key]), on: last.measured_on, change, since: first.measured_on }
  }).filter(Boolean)
}

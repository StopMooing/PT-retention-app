// Water for the day shown on the Nutrition tab: progress toward the target the coach set
// (clients.water_target_ml), quick add buttons and undo of the last add. The coach sees
// the same water_logs rows on the client's Nutrition tab.
import { useEffect, useState } from 'react'
import { Undo2 } from 'lucide-react'
import { supabase } from '../supabase'

export default function WaterCard({ client, date, showToast }) {
  const [logs, setLogs] = useState([])
  const [busy, setBusy] = useState(false)
  const target = client?.water_target_ml || 2000

  useEffect(() => {
    if (!client?.id) return
    let cancelled = false
    supabase.from('water_logs').select('id, amount_ml, logged_by, created_at').eq('client_id', client.id).eq('logged_date', date)
      .then(({ data, error }) => {
        if (error) console.error('Water load error:', error)
        if (!cancelled) setLogs(data ?? [])
      })
    return () => { cancelled = true }
  }, [client?.id, date])

  const total = logs.reduce((s, w) => s + (w.amount_ml || 0), 0)
  const mine = [...logs].filter((w) => w.logged_by === client.user_id).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  async function add(ml) {
    if (busy) return
    setBusy(true)
    const { data, error } = await supabase.from('water_logs')
      .insert({ client_id: client.id, logged_by: client.user_id, amount_ml: ml, logged_date: date })
      .select('id, amount_ml, logged_by, created_at').single()
    setBusy(false)
    if (error) { console.error('Water add error:', error); showToast?.("Couldn't add that. Try again."); return }
    setLogs((prev) => [...prev, data])
  }

  async function undo() {
    const last = mine[0]
    if (!last || busy) return
    setBusy(true)
    const { data, error } = await supabase.from('water_logs').delete().eq('id', last.id).select('id')
    setBusy(false)
    if (error || !data?.length) { console.error('Water undo error:', error); showToast?.("Couldn't undo that. Try again."); return }
    setLogs((prev) => prev.filter((w) => w.id !== last.id))
  }

  const litres = (ml) => (Math.round(ml / 50) * 50 / 1000).toLocaleString('en-AU', { maximumFractionDigits: 2 })
  return (
    <section className="rounded-[24px] bg-surface-2 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-muted">Water</p>
          <p className="font-display text-[26px] leading-[1.1] text-ink tabular-nums">
            {litres(total)}<span className="font-sans text-[13px] font-semibold text-muted"> of {litres(target)} L</span>
          </p>
        </div>
        {mine.length > 0 && (
          <button onClick={undo} disabled={busy} aria-label="Undo last water" className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:bg-surface">
            <Undo2 size={18} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2.5">
        {[250, 500, 750].map((ml) => (
          <button key={ml} onClick={() => add(ml)} disabled={busy} className="h-10 rounded-full bg-surface text-ink text-[14px] font-semibold tabular-nums disabled:opacity-50">+{ml} ml</button>
        ))}
      </div>
    </section>
  )
}

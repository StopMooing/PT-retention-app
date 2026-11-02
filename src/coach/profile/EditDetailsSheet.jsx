// Edit a client's name, email and phone. Before they join, the email is the one their
// invite link signs up with, so a typo here is fixed here.
import { useState } from 'react'
import { Sheet, Field, Button } from '../../ui'

export default function EditDetailsSheet({ open, onClose, client, onSave }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  // Fresh copy of the client each time the sheet opens.
  const f = form ?? { full_name: client.full_name ?? '', email: client.email ?? '', phone: client.phone ?? '' }
  const set = (k) => (e) => setForm({ ...f, [k]: e.target.value })

  function close() { setForm(null); setError(null); onClose() }

  async function save(e) {
    e.preventDefault()
    if (!f.full_name.trim()) { setError('Add their name.'); return }
    setSaving(true)
    setError(null)
    const err = await onSave({ full_name: f.full_name.trim(), email: f.email.trim() || null, phone: f.phone.trim() || null })
    setSaving(false)
    if (err) { setError(err); return }
    close()
  }

  return (
    <Sheet open={open} onClose={close} title="Edit details">
      <form onSubmit={save} className="flex flex-col gap-4 pt-1">
        <Field label="Full name" required value={f.full_name} onChange={set('full_name')} autoComplete="off" />
        <Field
          label="Email" type="email" value={f.email} onChange={set('email')} autoComplete="off"
          hint={client.user_id ? 'For your records. Their sign-in email stays the same.' : 'Their invite link signs up with this email.'}
        />
        <Field label="Phone" type="tel" value={f.phone} onChange={set('phone')} autoComplete="off" />
        {error && <p role="alert" className="text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3">{error}</p>}
        <Button type="submit" size="lg" block disabled={saving}>{saving ? 'Saving' : 'Save'}</Button>
      </form>
    </Sheet>
  )
}

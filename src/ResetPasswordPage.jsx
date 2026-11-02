// Set a new password after following the reset link in the email. The link signs the
// person in for this one purpose (Supabase's PASSWORD_RECOVERY), so updateUser works.
import { useState } from 'react'
import { supabase } from './supabase'
import { Mark, Field, Button } from './ui'

export default function ResetPasswordPage({ hasSession, onDone }) {
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  async function save(e) {
    e.preventDefault()
    if (password.length < 8) { setError('Use at least 8 characters.'); return }
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (err) { setError(err.message); return }
    setDone(true)
  }

  return (
    <div className="min-h-screen flex flex-col px-7 pt-24 pb-10 bg-bg text-ink">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <Mark size={72} />
          <h1 className="m-0 mt-2 font-display text-[40px] leading-none">New password</h1>
        </div>
        {done ? (
          <div className="mt-12 space-y-4 text-center">
            <p className="text-[15px] text-ink">Password saved. You're signed in.</p>
            <Button size="lg" block onClick={onDone}>Continue</Button>
          </div>
        ) : !hasSession ? (
          <div className="mt-12 space-y-4 text-center">
            <p className="text-[15px] text-muted">This reset link has expired or was already used. Ask for a new one from the sign-in page.</p>
            <Button size="lg" block onClick={() => { window.location.href = '/login' }}>Back to sign in</Button>
          </div>
        ) : (
          <form onSubmit={save} className="flex flex-col gap-4 mt-12">
            <Field id="new-password" label="New password" type="password" required autoComplete="new-password" hint="At least 8 characters"
              value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="m-0 text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3">{error}</p>}
            <Button type="submit" size="lg" block disabled={saving}>{saving ? 'Saving...' : 'Save password'}</Button>
          </form>
        )}
      </div>
    </div>
  )
}

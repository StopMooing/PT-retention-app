import { useState } from 'react'
import { supabase } from './supabase'
import { Mark, Field, Button } from './ui'

export default function AuthPage({ defaultMode = 'login' }) {
  const [mode, setMode] = useState(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        // role is read by the handle_new_user trigger, which refuses a signup without
        // one. This form is coach signup; clients are created via a claim link instead.
        options: { data: { full_name: fullName, role: 'pt' } },
      })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
      // Profile is created automatically by a database trigger on auth.users
      setMessage('Account created! Check your email to confirm, then log in.')
      setMode('login')
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col px-7 pt-24 pb-10 bg-bg text-ink">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <Mark size={72} />
          <h1 className="m-0 mt-2 font-display text-[46px] leading-none tracking-[0.01em]">UNFNSHD</h1>
          <p className="m-0 text-[15px] text-muted">
            {mode === 'login' ? "We aren't done." : 'Create your coach account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-16">
          {mode === 'signup' && (
            <Field id="auth-name" label="Full name" type="text" required autoComplete="name"
              value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" />
          )}
          <Field id="auth-email" label="Email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Field id="auth-password" label="Password" type="password" required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && <p className="m-0 text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3">{error}</p>}
          {message && <p className="m-0 text-sm text-accent bg-accent-soft rounded-[14px] px-4 py-3">{message}</p>}

          <Button type="submit" size="lg" block disabled={loading} className="mt-2">
            {loading
              ? mode === 'login' ? 'Signing in…' : 'Creating account…'
              : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm mt-8 text-muted">
          {mode === 'login' ? 'Coach without an account? ' : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }}
            className="font-semibold underline underline-offset-2 text-accent"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

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

    if (mode === 'forgot') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset` })
      setLoading(false)
      if (resetError) { setError(resetError.message); return }
      setMessage("If that email has an account, a reset link is on its way. Check your inbox (and junk folder).")
      setMode('login')
      return
    }

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

  const heading = mode === 'login' ? 'Pick up where you left off.' : mode === 'forgot' ? 'Reset your password.' : 'Create your coach account.'
  const lede = mode === 'login'
    ? 'Your plan, your food and your coach, all in one place.'
    : mode === 'forgot' ? "We'll email you a link to set a new one." : 'Coach your clients and keep every check-in in one place.'

  return (
    <div className="min-h-screen flex flex-col px-6 pt-[max(env(safe-area-inset-top),72px)] pb-8 bg-bg text-ink">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        <div className="flex items-center gap-2.5">
          <Mark size={34} />
          <span className="font-display text-[28px] leading-none tracking-[0.5px] pt-1">UNFNSHD</span>
        </div>
        <h1 className="m-0 mt-14 font-display text-[clamp(38px,12vw,46px)] leading-[0.98]">{heading}</h1>
        <p className="m-0 mt-3 text-[16px] leading-relaxed text-muted">{lede}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-9">
          {mode === 'signup' && (
            <Field id="auth-name" label="Full name" type="text" required autoComplete="name"
              value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" />
          )}
          <Field id="auth-email" label="Email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          {mode !== 'forgot' && (
            <Field id="auth-password" label="Password" type="password" required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password} onChange={(e) => setPassword(e.target.value)} />
          )}

          {error && <p className="m-0 text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3">{error}</p>}
          {message && <p className="m-0 text-sm text-ink bg-accent-soft rounded-[14px] px-4 py-3">{message}</p>}

          <Button type="submit" size="lg" block disabled={loading} className="mt-2">
            {loading
              ? mode === 'login' ? 'Signing in...' : mode === 'forgot' ? 'Sending...' : 'Creating account...'
              : mode === 'login' ? 'Sign in' : mode === 'forgot' ? 'Send reset link' : 'Create account'}
          </Button>
          {mode === 'login' ? (
            <button type="button" onClick={() => { setMode('forgot'); setError(null); setMessage(null) }} className="self-center text-sm font-semibold text-ink py-2.5">
              Forgot password?
            </button>
          ) : (
            <button type="button" onClick={() => { setMode('login'); setError(null); setMessage(null) }} className="self-center text-sm font-semibold text-ink py-2.5">
              Back to sign in
            </button>
          )}
        </form>

        {mode === 'login' && (
          <div className="mt-auto pt-10 space-y-3">
            <div className="rounded-[20px] bg-surface-2 p-[18px]">
              <p className="m-0 text-[15px] font-bold">New here?</p>
              <p className="m-0 mt-1 text-[14px] leading-relaxed text-muted">Your coach sends you an invite link. Open it from your email to set up your account.</p>
            </div>
            <p className="text-center text-sm text-muted">
              Coach?{' '}
              <button onClick={() => { setMode('signup'); setError(null); setMessage(null) }} className="font-semibold underline underline-offset-2 text-ink">
                Create a coach account
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

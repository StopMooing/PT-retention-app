import { useState } from 'react'
import { supabase } from './supabase'

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

  // Brand colours (light mode). These move into shared CSS variables in the redesign.
  const ink = '#121212'
  const forest = '#2E6B57'
  const inputClass =
    'w-full h-[50px] px-4 rounded-[14px] border bg-white text-base outline-none transition-colors focus:border-[#2E6B57]'

  return (
    <div
      className="min-h-screen flex flex-col px-7 pt-24 pb-10"
      style={{ backgroundColor: '#F3F1EC', color: ink, fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <div className="w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <svg width="72" height="72" viewBox="0 0 240 240" role="img" aria-label="UNFNSHD">
            <g transform="rotate(-30 120 120)">
              <circle cx="120" cy="120" r="80" fill="none" stroke={ink} strokeWidth="26" strokeLinecap="round" strokeDasharray="400 102.65" />
            </g>
            <circle cx="160" cy="50.7" r="15" fill={forest} />
          </svg>
          <h1
            className="m-0 mt-2 text-[46px] leading-none"
            style={{ fontFamily: "'Baloo 2', 'Arial Rounded MT Bold', sans-serif", fontWeight: 800 }}
          >
            UNFNSHD
          </h1>
          <p className="m-0 text-[15px]" style={{ color: '#55534E' }}>
            {mode === 'login' ? "We aren't done." : 'Create your coach account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-16">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-name" className="text-sm font-semibold">Full name</label>
              <input
                id="auth-name"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                className={inputClass}
                style={{ borderColor: '#CFCBC2' }}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-email" className="text-sm font-semibold">Email</label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
              style={{ borderColor: '#CFCBC2' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-password" className="text-sm font-semibold">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              style={{ borderColor: '#CFCBC2' }}
            />
          </div>

          {error && (
            <p className="m-0 text-sm text-red-700 bg-red-50 border border-red-100 rounded-[14px] px-4 py-3">
              {error}
            </p>
          )}

          {message && (
            <p className="m-0 text-sm rounded-[14px] px-4 py-3" style={{ color: forest, backgroundColor: '#E3EEE8' }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-[52px] mt-2 rounded-full text-white text-base font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: forest }}
          >
            {loading
              ? mode === 'login' ? 'Signing in…' : 'Creating account…'
              : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm mt-8" style={{ color: '#55534E' }}>
          {mode === 'login' ? 'Coach without an account? ' : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }}
            className="font-semibold underline underline-offset-2"
            style={{ color: forest }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { supabase } from './supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
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
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: data.user.id, full_name: fullName, email })
        if (profileError) {
          setError(profileError.message)
          setLoading(false)
          return
        }
      }
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
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <span className="text-black font-bold text-lg tracking-tight">StopMooing</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 m-0">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              {mode === 'login'
                ? 'Sign in to your StopMooing account'
                : 'Start managing your clients today'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {mode === 'signup' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-black transition-colors"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-black transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
                  {error}
                </p>
              )}

              {message && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3.5 py-2.5">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-800 active:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading
                  ? mode === 'login' ? 'Signing in…' : 'Creating account…'
                  : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }}
              className="text-black font-semibold underline underline-offset-2 hover:text-gray-700 transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

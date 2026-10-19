import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabasePublic } from './supabase'

export default function ClaimPage() {
  const { token } = useParams()
  const [client, setClient] = useState(null)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function fetchClient() {
      const { data, error } = await supabasePublic
        .rpc('get_claim_client', { p_token: token })
        .maybeSingle()
      if (error || !data) setInvalid(true)
      else setClient(data)
    }
    fetchClient()
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Please choose a password of at least 8 characters.')
      return
    }
    setError(null)
    setLoading(true)

    // supabasePublic, not supabase: a coach opening this link while signed in must not
    // have their own session replaced. The claim token travels in metadata and the
    // handle_new_user trigger links the client row during signup.
    const { error: signUpError } = await supabasePublic.auth.signUp({
      email: client.email,
      password,
      options: {
        data: {
          full_name: client.full_name,
          role: 'client',
          claim_token: token,
        },
      },
    })

    setLoading(false)
    if (signUpError) {
      const msg = signUpError.message || ''
      if (msg.toLowerCase().includes('already registered')) {
        setError('An account already exists for this email address. Try signing in instead.')
      } else if (msg.includes('claim link')) {
        setError('This invite link has already been used.')
      } else {
        setError('Could not set up your account. Please contact your trainer.')
      }
      return
    }
    setDone(true)
  }

  const firstName = client?.full_name?.split(' ')[0] ?? ''

  if (!client && !invalid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  if (invalid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="text-center max-w-sm">
          <p className="text-sm font-semibold text-gray-900 m-0">Invite link not valid</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            This link has already been used, or it isn't correct. Ask your trainer to send you a new one.
          </p>
          <Link to="/login" className="inline-block text-xs font-semibold text-black underline underline-offset-2 mt-4">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 m-0">You're all set, {firstName}</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Check your email to confirm your address, then sign in to see your program.
          </p>
          <Link to="/login" className="inline-block text-xs font-semibold text-black underline underline-offset-2 mt-5">
            Go to sign in
          </Link>
        </div>
      </div>
    )
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
            <h1 className="text-2xl font-bold text-gray-900 m-0">Welcome, {firstName}</h1>
            <p className="text-gray-500 text-sm mt-2">
              Your trainer has set up your account. Choose a password to finish.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={client.email ?? ''}
                  readOnly
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-0.5">
                  Not your email? Ask your trainer to update it before you continue.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Choose a password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-black transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-800 active:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? 'Setting up…' : 'Create my account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

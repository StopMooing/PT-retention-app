import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { supabase, supabasePublic } from './supabase'
import { Mark, Field, Button } from './ui'

// The client's first screen, opened from their coach's invite link. Styled to match the
// sign-in screen so the first and second visits feel like the same app.
function Shell({ children, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col px-7 pt-20 pb-10 bg-bg text-ink">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <Mark size={64} />
          <p className="m-0 mt-2 font-display text-[40px] leading-none tracking-[0.01em]">UNFNSHD</p>
          {subtitle && <p className="m-0 text-[15px] text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

function Message({ title, body, children }) {
  return (
    <div className="mt-14 text-center">
      <h1 className="m-0 text-[22px] font-bold text-ink">{title}</h1>
      <p className="m-0 mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
      {children}
    </div>
  )
}

export default function ClaimPage() {
  const { token } = useParams()
  const [client, setClient] = useState(null)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  // This email already has an account: sign in with it and link it to the invite.
  const [existing, setExisting] = useState(false)

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
    if (!existing && password.length < 8) {
      setError('Please choose a password of at least 8 characters.')
      return
    }
    setError(null)
    setLoading(true)

    if (existing) {
      await linkExistingAccount()
      return
    }

    // supabasePublic, not supabase: a coach opening this link while signed in must not
    // have their own session replaced. The claim token travels in metadata and the
    // handle_new_user trigger links the client row during signup.
    const { data: signUpData, error: signUpError } = await supabasePublic.auth.signUp({
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
    // An existing email comes back as an error, or (with email confirmation on) as a user
    // with no identities. Either way: offer to link that account instead.
    const alreadyRegistered = (signUpError?.message || '').toLowerCase().includes('already registered')
      || (!signUpError && signUpData?.user && (signUpData.user.identities?.length ?? 1) === 0)
    if (alreadyRegistered) {
      setExisting(true)
      setPassword('')
      setError('You already have an account with this email. Enter its password to link it to your trainer.')
      return
    }
    if (signUpError) {
      const msg = signUpError.message || ''
      if (msg.includes('claim link')) {
        setError('This invite link has already been used.')
      } else {
        setError('Could not set up your account. Please contact your trainer.')
      }
      return
    }
    setDone(true)
  }

  // Signs in with the existing account (this browser now uses it), then links it to the
  // invite. The database only links when the account's email is the invite's email.
  async function linkExistingAccount() {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: client.email, password })
    if (signInError) {
      setLoading(false)
      setError("That password didn't work. Use Forgot password on the sign-in page if you need a new one.")
      return
    }
    const { data: result, error: linkError } = await supabase.rpc('claim_client_with_account', { p_token: token })
    if (linkError || result !== 'linked') {
      await supabase.auth.signOut()
      setLoading(false)
      setError(result === 'already_linked'
        ? 'This account is already linked to a trainer. Ask your trainer to check your email address.'
        : result === 'email_mismatch'
          ? "This account's email doesn't match the invite. Ask your trainer to check your email address."
          : 'Could not link your account. Please contact your trainer.')
      return
    }
    // Full reload so the app picks up the client account straight away.
    window.location.href = '/'
  }

  const firstName = client?.full_name?.split(' ')[0] ?? ''

  if (!client && !invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-ink">
        <Mark size={44} className="animate-pulse" />
      </div>
    )
  }

  const signInLink = (label) => (
    <Link to="/login" className="inline-block mt-6 text-sm font-semibold text-accent underline underline-offset-2">
      {label}
    </Link>
  )

  if (invalid) {
    return (
      <Shell>
        <Message
          title="This invite link has expired"
          body="It may have been used already, or it isn't quite right. Ask your trainer to send you a new one."
        >
          {signInLink('Already have an account? Sign in')}
        </Message>
      </Shell>
    )
  }

  // The coach created this client without an email, so there is no address to register
  // against. Better to say so than show a form that cannot succeed.
  if (!client.email) {
    return (
      <Shell>
        <Message
          title={firstName ? `Almost ready, ${firstName}` : 'Almost ready'}
          body="Your trainer hasn't added your email address yet. Ask them to add it, then open this link again."
        />
      </Shell>
    )
  }

  if (done) {
    return (
      <Shell>
        <div className="mt-14 flex flex-col items-center text-center">
          <span className="w-14 h-14 rounded-full bg-accent text-on-accent flex items-center justify-center mb-5">
            <Check size={28} strokeWidth={2.5} />
          </span>
          <h1 className="m-0 text-[22px] font-bold text-ink">You're all set, {firstName}</h1>
          <p className="m-0 mt-2 text-[15px] leading-relaxed text-muted">
            Check your email to confirm your address, then sign in to see your program.
          </p>
          <Link
            to="/login"
            className="w-full mt-8 h-[52px] rounded-full bg-accent text-on-accent font-bold text-base inline-flex items-center justify-center hover:bg-accent-strong transition-colors"
          >
            Go to sign in
          </Link>
        </div>
      </Shell>
    )
  }

  return (
    <Shell subtitle="We aren't done.">
      <div className="mt-12 text-center">
        <h1 className="m-0 text-[24px] font-bold text-ink">
          {firstName ? `Welcome, ${firstName}` : 'Welcome'}
        </h1>
        <p className="m-0 mt-2 text-[15px] leading-relaxed text-muted">
          {existing ? 'Sign in with your existing account to link it to your trainer.' : "Your trainer has set up your account. Choose a password and you're in."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
        <Field
          id="claim-email"
          label="Email"
          type="email"
          value={client.email ?? ''}
          readOnly
          inputClassName="bg-surface-2 text-muted border-line"
          hint="Not your email? Ask your trainer to update it before you continue."
        />
        <Field
          id="claim-password"
          label={existing ? 'Your password' : 'Choose a password'}
          type="password"
          required
          autoComplete={existing ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={existing ? '' : 'At least 8 characters'}
        />

        {error && <p className="m-0 text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3">{error}</p>}

        <Button type="submit" size="lg" block disabled={loading} className="mt-2">
          {loading ? (existing ? 'Linking...' : 'Setting up...') : existing ? 'Link my account' : 'Create my account'}
        </Button>
      </form>

      <p className="text-center text-sm mt-8 text-muted">
        {existing ? 'New here?' : 'Already have an account?'}{' '}
        <button type="button" onClick={() => { setExisting(!existing); setError(null); setPassword('') }} className="font-semibold underline underline-offset-2 text-accent">
          {existing ? 'Create an account' : 'Sign in to link it'}
        </button>
      </p>
    </Shell>
  )
}

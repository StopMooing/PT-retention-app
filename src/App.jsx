import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import { prefetchClientRow } from './client/data'
// Each side loads only its own code: a client never downloads the coach screens.
const AuthPage = lazy(() => import('./AuthPage'))
const ClaimPage = lazy(() => import('./ClaimPage'))
const ExerciseLibrary = lazy(() => import('./ExerciseLibrary'))
const ProgramBuilder = lazy(() => import('./ProgramBuilder'))
const NutritionPlanner = lazy(() => import('./NutritionPlanner'))
const HabitTracker = lazy(() => import('./HabitTracker'))
const ClientProfile = lazy(() => import('./ClientProfile'))
const ClientApp = lazy(() => import('./ClientApp'))
const CoachShell = lazy(() => import('./coach/CoachShell'))
const Dashboard = lazy(() => import('./coach/Dashboard'))
const MessagesPage = lazy(() => import('./coach/messages/MessagesPage'))
const ResetPasswordPage = lazy(() => import('./ResetPasswordPage'))

const roleKey = (uid) => `unfnshd-role-${uid}`
function readRole(uid) {
  try { return localStorage.getItem(roleKey(uid)) } catch { return null }
}
function writeRole(uid, role) {
  try { if (role) localStorage.setItem(roleKey(uid), role); else localStorage.removeItem(roleKey(uid)) } catch { /* storage unavailable */ }
}
import { Mark } from './ui'

// A password reset link lands on /reset (or on the home page with type=recovery in the
// address if /reset isn't on Supabase's allowed list). Read before Supabase tidies the URL.
const RECOVERY_AT_LOAD = typeof window !== 'undefined' &&
  (window.location.pathname === '/reset' || window.location.hash.includes('type=recovery'))

// Links in our auth emails (docs/email-templates) point at unfnshd.app/auth/confirm with a
// token, not at supabase.co, so email filters see one site. The app checks the token here:
// a password reset opens the new password page, a confirmed email goes into the app.
const CONFIRM_AT_LOAD = (() => {
  if (typeof window === 'undefined' || window.location.pathname !== '/auth/confirm') return null
  const q = new URLSearchParams(window.location.search)
  const tokenHash = q.get('token_hash')
  const type = q.get('type')
  return tokenHash && type ? { tokenHash, type } : { failed: true }
})()

export default function App() {
  const [session, setSession] = useState(undefined)
  // Whose role this is, so a role is never used for a different person (see below).
  const [role, setRole] = useState({ uid: undefined, value: null })
  const [recovering, setRecovering] = useState(RECOVERY_AT_LOAD || CONFIRM_AT_LOAD?.type === 'recovery')
  // null while checking an email link, 'failed' when it was expired or already used.
  const [confirm, setConfirm] = useState(CONFIRM_AT_LOAD ? (CONFIRM_AT_LOAD.failed ? 'failed' : 'checking') : null)

  useEffect(() => {
    if (!CONFIRM_AT_LOAD || CONFIRM_AT_LOAD.failed) return
    supabase.auth.verifyOtp({ token_hash: CONFIRM_AT_LOAD.tokenHash, type: CONFIRM_AT_LOAD.type }).then(({ error }) => {
      if (error) { console.error('Email link error:', error); setRecovering(false); setConfirm('failed'); return }
      if (CONFIRM_AT_LOAD.type === 'recovery') {
        // New password page, with the session the link just opened already in hand.
        supabase.auth.getSession().then(({ data }) => { setSession(data.session); setConfirm(null) })
        return
      }
      window.location.replace('/') // email confirmed: straight into the app
    })
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // The role decides which side of the app opens. It is remembered on the phone per
  // account, so the app opens without waiting for it; it is still checked every launch and
  // corrected if it ever changed. Keyed on the user, not the session object: a token
  // refresh is not a new person and must not bring the splash screen back.
  const uid = session === undefined ? undefined : session?.user?.id ?? null
  const knownRole = useMemo(() => (uid ? readRole(uid) : null), [uid])
  useEffect(() => {
    if (!uid) return
    // `cancelled` guards against an older fetch resolving last.
    let cancelled = false
    // Most people signing in are clients: fetch their screens and their record while the
    // role loads.
    if (knownRole !== 'pt') { import('./ClientApp'); prefetchClientRow(uid) }
    supabase.from('profiles').select('role').eq('id', uid).single().then(({ data, error }) => {
      if (cancelled) return
      if (error && knownRole) return // offline or a blip: keep the role we know
      const value = data?.role ?? null
      setRole({ uid, value })
      writeRole(uid, value)
    })
    return () => { cancelled = true }
  }, [uid, knownRole])
  // The role gate is closed until there is a role for the person signed in now (checked,
  // or remembered on this phone). Without this the redirect below could use the PREVIOUS
  // user's role and send a signing-in coach to the client app.
  const checked = role.uid === uid
  const userRole = checked ? role.value : knownRole
  const roleLoading = uid === undefined || (!!uid && !checked && !knownRole)

  const splash = (
    <div className="min-h-dvh flex items-center justify-center bg-bg text-ink" role="status" aria-label="Loading">
      <Mark size={44} className="animate-pulse" />
    </div>
  )
  if (confirm === 'checking') return splash
  if (confirm === 'failed') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg text-ink px-6">
        <div className="text-center max-w-sm w-full">
          <Mark size={56} className="mx-auto" />
          <p className="font-display text-[26px] mt-5">This link has expired</p>
          <p className="text-muted mt-2">It may have been used already. Sign in, or ask for a new link from the sign-in page.</p>
          <a href="/login" className="mt-6 h-[52px] w-full rounded-full bg-accent text-on-accent font-bold inline-flex items-center justify-center">Go to sign in</a>
        </div>
      </div>
    )
  }
  if (session === undefined || roleLoading) return splash

  if (recovering) {
    return (
      <Suspense fallback={splash}>
        <ResetPasswordPage hasSession={!!session} onDone={() => { setRecovering(false); window.history.replaceState(null, '', '/') }} />
      </Suspense>
    )
  }

  const loggedInRedirect = userRole === 'pt'
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/my-workout" replace />

  return (
    <Suspense fallback={splash}>
    <Routes>
      <Route path="/claim/:token" element={<ClaimPage />} />
      <Route path="/" element={session ? loggedInRedirect : <AuthPage defaultMode="login" />} />
      <Route path="/auth" element={session ? loggedInRedirect : <AuthPage />} />
      <Route path="/login" element={session ? loggedInRedirect : <AuthPage defaultMode="login" />} />
      <Route path="/signup" element={session ? loggedInRedirect : <AuthPage defaultMode="signup" />} />
      {session && (
        <Route element={<CoachShell user={session.user} />}>
          <Route path="/dashboard" element={
            userRole === 'pt' ? <Dashboard user={session.user} /> : <Navigate to="/my-workout" replace />
          } />
          <Route path="/exercise-library" element={
            userRole === 'pt' ? <ExerciseLibrary user={session.user} /> : <Navigate to="/my-workout" replace />
          } />
          <Route path="/program-builder" element={
            userRole === 'pt' ? <ProgramBuilder user={session.user} /> : <Navigate to="/my-workout" replace />
          } />
          <Route path="/nutrition" element={
            userRole === 'pt' ? <NutritionPlanner /> : <Navigate to="/my-workout" replace />
          } />
          <Route path="/habits" element={
            userRole === 'pt' ? <HabitTracker /> : <Navigate to="/my-workout" replace />
          } />
          <Route path="/clients/:clientId" element={
            userRole === 'pt' ? <ClientProfile user={session.user} /> : <Navigate to="/my-workout" replace />
          } />
          <Route path="/messages/:clientId?" element={
            userRole === 'pt' ? <MessagesPage user={session.user} /> : <Navigate to="/my-workout" replace />
          } />
        </Route>
      )}
      {session && (
        <Route path="/my-workout" element={
          userRole === 'pt' ? <Navigate to="/dashboard" replace /> : <ClientApp />
        } />
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}

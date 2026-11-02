import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
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
import { Mark } from './ui'

// A password reset link lands on /reset (or on the home page with type=recovery in the
// address if /reset isn't on Supabase's allowed list). Read before Supabase tidies the URL.
const RECOVERY_AT_LOAD = typeof window !== 'undefined' &&
  (window.location.pathname === '/reset' || window.location.hash.includes('type=recovery'))

export default function App() {
  const [session, setSession] = useState(undefined)
  const [userRole, setUserRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const [recovering, setRecovering] = useState(RECOVERY_AT_LOAD)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return
    // The role gate must close again on every session change. Without this the redirect
    // below is computed from the PREVIOUS user's role, which sends a signing-in coach to
    // the client app. `cancelled` guards against an older fetch resolving last.
    let cancelled = false
    setRoleLoading(true)
    // Most people signing in are clients: fetch their screens while the role loads.
    if (session) import('./ClientApp')
    async function fetchRole() {
      try {
        // The session already holds the user, so this skips a network round trip.
        const user = session?.user
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          if (cancelled) return
          setUserRole(data?.role ?? null)
        } else {
          setUserRole(null)
        }
      } finally {
        if (!cancelled) setRoleLoading(false)
      }
    }
    fetchRole()
    return () => { cancelled = true }
  }, [session])

  const splash = (
    <div className="min-h-dvh flex items-center justify-center bg-bg text-ink" role="status" aria-label="Loading">
      <Mark size={44} className="animate-pulse" />
    </div>
  )
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

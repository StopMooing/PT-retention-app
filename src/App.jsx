import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import AuthPage from './AuthPage'
import ClaimPage from './ClaimPage'
import ExerciseLibrary from './ExerciseLibrary'
import ProgramBuilder from './ProgramBuilder'
import NutritionPlanner from './NutritionPlanner'
import HabitTracker from './HabitTracker'
import ClientProfile from './ClientProfile'
import ClientApp from './ClientApp'
import CoachShell from './coach/CoachShell'
import Dashboard from './coach/Dashboard'
import { Mark } from './ui'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [userRole, setUserRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    async function fetchRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
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

  if (session === undefined || roleLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg text-ink" role="status" aria-label="Loading">
        <Mark size={44} className="animate-pulse" />
      </div>
    )
  }

  const loggedInRedirect = userRole === 'pt'
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/my-workout" replace />

  return (
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
            userRole === 'pt' ? <ClientProfile /> : <Navigate to="/my-workout" replace />
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
  )
}

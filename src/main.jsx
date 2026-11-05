import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { initSentry, Sentry } from './sentry.js'
import { Mark, Button } from './ui'

initSentry()

// After a new version goes live, a phone with the app already open still runs the old
// code, which asks for screen files that no longer exist. Reload once to pick up the new
// version instead of showing the crash screen. The guard stops a reload loop.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem('unfnshd-reloaded-at') || 0)
    if (Date.now() - last < 30000) return
    sessionStorage.setItem('unfnshd-reloaded-at', String(Date.now()))
  } catch { /* storage unavailable: still reload once */ }
  event.preventDefault()
  window.location.reload()
})

function CrashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-bg text-ink">
      <Mark size={48} />
      <p className="text-lg font-bold">Something went wrong.</p>
      <p className="text-sm text-muted -mt-2">It has been reported. Reloading usually fixes it.</p>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<CrashScreen />}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)

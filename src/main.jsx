import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { initSentry, Sentry } from './sentry.js'
import { Mark, Button } from './ui'
import { registerServiceWorker } from './lib/push'

initSentry()
registerServiceWorker()

// After a new version goes live, a phone or browser with the app already open still runs
// the old code, which asks for screen files that no longer exist (and for a few seconds
// while a release spreads, a new file can briefly fail too). Reload to pick up the new
// version, up to 3 times in 2 minutes, showing "Updating" instead of the crash screen.
const isUpdateError = (e) =>
  /Importing a module script failed|dynamically imported module|Failed to fetch dynamically|error loading dynamically|_result\.default|Unable to preload/i.test(String(e?.message || e || ''))

let reloading = false
function reloadForUpdate() {
  if (reloading) return true
  let tries = []
  try { tries = JSON.parse(sessionStorage.getItem('unfnshd-update-reloads') || '[]').filter((t) => Date.now() - t < 120000) } catch { /* storage unavailable */ }
  if (tries.length >= 3) return false
  tries.push(Date.now())
  try { sessionStorage.setItem('unfnshd-update-reloads', JSON.stringify(tries)) } catch { /* storage unavailable */ }
  reloading = true
  setTimeout(() => window.location.reload(), tries.length === 1 ? 300 : 2000)
  return true
}

window.addEventListener('vite:preloadError', (event) => {
  if (reloadForUpdate()) event.preventDefault()
})

function CrashScreen({ error }) {
  const updating = isUpdateError(error) && reloadForUpdate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-bg text-ink">
      <Mark size={48} />
      {updating ? (
        <p className="text-lg font-bold">Getting the latest version...</p>
      ) : (
        <>
          <p className="text-lg font-bold">Something went wrong.</p>
          <p className="text-sm text-muted -mt-2">It has been reported. Reloading usually fixes it.</p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={({ error }) => <CrashScreen error={error} />}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)

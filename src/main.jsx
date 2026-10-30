import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { initSentry, Sentry } from './sentry.js'
import { Mark, Button } from './ui'

initSentry()

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

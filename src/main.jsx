import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { initSentry, Sentry } from './sentry.js'

initSentry()

function CrashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-lg font-semibold">Something went wrong.</p>
      <p className="text-sm text-gray-500">It has been reported. Reloading usually fixes it.</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-black hover:bg-gray-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg"
      >
        Reload
      </button>
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

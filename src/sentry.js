// Error monitoring. Sentry only runs in the deployed app (not local dev) and only when
// VITE_SENTRY_DSN is set in Vercel.
//
// Privacy: this app holds body weights, check-in notes and progress photos. Sentry gets the
// code-level error and nothing about the person: no IP or cookies (sendDefaultPii off), no
// session replay, no performance tracing, and breadcrumbs never carry typed input or
// request bodies.
import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

export function initSentry() {
  if (!dsn || !import.meta.env.PROD) return

  Sentry.init({
    dsn,
    environment: window.location.hostname === 'unfnshd.app' ? 'production' : 'preview',
    sendDefaultPii: false,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeBreadcrumb(crumb) {
      // Drop the text of clicked elements and any request bodies; keep the event shape.
      if (crumb.category === 'ui.input') return null
      if (crumb.category === 'ui.click') return { ...crumb, message: undefined }
      if (crumb.data) {
        const { request_body, response_body, ...rest } = crumb.data
        return { ...crumb, data: rest }
      }
      return crumb
    },
    beforeSend(event) {
      if (event.request) {
        delete event.request.data
        delete event.request.cookies
        delete event.request.headers
      }
      return event
    },
  })
}

export { Sentry }

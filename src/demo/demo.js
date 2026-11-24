// The website demo: the real app, running in the visitor's browser against made-up sample
// data (public/demo-data.json, built from tools/screenshots/fixtures.cjs). Every request
// the app makes goes to an in-memory stand-in (mockServer.js) instead of the database, so
// nothing is ever saved and nobody's real data is ever shown. A reload starts it fresh.

export const DEMO_KEY = 'unfnshd-demo'

// 'coach' | 'client' when this tab is in the demo, else null.
export function demoRole() {
  try {
    const r = sessionStorage.getItem(DEMO_KEY)
    return r === 'coach' || r === 'client' ? r : null
  } catch {
    return null
  }
}

export function startDemo(role) {
  try { sessionStorage.setItem(DEMO_KEY, role) } catch { /* storage blocked: the demo can't run */ }
  window.location.assign(role === 'coach' ? '/dashboard' : '/my-workout')
}

export function exitDemo() {
  try { sessionStorage.removeItem(DEMO_KEY) } catch { /* nothing to clear */ }
  window.location.assign('/')
}

// Move every date in the sample data forward by the days since it was built, so the demo
// always looks like this week. Works on the date part of any "YYYY-MM-DD..." string.
function shiftDates(value, days) {
  if (!days) return value
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!m) return value
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + days))
    const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    return ymd + value.slice(10)
  }
  if (Array.isArray(value)) return value.map((v) => shiftDates(v, days))
  if (value && typeof value === 'object') {
    const out = {}
    for (const k of Object.keys(value)) out[k] = shiftDates(value[k], days)
    return out
  }
  return value
}

const localDay = () => {
  const d = new Date()
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
}

let ready = null
function load() {
  if (!ready) {
    ready = (async () => {
      const role = demoRole()
      const [{ createMockServer }, data] = await Promise.all([
        import('./mockServer.js'),
        fetch('/demo-data.json').then((r) => r.json()),
      ])
      const [y, m, d] = data.builtOn.split('-').map(Number)
      const days = Math.round((localDay() - Date.UTC(y, m - 1, d)) / 86400000)
      const user = data.users[role]
      return { user, handle: createMockServer({ tables: shiftDates(data.tables, days), user, role }) }
    })()
  }
  return ready
}

// The fetch the database client uses in the demo.
export async function demoFetch(input, init) {
  const { handle } = await load()
  return handle(new Request(input, init))
}

// Where the database client keeps its sign-in in the demo: always signed in as the sample
// coach or client. Signing out leaves the demo.
export function demoStorage() {
  return {
    async getItem() {
      const { user } = await load()
      const { sessionFor } = await import('./mockServer.js')
      return JSON.stringify(sessionFor(user))
    },
    setItem() {},
    removeItem() {
      try { sessionStorage.removeItem(DEMO_KEY) } catch { /* nothing to clear */ }
    },
  }
}

// The AI features need a real account: in the demo they answer with a short note instead
// of reaching the server.
export function muteDemoAi() {
  const realFetch = window.fetch.bind(window)
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || ''
    if (url.includes('/api/chat')) {
      const text = "The AI coach is switched off in this demo. In a real account it builds workouts and meal ideas from what you ask for."
      return Promise.resolve(new Response(JSON.stringify({ text }), { status: 200, headers: { 'content-type': 'application/json' } }))
    }
    return realFetch(input, init)
  }
}

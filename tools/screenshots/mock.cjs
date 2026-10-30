// A tiny in-memory stand-in for Supabase, wired into Playwright with page.route.
// Lets the real app run locally against fixtures.cjs. Nothing leaves this machine.
const fx = require('./fixtures.cjs')
const REF = 'ksataubrattfspjpftlk'

function b64url(o) { return Buffer.from(JSON.stringify(o)).toString('base64url') }
function fakeJwt(user) {
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: user.id, email: user.email, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 86400, aud: 'authenticated' })}.sig`
}
function authUser(u) {
  return { id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, app_metadata: {}, user_metadata: { full_name: u.full_name, role: u.role }, created_at: '2026-01-01T00:00:00Z' }
}
function sessionFor(u) {
  return { access_token: fakeJwt(u), refresh_token: 'r', token_type: 'bearer', expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, user: authUser(u) }
}

function splitTop(s) {
  const out = []; let depth = 0, cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = '' } else cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}
const singular = (t) => t.replace(/s$/, '')

function project(db, table, row, select) {
  if (!select || select === '*') return { ...row }
  const out = {}
  for (const part of splitTop(select)) {
    if (part === '*') { Object.assign(out, row); continue }
    const m = part.match(/^(?:(\w+):)?(\w+)(?:!(\w+))?(?:\((.*)\))?$/s)
    if (!m) continue
    const [, alias, name, , inner] = m
    if (inner === undefined) {
      if (name === '*') Object.assign(out, row)
      else out[alias || name] = row[name]
      continue
    }
    const target = db[name] || []
    let fk = row[singular(name) + '_id'] !== undefined ? singular(name) + '_id' : null
    if (name === 'saved_workouts') fk = 'custom_workout_id'
    if (fk) {
      const hit = target.find((r) => r.id === row[fk])
      out[alias || name] = hit ? project(db, name, hit, inner) : null
    } else {
      const back = singular(table) + '_id'
      out[alias || name] = target.filter((r) => r[back] === row.id).map((r) => project(db, name, r, inner))
    }
  }
  return out
}

function matches(row, key, expr) {
  if (key.includes('.')) return true
  const v = row[key]
  const [op, ...rest] = expr.split('.')
  let val = rest.join('.')
  const not = op === 'not'
  if (not) return true
  const num = (x) => (x !== null && x !== '' && !isNaN(x) ? Number(x) : x)
  const a = num(v), b = num(val)
  switch (op) {
    case 'eq': return String(v) === val || (val === 'true' && v === true) || (val === 'false' && v === false)
    case 'neq': return String(v) !== val
    case 'gt': return a > b
    case 'gte': return a >= b
    case 'lt': return a < b
    case 'lte': return a <= b
    case 'is': return val === 'null' ? v == null : String(v) === val
    case 'in': return val.replace(/^\(|\)$/g, '').split(',').map((s) => s.replace(/"/g, '')).includes(String(v))
    case 'ilike': case 'like': {
      const re = new RegExp('^' + val.replace(/[%*]/g, '.*') + '$', 'i'); return re.test(String(v ?? ''))
    }
    default: return true
  }
}

function createDb() { return JSON.parse(JSON.stringify(fx.tables)) }

async function install(page, role) {
  const db = createDb()
  const user = fx.users[role]
  await page.addInitScript(([key, sess, theme]) => {
    if (sess) localStorage.setItem(key, JSON.stringify(sess))
    if (theme) localStorage.setItem('unfnshd-theme', theme)
  }, [`sb-${REF}-auth-token`, user ? sessionFor(user) : null, process.env.THEME || null])

  await page.route(`https://${REF}.supabase.co/**`, async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname
    const json = (status, body, headers = {}) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', ...headers }, body: JSON.stringify(body) })
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
    if (path.startsWith('/auth/v1/user')) return user ? json(200, authUser(user)) : json(401, { msg: 'no user' })
    if (path.startsWith('/auth/v1/token')) return user ? json(200, sessionFor(user)) : json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' })
    if (path.startsWith('/auth/v1/logout')) return route.fulfill({ status: 204 })
    if (path.startsWith('/auth/v1')) return json(200, {})
    if (path.startsWith('/storage/v1')) return json(200, [])
    if (path.startsWith('/rest/v1/rpc/')) {
      const fn = path.split('/').pop()
      if (fn === 'resolve_exercise_ids') {
        let names = []
        try { const b = req.postDataJSON(); names = b.p_names || b.names || Object.values(b)[0] || [] } catch {}
        return json(200, names.map((nm) => { const e = db.exercises.find((x) => x.name.toLowerCase() === String(nm).toLowerCase()); return { input_name: nm, name: nm, exercise_id: e ? e.id : null } }))
      }
      // A sample invite for the claim page. The token "expired" shows the invalid state.
      if (fn === 'get_claim_client') {
        let tok = ''
        try { tok = req.postDataJSON().p_token } catch {}
        return json(200, tok === 'expired' ? [] : [{ full_name: 'Jane Carter', email: 'jane@example.com' }])
      }
      return json(200, [])
    }
    const table = path.replace('/rest/v1/', '')
    if (!db[table]) db[table] = []
    const params = [...url.searchParams.entries()]
    const filterRows = () => db[table].filter((r) => params.every(([k, v]) => ['select', 'order', 'limit', 'offset', 'or', 'on_conflict', 'columns'].includes(k) || matches(r, k, v)))
    const prefer = req.headers()['prefer'] || ''
    const wantsObject = (req.headers()['accept'] || '').includes('vnd.pgrst.object')

    if (req.method() === 'GET' || req.method() === 'HEAD') {
      let rows = filterRows()
      const order = url.searchParams.get('order')
      if (order) {
        for (const o of order.split(',').reverse()) {
          const [col, dir] = o.split('.')
          if (col.includes('(')) continue
          rows = [...rows].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (dir === 'desc' ? -1 : 1))
        }
      }
      const total = rows.length
      const offset = Number(url.searchParams.get('offset') || 0)
      const limit = url.searchParams.get('limit')
      rows = rows.slice(offset, limit ? offset + Number(limit) : undefined)
      const out = rows.map((r) => project(db, table, r, url.searchParams.get('select')))
      const headers = { 'content-range': `0-${Math.max(out.length - 1, 0)}/${total}` }
      if (req.method() === 'HEAD') return route.fulfill({ status: 200, headers })
      if (wantsObject) return out.length ? json(200, out[0], headers) : json(406, { code: 'PGRST116', message: 'no rows' })
      return json(200, out, headers)
    }
    if (req.method() === 'POST') {
      let body = req.postDataJSON(); const arr = Array.isArray(body) ? body : [body]
      const inserted = arr.map((r) => ({ id: `20000000-0000-4000-8000-${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`, created_at: new Date().toISOString(), ...r }))
      db[table].push(...inserted)
      const out = inserted.map((r) => project(db, table, r, url.searchParams.get('select')))
      if (!prefer.includes('return=representation')) return route.fulfill({ status: 201, headers: { 'access-control-allow-origin': '*' } })
      return json(201, wantsObject ? out[0] : out)
    }
    if (req.method() === 'PATCH') {
      const body = req.postDataJSON(); const rows = filterRows(); rows.forEach((r) => Object.assign(r, body))
      const out = rows.map((r) => project(db, table, r, url.searchParams.get('select')))
      if (!prefer.includes('return=representation')) return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
      return json(200, wantsObject ? out[0] : out)
    }
    if (req.method() === 'DELETE') {
      const rows = new Set(filterRows()); db[table] = db[table].filter((r) => !rows.has(r))
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
    }
    return json(200, [])
  })
  await page.route('**/api/chat', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: 'Sample AI reply.' }] }) }))
  await page.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }))
  await page.route('https://world.openfoodfacts.org/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"products":[]}' }))
}

module.exports = { install }

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
    if (path.startsWith('/storage/v1')) {
      // Signed links for the private progress-photos bucket: echo a link per path, then
      // serve a placeholder picture when the browser loads it.
      const sign = path.match(/^\/storage\/v1\/object\/sign\/([^/]+)(?:\/(.+))?$/)
      if (sign && req.method() === 'POST' && !sign[2]) {
        let paths = []
        try { paths = req.postDataJSON().paths || [] } catch {}
        return json(200, paths.map((p) => ({ path: p, signedURL: `/object/sign/${sign[1]}/${p}?token=mock`, error: null })))
      }
      if (sign && req.method() === 'GET') {
        const n = (sign[2] || '').length % 2
        const [a, b] = n ? ['#BFC9C2', '#7E8C83'] : ['#C9C3B6', '#8A8478']
        return route.fulfill({ status: 200, contentType: 'image/svg+xml', headers: { 'access-control-allow-origin': '*' }, body: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="${a}"/><circle cx="150" cy="150" r="60" fill="${b}"/><rect x="90" y="220" width="120" height="160" rx="40" fill="${b}"/></svg>` })
      }
      if (req.method() === 'POST' || req.method() === 'PUT') return json(200, { Key: path.replace('/storage/v1/object/', ''), Id: 'mock' })
      return json(200, [])
    }
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
    // NO_ON_DEMAND=1: behave like a database without the on-demand columns (migration not applied).
    if (process.env.NO_ON_DEMAND && table === 'programs' && /is_on_demand|"kind"/.test(url.search + (req.postData() || ''))) {
      return json(400, { code: '42703', message: 'column programs.is_on_demand does not exist' })
    }
    const prefer = req.headers()['prefer'] || ''
    const wantsObject = (req.headers()['accept'] || '').includes('vnd.pgrst.object')

    // NOT_MIGRATED=1: behave like the real database before the on_demand_library
    // migration: no is_on_demand column (400) and a client can't read their coach's profile.
    if (process.env.NOT_MIGRATED && req.method() === 'GET') {
      if (url.searchParams.has('is_on_demand')) return json(400, { code: '42703', message: 'column programs.is_on_demand does not exist', details: null, hint: null })
      if (table === 'profiles' && role === 'client' && url.searchParams.get('id') !== `eq.${user.id}`) {
        return wantsObject ? json(406, { code: 'PGRST116', message: 'no rows' }) : json(200, [])
      }
    }

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
      // Upsert (on_conflict + merge-duplicates): update the row with the same key instead.
      const conflict = prefer.includes('merge-duplicates') && url.searchParams.get('on_conflict')
      const keyCols = conflict ? conflict.split(',') : []
      const inserted = arr.map((r) => {
        const hit = keyCols.length && db[table].find((x) => keyCols.every((c) => String(x[c]) === String(r[c])))
        if (hit) return Object.assign(hit, r)
        const row = { id: `20000000-0000-4000-8000-${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`, created_at: new Date().toISOString(), ...r }
        db[table].push(row)
        return row
      })
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

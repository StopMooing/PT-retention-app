// A tiny in-memory stand-in for Supabase: takes a fetch Request, answers like the real API
// from sample tables, and keeps any writes in memory only. Used by the website demo (in the
// visitor's browser) and the screenshot harness (tools/screenshots). It never talks to the
// real database.

function b64url(o) {
  const s = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(JSON.stringify(o))))
    : globalThis.Buffer.from(JSON.stringify(o)).toString('base64')
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fakeJwt(user) {
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: user.id, email: user.email, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 86400, aud: 'authenticated' })}.sig`
}
export function authUser(u) {
  return { id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, app_metadata: {}, user_metadata: { full_name: u.full_name, role: u.role }, created_at: '2026-01-01T00:00:00Z' }
}
export function sessionFor(u) {
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
    const [, alias, name, hint, inner] = m
    if (inner === undefined) {
      if (name === '*') Object.assign(out, row)
      else out[alias || name] = row[name]
      continue
    }
    const target = db[name] || []
    // A hint names the link: a column ("exercise_id") or a constraint ("<table>_<column>_fkey").
    const hinted = hint && (hint in row ? hint : hint.replace(`${table}_`, '').replace(/_fkey$/, ''))
    let fk = hinted && hinted.endsWith('_id') ? hinted : row[singular(name) + '_id'] !== undefined ? singular(name) + '_id' : null
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
  const val = rest.join('.')
  if (op === 'not') return true
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

const CORS = { 'access-control-allow-origin': '*' }
const json = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...CORS, ...headers } })
const empty = (status, headers = {}) => new Response(null, { status, headers: { ...CORS, ...headers } })
const newId = (prefix) => `${prefix}-0000-4000-8000-${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`

// A grey placeholder person for progress photos.
export function photoSvg(seed = '') {
  const [a, b] = seed.length % 2 ? ['#BFC9C2', '#7E8C83'] : ['#C9C3B6', '#8A8478']
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="${a}"/><circle cx="150" cy="150" r="60" fill="${b}"/><rect x="90" y="220" width="120" height="160" rx="40" fill="${b}"/></svg>`
}

// tables: the sample data (copied, so each server starts fresh). user: the signed-in person
// ({ id, email, full_name, role }) or null. role: 'coach' | 'client' | null. env: harness
// switches (NO_ON_DEMAND, NOT_MIGRATED). photoBase: where signed photo links point.
export function createMockServer({ tables, user, role = null, env = {}, photoBase = '' }) {
  const db = JSON.parse(JSON.stringify(tables))

  async function body(req) {
    try { return await req.json() } catch { return null }
  }

  return async function handle(req) {
    const url = new URL(req.url)
    const path = url.pathname.replace(/^\/demo-api/, '')
    const method = req.method
    if (method === 'OPTIONS') return empty(200, { 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' })

    if (path.startsWith('/auth/v1/user')) return user ? json(200, authUser(user)) : json(401, { msg: 'no user' })
    if (path.startsWith('/auth/v1/token')) return user ? json(200, sessionFor(user)) : json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' })
    if (path.startsWith('/auth/v1/logout')) return empty(204)
    if (path.startsWith('/auth/v1')) return json(200, {})

    if (path.startsWith('/storage/v1')) {
      // Signed links for private photos: a link per path, then a placeholder picture.
      const sign = path.match(/^\/storage\/v1\/object\/sign\/([^/]+)(?:\/(.+))?$/)
      if (sign && method === 'POST' && !sign[2]) {
        const paths = (await body(req))?.paths || []
        return json(200, paths.map((p) => ({ path: p, signedURL: `${photoBase}/object/sign/${sign[1]}/${p}?token=mock`, error: null })))
      }
      if (sign && method === 'GET') return new Response(photoSvg(sign[2] || ''), { status: 200, headers: { 'content-type': 'image/svg+xml', ...CORS } })
      if (method === 'POST' || method === 'PUT') return json(200, { Key: path.replace('/storage/v1/object/', ''), Id: 'mock' })
      return json(200, [])
    }

    if (path.startsWith('/functions/v1')) return json(200, {})

    if (path.startsWith('/rest/v1/rpc/')) {
      const fn = path.split('/').pop()
      const b = (await body(req)) || {}
      if (fn === 'resolve_exercise_ids') {
        const names = b.p_names || b.names || Object.values(b)[0] || []
        return json(200, names.map((nm) => { const e = db.exercises.find((x) => x.name.toLowerCase() === String(nm).toLowerCase()); return { input_name: nm, name: nm, exercise_id: e ? e.id : null } }))
      }
      // Inbox: the latest row per client, like the database functions.
      const LATEST = { latest_message_per_client: ['coach_messages', 'created_at'], latest_checkin_per_client: ['checkins', 'submitted_at'], latest_daily_checkin_per_client: ['daily_checkins', 'created_at'] }
      if (LATEST[fn]) {
        const [tbl, col] = LATEST[fn]
        const ids = b.p_client_ids || []
        const best = {}
        for (const r of db[tbl] || []) if (ids.includes(r.client_id) && (!best[r.client_id] || r[col] > best[r.client_id][col])) best[r.client_id] = r
        return json(200, Object.values(best))
      }
      // Program builder saves, done in memory like the database functions.
      const uid = () => newId('30000000')
      if (fn === 'save_program_day') {
        const { p_day, p_items } = b
        const keep = []
        p_items.forEach((it, idx) => {
          const fields = { exercise_id: it.exercise_id, sets: it.sets, reps: it.reps, rest_seconds: it.rest_seconds, notes: it.notes?.trim() || null, superset_group: it.superset_group, order_index: idx }
          let row = it.id && db.workout_exercises.find((r) => r.id === it.id && r.program_workout_id === p_day)
          if (row) Object.assign(row, fields)
          else { row = { id: uid(), program_workout_id: p_day, created_at: new Date().toISOString(), ...fields }; db.workout_exercises.push(row) }
          keep.push(row.id)
          db.workout_exercise_sets = (db.workout_exercise_sets || []).filter((x) => x.workout_exercise_id !== row.id)
          it.set_rows.forEach((sr, n) => db.workout_exercise_sets.push({ id: uid(), workout_exercise_id: row.id, set_number: n + 1, set_type: sr.set_type, reps: sr.reps || null, weight_kg: sr.weight_kg === '' ? null : Number(sr.weight_kg), rpe: sr.rpe === '' ? null : Number(sr.rpe), rest_seconds: sr.rest_seconds === '' ? null : Number(sr.rest_seconds) }))
        })
        db.workout_exercises = db.workout_exercises.filter((r) => r.program_workout_id !== p_day || keep.includes(r.id))
        return json(200, null)
      }
      if (fn === 'copy_program_week') {
        const { p_program, p_from_week, p_kg = 0, p_reps = 0 } = b
        const days = db.program_workouts.filter((w) => w.program_id === p_program)
        const next = Math.max(...days.map((w) => w.week_number || 1)) + 1
        const bump = (r) => (/^\d+$/.test(r ?? '') ? String(Number(r) + p_reps) : r)
        for (const d of days.filter((w) => (w.week_number || 1) === p_from_week)) {
          const nd = { ...d, id: uid(), week_number: next }
          db.program_workouts.push(nd)
          for (const we of db.workout_exercises.filter((x) => x.program_workout_id === d.id)) {
            const ne = { ...we, id: uid(), program_workout_id: nd.id, reps: bump(we.reps) }
            db.workout_exercises.push(ne)
            for (const st of (db.workout_exercise_sets || []).filter((x) => x.workout_exercise_id === we.id)) {
              const warm = st.set_type === 'warmup'
              db.workout_exercise_sets.push({ ...st, id: uid(), workout_exercise_id: ne.id, reps: warm ? st.reps : bump(st.reps), weight_kg: warm || st.weight_kg == null ? st.weight_kg : st.weight_kg + p_kg })
            }
          }
        }
        return json(200, next)
      }
      if (fn === 'copy_program') {
        const src = db.programs.find((p) => p.id === b.p_program)
        if (!src) return json(400, { message: 'not_found' })
        const np = { ...src, id: uid(), created_by: user?.id ?? null, is_on_demand: false, kind: 'program', created_at: new Date().toISOString() }
        db.programs.push(np)
        for (const d of db.program_workouts.filter((w) => w.program_id === b.p_program)) {
          const nd = { ...d, id: uid(), program_id: np.id }
          db.program_workouts.push(nd)
          for (const we of db.workout_exercises.filter((x) => x.program_workout_id === d.id)) {
            const ne = { ...we, id: uid(), program_workout_id: nd.id }
            db.workout_exercises.push(ne)
            for (const st of (db.workout_exercise_sets || []).filter((x) => x.workout_exercise_id === we.id)) db.workout_exercise_sets.push({ ...st, id: uid(), workout_exercise_id: ne.id })
          }
        }
        return json(200, np.id)
      }
      // A sample invite for the claim page. The token "expired" shows the invalid state.
      if (fn === 'get_claim_client') return json(200, b.p_token === 'expired' ? [] : [{ full_name: 'Jane Carter', email: 'jane@example.com' }])
      return json(200, [])
    }

    const table = path.replace('/rest/v1/', '')
    if (!db[table]) db[table] = []
    const params = [...url.searchParams.entries()]
    const filterRows = () => db[table].filter((r) => params.every(([k, v]) => ['select', 'order', 'limit', 'offset', 'or', 'on_conflict', 'columns'].includes(k) || matches(r, k, v)))
    const prefer = req.headers.get('prefer') || ''
    const wantsObject = (req.headers.get('accept') || '').includes('vnd.pgrst.object')
    const select = url.searchParams.get('select')
    const reqBody = method === 'POST' || method === 'PATCH' ? await body(req) : null

    // NO_ON_DEMAND=1: behave like a database without the on-demand columns.
    if (env.NO_ON_DEMAND && table === 'programs' && /is_on_demand|"kind"/.test(url.search + JSON.stringify(reqBody || ''))) {
      return json(400, { code: '42703', message: 'column programs.is_on_demand does not exist' })
    }
    // NOT_MIGRATED=1: no is_on_demand column, and a client can't read their coach's profile.
    if (env.NOT_MIGRATED && method === 'GET') {
      if (url.searchParams.has('is_on_demand')) return json(400, { code: '42703', message: 'column programs.is_on_demand does not exist', details: null, hint: null })
      if (table === 'profiles' && role === 'client' && url.searchParams.get('id') !== `eq.${user.id}`) {
        return wantsObject ? json(406, { code: 'PGRST116', message: 'no rows' }) : json(200, [])
      }
    }

    if (method === 'GET' || method === 'HEAD') {
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
      const out = rows.map((r) => project(db, table, r, select))
      const headers = { 'content-range': `0-${Math.max(out.length - 1, 0)}/${total}` }
      if (method === 'HEAD') return empty(200, headers)
      if (wantsObject) return out.length ? json(200, out[0], headers) : json(406, { code: 'PGRST116', message: 'no rows' })
      return json(200, out, headers)
    }
    if (method === 'POST') {
      const arr = Array.isArray(reqBody) ? reqBody : [reqBody]
      // Upsert (on_conflict + merge-duplicates): update the row with the same key instead.
      const conflict = prefer.includes('merge-duplicates') && url.searchParams.get('on_conflict')
      const keyCols = conflict ? conflict.split(',') : []
      const inserted = arr.map((r) => {
        const hit = keyCols.length && db[table].find((x) => keyCols.every((c) => String(x[c]) === String(r[c])))
        if (hit) return Object.assign(hit, r)
        const row = { id: newId('20000000'), created_at: new Date().toISOString(), ...r }
        db[table].push(row)
        return row
      })
      const out = inserted.map((r) => project(db, table, r, select))
      if (!prefer.includes('return=representation')) return empty(201)
      return json(201, wantsObject ? out[0] : out)
    }
    if (method === 'PATCH') {
      const rows = filterRows(); rows.forEach((r) => Object.assign(r, reqBody))
      const out = rows.map((r) => project(db, table, r, select))
      if (!prefer.includes('return=representation')) return empty(204)
      return json(200, wantsObject ? out[0] : out)
    }
    if (method === 'DELETE') {
      const gone = filterRows(); const rows = new Set(gone); db[table] = db[table].filter((r) => !rows.has(r))
      // Like the real API: with ?select= the deleted rows come back.
      if (select) return json(200, gone.map((r) => project(db, table, r, select)))
      return empty(204)
    }
    return json(200, [])
  }
}

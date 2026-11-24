// Wires the in-memory Supabase stand-in (src/demo/mockServer.js, shared with the website
// demo) into Playwright with page.route, so the real app runs locally against
// fixtures.cjs. Nothing leaves this machine.
const fx = require('./fixtures.cjs')
const REF = 'ksataubrattfspjpftlk'

async function install(page, role) {
  const { createMockServer, sessionFor } = await import('../../src/demo/mockServer.js')
  const user = fx.users[role]
  const handle = createMockServer({ tables: fx.tables, user, role, env: process.env })
  await page.addInitScript(([key, sess, theme]) => {
    if (sess) localStorage.setItem(key, JSON.stringify(sess))
    if (theme) localStorage.setItem('unfnshd-theme', theme)
  }, [`sb-${REF}-auth-token`, user ? sessionFor(user) : null, process.env.THEME || null])

  await page.route(`https://${REF}.supabase.co/**`, async (route) => {
    const r = route.request()
    const post = r.postData()
    const req = new Request(r.url(), { method: r.method(), headers: r.headers(), body: ['GET', 'HEAD'].includes(r.method()) ? undefined : post ?? undefined })
    const res = await handle(req)
    const headers = Object.fromEntries(res.headers.entries())
    const buf = Buffer.from(await res.arrayBuffer())
    return route.fulfill({ status: res.status, headers, body: buf })
  })
  await page.route('**/api/chat', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: 'Sample AI reply.' }] }) }))
  await page.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }))
  await page.route('https://world.openfoodfacts.org/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"products":[]}' }))
}

module.exports = { install }

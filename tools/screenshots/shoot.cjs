// Usage: node shoot.cjs <plan.json>
// plan: [{ role, path, out, width?, height?, full?, theme?, steps?: [ {click:'text'} | {wait:ms} | {fill:[selector,value]} | {css: selector-click} ] }]
const { chromium } = require('playwright')
const { install } = require('./mock.cjs')
const plan = require(require('path').resolve(process.argv[2]))
const BASE = process.env.BASE || 'http://localhost:4173'

;(async () => {
  const browser = await chromium.launch()
  for (const shot of plan) {
    process.env.THEME = shot.theme || ''
    const ctx = await browser.newContext({ viewport: { width: shot.width || 390, height: shot.height || 844 }, deviceScaleFactor: 2, colorScheme: shot.scheme || 'light', hasTouch: (shot.width || 390) < 800 })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
    await install(page, shot.role)
    await page.goto(BASE + (shot.path || '/'))
    await page.waitForTimeout(1500)
    for (const s of shot.steps || []) {
      try {
        if (s.click) await page.getByText(s.click, { exact: s.exact ?? false }).first().click({ timeout: 3000 })
        if (s.css) await page.locator(s.css).first().click({ timeout: 3000 })
        if (s.fill) await page.locator(s.fill[0]).first().fill(s.fill[1])
        if (s.scroll) await page.mouse.wheel(0, s.scroll)
        await page.waitForTimeout(s.wait || 700)
      } catch (e) { errors.push('STEP ' + JSON.stringify(s) + ' ' + e.message.split('\n')[0]) }
    }
    await page.screenshot({ path: shot.out, fullPage: shot.full !== false })
    console.log(shot.out, errors.length ? 'ERRORS: ' + [...new Set(errors)].slice(0, 5).join(' | ') : 'ok')
    await ctx.close()
  }
  await browser.close()
})()

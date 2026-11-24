// Writes public/demo-data.json for the website demo (/demo) from the same made-up sample
// data as the screenshot harness. Runs before every build. The demo shifts every date by
// the days since builtOn, so it always looks current. No real people or real data.
const fs = require('fs')
const path = require('path')
// The plain sample data: none of the harness's alternative setups.
for (const k of ['MORE_CLIENTS', 'NO_PLAN', 'NO_TARGETS', 'ARCHIVED', 'CHECKIN_DUE', 'OTHER_LIBRARY', 'SOLO_PROGRAM', 'NO_PROGRAM', 'TODAY_DONE', 'DAILY_DONE', 'NO_MESSAGES', 'PROGRAM_NEXT_WEEK', 'NO_MEASUREMENTS', 'MULTI_WEEK', 'RECIPE_PHOTOS']) delete process.env[k]
const fx = require('../screenshots/fixtures.cjs')
const d = new Date()
const builtOn = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const out = path.join(__dirname, '../../public/demo-data.json')
fs.writeFileSync(out, JSON.stringify({ builtOn, users: fx.users, tables: fx.tables }))
console.log(`demo data: ${Math.round(fs.statSync(out).size / 1024)} KB, built on ${builtOn}`)

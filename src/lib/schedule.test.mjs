// Self-check for the calendar plan. Run: node src/lib/schedule.test.mjs
import assert from 'node:assert/strict'
import { programPlan, defaultTrainingDays, defaultStartDate, planSummary, planSessionCount } from './schedule.js'

const days = [{ id: 'd1' }, { id: 'd2' }, { id: 'd3' }, { id: 'd4' }]

// 4-day program, 6 weeks, from Monday 2 Nov 2026 on Mon, Tue, Thu, Fri.
const plan = programPlan({ days, weeks: 6, startDate: '2026-11-02', trainingDays: [1, 2, 4, 5] })
assert.equal(plan.length, 24)
assert.deepEqual(plan.slice(0, 4).map((p) => p.scheduled_date), ['2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06'])
assert.equal(plan[plan.length - 1].scheduled_date, '2026-12-11')
assert.equal(planSessionCount(4, 6), 24)
assert.equal(planSummary({ dayCount: 4, weeks: 6, startDate: '2026-11-02' }), '6 weeks, 24 sessions, 2 Nov to 13 Dec')

// Days cycle in order, every week.
assert.deepEqual(plan.map((p) => p.program_workout_id), Array.from({ length: 24 }, (_, i) => `d${(i % 4) + 1}`))

// Start on a Saturday with the default days: Saturday isn't a training day, so the first
// session is the following Monday, and the plan still has 24 sessions.
const sat = programPlan({ days, weeks: 6, startDate: '2026-10-31', trainingDays: defaultTrainingDays(4) })
assert.equal(sat[0].scheduled_date, '2026-11-02')
assert.equal(sat[0].program_workout_id, 'd1')
assert.equal(sat.length, 24)
assert.ok(sat.every((p) => p.scheduled_date >= '2026-10-31'))

// Saturday as a training day: the first session is that Saturday.
const satOn = programPlan({ days, weeks: 6, startDate: '2026-10-31', trainingDays: [1, 3, 5, 6] })
assert.equal(satOn[0].scheduled_date, '2026-10-31')
assert.equal(satOn.length, 24)

// Defaults.
assert.deepEqual(defaultTrainingDays(1), [1])
assert.deepEqual(defaultTrainingDays(3), [1, 3, 5])
assert.deepEqual(defaultTrainingDays(7), [1, 2, 3, 4, 5, 6, 7])
assert.equal(defaultStartDate('2026-10-31'), '2026-11-02')
assert.equal(defaultStartDate('2026-11-02'), '2026-11-02')
assert.equal(defaultStartDate('2026-11-01'), '2026-11-02')

console.log('schedule.test.mjs: all checks passed')

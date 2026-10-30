// Synthetic sample data for screenshotting the app. No real people or real data.
const COACH = '00000000-0000-4000-8000-0000000000c0'
const CLIENT_USER = '00000000-0000-4000-8000-0000000000a1'
const CLIENT = '00000000-0000-4000-8000-00000000c1e1'
let n = 1
const id = () => `10000000-0000-4000-8000-${String(n++).padStart(12, '0')}`

function day(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const ts = (offset, h = 9) => `${day(offset)}T${String(h).padStart(2, '0')}:15:00+10:30`

const exerciseList = [
  ['Barbell Back Squat', 'Legs', 'barbell'], ['Romanian Deadlift', 'Hamstrings', 'barbell'],
  ['Walking Lunge', 'Legs', 'dumbbell'], ['Leg Press', 'Legs', 'machine'], ['Seated Calf Raise', 'Calves', 'machine'],
  ['Barbell Bench Press', 'Chest', 'barbell'], ['Incline Dumbbell Press', 'Chest', 'dumbbell'],
  ['Lat Pulldown', 'Back', 'cable'], ['Seated Cable Row', 'Back', 'cable'], ['Barbell Overhead Press', 'Shoulders', 'barbell'],
  ['Lateral Raise', 'Shoulders', 'dumbbell'], ['Face Pull (Cable)', 'Shoulders', 'cable'], ['Dumbbell Curl', 'Biceps', 'dumbbell'],
  ['Triceps Pushdown', 'Triceps', 'cable'], ['Hip Thrust', 'Glutes', 'barbell'], ['Plank', 'Core', 'bodyweight'],
  ['Deadlift', 'Back', 'barbell'], ['Pull Up', 'Back', 'bodyweight'],
]
const exercises = exerciseList.map(([name, muscle_group, equipment]) => ({
  id: id(), name, muscle_group, equipment, category: 'strength', instructions: null,
  created_by: null, is_global: true, created_at: ts(-200), exercise_aliases: [],
}))
const ex = (name) => exercises.find((e) => e.name === name)

const program = { id: id(), name: 'Strength Foundations', description: '12 week full body build', created_by: COACH, created_at: ts(-40) }
const pw = [
  { name: 'Lower A', day_number: 1, items: [['Barbell Back Squat', 4, '6-8'], ['Romanian Deadlift', 3, '8-10'], ['Walking Lunge', 3, '10 each'], ['Seated Calf Raise', 3, '12-15'], ['Plank', 3, '45s']] },
  { name: 'Upper A', day_number: 2, items: [['Barbell Bench Press', 4, '6-8'], ['Seated Cable Row', 4, '8-10'], ['Barbell Overhead Press', 3, '8-10'], ['Lat Pulldown', 3, '10-12'], ['Triceps Pushdown', 3, '12-15'], ['Dumbbell Curl', 3, '12-15']] },
  { name: 'Full Body', day_number: 3, items: [['Deadlift', 3, '5'], ['Incline Dumbbell Press', 3, '8-10'], ['Hip Thrust', 3, '10-12'], ['Pull Up', 3, 'AMRAP'], ['Lateral Raise', 3, '15'], ['Face Pull (Cable)', 3, '15']] },
]
const program_workouts = []
const workout_exercises = []
for (const w of pw) {
  const row = { id: id(), program_id: program.id, day_number: w.day_number, name: w.name, created_at: ts(-40) }
  program_workouts.push(row)
  w.items.forEach(([name, sets, reps], i) => workout_exercises.push({
    id: id(), program_workout_id: row.id, exercise_id: ex(name).id, sets, reps, rest_seconds: 90, notes: i === 0 ? 'Control the lowering, 3 seconds down.' : null, order_index: i, created_at: ts(-40),
  }))
}

// Monday/Wednesday/Friday schedule from 4 weeks ago to 2 weeks ahead.
const scheduled_workouts = []
const workout_logs = []
const workout_set_logs = []
const today = new Date()
for (let off = -28; off <= 14; off++) {
  const d = new Date(); d.setDate(today.getDate() + off)
  const dow = d.getDay()
  const idx = dow === 1 ? 0 : dow === 3 ? 1 : dow === 5 ? 2 : -1
  if (idx < 0) continue
  const s = { id: id(), client_id: CLIENT, program_workout_id: program_workouts[idx].id, custom_workout_id: null, scheduled_date: day(off), created_by: COACH, created_at: ts(-40) }
  scheduled_workouts.push(s)
  if (off < 0 && off !== -5) {
    const log = { id: id(), client_id: CLIENT, program_workout_id: s.program_workout_id, scheduled_workout_id: s.id, logged_at: ts(off, 7), completed_at: ts(off, 8), completed: true, notes: null, total_volume_kg: 0 }
    let vol = 0
    workout_exercises.filter((we) => we.program_workout_id === s.program_workout_id).forEach((we, k) => {
      for (let set = 1; set <= we.sets; set++) {
        const weight = Math.max(0, 20 + k * 5 + Math.round((28 + off) / 4) * 2.5)
        const reps = 8
        vol += weight * reps
        workout_set_logs.push({ id: id(), client_id: CLIENT, scheduled_workout_id: s.id, workout_log_id: log.id, exercise_id: we.exercise_id, set_number: set, reps_completed: reps, weight_kg: weight, logged_at: ts(off, 7) })
      }
    })
    log.total_volume_kg = vol
    workout_logs.push(log)
  }
}

const body_weight_logs = []
for (let off = -56, w = 84.6; off <= 0; off += 3) {
  w = w - 0.18 + (off % 2 ? 0.25 : -0.1)
  body_weight_logs.push({ id: id(), client_id: CLIENT, logged_by: CLIENT_USER, weight_kg: Math.round(w * 10) / 10, logged_date: day(off), created_at: ts(off) })
}

const food = [
  ['breakfast', 'Rolled oats', 60, 225, 7.9, 37.8, 4.4], ['breakfast', 'Greek yoghurt, natural', 170, 165, 15.3, 7.6, 7.7],
  ['lunch', 'Chicken breast, grilled', 150, 248, 46.5, 0, 5.4], ['lunch', 'White rice, cooked', 200, 260, 5.4, 56.4, 0.6],
  ['snack', 'Banana', 120, 107, 1.3, 23.6, 0.4],
]
const food_logs = []
for (const off of [0, -1]) for (const [meal_type, food_name, g, kcal, p, c, f] of food) {
  food_logs.push({ id: id(), client_id: CLIENT, food_name, brand: null, meal_type, serving_size_g: g, servings: 1, calories: kcal, protein_g: p, carbs_g: c, fats_g: f, barcode: null, logged_at: day(off), created_at: ts(off) })
}

const checkins = [
  [-34, 3, 3, 3, 'First week back. Legs were very sore after Monday.', 'Great start Jane. Soreness settles by week three, keep moving on rest days.'],
  [-27, 4, 3, 4, 'Sleep was rough midweek.', 'Noted. Try the 10pm screens off we spoke about.'],
  [-20, 4, 4, 4, 'Hit every session!', 'Love it. Squat looked much more stable on Friday.'],
  [-13, 3, 3, 3, 'Missed Wednesday, work trip.', 'All good, you still got two in. That is the habit.'],
  [-6, 4, 5, 4, 'Feeling strong, weight is moving.', null],
].map(([off, t, e, m, notes, reply]) => ({ id: id(), client_id: CLIENT, training_score: t, energy_score: e, mood_score: m, notes, blocker: null, created_at: ts(off, 18), submitted_at: ts(off, 18), coach_reply: reply, replied_at: reply ? ts(off + 1, 8) : null }))

const personal_bests = [
  ['Barbell Back Squat', 'max_weight', 72.5, 6], ['Barbell Bench Press', 'max_weight', 52.5, 6], ['Deadlift', 'max_weight', 90, 5],
  ['Barbell Back Squat', 'estimated_1rm', 86, 6], ['Barbell Bench Press', 'estimated_1rm', 62, 6],
].map(([name, pb_type, value, reps], i) => ({ id: id(), client_id: CLIENT, exercise_id: ex(name).id, pb_type, value, reps_completed: reps, weight_kg: pb_type === 'max_weight' ? value : null, achieved_at: ts(-3 - i * 4), scheduled_workout_id: null }))

const habits = [
  { id: id(), name: '10k steps', description: null, icon: '🚶', frequency: 'daily', target_per_week: 7, client_id: CLIENT, created_by: COACH, is_active: true, created_at: ts(-30) },
  { id: id(), name: '3L water', description: null, icon: '💧', frequency: 'daily', target_per_week: 7, client_id: CLIENT, created_by: COACH, is_active: true, created_at: ts(-30) },
]
const habit_logs = []
for (let off = -20; off <= 0; off++) habits.forEach((h, i) => { if ((off + i) % 3) habit_logs.push({ id: id(), habit_id: h.id, client_id: CLIENT, completed_date: day(off), completed: true, notes: null, created_at: ts(off) }) })

const jane = {
  id: CLIENT, pt_id: COACH, user_id: CLIENT_USER, full_name: 'Jane Carter', email: 'jane@example.com', phone: '0400 000 000', goal: 'Get strong and drop 5 kg before summer',
  status: 'Engaged', created_at: ts(-40), last_checkin_at: ts(-6, 18).slice(0, 19), sessions_this_month: 9, notes: null,
  calorie_target: 1900, protein_target_g: 140, carbs_target_g: 190, fats_target_g: 60, water_target_ml: 2500, profile_photo_url: null, claim_token: id(),
}
const others = [
  ['Marcus Lee', 'Engaged', -2, 'Build muscle'], ['Priya Shah', 'Engaged', -4, 'Run a half marathon'], ['Tom Nguyen', 'Drifting', -12, 'Lose weight'],
  ['Sophie Brown', 'At Risk', -24, 'Tone up'], ['Daniel Wright', 'Engaged', -1, 'Strength'],
].map(([full_name, status, off, goal]) => ({ ...jane, id: id(), user_id: id(), full_name, status, goal, email: full_name.split(' ')[0].toLowerCase() + '@example.com', last_checkin_at: ts(off, 18).slice(0, 19), sessions_this_month: 4 + (off % 5), claim_token: id() }))
const otherCheckins = others.map((c, i) => ({ id: id(), client_id: c.id, training_score: 3 + (i % 3), energy_score: 2 + (i % 4), mood_score: 3, notes: 'Good week overall.', blocker: null, created_at: c.last_checkin_at, submitted_at: c.last_checkin_at + '+10:30', coach_reply: i % 2 ? 'Nice work.' : null, replied_at: null }))

module.exports = {
  ids: { COACH, CLIENT_USER, CLIENT },
  users: {
    coach: { id: COACH, email: 'coach@example.com', role: 'pt', full_name: 'Luke Coach' },
    client: { id: CLIENT_USER, email: 'jane@example.com', role: 'client', full_name: 'Jane Carter' },
  },
  tables: {
    profiles: [
      { id: COACH, full_name: 'Luke Coach', email: 'coach@example.com', role: 'pt', created_at: ts(-100) },
      { id: CLIENT_USER, full_name: 'Jane Carter', email: 'jane@example.com', role: 'client', created_at: ts(-40) },
    ],
    clients: [jane, ...others],
    exercises, exercise_aliases: [], programs: [program], program_workouts, workout_exercises,
    program_assignments: [{ id: id(), program_id: program.id, client_id: CLIENT, assigned_by: COACH, start_date: day(-28), is_active: true, created_at: ts(-28) }],
    scheduled_workouts, workout_logs, workout_set_logs, body_weight_logs, food_logs,
    checkins: [...checkins, ...otherCheckins], personal_bests, habits, habit_logs,
    progress_photos: [], resources: [], resource_assignments: [], saved_meals: [], saved_workouts: [], water_logs: [
      { id: id(), client_id: CLIENT, logged_by: CLIENT_USER, amount_ml: 750, logged_date: day(0), created_at: ts(0) },
    ],
    pt_notes: [], meal_plans: [], meals: [], meal_foods: [], meal_templates: [], meal_template_foods: [], foods: [],
  },
}

// Appended: a meal plan with meals and foods, and one meal idea, for the nutrition screens.
{
  const t = module.exports.tables
  const plan = { id: id(), name: 'Lean bulk', client_id: CLIENT, created_by: COACH, daily_calories: 2400, protein_target_g: 180, carbs_target_g: 260, fats_target_g: 70, is_active: true, is_template: false, created_at: ts(-10) }
  const plan2 = { id: id(), name: 'Maintenance template', client_id: null, created_by: COACH, daily_calories: null, protein_target_g: null, carbs_target_g: null, fats_target_g: null, is_active: true, is_template: false, created_at: ts(-20) }
  t.meal_plans.push(plan, plan2)
  const mealRows = [['Oats and berries', 'Breakfast'], ['Chicken rice bowl', 'Lunch'], ['Afternoon snack', 'Afternoon Snack'], ['Salmon and veg', 'Dinner']]
    .map(([name, meal_time], i) => ({ id: id(), meal_plan_id: plan.id, name, meal_time, order_index: i, created_at: ts(-10) }))
  t.meals.push(...mealRows)
  const mf = [
    [0, 'Rolled oats', null, 80, 300, 10.5, 50.4, 5.9], [0, 'Blueberries', null, 100, 57, 0.7, 14.5, 0.3], [0, 'Greek yoghurt, natural', 'Chobani', 170, 165, 15.3, 7.6, 7.7],
    [1, 'Chicken breast, grilled', null, 200, 330, 62, 0, 7.2], [1, 'White rice, cooked', null, 250, 325, 6.8, 70.5, 0.8],
    [2, 'Banana', null, 120, 107, 1.3, 23.6, 0.4], [2, 'Almonds', null, 30, 174, 6.3, 2.6, 15],
  ]
  mf.forEach(([m, food_name, brand, g, kcal, p, c, f]) => t.meal_foods.push({ id: id(), meal_id: mealRows[m].id, food_name, brand, serving_size_g: g, calories: kcal, protein_g: p, carbs_g: c, fats_g: f, open_food_facts_id: null, created_at: ts(-10) }))
  const tpl = { id: id(), name: 'High protein overnight oats', description: 'Make it the night before, grab it on the way out.', category: 'High protein', meal_time: 'Breakfast', total_calories: 420, total_protein_g: 32, total_carbs_g: 48, total_fats_g: 10, prep_time_minutes: 5, instructions: 'Step 1: Mix oats, protein powder and milk in a jar. Step 2: Stir through yoghurt. Step 3: Top with berries and chill overnight.', created_at: ts(-50) }
  t.meal_templates.push(tpl)
  t.meal_template_foods.push(
    { id: id(), meal_template_id: tpl.id, food_name: 'Rolled oats', serving_size_g: 50, calories: 188, protein_g: 6.6, carbs_g: 31.5, fats_g: 3.7 },
    { id: id(), meal_template_id: tpl.id, food_name: 'Whey protein', serving_size_g: 30, calories: 120, protein_g: 24, carbs_g: 3, fats_g: 1.5 },
  )
}

// ---- Client app extras (appended for the client redesign screenshots) ----
{
  const t = module.exports.tables
  // The app itself writes pb_type '1rm' / 'best_set' / 'volume'.
  ;[['Barbell Back Squat', 88.5, -3], ['Barbell Bench Press', 63, -8], ['Deadlift', 104, -12], ['Romanian Deadlift', 71, -20]].forEach(([name, value, off]) => {
    t.personal_bests.push({ id: id(), client_id: CLIENT, exercise_id: ex(name).id, pb_type: '1rm', value, reps_completed: null, weight_kg: null, achieved_at: ts(off), scheduled_workout_id: null })
  })
  const svg = (a, b) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="${a}"/><circle cx="150" cy="150" r="60" fill="${b}"/><rect x="90" y="220" width="120" height="160" rx="40" fill="${b}"/></svg>`)
  t.progress_photos.push(
    { id: id(), client_id: CLIENT, photo_url: svg('#C9C3B6', '#8A8478'), note: null, taken_date: day(-2), created_at: ts(-2) },
    { id: id(), client_id: CLIENT, photo_url: svg('#BFC9C2', '#7E8C83'), note: null, taken_date: day(-30), created_at: ts(-30) },
  )
  t.saved_meals.push({
    id: id(), client_id: CLIENT, name: 'High protein day', calories: 1850, protein_g: 150, carbs_g: 170, fats_g: 55, created_at: ts(-4),
    content: JSON.stringify({ title: 'High protein day', meals: [
      { name: 'Oats with whey', meal_type: 'breakfast', description: '', calories: 450, protein_g: 40, carbs_g: 55, fats_g: 8 },
      { name: 'Chicken burrito bowl', meal_type: 'lunch', description: '', calories: 650, protein_g: 55, carbs_g: 70, fats_g: 15 },
    ] }),
  })
  t.saved_workouts.push({
    id: id(), client_id: CLIENT, name: 'Hotel dumbbell session', created_at: ts(-9),
    content: JSON.stringify({ title: 'Hotel dumbbell session', exercises: [
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10', rest_seconds: 60 }, { name: 'Walking Lunge', sets: 3, reps: '12 each', rest_seconds: 60 },
      { name: 'Lateral Raise', sets: 3, reps: '15', rest_seconds: 45 },
    ] }),
  })
  t.resources.push({ id: id(), title: 'Protein made simple', description: 'A one page guide to hitting your protein most days.', type: 'pdf', url: 'https://example.com/protein.pdf', file_path: null, is_global: false, created_by: COACH, created_at: ts(-10) })
}

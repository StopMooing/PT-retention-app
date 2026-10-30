// Saving what the AI helper made: same tables, same columns, same exercise-name checks.
// Each returns { data, error, notice }: data is the saved row (null if nothing was saved),
// error and notice are friendly messages for a toast. Raw errors go to the console.
import { supabase } from '../supabase'
import { toLocalDateStr } from './dates'

const SAVE_WORKOUT_FAILED = "Couldn't save that workout. Try again in a moment."
const SAVE_MEAL_FAILED = "Couldn't save that meal. Try again in a moment."

export async function saveAiWorkout(client, content) {
  if (!content?.trim()) return { data: null, error: SAVE_WORKOUT_FAILED }
  let parsedWorkout = null
  let cleanContent = content.trim()
  try {
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.title && Array.isArray(parsed.exercises)) {
        parsedWorkout = parsed
        cleanContent = JSON.stringify(parsed)
      }
    }
  } catch (e) {
    console.warn('AI workout JSON parse failed, saving as plain text:', e)
  }

  const droppedNames = []
  if (parsedWorkout && parsedWorkout.exercises.length > 0) {
    const names = parsedWorkout.exercises.map((e) => (e?.name ?? '').trim()).filter(Boolean)
    let resolvedRows = null
    if (names.length > 0) {
      try {
        const { data: resolved, error: resolveError } = await supabase.rpc('resolve_exercise_ids', { p_names: names })
        if (resolveError) console.error('resolve_exercise_ids error at save, saving names unchanged:', resolveError)
        else resolvedRows = resolved ?? []
      } catch (e) {
        console.error('resolve_exercise_ids exception at save, saving names unchanged:', e)
      }
    }
    if (resolvedRows !== null) {
      const resolvedMap = {}
      for (const row of resolvedRows) {
        const key = (row?.input_name ?? '').trim().toLowerCase()
        if (key && row?.matched_name) resolvedMap[key] = row.matched_name
      }
      const keptExercises = []
      for (const ex of parsedWorkout.exercises) {
        const rawName = (ex?.name ?? '').trim()
        const canonical = resolvedMap[rawName.toLowerCase()]
        if (canonical) keptExercises.push({ ...ex, name: canonical })
        else droppedNames.push(rawName || '(unnamed)')
      }
      if (keptExercises.length === 0) {
        console.error('All AI exercise names unresolved, workout not saved:', droppedNames)
        return { data: null, error: "These exercises aren't in the exercise library, so the workout wasn't saved. Try asking for it again." }
      }
      if (droppedNames.length > 0) console.error('Unresolved AI exercise names dropped at save:', droppedNames)
      parsedWorkout = { ...parsedWorkout, exercises: keptExercises }
      cleanContent = JSON.stringify(parsedWorkout)
    }
  }

  const name = parsedWorkout?.title || content.split('\n').find((l) => l.trim())?.substring(0, 50) || `AI Workout ${toLocalDateStr()}`
  try {
    const { data, error } = await supabase.from('saved_workouts').insert({ client_id: client.id, name, content: cleanContent }).select().single()
    if (error) { console.error('Save workout error:', error); return { data: null, error: SAVE_WORKOUT_FAILED } }
    const notice = droppedNames.length > 0
      ? `Workout saved. ${droppedNames.join(', ')} ${droppedNames.length === 1 ? "isn't" : "aren't"} in the exercise library, so ${droppedNames.length === 1 ? "it's" : "they're"} left out.`
      : null
    return { data, notice }
  } catch (e) {
    console.error('Save workout exception:', e)
    return { data: null, error: SAVE_WORKOUT_FAILED }
  }
}

export async function saveAiMeal(client, content) {
  // Structured per-meal JSON first (new format)
  let parsed = null
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const p = JSON.parse(jsonMatch[0])
      if (p && Array.isArray(p.meals) && p.meals.length > 0) parsed = p
    }
  } catch (e) { console.warn('Meal JSON parse failed, falling back to legacy:', e) }

  let name, calories, protein, carbs, fats, storedContent
  if (parsed) {
    const VALID_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
    parsed.meals = parsed.meals.map((m) => ({
      name: (m?.name || 'Meal').toString().slice(0, 80),
      meal_type: VALID_TYPES.includes((m?.meal_type || '').toLowerCase()) ? m.meal_type.toLowerCase() : 'other',
      description: (m?.description || '').toString(),
      calories: Math.round(parseFloat(m?.calories) || 0),
      protein_g: Math.round(parseFloat(m?.protein_g) || 0),
      carbs_g: Math.round(parseFloat(m?.carbs_g) || 0),
      fats_g: Math.round(parseFloat(m?.fats_g) || 0),
    }))
    name = (parsed.title || parsed.meals[0].name || 'AI Meal Plan').slice(0, 50)
    calories = parsed.meals.reduce((s, m) => s + m.calories, 0)
    protein = parsed.meals.reduce((s, m) => s + m.protein_g, 0)
    carbs = parsed.meals.reduce((s, m) => s + m.carbs_g, 0)
    fats = parsed.meals.reduce((s, m) => s + m.fats_g, 0)
    storedContent = JSON.stringify(parsed)
  } else {
    // Legacy fallback for plain-text replies
    const calorieMatch = content.match(/[Cc]alories?:?\s*(\d+)/)
    const proteinMatch = content.match(/[Pp]rotein:?\s*(\d+)/)
    const carbsMatch = content.match(/[Cc]arbs?:?\s*(\d+)/)
    const fatsMatch = content.match(/[Ff]ats?:?\s*(\d+)/)
    name = content.split('\n').find((l) => l.trim().length > 3)?.trim().substring(0, 50) || 'AI Meal'
    calories = parseFloat(calorieMatch?.[1]) || 0
    protein = parseFloat(proteinMatch?.[1]) || 0
    carbs = parseFloat(carbsMatch?.[1]) || 0
    fats = parseFloat(fatsMatch?.[1]) || 0
    storedContent = content
  }

  try {
    const { data, error } = await supabase.from('saved_meals').insert({
      client_id: client.id, name, content: storedContent, calories, protein_g: protein, carbs_g: carbs, fats_g: fats,
    }).select().single()
    if (error) {
      console.error('Save meal error:', error)
      return { data: null, error: SAVE_MEAL_FAILED }
    }
    return { data }
  } catch (e) {
    console.error('Save meal exception:', e)
    return { data: null, error: SAVE_MEAL_FAILED }
  }
}

// The exercise library (global exercises plus the coach's own, as the row rules allow),
// loaded once per visit and shared by every picker.
import { supabase } from '../supabase'

let cache = null
export async function loadExerciseLibrary() {
  if (cache) return cache
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, muscle_group, equipment, category, exercise_aliases(alias)')
    .order('name')
  if (error) throw error
  cache = data ?? []
  return cache
}
export const cachedExerciseLibrary = () => cache

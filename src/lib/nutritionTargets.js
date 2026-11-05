// Calorie and macro targets, one formula for the whole app: the client's calorie
// calculator and the on-demand meal plans (tools/meal-library) both use these, so the
// numbers always agree.

export const ACTIVITY = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55, // trains 3 to 5 days a week
  very: 1.725,
  extra: 1.9,
}

// Mifflin-St Jeor resting calories times activity.
export function maintenanceCalories({ sex, weightKg, heightCm, age, activity }) {
  const bmr = sex === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  return Math.round(bmr * activity)
}

// Fat loss is 500 kcal under maintenance, muscle gain 300 over.
export const GOAL_ADJUST = { cut: -500, maintain: 0, bulk: 300 }
export function goalCalories(maintenance, goal) {
  return maintenance + (GOAL_ADJUST[goal] ?? 0)
}

// Protein 30%, carbs 40%, fats 30% of calories.
export function macroTargets(calories) {
  return {
    calories,
    protein: Math.round((calories * 0.30) / 4),
    carbs: Math.round((calories * 0.40) / 4),
    fats: Math.round((calories * 0.30) / 9),
  }
}
